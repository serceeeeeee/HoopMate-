from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class UserBase(BaseModel):
    nickname: str = Field(default="HoopMate 用户", max_length=64)
    position: Optional[str] = Field(default="SG", max_length=16)
    height_cm: Optional[int] = Field(default=178, ge=100, le=230)
    weight_kg: Optional[float] = Field(default=70, ge=30, le=200)
    skill_level: Optional[str] = Field(default="中级", max_length=32)
    goal: Optional[str] = Field(default="提升投篮稳定性", max_length=255)
    weekly_goal_sessions: int = Field(default=3, ge=1, le=14)
    weekly_goal_minutes: int = Field(default=180, ge=30, le=2000)
    target_shooting_rate: float = Field(default=55.0, ge=0, le=100)
    stage_goal: Optional[str] = Field(default="4 周内提升三分稳定性", max_length=255)


class UserCreate(UserBase):
    id: int = 1


class UserUpdate(UserBase):
    pass


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class TrainingSessionBase(BaseModel):
    training_date: date
    category: str = Field(default="投篮", max_length=32)
    duration_min: int = Field(default=60, ge=1, le=360)
    intensity: int = Field(default=5, ge=1, le=10)
    total_shots: int = Field(default=0, ge=0, le=2000)
    made_shots: int = Field(default=0, ge=0, le=2000)
    free_throw_attempts: int = Field(default=0, ge=0, le=1000)
    free_throw_makes: int = Field(default=0, ge=0, le=1000)
    three_attempts: int = Field(default=0, ge=0, le=1000)
    three_makes: int = Field(default=0, ge=0, le=1000)
    mid_attempts: int = Field(default=0, ge=0, le=1000)
    mid_makes: int = Field(default=0, ge=0, le=1000)
    note: Optional[str] = Field(default=None, max_length=500)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        allow = {"投篮", "运球", "体能", "综合", "比赛", "恢复"}
        if value not in allow:
            raise ValueError(f"训练类型必须为：{', '.join(sorted(allow))}")
        return value

    @model_validator(mode="after")
    def validate_makes(self):
        pairs = [
            (self.made_shots, self.total_shots, "总命中数不能大于总出手数"),
            (self.free_throw_makes, self.free_throw_attempts, "罚球命中数不能大于罚球出手数"),
            (self.three_makes, self.three_attempts, "三分命中数不能大于三分出手数"),
            (self.mid_makes, self.mid_attempts, "中投命中数不能大于中投出手数"),
        ]
        for makes, attempts, message in pairs:
            if makes > attempts:
                raise ValueError(message)
        return self


class TrainingSessionCreate(TrainingSessionBase):
    user_id: int = 1


class TrainingSessionUpdate(TrainingSessionBase):
    pass


class TrainingSessionOut(TrainingSessionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    shooting_rate: float
    training_load: int
    created_at: datetime
    updated_at: datetime


class SummaryOut(BaseModel):
    total_sessions: int
    total_duration: int
    avg_duration: float
    total_shots: int
    made_shots: int
    avg_shooting_rate: float
    free_throw_rate: float
    three_rate: float
    mid_rate: float
    paint_rate: float = 0.0
    total_load: int
    avg_intensity: float
    recent_7day_sessions: int
    recent_7day_rate_change: float = 0.0
    latest_date: Optional[str]


class TrendOut(BaseModel):
    dates: list[str]
    shooting_rates: list[float]
    durations: list[int]
    loads: list[int]


class CategoryItem(BaseModel):
    category: str
    sessions: int
    duration: int
    percent: float


class CategoryOut(BaseModel):
    items: list[CategoryItem]


class ZoneItem(BaseModel):
    code: str = ""
    zone: str
    shortName: str = ""
    attempts: int
    makes: int
    rate: float
    color: str = "#F2F4F7"
    level: str = "empty"


class ZoneOut(BaseModel):
    items: list[ZoneItem]


class ShotPoint(BaseModel):
    id: str
    x: float
    y: float
    made: bool
    zone: str
    zoneCode: str


class ShotPointsOut(BaseModel):
    items: list[ShotPoint]


class SessionDetailOut(BaseModel):
    session: TrainingSessionOut
    zones: list[ZoneItem]
    shotPoints: list[ShotPoint]
    comparison: dict
    recommendations: list[str]
    summaryText: str


class RecommendationOut(BaseModel):
    user_id: int
    summary: SummaryOut
    recommendations: list[str]


class NewsItem(BaseModel):
    id: str
    title: str
    source: str
    publishedAt: str
    summary: str
    imageUrl: str = ""
    url: str = ""
    category: str = "篮球"
    content: str = ""


class NewsListOut(BaseModel):
    items: list[NewsItem]
    total: int
    page: int
    pageSize: int
    provider: str = "mock"
    usingMock: bool = True


class GameItem(BaseModel):
    id: str
    league: str
    homeTeam: str
    awayTeam: str
    homeScore: Optional[int] = None
    awayScore: Optional[int] = None
    startTime: str
    status: str
    venue: str = ""


class GameListOut(BaseModel):
    items: list[GameItem]
    total: int
    provider: str = "mock"
    usingMock: bool = True
