from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import analysis, demo, export, games, import_csv, news, players, recommendations, training, users

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HoopMate 篮球训练助手 API",
    description="用于微信小程序的训练记录、数据分析和个性化建议后端服务。",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 正式环境请改为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["用户信息"])
app.include_router(training.router, prefix="/api/training", tags=["训练记录"])
app.include_router(import_csv.router, prefix="/api/training", tags=["CSV 导入"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["数据分析"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["训练建议"])
app.include_router(export.router, prefix="/api/export", tags=["数据导出"])
app.include_router(demo.router, prefix="/api/demo", tags=["演示数据"])
app.include_router(players.router, prefix="/api/player-demo", tags=["球员示例数据"])
app.include_router(news.router, prefix="/api/news", tags=["篮球新闻"])
app.include_router(games.router, prefix="/api/games", tags=["篮球赛事"])


@app.get("/")
def health_check():
    return {
        "name": "HoopMate 篮球训练助手 API",
        "status": "running",
        "docs": "/docs",
    }
