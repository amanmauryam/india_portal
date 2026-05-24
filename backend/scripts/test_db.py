import asyncio
import asyncpg

async def test():
    try:
        conn = await asyncpg.connect(user="portal", password="Aman@123", host="127.0.0.1", port=5432, database="india_portal")
        print("Connected!")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test())
