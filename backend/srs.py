from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass
class ReviewResult:
    next_interval: int
    new_easiness_factor: float
    new_repetitions: int
    next_review_date: datetime


# Quality: 0=Again, 1=Hard, 2=Good, 3=Easy
_QUALITY_MAP = {0: 1, 1: 3, 2: 4, 3: 5}


def calculate_next_review(
    quality: int,
    easiness_factor: float,
    repetitions: int,
    interval: int,
) -> ReviewResult:
    q = _QUALITY_MAP.get(quality, 3)

    if q < 3:
        repetitions = 0
        interval = 1
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * easiness_factor)
        repetitions += 1

    new_ef = easiness_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ef = max(1.3, new_ef)

    next_date = datetime.now(timezone.utc) + timedelta(days=interval)
    return ReviewResult(
        next_interval=interval,
        new_easiness_factor=round(new_ef, 4),
        new_repetitions=repetitions,
        next_review_date=next_date,
    )
