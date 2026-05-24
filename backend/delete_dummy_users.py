import asyncio
from sqlalchemy.future import select
from app.database import async_session
from app.models import (
    User, AuditLog, UserSession, Notification, ContentVersion,
    MediaFile, Task, ContentTemplate, ReusableComponent, IngestionLog,
    BlogPost, District, Service
)

async def delete_dummy_users():
    async with async_session() as db:
        # Get superuser
        result = await db.execute(
            select(User).where(User.email == "admin@portal.gov.in")
        )
        superuser = result.scalars().first()
        if not superuser:
            print("Superuser not found! Aborting.")
            return

        result = await db.execute(
            select(User).where(User.email != "admin@portal.gov.in")
        )
        dummy_users = result.scalars().all()

        if not dummy_users:
            print("No dummy users found to delete.")
            return

        print(f"Found {len(dummy_users)} dummy user(s) to delete:")
        for u in dummy_users:
            print(f"  - {u.email} ({u.full_name}, role={u.role})")

        dummy_ids = [u.id for u in dummy_users]

        # Reassign blog posts from dummy users to superuser
        stmt = select(BlogPost).where(BlogPost.author_id.in_(dummy_ids))
        for bp in (await db.execute(stmt)).scalars().all():
            bp.author_id = superuser.id
            print(f"  Reassigned blog post '{bp.title}' to superuser")

        stmt = select(BlogPost).where(BlogPost.assigned_to.in_(dummy_ids))
        for bp in (await db.execute(stmt)).scalars().all():
            bp.assigned_to = None

        # Nullify assigned_to on districts/services
        stmt = select(District).where(District.assigned_to.in_(dummy_ids))
        for d in (await db.execute(stmt)).scalars().all():
            d.assigned_to = None

        stmt = select(Service).where(Service.assigned_to.in_(dummy_ids))
        for s in (await db.execute(stmt)).scalars().all():
            s.assigned_to = None

        # Delete related records referencing these users
        related_config = [
            (AuditLog, "user_id"),
            (UserSession, "user_id"),
            (Notification, "user_id"),
            (ContentVersion, "created_by"),
            (MediaFile, "uploaded_by"),
            (Task, "assigned_to"),
            (Task, "created_by"),
            (ContentTemplate, "created_by"),
            (ReusableComponent, "created_by"),
            (IngestionLog, "performed_by"),
        ]

        for model_class, col_name in related_config:
            col = getattr(model_class, col_name)
            stmt = select(model_class).where(col.in_(dummy_ids))
            rows = (await db.execute(stmt)).scalars().all()
            for row in rows:
                await db.delete(row)
            if rows:
                print(f"  Deleted {len(rows)} related {model_class.__tablename__} record(s)")

        # Delete the users
        for u in dummy_users:
            await db.delete(u)

        await db.commit()
        print(f"Successfully deleted {len(dummy_users)} dummy user(s).")

if __name__ == "__main__":
    asyncio.run(delete_dummy_users())
