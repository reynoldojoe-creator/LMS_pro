import sqlite3
import os
import json

def migrate_database():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "data", "lms_simats.db")
    
    print(f"Connecting to database at {db_path}")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Migrate Questions
    # Check if bloom_level exists
    try:
        cursor.execute("SELECT bloom_level FROM questions LIMIT 1")
        print("Migrating questions table...")
        
        # Fetch all questions needed migration
        cursor.execute("SELECT id, bloom_level, difficulty FROM questions")
        questions = cursor.fetchall()
        
        for q in questions:
            bloom = q['bloom_level']
            difficulty = q['difficulty']
            
            # Map Bloom to Difficulty if Difficulty is missing or default
            new_difficulty = difficulty
            if bloom:
                bloom_lower = bloom.lower()
                if start_bloom_match(bloom_lower, ['remember', 'understand']):
                    new_difficulty = 'easy'
                elif start_bloom_match(bloom_lower, ['apply', 'analyze']):
                    new_difficulty = 'medium'
                elif start_bloom_match(bloom_lower, ['evaluate', 'create']):
                    new_difficulty = 'hard'
                
                # Update if changed
                if new_difficulty != difficulty:
                    cursor.execute("UPDATE questions SET difficulty = ? WHERE id = ?", (new_difficulty, q['id']))
        
        # Drop bloom_level column
        # SQLite doesn't support DROP COLUMN directly in older versions, but let's try standard syntax
        # If it fails, we ignore (column remains but unused)
        try:
            cursor.execute("ALTER TABLE questions DROP COLUMN bloom_level")
            print("Dropped bloom_level from questions")
        except Exception as e:
            print(f"Could not drop bloom_level from questions (might require table recreation): {e}")

    except sqlite3.OperationalError:
        print("bloom_level not found in questions (already migrated?)")

    # 2. Migrate Course Outcomes
    try:
        cursor.execute("SELECT bloom_level FROM course_outcomes LIMIT 1")
        print("Migrating course_outcomes table...")
        try:
            cursor.execute("ALTER TABLE course_outcomes DROP COLUMN bloom_level")
            print("Dropped bloom_level from course_outcomes")
        except Exception as e:
            print(f"Could not drop bloom_level from course_outcomes: {e}")
    except sqlite3.OperationalError:
        print("bloom_level not found in course_outcomes")

    # 3. Migrate Learning Outcomes
    try:
        cursor.execute("SELECT bloom_level FROM learning_outcomes LIMIT 1")
        print("Migrating learning_outcomes table...")
        try:
            cursor.execute("ALTER TABLE learning_outcomes DROP COLUMN bloom_level")
            print("Dropped bloom_level from learning_outcomes")
        except Exception as e:
             print(f"Could not drop bloom_level from learning_outcomes: {e}")
    except sqlite3.OperationalError:
         print("bloom_level not found in learning_outcomes")

    # 4. Cleanup Rubrics (bloom_distribution)
    # This is harder as it is JSON in a text column. We'll just leave it or nullify it if we parsed it.
    # Since we removed the field from the model, the app won't read it. The column in DB will just be ignored.
    # We can drop the column if we want.
    try:
        cursor.execute("SELECT bloom_distribution FROM rubrics LIMIT 1")
        print("Migrating rubrics table...")
        try:
            cursor.execute("ALTER TABLE rubrics DROP COLUMN bloom_distribution")
            print("Dropped bloom_distribution from rubrics")
        except Exception as e:
             print(f"Could not drop bloom_distribution from rubrics: {e}")

        # Also need to check 'sections' column if it contains bloom info in JSON?
        # The prompt templates and prompts logic were stored in code, not DB (mostly).
        # Rubric structure stored in 'sections' might have 'bloom_distribution'.
        # We'll leave that for now as it doesn't break anything, just extra data.

    except sqlite3.OperationalError:
         print("bloom_distribution not found in rubrics")

    conn.commit()
    conn.close()
    print("Migration completed.")

def start_bloom_match(bloom, keywords):
    for k in keywords:
        if k in bloom:
            return True
    return False

if __name__ == "__main__":
    migrate_database()
