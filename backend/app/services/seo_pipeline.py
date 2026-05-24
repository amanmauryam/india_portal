from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import District, Service, State, SEOMetadata
from app.seo import SEOEngine


async def auto_generate_district_content(
    db: AsyncSession,
    district: District,
    state: Optional[State] = None,
) -> Dict[str, Any]:
    if not state:
        state_res = await db.execute(select(State).where(State.id == district.state_id))
        state = state_res.scalars().first()
    if not state:
        return {}

    generated = SEOEngine.generate_district_content(district.name, state.name)
    updated = False

    if not district.overview and generated.get("overview"):
        district.overview = generated["overview"]
        updated = True
    if not district.famous_places or len(district.famous_places) == 0:
        district.famous_places = generated.get("famous_places", [])
        updated = True
    if not district.railway_stations or len(district.railway_stations) == 0:
        district.railway_stations = generated.get("railway_stations", [])
        updated = True
    if not district.industries_overview:
        district.industries_overview = generated.get("industries_overview", "")
        updated = True
    if not district.odop or not district.odop.get("product_name"):
        district.odop = generated.get("odop", {})
        updated = True
    if not district.emergency_contacts or len(district.emergency_contacts) == 0:
        district.emergency_contacts = generated.get("emergency_contacts", {})
        updated = True
    if not district.most_searched_queries or len(district.most_searched_queries) == 0:
        district.most_searched_queries = generated.get("most_searched_queries", [])
        updated = True

    if updated:
        await db.flush()

    return generated


async def auto_generate_service_content(
    db: AsyncSession,
    service: Service,
    district: Optional[District] = None,
    state: Optional[State] = None,
) -> Dict[str, Any]:
    if not district:
        dist_res = await db.execute(select(District).where(District.id == service.district_id))
        district = dist_res.scalars().first()
    if not district:
        return {}
    if not state:
        state_res = await db.execute(select(State).where(State.id == district.state_id))
        state = state_res.scalars().first()
    if not state:
        return {}

    generated = SEOEngine.generate_service_content(service.name, district.name, state.name, service.category)
    updated = False

    if not service.step_by_step_guide or len(service.step_by_step_guide) == 0:
        service.step_by_step_guide = generated.get("step_by_step_guide", [])
        updated = True
    if not service.faqs or len(service.faqs) == 0:
        service.faqs = generated.get("faqs", [])
        updated = True
    if not service.warning_notes:
        service.warning_notes = generated.get("warning_notes", "")
        updated = True
    if not service.related_services_links or len(service.related_services_links) == 0:
        service.related_services_links = generated.get("related_services_links", [])
        updated = True

    if updated:
        await db.flush()

    return generated


async def auto_generate_seo_metadata(
    db: AsyncSession,
    page_type: str,
    page_id: str,
    slug: str,
    context: Dict[str, Any],
) -> SEOMetadata:
    seo_engine = SEOEngine()
    title_template = f"{{page_name}} | BharatLocal"
    desc_template = f"Official directory for {{page_name}}. Find verified links, guides, and local information."

    meta_title = seo_engine.render_template(title_template, context)
    meta_description = seo_engine.render_template(desc_template, context)

    schema = {}
    if page_type == "BREADCRUMB":
        schema = seo_engine.get_schema_markup("BREADCRUMB", {"items": context.get("breadcrumbs", [])})
    elif page_type == "SERVICE":
        schema = seo_engine.get_schema_markup("SERVICE", context)

    metadata = SEOMetadata(
        page_type=page_type,
        page_id=page_id,
        slug=slug,
        meta_title=meta_title[:120] if meta_title else None,
        meta_description=meta_description[:300] if meta_description else None,
        schema_markup=schema,
        is_auto_generated=True,
    )
    db.add(metadata)
    await db.flush()
    return metadata
