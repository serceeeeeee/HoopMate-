from datetime import datetime, timedelta


def mock_news_items() -> list[dict]:
    now = datetime.now()
    return [
        {
            "id": "mock-news-1",
            "title": "投篮训练中如何建立稳定的出手节奏",
            "source": "HoopMate Training Lab",
            "publishedAt": (now - timedelta(hours=3)).strftime("%Y-%m-%d %H:%M"),
            "summary": "从脚步、接球、起跳和随球动作四个环节拆解投篮稳定性，适合作为个人训练复盘参考。",
            "imageUrl": "",
            "url": "",
            "category": "训练技巧",
            "content": "稳定的出手节奏通常来自固定的准备动作、连续的脚步衔接和一致的随球动作。建议训练时按区域记录命中率，并在每组投篮后记录手感和偏差方向。",
        },
        {
            "id": "mock-news-2",
            "title": "年轻后卫训练重点：控球、急停和对抗终结",
            "source": "HoopMate Courtside",
            "publishedAt": (now - timedelta(days=1, hours=2)).strftime("%Y-%m-%d %H:%M"),
            "summary": "后卫专项训练需要同时关注控球稳定性、变速能力和对抗后的终结效率。",
            "imageUrl": "",
            "url": "",
            "category": "训练技巧",
            "content": "控卫和分卫在个人训练中可以将弱侧手控球、急停跳投和对抗上篮组合为一组训练循环。每次训练后记录失误次数和投篮命中率，更容易发现短板。",
        },
        {
            "id": "mock-news-3",
            "title": "NBA 赛季观察：空间型锋线价值持续提升",
            "source": "HoopMate News Mock",
            "publishedAt": (now - timedelta(days=2)).strftime("%Y-%m-%d %H:%M"),
            "summary": "现代篮球对锋线球员的三分、防守覆盖和转换速度提出了更高要求。",
            "imageUrl": "",
            "url": "",
            "category": "NBA",
            "content": "空间型锋线能够同时影响进攻站位和防守换防，是现代篮球体系中非常重要的角色。普通训练者也可以参考这种能力结构，增加底角三分、横移和快攻终结训练。",
        },
        {
            "id": "mock-news-4",
            "title": "CBA 青训观察：基础技术与体能储备同样重要",
            "source": "HoopMate News Mock",
            "publishedAt": (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M"),
            "summary": "青少年训练中，投篮姿势、核心力量和移动能力需要同步培养。",
            "imageUrl": "",
            "url": "",
            "category": "CBA",
            "content": "基础技术稳定性和体能储备决定了后续技术动作能否在比赛强度下保持质量。HoopMate 的训练记录适合用来追踪个人阶段性成长。",
        },
        {
            "id": "mock-news-5",
            "title": "国际篮球节奏更快，转换进攻训练值得关注",
            "source": "HoopMate Global Mock",
            "publishedAt": (now - timedelta(days=4)).strftime("%Y-%m-%d %H:%M"),
            "summary": "国际比赛中，转换速度、投篮选择和团队空间越来越影响比赛走势。",
            "imageUrl": "",
            "url": "",
            "category": "国际篮球",
            "content": "训练中可以把三人快攻、快速落位投篮和防守回追作为组合训练，提高比赛节奏下的决策速度。",
        },
    ]


def mock_game_items() -> list[dict]:
    base = datetime.now().replace(minute=0, second=0, microsecond=0)
    return [
        {"id": "game-1", "league": "NBA", "homeTeam": "Los Angeles Stars", "awayTeam": "Boston Greens", "homeScore": 102, "awayScore": 98, "startTime": (base + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M"), "status": "Live", "venue": "Downtown Arena"},
        {"id": "game-2", "league": "NBA", "homeTeam": "Bay City Waves", "awayTeam": "Texas Rangers", "homeScore": 0, "awayScore": 0, "startTime": (base + timedelta(days=1, hours=2)).strftime("%Y-%m-%d %H:%M"), "status": "Upcoming", "venue": "Harbor Center"},
        {"id": "game-3", "league": "CBA", "homeTeam": "Beijing North", "awayTeam": "Shanghai Sharks", "homeScore": 88, "awayScore": 91, "startTime": (base - timedelta(days=1)).strftime("%Y-%m-%d %H:%M"), "status": "Finished", "venue": "Capital Gym"},
        {"id": "game-4", "league": "NCAA", "homeTeam": "Blue College", "awayTeam": "Lake University", "homeScore": 74, "awayScore": 68, "startTime": (base - timedelta(days=2)).strftime("%Y-%m-%d %H:%M"), "status": "Finished", "venue": "Campus Arena"},
        {"id": "game-5", "league": "国际赛事", "homeTeam": "Spain Select", "awayTeam": "France Select", "homeScore": 0, "awayScore": 0, "startTime": (base + timedelta(days=2, hours=4)).strftime("%Y-%m-%d %H:%M"), "status": "Upcoming", "venue": "International Dome"},
    ]
