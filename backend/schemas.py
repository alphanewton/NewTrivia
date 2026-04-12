from pydantic import BaseModel, field_validator


class CreateQuizRequest(BaseModel):
    topic: str          # any non-empty string
    difficulty: str     # easy | medium | hard
    quantity: int       # 10 | 15 | 20
    question_time: int = 20       # seconds per question (10-60)
    intermission_time: int = 5    # seconds between questions (3-15)
    host_controlled: bool = False  # host manually advances each question

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("topic cannot be empty")
        if len(v) > 80:
            raise ValueError("topic too long (max 80 characters)")
        return v

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v):
        if v not in {"easy", "medium", "hard"}:
            raise ValueError("difficulty must be easy, medium, or hard")
        return v

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v):
        if v not in {10, 15, 20}:
            raise ValueError("quantity must be 10, 15, or 20")
        return v

    @field_validator("question_time")
    @classmethod
    def validate_question_time(cls, v):
        if not (10 <= v <= 60):
            raise ValueError("question_time must be between 10 and 60 seconds")
        return v

    @field_validator("intermission_time")
    @classmethod
    def validate_intermission_time(cls, v):
        if not (3 <= v <= 15):
            raise ValueError("intermission_time must be between 3 and 15 seconds")
        return v
