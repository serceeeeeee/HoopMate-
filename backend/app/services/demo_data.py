from datetime import date, timedelta


def build_demo_sessions(user_id: int = 1) -> list[dict]:
    today = date.today()
    raw = [
        (20, "投篮", 60, 6, 100, 42, 20, 15, 30, 8, 30, 14, "近距离和中投训练，手感一般"),
        (17, "运球", 45, 5, 30, 15, 0, 0, 0, 0, 0, 0, "弱侧手和变向训练"),
        (14, "投篮", 70, 7, 120, 56, 25, 19, 40, 14, 35, 18, "增加底角三分练习"),
        (11, "体能", 50, 8, 0, 0, 0, 0, 0, 0, 0, 0, "折返跑和核心训练"),
        (8, "综合", 80, 7, 90, 47, 20, 16, 25, 10, 30, 17, "半场综合训练"),
        (5, "投篮", 65, 6, 110, 60, 30, 24, 35, 13, 30, 18, "投篮节奏较好"),
        (2, "比赛", 90, 8, 60, 31, 8, 6, 18, 6, 20, 11, "半场比赛，体能后段下降"),
    ]
    data = []
    for days_ago, category, duration, intensity, total, made, fta, ftm, thra, thrm, mida, midm, note in raw:
        data.append({
            "user_id": user_id,
            "training_date": today - timedelta(days=days_ago),
            "category": category,
            "duration_min": duration,
            "intensity": intensity,
            "total_shots": total,
            "made_shots": made,
            "free_throw_attempts": fta,
            "free_throw_makes": ftm,
            "three_attempts": thra,
            "three_makes": thrm,
            "mid_attempts": mida,
            "mid_makes": midm,
            "note": note,
        })
    return data
