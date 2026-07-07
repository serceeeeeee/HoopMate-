from app.database import Base, SessionLocal, engine
from app.models import TrainingSession, User
from app.services.demo_data import build_demo_sessions


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            user = User(
                id=1,
                nickname="HoopMate 演示用户",
                position="SG",
                height_cm=178,
                weight_kg=70,
                skill_level="中级",
                goal="提升投篮稳定性和训练连续性",
                weekly_goal_sessions=4,
                weekly_goal_minutes=240,
                target_shooting_rate=55.0,
                stage_goal="4 周内提升三分稳定性和训练连续性",
            )
            db.add(user)
            db.commit()
        db.query(TrainingSession).filter(TrainingSession.user_id == 1).delete()
        for item in build_demo_sessions(user_id=1):
            db.add(TrainingSession(**item))
        db.commit()
        print("演示数据已初始化：user_id=1")
    finally:
        db.close()


if __name__ == "__main__":
    main()
