import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.services.analysis_service import enrich_session

router = APIRouter()


@router.get("/csv")
def export_csv(user_id: int = 1, db: Session = Depends(get_db)):
    rows = crud.list_sessions(db, user_id=user_id, limit=1000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "training_date", "category", "duration_min", "intensity", "total_shots", "made_shots", "shooting_rate", "training_load", "note"
    ])
    for row in rows:
        data = enrich_session(row)
        writer.writerow([
            row.id, row.training_date, row.category, row.duration_min, row.intensity,
            row.total_shots, row.made_shots, data["shooting_rate"], data["training_load"], row.note or ""
        ])
    output.seek(0)
    headers = {"Content-Disposition": "attachment; filename=hoopmate_training_records.csv"}
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)
