from sqlalchemy.orm import Session

from app import models, schemas


def get_or_create_user(db: Session, user_id: int = 1) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        return user
    user = models.User(
        id=user_id,
        nickname="HoopMate 用户",
        position="SG",
        height_cm=178,
        weight_kg=70,
        skill_level="中级",
        goal="提升投篮稳定性",
        weekly_goal_sessions=4,
        weekly_goal_minutes=240,
        target_shooting_rate=55.0,
        stage_goal="4 周内把三分命中率提升到 35%",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, payload: schemas.UserUpdate) -> models.User:
    user = get_or_create_user(db, user_id)
    for key, value in payload.model_dump().items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def create_session(db: Session, payload: schemas.TrainingSessionCreate) -> models.TrainingSession:
    get_or_create_user(db, payload.user_id)
    session = models.TrainingSession(**payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def list_sessions(db: Session, user_id: int = 1, limit: int = 100, offset: int = 0) -> list[models.TrainingSession]:
    return (
        db.query(models.TrainingSession)
        .filter(models.TrainingSession.user_id == user_id)
        .order_by(models.TrainingSession.training_date.desc(), models.TrainingSession.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_session(db: Session, session_id: int, user_id: int = 1) -> models.TrainingSession | None:
    return (
        db.query(models.TrainingSession)
        .filter(models.TrainingSession.id == session_id, models.TrainingSession.user_id == user_id)
        .first()
    )


def delete_session(db: Session, session_id: int, user_id: int = 1) -> bool:
    session = get_session(db, session_id, user_id)
    if not session:
        return False
    db.delete(session)
    db.commit()
    return True
