from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.services.analysis_service import calculate_summary
from app.services.recommendation_service import generate_recommendations

router = APIRouter()


@router.get("", response_model=schemas.RecommendationOut)
def get_recommendations(user_id: int = 1, db: Session = Depends(get_db)):
    records = crud.list_sessions(db, user_id=user_id, limit=500)
    summary = calculate_summary(records)
    recommendations = generate_recommendations(records)
    return {"user_id": user_id, "summary": summary, "recommendations": recommendations}
