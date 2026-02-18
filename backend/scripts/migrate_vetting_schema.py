import sqlite3
import os

# Correct path relative to where script is run (project root)
DB_PATH = os.path.join(os.getcwd(), "data", "lms_simats.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("Checking for 'lo_mappings' column...")
        cursor.execute("SELECT lo_mappings FROM generated_questions LIMIT 1")
        print("'lo_mappings' already exists.")
    except sqlite3.OperationalError:
        print("Adding 'lo_mappings' column...")
        cursor.execute("ALTER TABLE generated_questions ADD COLUMN lo_mappings JSON")
        conn.commit()
        print("Added 'lo_mappings'.")

    try:
        print("Checking for 'vetter_lo_adjustment' column...")
        cursor.execute("SELECT vetter_lo_adjustment FROM generated_questions LIMIT 1")
        print("'vetter_lo_adjustment' already exists.")
    except sqlite3.OperationalError:
        print("Adding 'vetter_lo_adjustment' column...")
        cursor.execute("ALTER TABLE generated_questions ADD COLUMN vetter_lo_adjustment JSON")
        conn.commit()
        print("Added 'vetter_lo_adjustment'.")

    conn.close()

if __name__ == "__main__":
    migrate()
