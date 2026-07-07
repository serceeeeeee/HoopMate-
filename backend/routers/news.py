from fastapi import APIRouter, Query

from app import schemas
from app.services.news_service import fetch_news, fetch_news_detail

router = APIRouter()


@router.get("/list", response_model=schemas.NewsListOut)
async def list_news(
    category: str = Query(default="全部"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=30),
):
    return await fetch_news(category=category, page=page, page_size=page_size)


@router.get("/detail/{news_id}", response_model=schemas.NewsItem)
async def news_detail(news_id: str):
    return await fetch_news_detail(news_id)
