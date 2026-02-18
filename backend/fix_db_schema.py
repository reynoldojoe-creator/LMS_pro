
import sqlite3

db_path = 'data/lms_simats.db'
print(f"Connecting to database at {db_path}...")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Columns to add based on SampleQuestion model
columns_to_add = [
    ('difficulty', 'TEXT'),
    ('co_mapping', 'TEXT'), # JSON stored as TEXT in SQLite
    ('lo_mapping', 'TEXT'), # JSON stored as TEXT
    ('topic', 'TEXT'),
    ('unit', 'INTEGER'),
    ('uploaded_at', 'TEXT'),
    ('options', 'TEXT'),
    ('correct_answer', 'TEXT'),
    ('co_ids', 'TEXT'),
    ('lo_ids', 'TEXT'),
    ('file_path', 'TEXT')
]

print("Checking and adding columns...")

for col_name, col_type in columns_to_add:
    try:
        # Check if column exists strictly
        cursor.execute(f"SELECT {col_name} FROM sample_questions LIMIT 1")
    except sqlite3.OperationalError:
        # Column likely doesn't exist, try adding it
        try:
            print(f"Adding column: {col_name} ({col_type})")
            cursor.execute(f"ALTER TABLE sample_questions ADD COLUMN {col_name} {col_type}")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")
    except Exception as e:
        print(f"Unexpected error checking {col_name}: {e}")
    else:
        print(f"Column {col_name} already exists.")

conn.commit()
print("Committed changes.")
conn.close()
