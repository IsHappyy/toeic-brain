import os
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List

from database import get_db, create_tables, WordDB, UserWordDB, DailyStatsDB
from models import ReviewRequest, ReviewResponse, DashboardStats
from srs import calculate_next_review
from vocabulary_data import TOEIC_WORDS

app = FastAPI(title="TOEIC Brain API")

_origins = os.getenv("CORS_ORIGIN", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    create_tables()
    _seed_words()


def _seed_words():
    from database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(WordDB).count() == 0:
            for w in TOEIC_WORDS:
                db.add(WordDB(**w))
            db.commit()
    finally:
        db.close()


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _get_or_create_daily(db: Session, user_id: str) -> DailyStatsDB:
    today = _today()
    row = db.query(DailyStatsDB).filter_by(user_id=user_id, date=today).first()
    if not row:
        row = DailyStatsDB(user_id=user_id, date=today, reviews_done=0)
        db.add(row)
        db.flush()
    return row


def _streak(db: Session, user_id: str) -> int:
    streak = 0
    day = datetime.now(timezone.utc).date()
    for _ in range(365):
        s = db.query(DailyStatsDB).filter_by(user_id=user_id, date=day.strftime("%Y-%m-%d")).first()
        if s and s.reviews_done > 0:
            streak += 1
            day -= timedelta(days=1)
        else:
            break
    return streak


@app.get("/stats", response_model=DashboardStats)
def get_stats(user_id: str = Query(...), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    total_words = db.query(WordDB).count()

    due_today = db.query(UserWordDB).filter(
        UserWordDB.user_id == user_id,
        UserWordDB.next_review_date <= now,
    ).count()

    learned_ids = {r.word_id for r in db.query(UserWordDB.word_id).filter_by(user_id=user_id)}
    new_available = total_words - len(learned_ids)

    rows = db.query(UserWordDB.total_reviews, UserWordDB.correct_reviews).filter_by(user_id=user_id).all()
    total_r = sum(r[0] or 0 for r in rows)
    correct_r = sum(r[1] or 0 for r in rows)
    accuracy = round(correct_r / total_r * 100, 1) if total_r else 0.0

    daily = _get_or_create_daily(db, user_id)
    db.commit()

    return DashboardStats(
        due_today=due_today,
        new_available=new_available,
        total_learned=len(learned_ids),
        total_words=total_words,
        streak=_streak(db, user_id),
        today_reviews=daily.reviews_done,
        accuracy_overall=accuracy,
    )


@app.get("/words/due")
def get_due_words(user_id: str = Query(...), limit: int = 20, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    rows = (
        db.query(UserWordDB)
        .filter(UserWordDB.user_id == user_id, UserWordDB.next_review_date <= now)
        .order_by(UserWordDB.next_review_date)
        .limit(limit)
        .all()
    )
    result = []
    for uw in rows:
        w = db.query(WordDB).get(uw.word_id)
        if w:
            result.append({**_word_dict(w), "user_word_id": uw.id, "repetitions": uw.repetitions, "is_new": False})
    return result


@app.get("/words/new")
def get_new_words(user_id: str = Query(...), limit: int = 10, db: Session = Depends(get_db)):
    learned = {r.word_id for r in db.query(UserWordDB.word_id).filter_by(user_id=user_id)}
    q = db.query(WordDB)
    if learned:
        q = q.filter(~WordDB.id.in_(learned))
    words = q.limit(limit).all()
    return [{**_word_dict(w), "user_word_id": None, "repetitions": 0, "is_new": True} for w in words]


@app.post("/review/{word_id}", response_model=ReviewResponse)
def submit_review(word_id: int, req: ReviewRequest, user_id: str = Query(...), db: Session = Depends(get_db)):
    word = db.query(WordDB).get(word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    uw = db.query(UserWordDB).filter_by(user_id=user_id, word_id=word_id).first()
    if uw is None:
        uw = UserWordDB(
            user_id=user_id, word_id=word_id,
            easiness_factor=2.5, repetitions=0, interval=1,
            total_reviews=0, correct_reviews=0,
            next_review_date=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
        )
        db.add(uw)
        db.flush()

    result = calculate_next_review(
        quality=req.quality,
        easiness_factor=uw.easiness_factor or 2.5,
        repetitions=uw.repetitions or 0,
        interval=uw.interval or 1,
    )
    uw.easiness_factor = result.new_easiness_factor
    uw.repetitions = result.new_repetitions
    uw.interval = result.next_interval
    uw.next_review_date = result.next_review_date
    uw.total_reviews = (uw.total_reviews or 0) + 1
    if req.quality >= 2:
        uw.correct_reviews = (uw.correct_reviews or 0) + 1

    daily = _get_or_create_daily(db, user_id)
    daily.reviews_done = (daily.reviews_done or 0) + 1
    db.commit()

    labels = {0: "ไม่เป็นไร ลองใหม่เร็วๆ นี้", 1: "ยากแต่สู้ต่อได้!", 2: "ดีมาก! สมองกำลังเชื่อมต่อ", 3: f"เยี่ยม! พบกันอีกใน {result.next_interval} วัน"}
    return ReviewResponse(next_interval=result.next_interval, next_review_date=result.next_review_date, message=labels[req.quality])


@app.get("/words/all")
def get_all_words(user_id: str = Query(...), db: Session = Depends(get_db)):
    words = db.query(WordDB).all()
    user_words = {uw.word_id: uw for uw in db.query(UserWordDB).filter_by(user_id=user_id).all()}
    now = datetime.now(timezone.utc)
    result = []
    for w in words:
        uw = user_words.get(w.id)
        accuracy = None
        if uw and (uw.total_reviews or 0) > 0:
            accuracy = round((uw.correct_reviews or 0) / uw.total_reviews * 100, 1)
        result.append({
            "word_id": w.id, "word": w.word, "category": w.category,
            "definition_th": w.definition_th,
            "repetitions": uw.repetitions if uw else 0,
            "is_learned": uw is not None,
            "is_due": uw is not None and uw.next_review_date <= now,
            "accuracy": accuracy,
            "next_review_date": uw.next_review_date.isoformat() if uw else None,
            "interval": uw.interval if uw else 0,
        })
    return result


def _word_dict(w: WordDB) -> dict:
    return {
        "word_id": w.id, "word": w.word, "pronunciation": w.pronunciation,
        "part_of_speech": w.part_of_speech, "definition_en": w.definition_en,
        "definition_th": w.definition_th, "example_sentence": w.example_sentence,
        "example_sentence_th": w.example_sentence_th, "category": w.category,
    }
