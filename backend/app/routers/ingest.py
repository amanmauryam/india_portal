import csv
import json
import re
from io import StringIO
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import State, District, Service, User, IngestionLog
from app.auth import RoleChecker, get_current_user
from app.cache import CacheManager

router = APIRouter(prefix="/api/admin/ingest", tags=["ingest"])

BATCH_SIZE = 100


def clean_slug(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    return re.sub(r"\s+", "-", text.strip())


def validate_service_link(link: str) -> bool:
    return link.startswith("https://")


def validate_category(cat: str) -> bool:
    return cat in ("ELECTRICITY", "GAS", "WATER", "GOVERNMENT", "OTHER")


async def create_ingestion_log(
    db: AsyncSession,
    source_type: str,
    file_name: Optional[str],
    status: str,
    records_total: int,
    records_created: int,
    records_updated: int,
    records_failed: int,
    errors: list,
    performed_by: Optional[UUID] = None,
):
    log = IngestionLog(
        source_type=source_type,
        file_name=file_name,
        status=status,
        records_total=records_total,
        records_created=records_created,
        records_updated=records_updated,
        records_failed=records_failed,
        errors=errors,
        performed_by=performed_by,
    )
    db.add(log)
    await db.flush()
    return log


@router.post("/json", status_code=200)
async def ingest_json(
    file: UploadFile = File(...),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"]))
):
    try:
        content = await file.read()
        data = json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON file format: {str(e)}")

    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Root element of ingestion JSON must be a list of states")

    summary = {
        "states_processed": 0,
        "states_created": 0,
        "districts_processed": 0,
        "districts_created": 0,
        "services_processed": 0,
        "services_created": 0,
        "errors": []
    }

    item_count = 0

    for state_idx, state_data in enumerate(data):
        state_name = state_data.get("name")
        state_slug = state_data.get("slug") or clean_slug(state_name or "")

        if not state_name:
            summary["errors"].append(f"State at index {state_idx} missing name. Skipping state.")
            continue

        stmt = select(State).where((State.slug == state_slug) | (State.name == state_name))
        res = await db.execute(stmt)
        state = res.scalars().first()

        if not state:
            state = State(
                name=state_name,
                slug=state_slug,
                description=state_data.get("description", "")
            )
            db.add(state)
            await db.flush()
            summary["states_created"] += 1

        summary["states_processed"] += 1
        item_count += 1

        districts_list = state_data.get("districts", [])
        for dist_data in districts_list:
            dist_name = dist_data.get("name")
            dist_slug = dist_data.get("slug") or clean_slug(dist_name or "")

            if not dist_name:
                summary["errors"].append(f"District in state '{state_name}' missing name. Skipping.")
                continue

            stmt = select(District).where(
                (District.state_id == state.id) &
                ((District.slug == dist_slug) | (District.name == dist_name))
            )
            res = await db.execute(stmt)
            district = res.scalars().first()

            famous_places = dist_data.get("famous_places", [])
            railway_stations = dist_data.get("railway_stations", [])
            emergency_contacts = dist_data.get("emergency_contacts", {})
            odop = dist_data.get("odop", {})
            most_searched_queries = dist_data.get("most_searched_queries", [])

            if not district:
                district = District(
                    state_id=state.id,
                    name=dist_name,
                    slug=dist_slug,
                    overview=dist_data.get("overview", ""),
                    famous_places=famous_places,
                    railway_stations=railway_stations,
                    industries_overview=dist_data.get("industries_overview", ""),
                    odop=odop,
                    emergency_contacts=emergency_contacts,
                    most_searched_queries=most_searched_queries,
                    status=dist_data.get("status", "PUBLISHED")
                )
                db.add(district)
                await db.flush()
                summary["districts_created"] += 1
            else:
                if dist_data.get("overview"): district.overview = dist_data["overview"]
                if famous_places: district.famous_places = famous_places
                if railway_stations: district.railway_stations = railway_stations
                if dist_data.get("industries_overview"): district.industries_overview = dist_data["industries_overview"]
                if odop: district.odop = odop
                if emergency_contacts: district.emergency_contacts = emergency_contacts
                if most_searched_queries: district.most_searched_queries = most_searched_queries
                if dist_data.get("status"): district.status = dist_data["status"]

            summary["districts_processed"] += 1
            item_count += 1

            services_list = dist_data.get("services", [])
            for srv_data in services_list:
                srv_name = srv_data.get("name")
                srv_slug = srv_data.get("slug") or clean_slug(srv_name or "")
                category = srv_data.get("category", "OTHER")
                official_link = srv_data.get("official_link", "")

                if not srv_name or not official_link:
                    summary["errors"].append(f"Service in district '{dist_name}' missing name or official link. Skipping.")
                    continue

                if not validate_service_link(official_link):
                    summary["errors"].append(f"Service '{srv_name}' official link must use secure HTTPS: '{official_link}'. Skipping.")
                    continue
                if not validate_category(category):
                    summary["errors"].append(f"Service '{srv_name}' has invalid category: '{category}'. Defaulting to OTHER.")
                    category = "OTHER"

                stmt = select(Service).where(
                    (Service.district_id == district.id) &
                    (Service.slug == srv_slug)
                )
                res = await db.execute(stmt)
                service = res.scalars().first()

                step_by_step = srv_data.get("step_by_step_guide", [])
                faqs = srv_data.get("faqs", [])
                related_links = srv_data.get("related_services_links", [])

                if not service:
                    service = Service(
                        district_id=district.id,
                        name=srv_name,
                        slug=srv_slug,
                        category=category,
                        official_link=official_link,
                        step_by_step_guide=step_by_step,
                        faqs=faqs,
                        warning_notes=srv_data.get("warning_notes", ""),
                        related_services_links=related_links,
                        status=srv_data.get("status", "PUBLISHED"),
                        is_sponsored=srv_data.get("is_sponsored", False),
                        sponsor_link=srv_data.get("sponsor_link", None)
                    )
                    db.add(service)
                    summary["services_created"] += 1
                else:
                    service.name = srv_name
                    service.category = category
                    service.official_link = official_link
                    if step_by_step: service.step_by_step_guide = step_by_step
                    if faqs: service.faqs = faqs
                    if srv_data.get("warning_notes"): service.warning_notes = srv_data["warning_notes"]
                    if related_links: service.related_services_links = related_links
                    if srv_data.get("status"): service.status = srv_data["status"]
                    if "is_sponsored" in srv_data: service.is_sponsored = srv_data["is_sponsored"]
                    if srv_data.get("sponsor_link"): service.sponsor_link = srv_data["sponsor_link"]

                summary["services_processed"] += 1
                item_count += 1

            if item_count >= BATCH_SIZE:
                await db.flush()
                item_count = 0

    has_errors = len(summary["errors"]) > 0
    overall_status = "PARTIAL" if has_errors else "SUCCESS"

    ing_log = await create_ingestion_log(
        db=db,
        source_type="JSON",
        file_name=file.filename,
        status=overall_status,
        records_total=summary["states_processed"] + summary["districts_processed"] + summary["services_processed"],
        records_created=summary["states_created"] + summary["districts_created"] + summary["services_created"],
        records_updated=0,
        records_failed=len(summary["errors"]),
        errors=summary["errors"],
        performed_by=current_user.id,
    )

    await db.commit()
    await CacheManager.invalidate(["states", "districts", "services"])

    return {
        "status": "success",
        "message": "JSON Bulk Ingestion completed successfully",
        "summary": summary,
        "log_id": str(ing_log.id),
    }


@router.post("/csv", status_code=200)
async def ingest_csv(
    file: UploadFile = File(...),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"]))
):
    try:
        content = await file.read()
        csv_text = content.decode("utf-8")
        reader = csv.DictReader(StringIO(csv_text))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file format: {str(e)}")

    summary = {
        "states_processed": 0,
        "states_created": 0,
        "districts_processed": 0,
        "districts_created": 0,
        "services_processed": 0,
        "services_created": 0,
        "errors": []
    }

    loaded_states = {}
    loaded_districts = {}
    item_count = 0

    for row_idx, row in enumerate(reader):
        state_name = row.get("state_name")
        dist_name = row.get("district_name")
        srv_name = row.get("service_name")
        category = row.get("category", "OTHER").upper()
        official_link = row.get("official_link", "")
        warning_notes = row.get("warning_notes", "")

        if not state_name or not dist_name or not srv_name or not official_link:
            summary["errors"].append(f"Row {row_idx} has empty critical fields. Skipping row.")
            continue

        state_slug = clean_slug(state_name)
        if state_slug not in loaded_states:
            stmt = select(State).where((State.slug == state_slug) | (State.name == state_name))
            res = await db.execute(stmt)
            state = res.scalars().first()
            if not state:
                state = State(name=state_name, slug=state_slug, description=f"State directory for {state_name}")
                db.add(state)
                await db.flush()
                summary["states_created"] += 1
            loaded_states[state_slug] = state.id
            summary["states_processed"] += 1
        state_id = loaded_states[state_slug]

        dist_slug = clean_slug(dist_name)
        dist_key = f"{state_id}:{dist_slug}"
        if dist_key not in loaded_districts:
            stmt = select(District).where(
                (District.state_id == state_id) &
                ((District.slug == dist_slug) | (District.name == dist_name))
            )
            res = await db.execute(stmt)
            district = res.scalars().first()
            if not district:
                district = District(
                    state_id=state_id,
                    name=dist_name,
                    slug=dist_slug,
                    overview=f"Overview guide for {dist_name} District, {state_name}.",
                    status="PUBLISHED"
                )
                db.add(district)
                await db.flush()
                summary["districts_created"] += 1
            loaded_districts[dist_key] = district.id
            summary["districts_processed"] += 1
        district_id = loaded_districts[dist_key]

        if not validate_service_link(official_link):
            summary["errors"].append(f"Row {row_idx} service '{srv_name}' official link is not HTTPS secure. Skipping.")
            continue
        if not validate_category(category):
            summary["errors"].append(f"Row {row_idx} service '{srv_name}' has invalid category: '{category}'. Defaulting to OTHER.")
            category = "OTHER"

        srv_slug = clean_slug(srv_name)
        stmt = select(Service).where(
            (Service.district_id == district_id) &
            (Service.slug == srv_slug)
        )
        res = await db.execute(stmt)
        service = res.scalars().first()

        if not service:
            service = Service(
                district_id=district_id,
                name=srv_name,
                slug=srv_slug,
                category=category,
                official_link=official_link,
                warning_notes=warning_notes,
                status="PUBLISHED"
            )
            db.add(service)
            summary["services_created"] += 1
        else:
            service.name = srv_name
            service.category = category
            service.official_link = official_link
            if warning_notes:
                service.warning_notes = warning_notes

        summary["services_processed"] += 1
        item_count += 1

        if item_count >= BATCH_SIZE:
            await db.flush()
            item_count = 0

    has_errors = len(summary["errors"]) > 0
    overall_status = "PARTIAL" if has_errors else "SUCCESS"

    ing_log = await create_ingestion_log(
        db=db,
        source_type="CSV",
        file_name=file.filename,
        status=overall_status,
        records_total=summary["states_processed"] + summary["districts_processed"] + summary["services_processed"],
        records_created=summary["states_created"] + summary["districts_created"] + summary["services_created"],
        records_updated=0,
        records_failed=len(summary["errors"]),
        errors=summary["errors"],
        performed_by=current_user.id,
    )

    await db.commit()
    await CacheManager.invalidate(["states", "districts", "services"])

    return {
        "status": "success",
        "message": "CSV Flat Ingestion completed successfully",
        "summary": summary,
        "log_id": str(ing_log.id),
    }


@router.post("/json-body", status_code=200)
async def ingest_json_body(
    data: List[Dict[str, Any]],
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"]))
):
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Root element must be a list of states")

    summary = {
        "states_processed": 0,
        "states_created": 0,
        "districts_processed": 0,
        "districts_created": 0,
        "services_processed": 0,
        "services_created": 0,
        "errors": []
    }

    item_count = 0

    for state_idx, state_data in enumerate(data):
        state_name = state_data.get("name")
        state_slug = state_data.get("slug") or clean_slug(state_name or "")

        if not state_name:
            summary["errors"].append(f"State at index {state_idx} missing name. Skipping.")
            continue

        stmt = select(State).where((State.slug == state_slug) | (State.name == state_name))
        res = await db.execute(stmt)
        state = res.scalars().first()

        if not state:
            state = State(name=state_name, slug=state_slug, description=state_data.get("description", ""))
            db.add(state)
            await db.flush()
            summary["states_created"] += 1
        summary["states_processed"] += 1
        item_count += 1

        districts_list = state_data.get("districts", [])
        for dist_data in districts_list:
            dist_name = dist_data.get("name")
            dist_slug = dist_data.get("slug") or clean_slug(dist_name or "")
            if not dist_name:
                summary["errors"].append(f"District in state '{state_name}' missing name. Skipping.")
                continue

            stmt = select(District).where(
                (District.state_id == state.id) &
                ((District.slug == dist_slug) | (District.name == dist_name))
            )
            res = await db.execute(stmt)
            district = res.scalars().first()

            if not district:
                district = District(
                    state_id=state.id,
                    name=dist_name,
                    slug=dist_slug,
                    overview=dist_data.get("overview", ""),
                    famous_places=dist_data.get("famous_places", []),
                    railway_stations=dist_data.get("railway_stations", []),
                    industries_overview=dist_data.get("industries_overview", ""),
                    odop=dist_data.get("odop", {}),
                    emergency_contacts=dist_data.get("emergency_contacts", {}),
                    most_searched_queries=dist_data.get("most_searched_queries", []),
                    status=dist_data.get("status", "PUBLISHED"),
                )
                db.add(district)
                await db.flush()
                summary["districts_created"] += 1
            summary["districts_processed"] += 1
            item_count += 1

            for srv_data in dist_data.get("services", []):
                srv_name = srv_data.get("name")
                srv_slug = srv_data.get("slug") or clean_slug(srv_name or "")
                category = srv_data.get("category", "OTHER")
                official_link = srv_data.get("official_link", "")

                if not srv_name or not official_link:
                    summary["errors"].append(f"Service in district '{dist_name}' missing name or link. Skipping.")
                    continue
                if not validate_service_link(official_link):
                    summary["errors"].append(f"Service '{srv_name}' link not HTTPS. Skipping.")
                    continue
                if not validate_category(category):
                    category = "OTHER"

                stmt = select(Service).where(
                    (Service.district_id == district.id) & (Service.slug == srv_slug)
                )
                res = await db.execute(stmt)
                service = res.scalars().first()

                if not service:
                    service = Service(
                        district_id=district.id,
                        name=srv_name,
                        slug=srv_slug,
                        category=category,
                        official_link=official_link,
                        step_by_step_guide=srv_data.get("step_by_step_guide", []),
                        faqs=srv_data.get("faqs", []),
                        warning_notes=srv_data.get("warning_notes", ""),
                        related_services_links=srv_data.get("related_services_links", []),
                        status=srv_data.get("status", "PUBLISHED"),
                    )
                    db.add(service)
                    summary["services_created"] += 1
                summary["services_processed"] += 1
                item_count += 1

            if item_count >= BATCH_SIZE:
                await db.flush()
                item_count = 0

    has_errors = len(summary["errors"]) > 0
    overall_status = "PARTIAL" if has_errors else "SUCCESS"

    ing_log = await create_ingestion_log(
        db=db,
        source_type="API",
        file_name=None,
        status=overall_status,
        records_total=summary["states_processed"] + summary["districts_processed"] + summary["services_processed"],
        records_created=summary["states_created"] + summary["districts_created"] + summary["services_created"],
        records_updated=0,
        records_failed=len(summary["errors"]),
        errors=summary["errors"],
        performed_by=current_user.id,
    )

    await db.commit()
    await CacheManager.invalidate(["states", "districts", "services"])

    return {
        "status": "success",
        "message": "JSON Body ingestion completed successfully",
        "summary": summary,
        "log_id": str(ing_log.id),
    }
