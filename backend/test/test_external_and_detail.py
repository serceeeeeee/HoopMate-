from datetime import date

from app.services.analysis_service import build_shot_points, build_zone_data, calculate_summary
from app.services.mock_external_data import mock_game_items, mock_news_items


def sample():
    return [{
        "id": 1,
        "training_date": date.today(),
        "category": "投篮",
        "duration_min": 60,
        "intensity": 6,
        "total_shots": 100,
        "made_shots": 52,
        "free_throw_attempts": 20,
        "free_throw_makes": 16,
        "three_attempts": 30,
        "three_makes": 10,
        "mid_attempts": 30,
        "mid_makes": 17,
    }]


def test_summary_has_light_dashboard_fields():
    summary = calculate_summary(sample())
    assert "paint_rate" in summary
    assert "recent_7day_rate_change" in summary


def test_zone_data_has_heatmap_codes():
    zone = build_zone_data(sample())
    assert any(item["code"] == "paint" for item in zone["items"])
    assert all("color" in item for item in zone["items"])


def test_shot_points_have_coordinates():
    points = build_shot_points(sample(), seed=1)["items"]
    assert points
    assert all(0 <= item["x"] <= 100 and 0 <= item["y"] <= 100 for item in points)


def test_mock_external_data_available():
    assert mock_news_items()
    assert mock_game_items()
