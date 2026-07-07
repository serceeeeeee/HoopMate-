from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.services.analysis_service import (
    build_category_data,
    build_shot_points,
    build_trend_data,
    build_zone_data,
    calculate_summary,
    enrich_session,
    summarize_session_detail,
)
from app.services.recommendation_service import generate_session_recommendations

router = APIRouter()


@router.get("/summary", response_model=schemas.SummaryOut)
def get_summary(user_id: int = 1, db: Session = Depends(get_db)):
    records = crud.list_sessions(db, user_id=user_id, limit=500)
    return calculate_summary(records)


@router.get("/trend", response_model=schemas.TrendOut)
def get_trend(user_id: int = 1, limit: int = Query(default=12, ge=3, le=50), db: Session = Depends(get_db)):
    records = crud.list_sessions(db, user_id=user_id, limit=500)
    return build_trend_data(records, limit=limit)


@router.get("/category", response_model=schemas.CategoryOut)
def get_category(user_id: int = 1, db: Session = Depends(get_db)):
    records = crud.list_sessions(db, user_id=user_id, limit=500)
    return build_category_data(records)


@router.get("/zone", response_model=schemas.ZoneOut)
def get_zone(user_id: int = 1, session_id: int | None = None, db: Session = Depends(get_db)):
    if session_id:
        obj = crud.get_session(db, session_id=session_id, user_id=user_id)
        if not obj:
            raise HTTPException(status_code=404, detail="训练记录不存在")
        records = [obj]
    else:
        records = crud.list_sessions(db, user_id=user_id, limit=500)
    return build_zone_data(records)


@router.get("/shot-points", response_model=schemas.ShotPointsOut)
def get_shot_points(user_id: int = 1, session_id: int | None = None, db: Session = Depends(get_db)):
    if session_id:
        obj = crud.get_session(db, session_id=session_id, user_id=user_id)
        if not obj:
            raise HTTPException(status_code=404, detail="训练记录不存在")
        records = [obj]
        seed = session_id
    else:
        records = crud.list_sessions(db, user_id=user_id, limit=12)
        seed = user_id
    return build_shot_points(records, seed=seed)


@router.get("/session-detail/{session_id}", response_model=schemas.SessionDetailOut)
def get_session_detail(session_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    obj = crud.get_session(db, session_id=session_id, user_id=user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="训练记录不存在")
    all_records = list(reversed(crud.list_sessions(db, user_id=user_id, limit=500)))
    previous = None
    for idx, item in enumerate(all_records):
        if item.id == obj.id and idx > 0:
            previous = all_records[idx - 1]
            break
    session_data = enrich_session(obj) | {"created_at": obj.created_at, "updated_at": obj.updated_at, "id": obj.id, "user_id": obj.user_id}
    zone_data = build_zone_data([obj])["items"]
    points = build_shot_points([obj], seed=session_id)["items"]
    comparison = summarize_session_detail(obj, previous)
    return {
        "session": session_data,
        "zones": zone_data,
        "shotPoints": points,
        "comparison": comparison,
        "recommendations": generate_session_recommendations(session_data, zone_data, comparison),
        "summaryText": comparison["text"],
    }
git add .
git commit -m "feat: 完善训练分析 API 路由" \
  -m "新增训练汇总、趋势、分类、投篮热区、投篮点位和单次训练详情接口，接入分析服务与推荐服务，为 HoopMate 分析页和训练详情页提供后端数据支持。"