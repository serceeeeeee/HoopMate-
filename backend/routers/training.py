from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.services.analysis_service import enrich_session

router = APIRouter()


@router.post("/sessions", response_model=schemas.TrainingSessionOut)
def create_training_session(payload: schemas.TrainingSessionCreate, db: Session = Depends(get_db)):
    obj = crud.create_session(db, payload)
    return enrich_session(obj) | {"created_at": obj.created_at, "updated_at": obj.updated_at, "id": obj.id, "user_id": obj.user_id}


@router.get("/sessions", response_model=list[schemas.TrainingSessionOut])
def list_training_sessions(
    user_id: int = 1,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    rows = crud.list_sessions(db, user_id=user_id, limit=limit, offset=offset)
    return [enrich_session(obj) | {"created_at": obj.created_at, "updated_at": obj.updated_at, "id": obj.id, "user_id": obj.user_id} for obj in rows]


@router.get("/sessions/{session_id}", response_model=schemas.TrainingSessionOut)
def get_training_session(session_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    obj = crud.get_session(db, session_id=session_id, user_id=user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="训练记录不存在")
    return enrich_session(obj) | {"created_at": obj.created_at, "updated_at": obj.updated_at, "id": obj.id, "user_id": obj.user_id}


@router.delete("/sessions/{session_id}")
def delete_training_session(session_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    ok = crud.delete_session(db, session_id=session_id, user_id=user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="训练记录不存在")
    return {"success": True, "message": "训练记录已删除"}
