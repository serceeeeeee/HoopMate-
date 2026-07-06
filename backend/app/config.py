from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = BASE_DIR / "hoopmate.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
DEFAULT_USER_ID = int(os.getenv("DEFAULT_USER_ID", "1"))
