from statistics import mean


def synthetic_players() -> list[dict]:
    """合成示例球员数据。

    本数据仅用于小程序页面展示数据表、柱状图和散点图能力，不代表真实球员或真实比赛结果。
    """
    return [
        {"player_name": "Aiden Chen", "position": "PG", "points": 18.6, "rebounds": 4.1, "assists": 7.8, "shooting_rate": 48.2, "three_rate": 36.5, "efficiency_score": 21.4},
        {"player_name": "Leo Wang", "position": "SG", "points": 22.3, "rebounds": 5.0, "assists": 3.6, "shooting_rate": 46.8, "three_rate": 39.1, "efficiency_score": 23.0},
        {"player_name": "Ryan Li", "position": "SF", "points": 16.9, "rebounds": 6.4, "assists": 4.2, "shooting_rate": 50.1, "three_rate": 34.2, "efficiency_score": 20.2},
        {"player_name": "Mason Zhou", "position": "PF", "points": 14.2, "rebounds": 8.7, "assists": 2.8, "shooting_rate": 53.4, "three_rate": 28.9, "efficiency_score": 19.6},
        {"player_name": "Kevin Xu", "position": "C", "points": 13.5, "rebounds": 10.1, "assists": 2.1, "shooting_rate": 58.6, "three_rate": 12.0, "efficiency_score": 22.1},
        {"player_name": "Noah Sun", "position": "PG", "points": 12.8, "rebounds": 3.6, "assists": 8.9, "shooting_rate": 44.5, "three_rate": 33.7, "efficiency_score": 18.7},
        {"player_name": "Evan Zhao", "position": "SG", "points": 19.4, "rebounds": 4.3, "assists": 4.1, "shooting_rate": 47.7, "three_rate": 41.2, "efficiency_score": 21.8},
        {"player_name": "Oscar Liu", "position": "SF", "points": 15.7, "rebounds": 7.2, "assists": 3.5, "shooting_rate": 49.0, "three_rate": 35.8, "efficiency_score": 19.1},
    ]


def build_player_demo_stats() -> dict:
    players = synthetic_players()
    summary = {
        "avg_points": round(mean(p["points"] for p in players), 2),
        "avg_rebounds": round(mean(p["rebounds"] for p in players), 2),
        "avg_assists": round(mean(p["assists"] for p in players), 2),
        "avg_shooting_rate": round(mean(p["shooting_rate"] for p in players), 2),
    }
    positions = sorted({p["position"] for p in players})
    position_stats = []
    for pos in positions:
        rows = [p for p in players if p["position"] == pos]
        position_stats.append({
            "position": pos,
            "players": len(rows),
            "avg_points": round(mean(p["points"] for p in rows), 2),
            "avg_efficiency": round(mean(p["efficiency_score"] for p in rows), 2),
        })
    return {
        "description": "合成示例球员数据，仅用于展示 HoopMate 数据可视化能力。",
        "summary": summary,
        "players": players,
        "position_stats": position_stats,
        "scatter": [
            {
                "name": p["player_name"],
                "x": p["shooting_rate"],
                "y": p["points"],
                "size": p["efficiency_score"],
                "position": p["position"],
            }
            for p in players
        ],
    }
