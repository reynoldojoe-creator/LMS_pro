
from app.models.database import engine
import os

db_path = engine.url.database
print(f"Database Path from Engine: {db_path}")
if db_path and not db_path.startswith(':memory:'):
    print(f"Absolute Path: {os.path.abspath(db_path)}")
