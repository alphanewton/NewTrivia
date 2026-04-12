from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship
from database.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    host_user_id = Column(String, index=True)
    topic = Column(String)
    difficulty = Column(String)
    quantity = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    sessions = relationship("GameSession", back_populates="quiz")


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    room_code = Column(String, unique=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    final_leaderboard = Column(JSON, nullable=True)
    quiz = relationship("Quiz", back_populates="sessions")
    player_sessions = relationship("PlayerSession", back_populates="game_session")


class PlayerSession(Base):
    __tablename__ = "player_sessions"

    id = Column(Integer, primary_key=True, index=True)
    game_session_id = Column(Integer, ForeignKey("game_sessions.id"))
    player_name = Column(String)
    score = Column(Integer, default=0)
    rank = Column(Integer, nullable=True)
    is_winner = Column(Boolean, default=False)
    game_session = relationship("GameSession", back_populates="player_sessions")
