from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class Word(BaseModel):
    id: int
    word: str
    pronunciation: str
    part_of_speech: str
    definition_en: str
    definition_th: str
    example_sentence: str
    example_sentence_th: str
    category: str

    class Config:
        from_attributes = True


class UserWord(BaseModel):
    id: int
    word_id: int
    easiness_factor: float
    repetitions: int
    interval: int
    next_review_date: datetime
    total_reviews: int
    correct_reviews: int

    class Config:
        from_attributes = True


class WordWithStatus(BaseModel):
    word: Word
    user_word: Optional[UserWord]
    is_due: bool
    accuracy: Optional[float]


class ReviewRequest(BaseModel):
    quality: int  # 0=Again, 1=Hard, 2=Good, 3=Easy


class ReviewResponse(BaseModel):
    next_interval: int
    next_review_date: datetime
    message: str


class DashboardStats(BaseModel):
    due_today: int
    new_available: int
    total_learned: int
    total_words: int
    streak: int
    today_reviews: int
    accuracy_overall: float
    goal: int = 3000
