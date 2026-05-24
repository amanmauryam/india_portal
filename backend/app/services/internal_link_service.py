from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Service, District, State, InternalLink
from typing import Optional


async def _load_district_state(db: AsyncSession, district: District) -> Optional[State]:
    result = await db.execute(select(State).where(State.id == district.state_id))
    return result.scalars().first()


async def generate_internal_links_for_service(
    db: AsyncSession,
    service: Service,
    district: Optional[District] = None,
) -> int:

    if not district:
        result = await db.execute(
            select(District).where(District.id == service.district_id)
        )
        district = result.scalars().first()

    if not district:
        return 0

    state = await _load_district_state(db, district)

    # related services
    related_services = await db.execute(
        select(Service).where(
            (Service.district_id == district.id) &
            (Service.id != service.id) &
            (Service.status == "PUBLISHED")
        ).limit(5)
    )

    state_slug = state.slug if state else ""

    count = 0

    for related in related_services.scalars().all():
        db.add(InternalLink(
            source_type="SERVICE",
            source_id=service.id,
            target_type="SERVICE",
            target_id=related.id,
            relation_type="RELATED_SERVICE",
            weight=1,
            is_auto_generated=True,
        ))
        count += 1

    # other districts
    if state:
        other_districts = await db.execute(
            select(District).where(
                (District.state_id == district.state_id) &
                (District.id != district.id) &
                (District.status == "PUBLISHED")
            ).limit(5)
        )

        for other in other_districts.scalars().all():
            db.add(InternalLink(
                source_type="SERVICE",
                source_id=service.id,
                target_type="DISTRICT",
                target_id=other.id,
                relation_type="NEARBY_DISTRICT",
                weight=1,
                is_auto_generated=True,
            ))
            count += 1

    await db.flush()
    return count


async def generate_internal_links_for_district(
    db: AsyncSession,
    district: District,
) -> int:

    state = await _load_district_state(db, district)

    sibling_districts = await db.execute(
        select(District).where(
            (District.state_id == district.state_id) &
            (District.id != district.id) &
            (District.status == "PUBLISHED")
        ).limit(5)
    )

    services = await db.execute(
        select(Service).where(
            (Service.district_id == district.id) &
            (Service.status == "PUBLISHED")
        ).limit(5)
    )

    count = 0
    state_slug = state.slug if state else ""

    # district → district links
    for sibling in sibling_districts.scalars().all():
        db.add(InternalLink(
            source_type="DISTRICT",
            source_id=district.id,
            target_type="DISTRICT",
            target_id=sibling.id,
            relation_type="NEARBY_DISTRICT",
            weight=1,
            is_auto_generated=True,
        ))
        count += 1

    # district → service links
    for service in services.scalars().all():
        db.add(InternalLink(
            source_type="DISTRICT",
            source_id=district.id,
            target_type="SERVICE",
            target_id=service.id,
            relation_type="DISTRICT_SERVICE",
            weight=1,
            is_auto_generated=True,
        ))
        count += 1

    await db.flush()
    return count