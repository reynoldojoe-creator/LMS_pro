import sqlite3
import os

# Define path to DB
# ROOT/scripts/migrate_samples.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "data", "lms_simats.db")

def migrate():
    print(f"Migrating sample_questions at {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("Database not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(sample_questions)")
        columns_info = cursor.fetchall()
        existing_columns = [info[1] for info in columns_info]
        
        print(f"Existing columns: {existing_columns}")
        
        # Columns to add based on SampleQuestion model:
        # options = Column(Text, nullable=True) # JSON string for MCQs
        # correct_answer = Column(Text, nullable=True)
        # marks = Column(Integer, default=1)
        # co_ids = Column(Text, nullable=True) # JSON string of CO IDs
        # lo_ids = Column(Text, nullable=True) # JSON string of LO IDs
        # file_path = Column(String, nullable=True) # Original file source if any
        
        new_columns = {
            "options": "TEXT",
            "correct_answer": "TEXT",
            "marks": "INTEGER DEFAULT 1",
            "co_ids": "TEXT",
            "lo_ids": "TEXT",
            "file_path": "TEXT",
            "created_at": "TEXT DEFAULT '1970-01-01 00:00:00'"
        }
        
        for col, dtype in new_columns.items():
            if col not in existing_columns:
                print(f"Adding column: {col}")
                cursor.execute(f"ALTER TABLE sample_questions ADD COLUMN {col} {dtype}")
            else:
                print(f"Column {col} already exists.")
                
        conn.commit()
        print("Migration successful: sample_questions updated.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
