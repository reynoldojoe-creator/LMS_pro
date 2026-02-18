import sqlite3
import os

# Path to database - assuming it is in backend/app/lms.db or similar. 
# I need to check where the DB is. PROBABLY backend/app/lms.db or just lms.db
# Let's check typical location from database.py

DB_PATH = "backend/data/lms_simats.db" 

if not os.path.exists(DB_PATH):
    # Try alternate path
    DB_PATH = "lms.db"

if not os.path.exists(DB_PATH):
    print(f"Database not found at {DB_PATH}")
    # try one more
    DB_PATH = "backend/lms.db"

print(f"Using database at {DB_PATH}")

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(generated_batches)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if "title" not in columns:
        print("Adding 'title' column to generated_batches...")
        cursor.execute("ALTER TABLE generated_batches ADD COLUMN title TEXT")
        conn.commit()
        print("Column added successfully.")
    else:
        print("'title' column already exists.")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
