import sqlite3
import os
import sys

def migrate_database():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "data", "lms_simats.db")
    
    print(f"Connecting to database at {db_path}")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("PRAGMA foreign_keys=OFF")
        conn.commit()

        # 1. Check if we need to migrate
        print("Checking if migration is needed...")
        cursor.execute("PRAGMA table_info(topics)")
        columns = [row['name'] for row in cursor.fetchall()]
        if 'subject_id' in columns and 'unit_id' not in columns:
            print("Migration already applied (subject_id exists, unit_id missing in topics).")
            return

        print("Starting migration: Flattening Topics (removing Units)...")
        conn.execute("BEGIN TRANSACTION")

        # 2. Rename existing topics table
        print("Renaming 'topics' to 'topics_old'...")
        cursor.execute("ALTER TABLE topics RENAME TO topics_old")
        
        # Drop strict indexes that might conflict
        print("Dropping old indexes...")
        cursor.execute("DROP INDEX IF EXISTS ix_topics_id")
        cursor.execute("DROP INDEX IF EXISTS ix_topics_unit_id")
        cursor.execute("DROP INDEX IF EXISTS ix_topics_subject_id")

        # 3. Create new topics table
        # We need to replicate the schema from database.py but with new fields
        # Old schema: id, unit_id, name, has_custom_skill...
        # New schema: id, subject_id, name, order, has_custom_skill...
        print("Creating new 'topics' table...")
        create_table_sql = """
        CREATE TABLE topics (
            id INTEGER PRIMARY KEY,
            subject_id INTEGER NOT NULL,
            name VARCHAR,
            "order" INTEGER DEFAULT 0,
            has_custom_skill INTEGER DEFAULT 0,
            FOREIGN KEY(subject_id) REFERENCES subjects(id)
        )
        """
        cursor.execute(create_table_sql)
        # Create index
        cursor.execute("CREATE INDEX ix_topics_id ON topics (id)")
        cursor.execute("CREATE INDEX ix_topics_subject_id ON topics (subject_id)")

        # 4. Migrate data
        print("Migrating data from topics_old and units...")
        # Join topics_old with units to get subject_id
        # We also want to preserve existing data. 
        # Note: 'units' table must exist for this to work.
        
        cursor.execute("""
            SELECT 
                t.id, 
                u.subject_id, 
                t.name, 
                t.has_custom_skill,
                u.number as unit_number -- use unit number for initial ordering
            FROM topics_old t
            JOIN units u ON t.unit_id = u.id
        """)
        rows = cursor.fetchall()
        
        migrated_count = 0
        for row in rows:
            cursor.execute("""
                INSERT INTO topics (id, subject_id, name, "order", has_custom_skill)
                VALUES (?, ?, ?, ?, ?)
            """, (
                row['id'], 
                row['subject_id'], 
                row['name'], 
                row['unit_number'], # Use unit number as poor man's order, or 0
                row['has_custom_skill']
            ))
            migrated_count += 1
            
        print(f"Migrated {migrated_count} topics.")

        # 5. Drop old tables
        print("Dropping 'topics_old' and 'units'...")
        cursor.execute("DROP TABLE topics_old")
        cursor.execute("DROP TABLE units")

        # 6. Commit
        conn.commit()
        print("Migration successful!")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        # Restore if possible? (Hard in python script without full backup mechanism)
        # But we used transaction, so rollback should handle DB state.
        sys.exit(1)
    finally:
        cursor.execute("PRAGMA foreign_keys=ON")
        conn.close()

if __name__ == "__main__":
    migrate_database()
