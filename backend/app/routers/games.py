from fastapi import APIRouter, Query

from app import schemas
from app.services.games_service import fetch_games

router = APIRouter()


@router.get("/list", response_model=schemas.GameListOut)
async def list_games(league: str = Query(default="全部")):
    return await fetch_games(league=league)
