from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models import BlogPost, User
from app.schemas import BlogPostCreate, BlogPostUpdate, BlogPostOut, BlogPostDetailOut, PaginatedBlogsOut
from app.auth import RoleChecker, get_current_user
from app.services.audit_service import log_audit
from app.services.cache_service import invalidate_entity_cache
from app.cache import cached_api_response

router = APIRouter(prefix="/api/blogs", tags=["blogs"])


@router.get("", response_model=PaginatedBlogsOut)
@cached_api_response(expire=3600, tags=["blogs"])
async def get_blogs(
    status_filter: Optional[str] = "PUBLISHED",
    limit: Optional[int] = Query(None, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    total_q = select(func.count(BlogPost.id))
    if status_filter:
        total_q = total_q.where(BlogPost.status == status_filter)
    total_result = await db.execute(total_q)
    total = total_result.scalar()

    stmt = select(BlogPost).options(selectinload(BlogPost.author))
    if status_filter:
        stmt = stmt.where(BlogPost.status == status_filter)
    stmt = stmt.order_by(BlogPost.created_at.desc())
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    posts = result.scalars().all()

    out_posts = []
    for post in posts:
        detail = BlogPostDetailOut.model_validate(post)
        detail.author_name = post.author.full_name if post.author else "Unknown Author"
        out_posts.append(detail)

    return PaginatedBlogsOut(items=out_posts, total=total)


@router.get("/{slug_or_id}", response_model=BlogPostDetailOut)
@cached_api_response(expire=3600, tags=["blogs"])
async def get_blog(slug_or_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uuid_val = UUID(slug_or_id)
        stmt = select(BlogPost).where(BlogPost.id == uuid_val)
    except ValueError:
        stmt = select(BlogPost).where(BlogPost.slug == slug_or_id)

    stmt = stmt.options(selectinload(BlogPost.author))
    result = await db.execute(stmt)
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    detail = BlogPostDetailOut.model_validate(post)
    detail.author_name = post.author.full_name if post.author else "Unknown Author"
    return detail


@router.post("", response_model=BlogPostOut, status_code=status.HTTP_201_CREATED)
async def create_blog(
    blog_in: BlogPostCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR"]))
):
    slug_res = await db.execute(select(BlogPost).where(BlogPost.slug == blog_in.slug))
    if slug_res.scalars().first():
        raise HTTPException(status_code=400, detail="Blog post with this slug already exists")

    new_blog = BlogPost(
        **blog_in.model_dump(),
        author_id=current_user.id
    )
    db.add(new_blog)
    await db.flush()

    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="CREATE",
        entity_type="BLOG",
        entity_id=new_blog.id,
        new_values=blog_in.model_dump(),
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(new_blog)
    await invalidate_entity_cache("blogs")
    return new_blog


@router.put("/{blog_id}", response_model=BlogPostOut)
async def update_blog(
    blog_id: UUID,
    blog_in: BlogPostUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR"]))
):
    result = await db.execute(select(BlogPost).where(BlogPost.id == blog_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    if current_user.role == "DISTRICT_EDITOR" and post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own blog posts")

    old_values = {"title": post.title, "slug": post.slug, "status": post.status}
    update_data = blog_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="UPDATE",
        entity_type="BLOG",
        entity_id=post.id,
        old_values=old_values,
        new_values=update_data,
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(post)
    await invalidate_entity_cache("blogs")
    return post


@router.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog(
    blog_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "STATE_MANAGER"]))
):
    result = await db.execute(select(BlogPost).where(BlogPost.id == blog_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    old_values = {"title": post.title, "slug": post.slug}
    ip_address = request.client.host if request.client else None
    await log_audit(
        db=db,
        action="DELETE",
        entity_type="BLOG",
        entity_id=post.id,
        old_values=old_values,
        user_id=current_user.id,
        ip_address=ip_address,
    )

    await db.delete(post)
    await db.commit()
    await invalidate_entity_cache("blogs")
    return None
