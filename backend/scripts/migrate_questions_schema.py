import sqlite3
import os

# Correct path relative to project root
DB_PATH = os.path.join(os.getcwd(), "backend", "data", "lms_simats.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check and add is_reference
    try:
        print("Checking for 'is_reference' column...")
        cursor.execute("SELECT is_reference FROM questions LIMIT 1")
        print("'is_reference' already exists.")
    except sqlite3.OperationalError:
        print("Adding 'is_reference' column...")
        cursor.execute("ALTER TABLE questions ADD COLUMN is_reference BOOLEAN DEFAULT 0")
        conn.commit()
        print("Added 'is_reference'.")

    # Check and add rubric_id
    try:
        print("Checking for 'rubric_id' column...")
        cursor.execute("SELECT rubric_id FROM questions LIMIT 1")
        print("'rubric_id' already exists.")
    except sqlite3.OperationalError:
        print("Adding 'rubric_id' column...")
        cursor.execute("ALTER TABLE questions ADD COLUMN rubric_id TEXT") # Changed to TEXT to match Rubric.id type which is String
        conn.commit()
        print("Added 'rubric_id'.")
        
    conn.close()

if __name__ == "__main__":
    migrate()
