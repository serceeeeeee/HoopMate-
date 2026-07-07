from app.services.analysis_service import build_category_data, build_trend_data, calculate_summary


def generate_recommendations(records: list) -> list[str]:
    summary = calculate_summary(records)
    trend = build_trend_data(records, limit=5)
    category = build_category_data(records)
    advice: list[str] = []

    if summary["total_sessions"] == 0:
        return ["请先完成一次训练记录，系统将根据训练数据生成个性化建议。"]

    # 投篮建议
    if summary["avg_shooting_rate"] < 40:
        advice.append("整体投篮命中率偏低，建议优先进行近距离定点投篮训练，每次 5 组，每组 10 球，重点保持出手姿势稳定。")
    elif summary["avg_shooting_rate"] < 55:
        advice.append("整体投篮处于提升阶段，建议增加中距离和罚球训练，在稳定动作基础上逐步增加移动接球投篮。")
    else:
        advice.append("整体投篮表现较稳定，可加入急停跳投、对抗投篮和比赛节奏投篮，提高实战转化能力。")

    if summary["three_rate"] > 0 and summary["three_rate"] < 30:
        advice.append("三分命中率不足 30%，建议先固定 2-3 个常用出手点，降低出手速度，重点检查下肢发力和手腕跟随动作。")

    if summary["free_throw_rate"] > 0 and summary["free_throw_rate"] < 70:
        advice.append("罚球命中率仍有提升空间，建议每次训练结束前安排 20-30 次罚球，并记录连续命中数量。")

    # 训练频率建议
    if summary["total_sessions"] < 3:
        advice.append("当前累计训练次数较少，建议先建立每周至少 3 次的固定训练节奏，优先保证训练连续性。")
    elif summary["recent_7day_sessions"] < 2:
        advice.append("最近 7 天训练次数偏少，建议安排一次 45-60 分钟的综合训练，恢复训练节奏。")

    # 训练负荷建议
    if summary["avg_intensity"] >= 8:
        advice.append("平均训练强度较高，建议增加拉伸、低强度恢复跑和核心稳定训练，避免疲劳累积。")
    elif summary["avg_intensity"] <= 4 and summary["total_sessions"] >= 3:
        advice.append("训练强度整体偏低，可在保证动作质量的前提下增加对抗训练或限时投篮训练。")

    # 趋势建议
    rates = trend.get("shooting_rates", [])
    if len(rates) >= 3 and rates[-1] < rates[-2] < rates[-3]:
        advice.append("近几次投篮命中率连续下降，建议下一次训练减少出手总量，重点复盘脚步、节奏和手型。")

    # 短板类别建议
    category_items = category.get("items", [])
    categories = {item["category"] for item in category_items}
    if "运球" not in categories:
        advice.append("训练记录中缺少运球专项，建议加入变向、胯下、背后运球和弱侧手控球练习。")
    if "体能" not in categories and summary["total_sessions"] >= 3:
        advice.append("训练记录中体能训练占比较低，建议每周加入一次折返跑、核心力量或下肢爆发训练。")

    return advice[:6]



def generate_session_recommendations(session: dict, zones: list[dict] | None = None, comparison: dict | None = None) -> list[str]:
    """为单次训练详情页生成轻量建议。"""
    zones = zones or []
    comparison = comparison or {}
    advice: list[str] = []
    rate = float(session.get("shooting_rate") or 0)
    total = int(session.get("total_shots") or 0)
    if total <= 0:
        advice.append("本次训练未记录投篮数据，建议下次补充出手数和命中数，便于分析投篮表现。")
    elif rate >= 60:
        advice.append("本次投篮表现较稳定，可以在下一次训练中加入移动接球或轻对抗投篮，提高实战转化。")
    elif rate >= 45:
        advice.append("本次命中率处于可提升区间，建议保留当前出手节奏，并增加固定点位重复训练。")
    else:
        advice.append("本次命中率偏低，建议下次降低训练节奏，优先检查脚步、发力和出手手型。")

    valid_zones = [z for z in zones if z.get("attempts", 0) > 0]
    if valid_zones:
        weakest = sorted(valid_zones, key=lambda z: z.get("rate", 0))[0]
        best = sorted(valid_zones, key=lambda z: z.get("rate", 0), reverse=True)[0]
        advice.append(f"本次最佳区域为{best['zone']}，命中率 {best['rate']}%；待提升区域为{weakest['zone']}，建议下次安排专项补强。")

    if comparison.get("rateDiff", 0) < -5:
        advice.append("与上一次相比命中率下降较明显，建议减少高难度出手，先用近距离投篮找回节奏。")
    elif comparison.get("rateDiff", 0) > 5:
        advice.append("与上一次相比命中率提升明显，可以记录本次训练前的热身方式和投篮节奏，形成可复用模板。")

    if int(session.get("intensity") or 0) >= 8:
        advice.append("本次训练强度较高，建议训练后完成拉伸和低强度恢复，避免疲劳影响下一次投篮稳定性。")
    return advice[:4]
