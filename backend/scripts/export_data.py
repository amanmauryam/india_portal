import asyncio, json, os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.config import DATABASE_URL
from app.models import State, District, VerifiedPortal, BlogPost

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def export():
    rows = []
    async with async_session() as db:
        states = (await db.execute(select(State))).scalars().all()
        state_map = {s.id: s.slug for s in states}
        rows.append({"type": "states", "data": [{"name": s.name, "slug": s.slug, "description": s.description} for s in states]})

        districts = (await db.execute(
            select(District).options(selectinload(District.verified_portals))
        )).scalars().all()

        for d in districts:
            entry = {
                "state_slug": state_map[d.state_id],
                "name": d.name, "slug": d.slug, "headquarter": d.headquarter,
                "overview": d.overview, "famous_places": d.famous_places,
                "railway_stations": d.railway_stations, "industries_overview": d.industries_overview,
                "odop": d.odop, "emergency_contacts": d.emergency_contacts,
                "government_offices": d.government_offices, "most_searched_queries": d.most_searched_queries,
                "popular_government_services": d.popular_government_services, "seo_keywords": d.seo_keywords,
                "bus_stands": d.bus_stands, "airports_nearby": d.airports_nearby,
                "major_crops": d.major_crops, "electricity_provider": d.electricity_provider,
                "water_supply_authority": d.water_supply_authority, "municipal_bodies": d.municipal_bodies,
                "government_hospitals": d.government_hospitals, "police_stations_count": d.police_stations_count,
            }
            entry = {k: v for k, v in entry.items() if v not in (None, [], {}, "")}
            portals = []
            for p in d.verified_portals or []:
                portals.append({"name": p.name, "category": p.category, "url": p.url, "description": p.description, "is_active": p.is_active})
            entry["portals"] = portals
            rows.append({"type": "district", "data": entry})

        blogs = (await db.execute(select(BlogPost).where(BlogPost.slug.like("%-district-guide")))).scalars().all()
        for b in blogs:
            rows.append({"type": "blog", "data": {
                "title": b.title, "slug": b.slug, "content_blocks": b.content_blocks,
                "status": b.status, "meta_title": b.meta_title, "meta_description": b.meta_description,
                "og_title": b.og_title, "og_description": b.og_description,
                "robots": b.robots, "schema_markup": b.schema_markup,
            }})
            print(f"  Blog: {b.title}")

    with open("export.json", "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(rows)} items to export.json")

if __name__ == "__main__":
    asyncio.run(export())
