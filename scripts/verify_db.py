import sqlite3
import os
import sys

# Mimic database.py logic to find path
# backend/app/models/database.py
# ROOT/backend/app/models/database.py
# _BASE_DIR = backend
# _DB_PATH = backend/data/lms_simats.db

# From scripts/verify_db.py
# ROOT/scripts/verify_db.py
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
DB_PATH = os.path.join(ROOT_DIR, "backend", "data", "lms_simats.db")

print(f"Checking DB at: {DB_PATH}")

if not os.path.exists(DB_PATH):
    print("❌ Database file does NOT exist at this path.")
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    cursor.execute("PRAGMA table_info(topics)")
    columns = cursor.fetchall()
    col_names = [c[1] for c in columns]
    
    print("\nColumns in 'topics' table:")
    for c in col_names:
        print(f" - {c}")
        
    if "has_custom_skill" in col_names:
        print("\n✅ 'has_custom_skill' column EXISTS.")
    else:
        print("\n❌ 'has_custom_skill' column MISSING.")
        
except Exception as e:
    print(f"Error reading DB: {e}")
finally:
    conn.close()
