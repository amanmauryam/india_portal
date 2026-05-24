import asyncio
from app.database import Base, engine, async_session
from app.auth import get_password_hash
from app.models import User, State
from sqlalchemy.future import select

async def seed():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        user_exists = await db.execute(select(User).limit(1))
        if user_exists.scalars().first():
            print("Already seeded, skipping.")
            return

        admin = User(
            email="superadmin@portal.gov.in",
            hashed_password=get_password_hash("SuperAdmin@123"),
            full_name="Super Admin", role="SUPER_ADMIN", is_active=True,
        )
        db.add(admin)
        db.add(User(email="admin@portal.gov.in", hashed_password=get_password_hash("Admin@123"), full_name="Admin", role="ADMIN", is_active=True))
        db.add(User(email="manager@portal.gov.in", hashed_password=get_password_hash("Manager@123"), full_name="State Manager", role="STATE_MANAGER", is_active=True))
        await db.flush()

        state_up = State(name="Uttar Pradesh", slug="uttar-pradesh", description="The most populous state in India.")
        state_bihar = State(name="Bihar", slug="bihar", description="State in eastern India.")
        db.add_all([state_up, state_bihar])
        await db.flush()

        await db.commit()
        print(f"Seeded: 3 users, {state_up.name}, {state_bihar.name}")
        print("\nNext steps:")
        print("  1. Run: python scripts/generate_district_blogs.py")
        print("  2. Or use the admin panel to add districts and portals")

if __name__ == "__main__":
    asyncio.run(seed())
