from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.models import TrainingSession
from app.services.demo_data import build_demo_sessions

router = APIRouter()


@router.post("/seed")
def seed_demo(user_id: int = 1, db: Session = Depends(get_db)):
    crud.get_or_create_user(db, user_id)
    db.query(TrainingSession).filter(TrainingSession.user_id == user_id).delete()
    for item in build_demo_sessions(user_id=user_id):
        db.add(TrainingSession(**item))
    db.commit()
    return {"success": True, "message": "演示数据已生成", "count": len(build_demo_sessions(user_id=user_id))}
