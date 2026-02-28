import asyncio
from app.models import database
from app.api.endpoints.rubrics import export_rubric_pdf

async def test():
    db = database.SessionLocal()
    try:
        res = await export_rubric_pdf("2f6be0d2-9996-41dd-8767-d173614d7b3f", db)
        print("Success")
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test())
