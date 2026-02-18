import sqlite3
import os
import sys
from sqlalchemy import create_engine, inspect
from backend.app.models.database import Base, engine 
# Note: We need to import all models so Base.metadata is populated
from backend.app.models import database

# Path setup to allow imports
sys.path.append(os.getcwd())

def verify_schema():
    print("Verifying database schema match...")
    
    # Get actual DB schema
    inspector = inspect(engine)
    db_tables = inspector.get_table_names()
    
    # Get model definition
    model_tables = Base.metadata.tables
    
    errors = []
    
    for table_name, table_obj in model_tables.items():
        if table_name not in db_tables:
            print(f"❌ Table MISSING in DB: {table_name}")
            errors.append(f"Missing table: {table_name}")
            continue
            
        print(f"Checking table: {table_name}...", end="")
        
        # Get actual columns
        db_columns = [c['name'] for c in inspector.get_columns(table_name)]
        
        # Check model columns
        missing_cols = []
        for column in table_obj.columns:
            if column.name not in db_columns:
                missing_cols.append(column.name)
        
        if missing_cols:
            print(f" ❌ MISSING columns: {missing_cols}")
            errors.append(f"Table {table_name} missing columns: {missing_cols}")
        else:
            print(" ✅ OK")
            
    if errors:
        print("\n--- SCHEMA MISMATCHES FOUND ---")
        for e in errors:
            print(f"- {e}")
        print("-------------------------------")
    else:
        print("\n✅ Schema matches perfectly!")

if __name__ == "__main__":
    verify_schema()
