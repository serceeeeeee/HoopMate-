from datetime import date, timedelta
from typing import Any
import hashlib
import random

import pandas as pd


ZONE_META = {
    "paint": {"zone": "篮下", "shortName": "篮下", "center": (50, 82)},
    "free_throw": {"zone": "罚球", "shortName": "罚球", "center": (50, 52)},
    "mid_left": {"zone": "左侧中距离", "shortName": "左中", "center": (24, 52)},
    "mid_center": {"zone": "正面中距离", "shortName": "正中", "center": (50, 36)},
    "mid_right": {"zone": "右侧中距离", "shortName": "右中", "center": (76, 52)},
    "left_corner_3": {"zone": "左底角三分", "shortName": "左底角", "center": (15, 18)},
    "top_3": {"zone": "弧顶三分", "shortName": "弧顶", "center": (50, 18)},
    "right_corner_3": {"zone": "右底角三分", "shortName": "右底角", "center": (85, 18)},
}


def safe_rate(makes: int | float | None, attempts: int | float | None) -> float:
    attempts = attempts or 0
    makes = makes or 0
    if attempts <= 0:
        return 0.0
    return round(float(makes) / float(attempts) * 100, 2)


def color_for_rate(rate: float, attempts: int) -> tuple[str, str]:
    if attempts <= 0:
        return "#F2F4F7", "empty"
    if rate >= 65:
        return "#FF5A1F", "excellent"
    if rate >= 50:
        return "#FF8A4C", "good"
    if rate >= 35:
        return "#FFB088", "work"
    return "#FFD8C8", "low"


def serialize_session(obj: Any) -> dict:
    """将 SQLAlchemy 对象或普通 dict 统一转为分析用 dict。"""
    if isinstance(obj, dict):
        data = dict(obj)
    else:
        fields = [
            "id", "user_id", "training_date", "category", "duration_min", "intensity",
            "total_shots", "made_shots", "free_throw_attempts", "free_throw_makes",
            "three_attempts", "three_makes", "mid_attempts", "mid_makes", "note",
        ]
        data = {field: getattr(obj, field, None) for field in fields}
    if data.get("training_date") is not None:
        data["training_date"] = str(data["training_date"])
    return data


def enrich_session(obj: Any) -> dict:
    data = serialize_session(obj)
    data["shooting_rate"] = safe_rate(data.get("made_shots"), data.get("total_shots"))
    data["training_load"] = int((data.get("duration_min") or 0) * (data.get("intensity") or 0))
    return data


def to_dataframe(records: list[Any]) -> pd.DataFrame:
    rows = [serialize_session(item) for item in records]
    if not rows:
        return pd.DataFrame()
    df = pd.DataFrame(rows)
    df["training_date"] = pd.to_datetime(df["training_date"])
    numeric_cols = [
        "duration_min", "intensity", "total_shots", "made_shots", "free_throw_attempts",
        "free_throw_makes", "three_attempts", "three_makes", "mid_attempts", "mid_makes",
    ]
    for col in numeric_cols:
        if col not in df.columns:
            df[col] = 0
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df


def _rate_change_last_week(df: pd.DataFrame) -> float:
    shot_df = df[df["total_shots"] > 0].sort_values("training_date")
    if len(shot_df) < 2:
        return 0.0
    latest = shot_df.tail(4)
    previous = shot_df.iloc[max(0, len(shot_df) - 8): max(0, len(shot_df) - 4)]
    if previous.empty:
        first = safe_rate(latest.iloc[0]["made_shots"], latest.iloc[0]["total_shots"])
        last = safe_rate(latest.iloc[-1]["made_shots"], latest.iloc[-1]["total_shots"])
        return round(last - first, 2)
    latest_rate = safe_rate(latest["made_shots"].sum(), latest["total_shots"].sum())
    previous_rate = safe_rate(previous["made_shots"].sum(), previous["total_shots"].sum())
    return round(latest_rate - previous_rate, 2)


def calculate_summary(records: list[Any]) -> dict:
    df = to_dataframe(records)
    if df.empty:
        return {
            "total_sessions": 0,
            "total_duration": 0,
            "avg_duration": 0.0,
            "total_shots": 0,
            "made_shots": 0,
            "avg_shooting_rate": 0.0,
            "free_throw_rate": 0.0,
            "three_rate": 0.0,
            "mid_rate": 0.0,
            "paint_rate": 0.0,
            "total_load": 0,
            "avg_intensity": 0.0,
            "recent_7day_sessions": 0,
            "recent_7day_rate_change": 0.0,
            "latest_date": None,
        }

    df["training_load"] = df["duration_min"] * df["intensity"]
    latest = df["training_date"].max().date()
    recent_start = date.today() - timedelta(days=6)
    recent_7day_sessions = int((df["training_date"].dt.date >= recent_start).sum())
    paint_attempts = max(0, int(df["total_shots"].sum()) - int(df["free_throw_attempts"].sum()) - int(df["three_attempts"].sum()) - int(df["mid_attempts"].sum()))
    paint_makes = max(0, int(df["made_shots"].sum()) - int(df["free_throw_makes"].sum()) - int(df["three_makes"].sum()) - int(df["mid_makes"].sum()))

    return {
        "total_sessions": int(len(df)),
        "total_duration": int(df["duration_min"].sum()),
        "avg_duration": round(float(df["duration_min"].mean()), 2),
        "total_shots": int(df["total_shots"].sum()),
        "made_shots": int(df["made_shots"].sum()),
        "avg_shooting_rate": safe_rate(df["made_shots"].sum(), df["total_shots"].sum()),
        "free_throw_rate": safe_rate(df["free_throw_makes"].sum(), df["free_throw_attempts"].sum()),
        "three_rate": safe_rate(df["three_makes"].sum(), df["three_attempts"].sum()),
        "mid_rate": safe_rate(df["mid_makes"].sum(), df["mid_attempts"].sum()),
        "paint_rate": safe_rate(paint_makes, paint_attempts),
        "total_load": int(df["training_load"].sum()),
        "avg_intensity": round(float(df["intensity"].mean()), 2),
        "recent_7day_sessions": recent_7day_sessions,
        "recent_7day_rate_change": _rate_change_last_week(df),
        "latest_date": latest.isoformat() if latest else None,
    }


def build_trend_data(records: list[Any], limit: int = 12) -> dict:
    df = to_dataframe(records)
    if df.empty:
        return {"dates": [], "shooting_rates": [], "durations": [], "loads": []}

    df = df.sort_values("training_date").tail(limit)
    df["shooting_rate"] = df.apply(lambda row: safe_rate(row["made_shots"], row["total_shots"]), axis=1)
    df["training_load"] = df["duration_min"] * df["intensity"]

    return {
        "dates": df["training_date"].dt.strftime("%m-%d").tolist(),
        "shooting_rates": [round(float(x), 2) for x in df["shooting_rate"].tolist()],
        "durations": [int(x) for x in df["duration_min"].tolist()],
        "loads": [int(x) for x in df["training_load"].tolist()],
    }


def build_category_data(records: list[Any]) -> dict:
    df = to_dataframe(records)
    if df.empty:
        return {"items": []}

    grouped = (
        df.groupby("category", as_index=False)
        .agg(sessions=("category", "count"), duration=("duration_min", "sum"))
        .sort_values("duration", ascending=False)
    )
    total_duration = float(grouped["duration"].sum()) or 1.0
    grouped["percent"] = grouped["duration"].apply(lambda x: round(float(x) / total_duration * 100, 2))

    return {
        "items": [
            {
                "category": str(row["category"]),
                "sessions": int(row["sessions"]),
                "duration": int(row["duration"]),
                "percent": float(row["percent"]),
            }
            for _, row in grouped.iterrows()
        ]
    }


def _split_count(total: int, ratios: list[float]) -> list[int]:
    if total <= 0:
        return [0 for _ in ratios]
    values = [int(total * r) for r in ratios]
    while sum(values) < total:
        values[values.index(min(values))] += 1
    return values


def _zone_item(code: str, attempts: int, makes: int) -> dict:
    rate = safe_rate(makes, attempts)
    color, level = color_for_rate(rate, attempts)
    meta = ZONE_META[code]
    return {
        "code": code,
        "zone": meta["zone"],
        "shortName": meta["shortName"],
        "attempts": int(attempts),
        "makes": int(makes),
        "rate": rate,
        "color": color,
        "level": level,
    }


def build_zone_data(records: list[Any]) -> dict:
    """构建半场热区数据。

    当前数据表包含罚球、三分和中投分项。为了让小程序具备区域热区展示能力，
    中投与三分会按常见半场区域拆分为左侧、正面、右侧；篮下由总出手扣除已知分项得到。
    """
    df = to_dataframe(records)
    if df.empty:
        return {"items": []}

    total_attempts = int(df["total_shots"].sum())
    total_makes = int(df["made_shots"].sum())
    ft_attempts = int(df["free_throw_attempts"].sum())
    ft_makes = int(df["free_throw_makes"].sum())
    three_attempts = int(df["three_attempts"].sum())
    three_makes = int(df["three_makes"].sum())
    mid_attempts = int(df["mid_attempts"].sum())
    mid_makes = int(df["mid_makes"].sum())
    paint_attempts = max(0, total_attempts - ft_attempts - three_attempts - mid_attempts)
    paint_makes = max(0, total_makes - ft_makes - three_makes - mid_makes)

    mid_attempts_split = _split_count(mid_attempts, [0.3, 0.4, 0.3])
    mid_makes_split = _split_count(mid_makes, [0.3, 0.42, 0.28])
    three_attempts_split = _split_count(three_attempts, [0.25, 0.5, 0.25])
    three_makes_split = _split_count(three_makes, [0.25, 0.52, 0.23])

    raw = [
        ("paint", paint_attempts, paint_makes),
        ("free_throw", ft_attempts, ft_makes),
        ("mid_left", mid_attempts_split[0], mid_makes_split[0]),
        ("mid_center", mid_attempts_split[1], mid_makes_split[1]),
        ("mid_right", mid_attempts_split[2], mid_makes_split[2]),
        ("left_corner_3", three_attempts_split[0], three_makes_split[0]),
        ("top_3", three_attempts_split[1], three_makes_split[1]),
        ("right_corner_3", three_attempts_split[2], three_makes_split[2]),
    ]
    return {"items": [_zone_item(code, attempts, makes) for code, attempts, makes in raw]}


def _point_seed(*parts: Any) -> int:
    text = "|".join(str(p) for p in parts)
    return int(hashlib.md5(text.encode("utf-8")).hexdigest()[:8], 16)


def _make_zone_points(code: str, attempts: int, makes: int, seed: int, limit: int = 28) -> list[dict]:
    if attempts <= 0:
        return []
    shown = min(attempts, limit)
    show_makes = min(makes, shown)
    center_x, center_y = ZONE_META[code]["center"]
    rng = random.Random(_point_seed(code, attempts, makes, seed))
    points = []
    for i in range(shown):
        dx = rng.uniform(-8, 8)
        dy = rng.uniform(-7, 7)
        if "corner" in code:
            dx = rng.uniform(-5, 5)
            dy = rng.uniform(-5, 5)
        elif code == "top_3":
            dx = rng.uniform(-14, 14)
            dy = rng.uniform(-5, 8)
        elif code == "paint":
            dx = rng.uniform(-7, 7)
            dy = rng.uniform(-6, 7)
        points.append({
            "id": f"{code}-{seed}-{i}",
            "x": round(max(4, min(96, center_x + dx)), 2),
            "y": round(max(6, min(94, center_y + dy)), 2),
            "made": i < show_makes,
            "zone": ZONE_META[code]["zone"],
            "zoneCode": code,
        })
    rng.shuffle(points)
    return points


def build_shot_points(records: list[Any], seed: int = 1, per_zone_limit: int = 24) -> dict:
    zone_data = build_zone_data(records)["items"]
    points: list[dict] = []
    for item in zone_data:
        points.extend(_make_zone_points(item["code"], item["attempts"], item["makes"], seed, limit=per_zone_limit))
    return {"items": points}


def summarize_session_detail(current: Any, previous: Any | None) -> dict:
    cur = enrich_session(current)
    if previous is None:
        return {"rateDiff": 0.0, "shotsDiff": 0, "durationDiff": 0, "text": "这是当前筛选范围内的首条训练记录，可作为后续对比基准。"}
    prev = enrich_session(previous)
    rate_diff = round((cur.get("shooting_rate") or 0) - (prev.get("shooting_rate") or 0), 2)
    shots_diff = int((cur.get("total_shots") or 0) - (prev.get("total_shots") or 0))
    duration_diff = int((cur.get("duration_min") or 0) - (prev.get("duration_min") or 0))
    direction = "提升" if rate_diff >= 0 else "下降"
    return {
        "rateDiff": rate_diff,
        "shotsDiff": shots_diff,
        "durationDiff": duration_diff,
        "text": f"与上一次训练相比，命中率{direction} {abs(rate_diff)}%，出手变化 {shots_diff:+d} 次，训练时长变化 {duration_diff:+d} 分钟。",
    }
