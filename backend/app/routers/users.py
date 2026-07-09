from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.get("/profile", response_model=schemas.UserOut)
def get_profile(user_id: int = 1, db: Session = Depends(get_db)):
    return crud.get_or_create_user(db, user_id)


@router.put("/profile", response_model=schemas.UserOut)
def update_profile(payload: schemas.UserUpdate, user_id: int = 1, db: Session = Depends(get_db)):
    return crud.update_user(db, user_id, payload)
