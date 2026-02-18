"""
Migration: Add missing columns & tables to SQLite DB.

Fixes:
1. course_outcomes.order column
2. course_outcomes.source column
3. course_outcomes.bloom_level column
4. learning_outcomes.order column
5. learning_outcomes.bloom_level column
6. questions.is_reference column
7. questions.batch_id column
8. generated_questions table (if missing)
9. generated_batches table (if missing)
10. vetting_feedback table (if missing)
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "lms_simats.db")

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns

def table_exists(cursor, table):
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return cursor.fetchone() is not None

def migrate():
    print(f"Connecting to: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    changes = []

    # --- course_outcomes columns ---
    for col, col_type, default in [
        ("order", "INTEGER", "0"),
        ("source", "TEXT", "'explicit'"),
        ("bloom_level", "TEXT", "NULL"),
    ]:
        if not column_exists(cursor, "course_outcomes", col):
            cursor.execute(f"ALTER TABLE course_outcomes ADD COLUMN \"{col}\" {col_type} DEFAULT {default}")
            changes.append(f"Added course_outcomes.{col}")

    # --- learning_outcomes columns ---
    for col, col_type, default in [
        ("order", "INTEGER", "0"),
        ("bloom_level", "TEXT", "NULL"),
    ]:
        if not column_exists(cursor, "learning_outcomes", col):
            cursor.execute(f"ALTER TABLE learning_outcomes ADD COLUMN \"{col}\" {col_type} DEFAULT {default}")
            changes.append(f"Added learning_outcomes.{col}")

    # --- questions columns ---
    for col, col_type, default in [
        ("is_reference", "INTEGER", "0"),
        ("batch_id", "TEXT", "NULL"),
        ("rubric_id", "TEXT", "NULL"),
    ]:
        if not column_exists(cursor, "questions", col):
            cursor.execute(f"ALTER TABLE questions ADD COLUMN \"{col}\" {col_type} DEFAULT {default}")
            changes.append(f"Added questions.{col}")

    # --- generated_batches table ---
    if not table_exists(cursor, "generated_batches"):
        cursor.execute("""
            CREATE TABLE generated_batches (
                id TEXT PRIMARY KEY,
                rubric_id TEXT,
                subject_id INTEGER,
                generated_by TEXT,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_questions INTEGER,
                approved_count INTEGER DEFAULT 0,
                rejected_count INTEGER DEFAULT 0,
                pending_count INTEGER,
                status TEXT DEFAULT 'pending'
            )
        """)
        changes.append("Created generated_batches table")

    # --- generated_questions table ---
    if not table_exists(cursor, "generated_questions"):
        cursor.execute("""
            CREATE TABLE generated_questions (
                id TEXT PRIMARY KEY,
                batch_id TEXT,
                question_text TEXT,
                question_type TEXT,
                options TEXT,
                correct_answer TEXT,
                explanation TEXT,
                co_mappings TEXT,
                lo_mappings TEXT,
                bloom_level TEXT,
                difficulty TEXT,
                marks INTEGER,
                topic_id INTEGER,
                validation_score REAL,
                validation_issues TEXT,
                status TEXT DEFAULT 'pending',
                vetted_by TEXT,
                vetted_at DATETIME,
                rejection_reason TEXT,
                rejection_category TEXT,
                vetter_co_adjustment TEXT,
                vetter_lo_adjustment TEXT,
                vetter_notes TEXT,
                FOREIGN KEY (batch_id) REFERENCES generated_batches(id)
            )
        """)
        changes.append("Created generated_questions table")

    # --- vetting_feedback table ---
    if not table_exists(cursor, "vetting_feedback"):
        cursor.execute("""
            CREATE TABLE vetting_feedback (
                id TEXT PRIMARY KEY,
                subject_id INTEGER,
                topic_id INTEGER,
                question_type TEXT,
                rejection_category TEXT,
                count INTEGER DEFAULT 1,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        changes.append("Created vetting_feedback table")

    conn.commit()
    conn.close()

    if changes:
        print(f"\n✅ Applied {len(changes)} changes:")
        for c in changes:
            print(f"   - {c}")
    else:
        print("\n✅ Database is already up to date. No changes needed.")

if __name__ == "__main__":
    migrate()
