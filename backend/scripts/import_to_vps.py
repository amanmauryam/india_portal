import asyncio, json, os, sys, uuid
sys.path.insert(0, "/root/india_portal/backend")
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.future import select
from app.config import DATABASE_URL
from app.models import State, District, VerifiedPortal, BlogPost, User

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def import_data():
    with open("/root/export.json", encoding="utf-8") as f:
        rows = json.load(f)

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.role == "SUPER_ADMIN").limit(1))).scalars().first()
        if not user:
            print("ERROR: No SUPER_ADMIN user found")
            return

        state_slug_map = {}
        for row in rows:
            if row["type"] == "states":
                for s in row["data"]:
                    existing = (await db.execute(select(State).where(State.slug == s["slug"]))).scalars().first()
                    if not existing:
                        ns = State(name=s["name"], slug=s["slug"], description=s["description"])
                        db.add(ns)
                        await db.flush()
                        state_slug_map[s["slug"]] = ns.id
                        print(f"State: {s['name']}")
                    else:
                        state_slug_map[s["slug"]] = existing.id

        await db.commit()

        created_d = 0
        for row in rows:
            if row["type"] != "district":
                continue
            d = row["data"]

            existing_d = (await db.execute(select(District).where(District.slug == d["slug"]))).scalars().first()
            if existing_d:
                print(f"SKIP District: {d['name']}")
                continue

            state_id = state_slug_map.get(d["state_slug"])
            if not state_id:
                print(f"ERROR: State not found for {d['name']}")
                continue

            portals = d.pop("portals", [])
            district = District(state_id=state_id, **{k: v for k, v in d.items() if k != "state_slug"})
            db.add(district)
            await db.flush()

            for p in portals:
                db.add(VerifiedPortal(district_id=district.id, **p))
            await db.flush()
            created_d += 1
            print(f"District: {district.name}")

        await db.commit()

        created_b = 0
        for row in rows:
            if row["type"] != "blog":
                continue
            b = row["data"]
            existing_b = (await db.execute(select(BlogPost).where(BlogPost.slug == b["slug"]))).scalars().first()
            if existing_b:
                print(f"SKIP Blog: {b['slug']}")
                continue
            blog = BlogPost(**b, author_id=user.id)
            db.add(blog)
            await db.flush()
            created_b += 1
            print(f"Blog: {b['title']}")

        await db.commit()
        print(f"\nDone! Districts: {created_d}, Blogs: {created_b}")

if __name__ == "__main__":
    asyncio.run(import_data())
