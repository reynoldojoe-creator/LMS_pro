from typing import Generator
from ..models import database

# Dependency
def get_db() -> Generator:
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
