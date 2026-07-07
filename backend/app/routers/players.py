from fastapi import APIRouter

from app.services.player_demo import build_player_demo_stats

router = APIRouter()


@router.get("/stats")
def get_player_demo_stats():
    return build_player_demo_stats()
