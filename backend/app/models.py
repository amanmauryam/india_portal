import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON, UniqueConstraint, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="DISTRICT_EDITOR")  # SUPER_ADMIN, STATE_MANAGER, DISTRICT_EDITOR, CONTRIBUTOR, VIEWER
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    blog_posts = relationship("BlogPost", back_populates="author", cascade="all, delete-orphan", foreign_keys="[BlogPost.author_id]")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="[AuditLog.user_id]")


class State(Base):
    __tablename__ = "states"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    districts = relationship("District", back_populates="state", cascade="all, delete-orphan")


class District(Base):
    __tablename__ = "districts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    state_id = Column(UUID(as_uuid=True), ForeignKey("states.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    slug = Column(String, index=True, nullable=False)
    headquarter = Column(String, nullable=True)
    overview = Column(Text, nullable=True)
    
    # JSON arrays and objects
    famous_places = Column(JSON, default=list)        # list of objects: [{"name": "", "description": ""}]
    railway_stations = Column(JSON, default=list)     # list of strings or objects
    industries_overview = Column(Text, nullable=True)
    odop = Column(JSON, default=dict)                 # object: {"product_name": "", "description": "", "image_url": ""}
    emergency_contacts = Column(JSON, default=dict)    # object: {"police": "", "fire": "", "ambulance": "", "helpline": ""}
    most_searched_queries = Column(JSON, default=list) # list of strings

    # Extended fields
    bus_stands = Column(JSON, default=list)
    airports_nearby = Column(JSON, default=list)
    major_crops = Column(JSON, default=list)
    government_hospitals = Column(JSON, default=list)
    police_stations_count = Column(Integer, nullable=True)
    electricity_provider = Column(JSON, default=list)
    water_supply_authority = Column(JSON, default=list)
    municipal_bodies = Column(JSON, default=list)
    popular_government_services = Column(JSON, default=list)
    important_official_links = Column(JSON, default=list)
    government_offices = Column(JSON, default=list)
    seo_keywords = Column(JSON, default=list)
    
    # Workflow and Content approvals
    status = Column(String, default="PUBLISHED")       # DRAFT, PENDING_REVIEW, PUBLISHED
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    scheduled_publish_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Unique constraint on state_id + slug
    __table_args__ = (
        UniqueConstraint("state_id", "slug", name="_state_district_slug_uc"),
        UniqueConstraint("state_id", "name", name="_state_district_name_uc"),
    )

    # Relationships
    state = relationship("State", back_populates="districts")
    services = relationship("Service", back_populates="district", cascade="all, delete-orphan")
    verified_portals = relationship("VerifiedPortal", back_populates="district", cascade="all, delete-orphan", foreign_keys="[VerifiedPortal.district_id]")
    assignee = relationship("User", foreign_keys=[assigned_to])


class ServiceCategory(Base):
    __tablename__ = "service_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("service_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    icon = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)
    status = Column(String, default="ACTIVE")  # ACTIVE, INACTIVE
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    children = relationship("ServiceCategory", backref=backref("parent", remote_side=[id]), cascade="all")


class Service(Base):
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    district_id = Column(UUID(as_uuid=True), ForeignKey("districts.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    slug = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False)  # legacy string field
    category_id = Column(UUID(as_uuid=True), ForeignKey("service_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    official_link = Column(String, nullable=False)
    
    # JSON structures
    step_by_step_guide = Column(JSON, default=list)    # list of strings or objects
    faqs = Column(JSON, default=list)                  # list of objects: [{"question": "", "answer": ""}]
    warning_notes = Column(Text, nullable=True)
    related_services_links = Column(JSON, default=list)# list of objects: [{"name": "", "link": ""}]
    
    # Workflow & Content approvals
    status = Column(String, default="PUBLISHED")       # DRAFT, PENDING_REVIEW, PUBLISHED
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    scheduled_publish_at = Column(DateTime(timezone=True), nullable=True)
    
    # Monetization & Sponsorships
    is_sponsored = Column(Boolean, default=False)
    sponsor_link = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Unique constraint on district_id + slug
    __table_args__ = (
        UniqueConstraint("district_id", "slug", name="_district_service_slug_uc"),
    )

    # Relationships
    district = relationship("District", back_populates="services")
    assignee = relationship("User", foreign_keys=[assigned_to])
    category_rel = relationship("ServiceCategory", foreign_keys=[category_id])


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    content_blocks = Column(JSON, default=list)        # list of blocks: [{"type": "", "data": {}}]
    status = Column(String, default="DRAFT")          # DRAFT, PENDING_REVIEW, PUBLISHED
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    meta_title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)
    og_image = Column(String, nullable=True)
    og_title = Column(String, nullable=True)
    og_description = Column(Text, nullable=True)
    canonical_url = Column(String, nullable=True)
    robots = Column(String, default="index,follow")
    schema_markup = Column(JSON, nullable=True)
    
    # Workflow additions
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    scheduled_publish_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    author = relationship("User", back_populates="blog_posts", foreign_keys=[author_id])
    reviewer = relationship("User", foreign_keys=[assigned_to])


class PageTemplate(Base):
    __tablename__ = "page_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_type = Column(String, nullable=False, unique=True)  # STATE, DISTRICT, SERVICE, CATEGORY
    title_template = Column(String, nullable=False)
    description_template = Column(Text, nullable=False)
    content_template = Column(JSON, default=dict)            # Custom template block structures
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AnalyticsLog(Base):
    __tablename__ = "analytics_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String, nullable=False, index=True)  # PAGE_VIEW, LINK_CLICK, SEARCH_QUERY
    target_type = Column(String, nullable=True, index=True)  # STATE, DISTRICT, SERVICE, BLOG
    target_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    state_slug = Column(String, nullable=True, index=True)
    district_slug = Column(String, nullable=True, index=True)
    service_slug = Column(String, nullable=True, index=True)
    query_text = Column(String, nullable=True, index=True)   # Holds query if event_type is SEARCH_QUERY
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class SEOMetadata(Base):
    __tablename__ = "seo_metadata"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_type = Column(String, nullable=False, index=True)    # STATE, DISTRICT, SERVICE, BLOG
    page_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    slug = Column(String, nullable=True, index=True)
    meta_title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)
    meta_keywords = Column(String, nullable=True)
    og_title = Column(String, nullable=True)
    og_description = Column(Text, nullable=True)
    schema_markup = Column(JSON, default=dict)
    is_auto_generated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class InternalLink(Base):
    __tablename__ = "internal_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type = Column(String, nullable=False, index=True)  # STATE, DISTRICT, SERVICE, BLOG
    source_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    target_type = Column(String, nullable=False, index=True)
    target_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    relation_type = Column(String, nullable=False, default="RELATED")  # RELATED, PARENT, CHILD, SEE_ALSO
    weight = Column(Integer, default=0)
    is_auto_generated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("source_type", "source_id", "target_type", "target_id", "relation_type", name="_internal_link_uc"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String, nullable=False, index=True)    # CREATE, UPDATE, DELETE, APPROVE, REJECT, PUBLISH
    entity_type = Column(String, nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])


class AdSlot(Base):
    __tablename__ = "ad_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_type = Column(String, nullable=False, index=True)  # STATE, DISTRICT, SERVICE, BLOG, ALL
    position = Column(String, nullable=False)              # TOP, BOTTOM, SIDEBAR, INLINE, BETWEEN_STEPS
    ad_code = Column(Text, nullable=False)
    ad_type = Column(String, nullable=False, default="ADSENSE")  # ADSENSE, SPONSORED, AFFILIATE
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class IngestionLog(Base):
    __tablename__ = "ingestion_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type = Column(String, nullable=False)            # JSON, CSV, API
    file_name = Column(String, nullable=True)
    status = Column(String, nullable=False, default="SUCCESS")  # SUCCESS, PARTIAL, FAILED
    records_total = Column(Integer, default=0)
    records_created = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    errors = Column(JSON, default=list)
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    url = Column(String, nullable=False)
    alt_text = Column(String, nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    uploader = relationship("User", foreign_keys=[uploaded_by])


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="PENDING", index=True)  # PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False, index=True)  # task_assigned, task_completed, page_approved, page_rejected, mention
    title = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    link = Column(String, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    current_page = Column(String, nullable=True)
    editing_status = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])


class ContentVersion(Base):
    __tablename__ = "content_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String, nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    content_data = Column(JSON, nullable=True)
    version_note = Column(String, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", foreign_keys=[created_by])


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String, nullable=False, index=True)
    permission = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("role", "permission", name="_role_perm_uc"),
    )


class ContentTemplate(Base):
    __tablename__ = "content_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    template_type = Column(String, nullable=False, index=True)  # DISTRICT_PAGE, SERVICE_PAGE, BLOG_ARTICLE, GOVT_SCHEME, UTILITY_GUIDE
    content_blocks = Column(JSON, default=list)
    seo = Column(JSON, nullable=True)
    thumbnail = Column(String, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by])


class VerifiedPortal(Base):
    __tablename__ = "verified_portals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    district_id = Column(UUID(as_uuid=True), ForeignKey("districts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    category = Column(String, nullable=False, default="OTHER")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    district = relationship("District", foreign_keys=[district_id])


class ReusableComponent(Base):
    __tablename__ = "reusable_components"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    component_type = Column(String, nullable=False, index=True)  # FAQ, CTA, WARNING_BOX, CONTACT_CARD, INFO_CARD
    content_data = Column(JSON, nullable=False)  # the block data (type + data fields)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by])

