import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter()

REQUIRED_COLUMNS = {
    "training_date", "category", "duration_min", "intensity", "total_shots", "made_shots"
}
OPTIONAL_COLUMNS = {
    "free_throw_attempts", "free_throw_makes", "three_attempts", "three_makes", "mid_attempts", "mid_makes", "note"
}


def _int_value(row: dict, field: str, default: int = 0) -> int:
    value = row.get(field, "")
    if value in (None, ""):
        return default
    return int(float(value))


@router.post("/import_csv")
async def import_training_csv(user_id: int = 1, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="请上传 CSV 文件")

    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV 文件编码请使用 UTF-8") from exc

    reader = csv.DictReader(io.StringIO(text))
    fieldnames = set(reader.fieldnames or [])
    missing = REQUIRED_COLUMNS - fieldnames
    if missing:
        raise HTTPException(status_code=400, detail=f"CSV 缺少字段：{', '.join(sorted(missing))}")

    imported = 0
    errors: list[str] = []
    for idx, row in enumerate(reader, start=2):
        try:
            payload = schemas.TrainingSessionCreate(
                user_id=user_id,
                training_date=date.fromisoformat(row["training_date"].strip()),
                category=(row.get("category") or "投篮").strip(),
                duration_min=_int_value(row, "duration_min", 60),
                intensity=_int_value(row, "intensity", 5),
                total_shots=_int_value(row, "total_shots", 0),
                made_shots=_int_value(row, "made_shots", 0),
                free_throw_attempts=_int_value(row, "free_throw_attempts", 0),
                free_throw_makes=_int_value(row, "free_throw_makes", 0),
                three_attempts=_int_value(row, "three_attempts", 0),
                three_makes=_int_value(row, "three_makes", 0),
                mid_attempts=_int_value(row, "mid_attempts", 0),
                mid_makes=_int_value(row, "mid_makes", 0),
                note=(row.get("note") or "").strip() or None,
            )
            crud.create_session(db, payload)
            imported += 1
        except (ValueError, ValidationError) as exc:
            errors.append(f"第 {idx} 行：{exc}")

    return {
        "success": True,
        "imported": imported,
        "errors": errors[:10],
        "message": f"成功导入 {imported} 条训练记录" if imported else "未导入有效记录",
    }
