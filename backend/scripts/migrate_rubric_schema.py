import sqlite3
import os

# Correct path relative to project root
DB_PATH = os.path.join(os.getcwd(), "backend", "data", "lms_simats.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check and add lo_distribution
    try:
        print("Checking for 'lo_distribution' column...")
        cursor.execute("SELECT lo_distribution FROM rubrics LIMIT 1")
        print("'lo_distribution' already exists.")
    except sqlite3.OperationalError:
        print("Adding 'lo_distribution' column...")
        cursor.execute("ALTER TABLE rubrics ADD COLUMN lo_distribution TEXT")
        conn.commit()
        print("Added 'lo_distribution'.")

    # Check and add assignment_config
    try:
        print("Checking for 'assignment_config' column...")
        cursor.execute("SELECT assignment_config FROM rubrics LIMIT 1")
        print("'assignment_config' already exists.")
    except sqlite3.OperationalError:
        print("Adding 'assignment_config' column...")
        cursor.execute("ALTER TABLE rubrics ADD COLUMN assignment_config TEXT")
        conn.commit()
        print("Added 'assignment_config'.")
        
    # Check and add co_distribution if missing (it was legacy co_requirements)
    try:
        print("Checking for 'co_distribution' column...")
        cursor.execute("SELECT co_distribution FROM rubrics LIMIT 1")
        print("'co_distribution' already exists.")
    except sqlite3.OperationalError:
        print("Adding 'co_distribution' column...")
        cursor.execute("ALTER TABLE rubrics ADD COLUMN co_distribution TEXT")
        conn.commit()
        print("Added 'co_distribution'.")

    conn.close()

if __name__ == "__main__":
    migrate()
