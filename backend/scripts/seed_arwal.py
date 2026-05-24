import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.future import select
from app.config import DATABASE_URL
from app.models import District, State, VerifiedPortal

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

CATEGORY_MAP = {
    "Certificates": "GOVERNMENT",
    "Land Records": "REVENUE",
    "Food & Civil Supplies": "GOVERNMENT",
    "Electricity": "ELECTRICITY",
    "Transport": "TRANSPORT",
    "Health": "HEALTH",
    "Agriculture": "AGRICULTURE",
    "Employment": "SOCIAL",
    "Citizen Services": "GOVERNMENT",
}

async def seed():
    async with async_session() as db:
        state_result = await db.execute(select(State).where(State.slug == "bihar"))
        bihar = state_result.scalars().first()
        if not bihar:
            print("ERROR: Bihar state not found.")
            return

        existing = await db.execute(
            select(District).where(District.slug == "arwal", District.state_id == bihar.id)
        )
        if existing.scalars().first():
            print("Arwal district already exists. Skipping creation.")
            return

        arwal = District(
            state_id=bihar.id,
            name="Arwal",
            slug="arwal",
            overview=(
                "Arwal district is one of the smallest districts of Bihar, carved out of Jehanabad. "
                "It is primarily an agriculture-based district with strong rural connectivity. "
                "Located near the Son River basin, Arwal plays an important role in farming, "
                "local trade, and government welfare schemes delivery."
            ),
            famous_places=[
                {"name": "Son River Belt", "description": "Fertile river region supporting agriculture and irrigation."},
                {"name": "Arwal Town Market", "description": "Main commercial hub for local trade and rural economy."},
                {"name": "Nearby Barabar Hills Access", "description": "Gateway region for visiting historical caves and hills."},
            ],
            railway_stations=[
                "Jehanabad Junction (Nearest Major)",
                "Makhdumpur (Nearby Access)",
                "Gaya Junction (Regional Connectivity)",
            ],
            industries_overview=(
                "Agriculture dominates the economy with wheat, rice, maize and pulses. "
                "Small trading shops, dairy farming, transport services and government "
                "scheme-based employment are key contributors."
            ),
            odop={
                "product_name": "Organic Agricultural Produce",
                "description": "Fresh organic grains, vegetables and pulses produced in fertile Son river belt.",
                "image_url": "https://example.com/odop/arwal-agriculture.jpg",
            },
            emergency_contacts={
                "police": "112",
                "fire": "101",
                "ambulance": "108",
                "women_helpline": "181",
                "child_helpline": "1098",
                "disaster_management": "1077",
            },
            government_offices=[
                "District Collectorate Arwal",
                "District Transport Office Arwal",
                "District Registration Office",
                "District Agriculture Office",
                "Block Development Offices (All Blocks)",
            ],
            most_searched_queries=[
                "Arwal Land Records Online",
                "Arwal Caste Certificate Apply",
                "Arwal Income Certificate Status",
                "Arwal Electricity Bill Payment",
                "Arwal Ration Card Status",
                "PM Kisan Arwal Status",
                "Driving Licence Arwal Appointment",
                "Ayushman Card Arwal Download",
            ],
            status="PUBLISHED",
        )
        db.add(arwal)
        await db.flush()

        portals_data = [
            {"name": "RTPS Bihar Services", "category": "Certificates", "url": "https://serviceonline.bihar.gov.in"},
            {"name": "Caste Certificate", "category": "Certificates", "url": "https://serviceonline.bihar.gov.in"},
            {"name": "Income Certificate", "category": "Certificates", "url": "https://serviceonline.bihar.gov.in"},
            {"name": "Residence Certificate", "category": "Certificates", "url": "https://serviceonline.bihar.gov.in"},
            {"name": "Birth Certificate Services", "category": "Certificates", "url": "https://serviceonline.bihar.gov.in"},
            {"name": "Death Certificate Services", "category": "Certificates", "url": "https://serviceonline.bihar.gov.in"},
            {"name": "Bihar Bhumi Land Records", "category": "Land Records", "url": "https://biharbhumi.bihar.gov.in"},
            {"name": "Online Mutation (Dakhil Kharij)", "category": "Land Records", "url": "https://biharbhumi.bihar.gov.in"},
            {"name": "EPDS Bihar Ration Card Services", "category": "Food & Civil Supplies", "url": "https://epds.bihar.gov.in"},
            {"name": "SBPDCL Electricity Services", "category": "Electricity", "url": "https://www.sbpdcl.co.in"},
            {"name": "Driving Licence Services", "category": "Transport", "url": "https://parivahan.gov.in"},
            {"name": "Vehicle Registration Services", "category": "Transport", "url": "https://parivahan.gov.in"},
            {"name": "Ayushman Bharat Card", "category": "Health", "url": "https://beneficiary.nha.gov.in"},
            {"name": "PM-KISAN Registration", "category": "Agriculture", "url": "https://pmkisan.gov.in"},
            {"name": "National Career Service", "category": "Employment", "url": "https://www.ncs.gov.in"},
            {"name": "Passport Services", "category": "Citizen Services", "url": "https://www.passportindia.gov.in"},
        ]

        portals = []
        for p in portals_data:
            portals.append(VerifiedPortal(
                district_id=arwal.id,
                name=p["name"],
                url=p["url"],
                category=CATEGORY_MAP.get(p["category"], "OTHER"),
                is_active=True,
            ))
        db.add_all(portals)
        await db.commit()

        print(f"Created Arwal district with {len(portals)} verified portals.")

if __name__ == "__main__":
    asyncio.run(seed())
