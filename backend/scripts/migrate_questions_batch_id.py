import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), "backend", "data", "lms_simats.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("Checking for 'batch_id' column...")
        cursor.execute("SELECT batch_id FROM questions LIMIT 1")
        print("'batch_id' already exists.")
    except sqlite3.OperationalError:
        print("Adding 'batch_id' column...")
        cursor.execute("ALTER TABLE questions ADD COLUMN batch_id TEXT")
        conn.commit()
        print("Added 'batch_id'.")
        
    conn.close()

if __name__ == "__main__":
    migrate()
