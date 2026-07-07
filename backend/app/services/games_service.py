import os
from datetime import datetime
from typing import Any

import httpx

from app.services.mock_external_data import mock_game_items

LEAGUE_IDS = {
    "NBA": os.getenv("THESPORTSDB_NBA_LEAGUE_ID", "4387"),
    "CBA": os.getenv("THESPORTSDB_CBA_LEAGUE_ID", "4546"),
    "NCAA": os.getenv("THESPORTSDB_NCAA_LEAGUE_ID", "4472"),
}


def _filter_mock(league: str) -> dict:
    rows = mock_game_items()
    if league and league != "全部":
        rows = [item for item in rows if item.get("league") == league]
    return {"items": rows, "total": len(rows), "provider": "mock", "usingMock": True}


def _status_from_sportsdb(event: dict[str, Any]) -> str:
    status = str(event.get("strStatus") or "").lower()
    if status in {"match finished", "finished", "ft"} or event.get("intHomeScore") not in {None, ""}:
        return "Finished"
    if status in {"live", "in play"}:
        return "Live"
    return "Upcoming"


def _map_sportsdb_event(event: dict[str, Any], league: str) -> dict:
    status = _status_from_sportsdb(event)
    return {
        "id": f"tsdb-{event.get('idEvent')}",
        "league": league,
        "homeTeam": event.get("strHomeTeam") or "Home",
        "awayTeam": event.get("strAwayTeam") or "Away",
        "homeScore": int(event.get("intHomeScore") or 0),
        "awayScore": int(event.get("intAwayScore") or 0),
        "startTime": " ".join(filter(None, [event.get("dateEvent"), event.get("strTime", "")])).strip(),
        "status": status,
        "venue": event.get("strVenue") or "",
    }


def _map_apisports_game(item: dict[str, Any], league: str) -> dict:
    teams = item.get("teams") or {}
    scores = item.get("scores") or {}
    status_long = ((item.get("status") or {}).get("long") or "").lower()
    status = "Live" if "live" in status_long or "quarter" in status_long else "Finished" if "finished" in status_long or "after" in status_long else "Upcoming"
    return {
        "id": f"apisports-{item.get('id')}",
        "league": league,
        "homeTeam": (teams.get("home") or {}).get("name") or "Home",
        "awayTeam": (teams.get("away") or {}).get("name") or "Away",
        "homeScore": int(((scores.get("home") or {}).get("total")) or 0),
        "awayScore": int(((scores.get("away") or {}).get("total")) or 0),
        "startTime": (item.get("date") or "").replace("T", " ").replace("Z", ""),
        "status": status,
        "venue": (item.get("venue") or "") if isinstance(item.get("venue"), str) else "",
    }


async def fetch_games(league: str = "全部") -> dict:
    provider = os.getenv("GAMES_PROVIDER", "mock").lower()
    league = league or "全部"
    try:
        if provider == "thesportsdb" and os.getenv("THESPORTSDB_API_KEY") and league in LEAGUE_IDS:
            api_key = os.getenv("THESPORTSDB_API_KEY")
            league_id = LEAGUE_IDS[league]
            url = f"https://www.thesportsdb.com/api/v1/json/{api_key}/eventsnextleague.php"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, params={"id": league_id})
                resp.raise_for_status()
                data = resp.json()
            items = [_map_sportsdb_event(item, league) for item in data.get("events") or []]
            return {"items": items, "total": len(items), "provider": "thesportsdb", "usingMock": False}

        if provider == "apisports" and os.getenv("APISPORTS_BASKETBALL_KEY"):
            # API-SPORTS 的 league/season 建议用环境变量配置，避免页面与第三方原始字段耦合。
            league_id = os.getenv(f"APISPORTS_{league.upper()}_LEAGUE_ID", os.getenv("APISPORTS_DEFAULT_LEAGUE_ID", "12"))
            season = os.getenv("APISPORTS_SEASON", f"{datetime.now().year}-{datetime.now().year + 1}")
            headers = {"x-apisports-key": os.getenv("APISPORTS_BASKETBALL_KEY")}
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get("https://v1.basketball.api-sports.io/games", params={"league": league_id, "season": season}, headers=headers)
                resp.raise_for_status()
                data = resp.json()
            rows = data.get("response") or []
            items = [_map_apisports_game(item, league if league != "全部" else "NBA") for item in rows[:20]]
            return {"items": items, "total": len(items), "provider": "api-sports", "usingMock": False}
    except Exception:
        pass
    return _filter_mock(league)
