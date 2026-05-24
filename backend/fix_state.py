import asyncio
from app.database import engine
from sqlalchemy import text

async def fix():
    async with engine.begin() as conn:
        await conn.execute(
            text("""
                ALTER TABLE states
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
            """)
        )
        print("updated_at added to states")

asyncio.run(fix())
