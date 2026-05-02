import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

_raw_url = os.getenv("DATABASE_URL", "sqlite:///./english_learning.db")
# Railway gives postgres:// but SQLAlchemy needs postgresql+psycopg2://
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql+psycopg2://", 1)

_connect_args = {"check_same_thread": False} if _raw_url.startswith("sqlite") else {}
engine = create_engine(_raw_url, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class WordDB(Base):
    __tablename__ = "words"
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, unique=True, index=True)
    pronunciation = Column(String)
    part_of_speech = Column(String)
    definition_en = Column(Text)
    definition_th = Column(Text)
    example_sentence = Column(Text)
    example_sentence_th = Column(Text)
    category = Column(String)


class UserWordDB(Base):
    __tablename__ = "user_words"
    __table_args__ = (UniqueConstraint("user_id", "word_id", name="uq_user_word"),)
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    word_id = Column(Integer, index=True)
    easiness_factor = Column(Float)
    repetitions = Column(Integer)
    interval = Column(Integer)
    next_review_date = Column(DateTime)
    total_reviews = Column(Integer)
    correct_reviews = Column(Integer)
    created_at = Column(DateTime)


class DailyStatsDB(Base):
    __tablename__ = "daily_stats"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(String, index=True, nullable=False)
    date = Column(String, index=True)
    reviews_done = Column(Integer, default=0)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
