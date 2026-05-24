import asyncio
import os
import sys
import uuid
import re
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import DATABASE_URL
from app.models import District, State, BlogPost, User, VerifiedPortal


engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


def get_portal_category_label(cat: str) -> str:
    labels = {
        "ELECTRICITY": "Electricity Department",
        "WATER": "Water Supply Department",
        "GAS": "Gas Department",
        "GOVERNMENT": "Government Services",
        "MUNICIPAL": "Municipal Corporation",
        "EDUCATION": "Education Department",
        "HEALTH": "Health Department",
        "REVENUE": "Revenue Department",
        "POLICE": "Police Services",
        "TRANSPORT": "Transport Department",
        "SOCIAL": "Social Welfare",
        "AGRICULTURE": "Agriculture Department",
        "BANKING": "Banking Services",
        "OTHER": "Other Services",
    }
    return labels.get(cat, cat.replace("_", " ").title())


def get_meta_description(district: District, state: State) -> str:
    base = f"Complete guide to government services in {district.name} district, {state.name}. "
    extras = []
    if district.headquarter:
        extras.append(f"headquarters at {district.headquarter}")
    if district.popular_government_services:
        count = len(district.popular_government_services)
        extras.append(f"{count} essential citizen services")
    extras.append("verified utility portals")
    extras.append("emergency contacts")
    return base + "Find " + ", ".join(extras) + "."


def get_meta_keywords(district: District, state: State) -> str:
    keywords = [f"{district.name} district", f"{district.name} {state.name}"]
    if district.seo_keywords:
        keywords.extend(district.seo_keywords[:5])
    keywords.extend([
        f"government services in {district.name}",
        f"{district.name} utility portals",
        f"{district.name} verified portals",
        f"{district.name} helpline numbers",
        f"{district.name} government offices",
        f"citizen services {district.name}",
    ])
    return ", ".join(dict.fromkeys(k.lower().strip() for k in keywords))


def build_content_blocks(district: District, state: State, portals: list) -> list:
    blocks = []

    h1 = f"Complete Guide to Government Services in {district.name} District, {state.name}"
    if district.headquarter:
        h1 = f"Complete Guide to Government Services in {district.name} ({district.headquarter}), {state.name}"
    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "heading",
        "data": {"level": 1, "text": h1}
    })

    intro = (f"Welcome to the ultimate guide to government services in {district.name} district, {state.name}. "
             f"This comprehensive resource covers everything you need to know about citizen services, "
             f"verified utility portals, emergency contacts, transportation, and more in {district.name}. "
             f"Whether you are a resident or a newcomer, this guide will help you navigate all essential "
             f"government services efficiently.")
    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "paragraph",
        "data": {"text": intro}
    })

    if district.headquarter:
        blocks.append({
            "id": str(uuid.uuid4()),
            "type": "callout",
            "data": {
                "text": f"**District Headquarters:** {district.headquarter} | **State:** {state.name} | **Pin Code:** Check official portal",
                "variant": "info"
            }
        })

    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "heading",
        "data": {"level": 2, "text": f"Overview of {district.name} District"}
    })

    overview = district.overview or (
        f"{district.name} is a prominent district in the state of {state.name}, India. "
        f"It plays a vital role in the administrative, social, and economic development of the region. "
        f"The district is well-connected by road and rail networks, making it accessible from major cities. "
        f"With a rich cultural heritage and growing infrastructure, {district.name} offers a blend of "
        f"traditional values and modern amenities for its residents."
    )
    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "paragraph",
        "data": {"text": overview}
    })

    if district.popular_government_services:
        blocks.append({
            "id": str(uuid.uuid4()),
            "type": "heading",
            "data": {"level": 2, "text": f"Key Government Services in {district.name}"}
        })
        services_text = f"**{district.name}** district offers the following essential government services to its citizens:"
        for s in district.popular_government_services:
            services_text += f"\n- **{s}**"
        blocks.append({
            "id": str(uuid.uuid4()),
            "type": "paragraph",
            "data": {"text": services_text}
        })

    if portals:
        blocks.append({
            "id": str(uuid.uuid4()),
            "type": "heading",
            "data": {"level": 2, "text": f"Verified Utility Portals for {district.name} Residents"}
        })
        blocks.append({
            "id": str(uuid.uuid4()),
            "type": "paragraph",
            "data": {
                "text": f"Below is the complete list of verified government and utility portals for **{district.name}** district. "
                        f"These portals are officially verified and allow residents to access various services online "
                        f"from the comfort of their homes. Always use these official links to avoid fraud."
            }
        })
        blocks.append({
            "id": str(uuid.uuid4()),
            "type": "table",
            "data": {
                "headers": ["Portal Name", "Category", "Official Link"],
                "rows": [[p.name, get_portal_category_label(p.category), p.url] for p in portals],
                "caption": f"Verified utility portals for {district.name} district, {state.name}"
            }
        })

    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "heading",
        "data": {"level": 2, "text": f"Important Information About {district.name}"}
    })

    info_lines = []
    if district.railway_stations:
        stations = []
        for rs in district.railway_stations:
            stations.append(rs.get("name", str(rs)) if isinstance(rs, dict) else str(rs))
        if stations:
            info_lines.append(f"**Major Railway Stations:** {', '.join(stations)}")
    if district.bus_stands:
        info_lines.append(f"**Bus Stands:** {', '.join(district.bus_stands)}")
    if district.airports_nearby:
        info_lines.append(f"**Nearby Airports:** {', '.join(district.airports_nearby)}")
    if district.major_crops:
        info_lines.append(f"**Major Crops:** {', '.join(district.major_crops)}")
    if district.police_stations_count:
        info_lines.append(f"**Number of Police Stations:** {district.police_stations_count}")
    if district.electricity_provider:
        info_lines.append(f"**Electricity Provider:** {', '.join(district.electricity_provider)}")
    if district.water_supply_authority:
        info_lines.append(f"**Water Supply Authority:** {', '.join(district.water_supply_authority)}")
    if district.municipal_bodies:
        info_lines.append(f"**Municipal Bodies:** {', '.join(district.municipal_bodies)}")
    if district.government_hospitals:
        hospitals = [h.get("name", str(h)) if isinstance(h, dict) else str(h) for h in district.government_hospitals]
        info_lines.append(f"**Government Hospitals:** {', '.join(hospitals)}")
    if district.government_offices:
        info_lines.append(f"**Government Offices:** {', '.join(district.government_offices)}")

    if info_lines:
        blocks.append({
            "id": str(uuid.uuid4()),
            "type": "bullet_list",
            "data": {"items": [{"text": line} for line in info_lines]}
        })

    if district.famous_places:
        blocks.append({
            "id": str(uuid.uuid4()),
            "type": "paragraph",
            "data": {
                "text": f"**Tourist Attractions in {district.name}:** " +
                        ", ".join(
                            p.get("name", str(p)) if isinstance(p, dict) else str(p)
                            for p in district.famous_places
                        )
            }
        })

    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "heading",
        "data": {"level": 2, "text": f"Emergency Contacts for {district.name}"}
    })
    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "paragraph",
        "data": {
            "text": "In case of emergencies, dial the following numbers:\n"
                    "- **Police:** 100\n"
                    "- **Fire Brigade:** 101\n"
                    "- **Ambulance:** 102 / 108\n"
                    "- **Women Helpline:** 1090\n"
                    "- **Child Helpline:** 1098\n\n"
                    "For district-specific emergency contacts, please visit the official district website."
        }
    })

    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "heading",
        "data": {"level": 2, "text": "Frequently Asked Questions"}
    })

    hq_phrase = district.headquarter or "the district headquarters"
    faq_bank = [
        {
            "question": f"Where are the main government offices located in {district.name}?",
            "answer": f"The main government offices of **{district.name}** district are located at {hq_phrase}. "
                      f"These include the District Collectorate, District Council Office, Superintendent of Police Office, "
                      f"and various development authorities. Visit the respective verified portals for exact addresses."
        },
        {
            "question": f"Are online government services available in {district.name}?",
            "answer": f"Yes, **{district.name}** district offers multiple online government services. Through the verified "
                      f"portals listed above, residents can pay electricity bills, water taxes, apply for birth/death "
                      f"certificates, caste certificates, income certificates, and access many other citizen services online."
        },
        {
            "question": f"What is the best way to find official government portals for {district.name}?",
            "answer": f"The safest way is to use the verified portals listed in the table above on this page. "
                      f"These are officially verified and regularly updated. Always avoid clicking on suspicious links "
                      f"or paying money to unofficial agents for government services."
        },
        {
            "question": f"How can I get a birth or death certificate in {district.name}?",
            "answer": f"Birth and death certificates in **{district.name}** can be applied online through the state's e-District "
                      f"portal or the local municipal corporation website. Alternatively, visit the nearest municipal office "
                      f"or the district collectorate for assistance."
        },
        {
            "question": f"What transportation options are available in {district.name}?",
            "answer": f"**{district.name}** is well-connected by road and rail. "
                      + (f"The major railway stations include {', '.join(stations)}. " if info_lines and any("Railway" in l for l in info_lines) else "")
                      + (f"Key bus stands are located at {', '.join(district.bus_stands)}. " if district.bus_stands else "")
                      + ("For air travel, the nearest airports are listed in the information section above."
                         if district.airports_nearby else "")
        },
    ]

    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "faq",
        "data": {"items": faq_bank}
    })

    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "heading",
        "data": {"level": 2, "text": "Conclusion"}
    })
    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "paragraph",
        "data": {
            "text": f"**{district.name}** district in {state.name} offers a wide range of government services and citizen "
                    f"facilities. We hope this guide has helped you find the information you were looking for. "
                    f"Bookmark this page for quick access to all verified portals and essential services for {district.name}."
        }
    })

    blocks.append({
        "id": str(uuid.uuid4()),
        "type": "cta",
        "data": {
            "text": f"Explore All Services in {district.name} →",
            "url": f"/{state.slug}/{district.slug}",
            "variant": "primary"
        }
    })

    return blocks


async def generate_blogs():
    async with async_session() as db:
        user_result = await db.execute(
            select(User).where(User.role == "SUPER_ADMIN").limit(1)
        )
        super_admin = user_result.scalars().first()
        if not super_admin:
            print("ERROR: No SUPER_ADMIN user found in the database.")
            return

        result = await db.execute(
            select(District).options(
                selectinload(District.state),
                selectinload(District.verified_portals)
            )
        )
        districts = result.scalars().all()

        print(f"Found {len(districts)} districts. Generating SEO-optimized English blogs...")

        created_count = 0
        skipped_count = 0

        for district in districts:
            slug = f"{district.slug}-district-guide"
            existing = await db.execute(
                select(BlogPost).where(BlogPost.slug == slug)
            )
            if existing.scalars().first():
                print(f"  SKIP: Blog for {district.name} already exists.")
                skipped_count += 1
                continue

            state = district.state
            portals = list(district.verified_portals) if district.verified_portals else []
            content_blocks = build_content_blocks(district, state, portals)

            hq = f" ({district.headquarter})" if district.headquarter else ""
            title = f"Complete Guide to Government Services in {district.name}{hq}, {state.name}"
            meta_title = f"{district.name} District - Government Services, Verified Portals & Citizen Guide | BharatLocal"
            meta_description = get_meta_description(district, state)
            meta_keywords = get_meta_keywords(district, state)
            og_title = f"{district.name} District Guide - Government Services & Verified Portals | BharatLocal"

            schema_markup = {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": title,
                "description": meta_description,
                "keywords": meta_keywords,
                "articleSection": f"{district.name} District, {state.name}",
                "about": {
                    "@type": "AdministrativeArea",
                    "name": f"{district.name} District",
                    "containedInPlace": {"@type": "State", "name": state.name}
                }
            }

            blog = BlogPost(
                title=title,
                slug=slug,
                content_blocks=content_blocks,
                status="PUBLISHED",
                author_id=super_admin.id,
                meta_title=meta_title,
                meta_description=meta_description,
                og_title=og_title,
                og_description=meta_description,
                robots="index,follow",
                schema_markup=schema_markup,
            )
            db.add(blog)
            await db.flush()
            created_count += 1
            print(f"  CREATED: {title}")

        await db.commit()
        print(f"\nDone! Created: {created_count}, Skipped: {skipped_count}")


async def delete_existing_guide_blogs():
    async with async_session() as db:
        result = await db.execute(
            select(BlogPost).where(BlogPost.slug.like("%-district-guide"))
        )
        blogs = result.scalars().all()
        if not blogs:
            print("No district guide blogs found to delete.")
            return
        for blog in blogs:
            await db.delete(blog)
            print(f"  DELETED: {blog.slug}")
        await db.commit()
        print(f"Deleted {len(blogs)} district guide blogs.")


if __name__ == "__main__":
    import sys as _sys
    if "--delete" in _sys.argv:
        asyncio.run(delete_existing_guide_blogs())
    else:
        asyncio.run(generate_blogs())
