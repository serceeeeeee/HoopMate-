from datetime import date, timedelta

from app.services.analysis_service import build_category_data, build_trend_data, build_zone_data, calculate_summary, safe_rate
from app.services.recommendation_service import generate_recommendations


def demo_records():
    today = date.today()
    return [
        {
            "training_date": today - timedelta(days=2),
            "category": "投篮",
            "duration_min": 60,
            "intensity": 6,
            "total_shots": 100,
            "made_shots": 45,
            "free_throw_attempts": 20,
            "free_throw_makes": 16,
            "three_attempts": 30,
            "three_makes": 9,
            "mid_attempts": 40,
            "mid_makes": 20,
        },
        {
            "training_date": today,
            "category": "体能",
            "duration_min": 50,
            "intensity": 8,
            "total_shots": 0,
            "made_shots": 0,
            "free_throw_attempts": 0,
            "free_throw_makes": 0,
            "three_attempts": 0,
            "three_makes": 0,
            "mid_attempts": 0,
            "mid_makes": 0,
        },
    ]


def test_safe_rate():
    assert safe_rate(45, 100) == 45.0
    assert safe_rate(1, 0) == 0.0


def test_calculate_summary():
    summary = calculate_summary(demo_records())
    assert summary["total_sessions"] == 2
    assert summary["total_duration"] == 110
    assert summary["avg_shooting_rate"] == 45.0
    assert summary["total_load"] == 760


def test_build_trend_data():
    trend = build_trend_data(demo_records())
    assert len(trend["dates"]) == 2
    assert trend["shooting_rates"][-1] == 0.0


def test_build_category_data():
    category = build_category_data(demo_records())
    assert len(category["items"]) == 2
    assert sum(item["duration"] for item in category["items"]) == 110


def test_generate_recommendations():
    advice = generate_recommendations(demo_records())
    assert isinstance(advice, list)
    assert len(advice) >= 1


def test_build_zone_data():
    zone = build_zone_data(demo_records())
    assert "items" in zone
    assert any(item["zone"] == "罚球" for item in zone["items"])
