from datetime import datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nickname: Mapped[str] = mapped_column(String(64), default="HoopMate 用户")
    position: Mapped[str | None] = mapped_column(String(16), nullable=True)
    height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    skill_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    goal: Mapped[str | None] = mapped_column(String(255), nullable=True)
    weekly_goal_sessions: Mapped[int] = mapped_column(Integer, default=3)
    weekly_goal_minutes: Mapped[int] = mapped_column(Integer, default=180)
    target_shooting_rate: Mapped[float] = mapped_column(Float, default=55.0)
    stage_goal: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sessions: Mapped[list["TrainingSession"]] = relationship(
        "TrainingSession", back_populates="user", cascade="all, delete-orphan"
    )


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, default=1)
    training_date = mapped_column(Date, index=True)
    category: Mapped[str] = mapped_column(String(32), default="投篮")
    duration_min: Mapped[int] = mapped_column(Integer, default=60)
    intensity: Mapped[int] = mapped_column(Integer, default=5)
    total_shots: Mapped[int] = mapped_column(Integer, default=0)
    made_shots: Mapped[int] = mapped_column(Integer, default=0)
    free_throw_attempts: Mapped[int] = mapped_column(Integer, default=0)
    free_throw_makes: Mapped[int] = mapped_column(Integer, default=0)
    three_attempts: Mapped[int] = mapped_column(Integer, default=0)
    three_makes: Mapped[int] = mapped_column(Integer, default=0)
    mid_attempts: Mapped[int] = mapped_column(Integer, default=0)
    mid_makes: Mapped[int] = mapped_column(Integer, default=0)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship("User", back_populates="sessions")
