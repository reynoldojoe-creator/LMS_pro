import sqlite3
import os

# Define path to DB
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "data", "lms_simats.db")

def migrate():
    print(f"Migrating database at {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("Database not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(topics)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "has_custom_skill" not in columns:
            print("Adding has_custom_skill column to topics table...")
            cursor.execute("ALTER TABLE topics ADD COLUMN has_custom_skill INTEGER DEFAULT 0")
            conn.commit()
            print("Migration successful: added has_custom_skill")
        else:
            print("Column has_custom_skill already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
