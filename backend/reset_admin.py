import asyncio
from app.database import async_session
from app.models import User
from app.auth import get_password_hash, verify_password
from sqlalchemy.future import select

async def reset():
    async with async_session() as db:
        r = await db.execute(select(User).where(User.email == "admin@portal.gov.in"))
        u = r.scalars().first()
        if not u:
            print("Admin user not found!")
            return

        h = get_password_hash("Admin@1234")
        u.hashed_password = h
        await db.commit()

        # Verify
        await db.refresh(u)
        ok = verify_password("Admin@1234", u.hashed_password)
        print(f"Password reset. Verify: {ok}")
        print(f"Hash: {u.hashed_password[:50]}...")

asyncio.run(reset())
