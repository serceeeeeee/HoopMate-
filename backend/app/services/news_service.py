import os
from typing import Any
from urllib.parse import urlparse

import httpx

from app.services.mock_external_data import mock_news_items

CATEGORY_QUERY = {
    "全部": "basketball OR NBA OR CBA",
    "NBA": "NBA basketball",
    "CBA": "CBA basketball China",
    "国际篮球": "international basketball FIBA",
    "训练技巧": "basketball training shooting drills",
}


def _normalize_url(url: str | None) -> str:
    if not url:
        return ""
    parsed = urlparse(url)
    if parsed.scheme in {"http", "https"}:
        return url
    return ""


def _slice(items: list[dict], category: str, page: int, page_size: int) -> dict:
    rows = items
    if category and category != "全部":
        rows = [item for item in rows if item.get("category") == category]
    start = (page - 1) * page_size
    return {
        "items": rows[start:start + page_size],
        "total": len(rows),
        "page": page,
        "pageSize": page_size,
        "provider": "mock",
        "usingMock": True,
    }


def _map_gnews_article(article: dict[str, Any], idx: int, category: str) -> dict:
    return {
        "id": f"gnews-{abs(hash(article.get('url', idx))) % 10_000_000}",
        "title": article.get("title") or "Untitled",
        "source": (article.get("source") or {}).get("name") or "GNews",
        "publishedAt": (article.get("publishedAt") or "").replace("T", " ").replace("Z", ""),
        "summary": article.get("description") or article.get("content") or "",
        "imageUrl": _normalize_url(article.get("image")),
        "url": _normalize_url(article.get("url")),
        "category": category if category != "全部" else "NBA",
        "content": article.get("content") or article.get("description") or "",
    }


def _map_newsapi_article(article: dict[str, Any], idx: int, category: str) -> dict:
    return {
        "id": f"newsapi-{abs(hash(article.get('url', idx))) % 10_000_000}",
        "title": article.get("title") or "Untitled",
        "source": (article.get("source") or {}).get("name") or "NewsAPI",
        "publishedAt": (article.get("publishedAt") or "").replace("T", " ").replace("Z", ""),
        "summary": article.get("description") or "",
        "imageUrl": _normalize_url(article.get("urlToImage")),
        "url": _normalize_url(article.get("url")),
        "category": category if category != "全部" else "NBA",
        "content": article.get("content") or article.get("description") or "",
    }


def _map_newsdata_article(article: dict[str, Any], idx: int, category: str) -> dict:
    return {
        "id": f"newsdata-{article.get('article_id') or idx}",
        "title": article.get("title") or "Untitled",
        "source": article.get("source_id") or "NewsData.io",
        "publishedAt": article.get("pubDate") or "",
        "summary": article.get("description") or article.get("content") or "",
        "imageUrl": _normalize_url(article.get("image_url")),
        "url": _normalize_url(article.get("link")),
        "category": category if category != "全部" else "篮球",
        "content": article.get("content") or article.get("description") or "",
    }


async def fetch_news(category: str = "全部", page: int = 1, page_size: int = 10) -> dict:
    provider = os.getenv("NEWS_PROVIDER", "mock").lower()
    query = CATEGORY_QUERY.get(category, CATEGORY_QUERY["全部"])

    try:
        if provider == "gnews" and os.getenv("GNEWS_API_KEY"):
            params = {"q": query, "lang": "en", "max": min(page_size, 10), "page": page, "apikey": os.getenv("GNEWS_API_KEY")}
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get("https://gnews.io/api/v4/search", params=params)
                resp.raise_for_status()
                data = resp.json()
            items = [_map_gnews_article(item, idx, category) for idx, item in enumerate(data.get("articles", []))]
            return {"items": items, "total": int(data.get("totalArticles", len(items))), "page": page, "pageSize": page_size, "provider": "gnews", "usingMock": False}

        if provider == "newsapi" and os.getenv("NEWS_API_KEY"):
            params = {"q": query, "language": "en", "pageSize": min(page_size, 20), "page": page, "apiKey": os.getenv("NEWS_API_KEY")}
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get("https://newsapi.org/v2/everything", params=params)
                resp.raise_for_status()
                data = resp.json()
            items = [_map_newsapi_article(item, idx, category) for idx, item in enumerate(data.get("articles", []))]
            return {"items": items, "total": int(data.get("totalResults", len(items))), "page": page, "pageSize": page_size, "provider": "newsapi", "usingMock": False}

        if provider == "newsdata" and os.getenv("NEWSDATA_API_KEY"):
            params = {"apikey": os.getenv("NEWSDATA_API_KEY"), "q": query, "language": "en"}
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get("https://newsdata.io/api/1/news", params=params)
                resp.raise_for_status()
                data = resp.json()
            items = [_map_newsdata_article(item, idx, category) for idx, item in enumerate(data.get("results", []))]
            return {"items": items[:page_size], "total": len(items), "page": page, "pageSize": page_size, "provider": "newsdata", "usingMock": False}
    except Exception:
        # API 调用失败时使用 mock，保证小程序可演示。
        pass

    return _slice(mock_news_items(), category, page, page_size)


async def fetch_news_detail(news_id: str) -> dict:
    items = mock_news_items()
    for item in items:
        if item["id"] == news_id:
            return item
    return items[0]
