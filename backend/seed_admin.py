import asyncio
from app.database import async_session, engine, Base
from app.models import User
from app.auth import get_password_hash

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        from sqlalchemy.future import select
        result = await db.execute(select(User).where(User.email == "admin@portal.gov.in"))
        existing = result.scalars().first()
        if existing:
            print(f"Admin user already exists: {existing.email} (role={existing.role})")
            return

        user = User(
            email="admin@portal.gov.in",
            hashed_password=get_password_hash("Admin@1234"),
            full_name="Portal Admin",
            role="SUPER_ADMIN",
            is_active=True,
        )
        db.add(user)
        await db.commit()
        print("Super admin created: admin@portal.gov.in / Admin@1234")

asyncio.run(seed())
