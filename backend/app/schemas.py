from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator
from typing import List, Dict, Any, Optional, Literal
from uuid import UUID
from datetime import datetime
from enum import Enum

# ==========================================
# Enums
# ==========================================
class ServiceCategoryEnum(str, Enum):
    ELECTRICITY = "ELECTRICITY"
    GAS = "GAS"
    WATER = "WATER"
    GOVERNMENT = "GOVERNMENT"
    OTHER = "OTHER"


# ==========================================
# Dynamic Service Category Schemas
# ==========================================
class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    icon: Optional[str] = None
    sort_order: int = 0
    status: str = "ACTIVE"

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[str] = None

class CategoryOut(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    icon: Optional[str] = None
    sort_order: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    service_count: Optional[int] = 0

    class Config:
        from_attributes = True

class CategoryTreeOut(CategoryOut):
    children: List["CategoryTreeOut"] = []

class CategoryReorder(BaseModel):
    id: UUID
    sort_order: int
    parent_id: Optional[UUID] = None

class CategoryBulkAction(BaseModel):
    ids: List[UUID]
    action: Literal["delete", "activate", "deactivate", "move"]
    target_category_id: Optional[UUID] = None

class ContentStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    STATE_MANAGER = "STATE_MANAGER"
    DISTRICT_EDITOR = "DISTRICT_EDITOR"
    CONTRIBUTOR = "CONTRIBUTOR"
    VIEWER = "VIEWER"

# ==========================================
# User & Auth Schemas
# ==========================================
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.DISTRICT_EDITOR
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)

class UserRoleOut(BaseModel):
    role: str
    permissions: List[str] = []

class UserOut(UserBase):
    id: UUID
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# ==========================================
# State Schemas
# ==========================================
class StateBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class StateCreate(StateBase):
    pass

class StateUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None

class StateOut(StateBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==========================================
# District Schemas
# ==========================================
class DistrictBase(BaseModel):
    state_id: UUID
    name: str
    slug: str
    headquarter: Optional[str] = None
    overview: Optional[str] = None
    famous_places: List[Dict[str, Any]] = []
    railway_stations: List[Any] = []
    industries_overview: Optional[str] = None
    odop: Dict[str, Any] = {}
    emergency_contacts: Dict[str, str] = {}
    most_searched_queries: List[str] = []
    bus_stands: List[str] = []
    airports_nearby: List[str] = []
    major_crops: List[str] = []
    government_hospitals: List[str] = []
    police_stations_count: Optional[int] = None
    electricity_provider: List[str] = []
    water_supply_authority: List[str] = []
    municipal_bodies: List[str] = []
    popular_government_services: List[str] = []
    important_official_links: List[Dict[str, str]] = []
    government_offices: List[str] = []
    seo_keywords: List[str] = []
    status: ContentStatus = ContentStatus.PUBLISHED
    assigned_to: Optional[UUID] = None
    reviewer_notes: Optional[str] = None
    scheduled_publish_at: Optional[datetime] = None

class DistrictCreate(DistrictBase):
    pass

class DistrictUpdate(BaseModel):
    state_id: Optional[UUID] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    headquarter: Optional[str] = None
    overview: Optional[str] = None
    famous_places: Optional[List[Dict[str, Any]]] = None
    railway_stations: Optional[List[Any]] = None
    industries_overview: Optional[str] = None
    odop: Optional[Dict[str, Any]] = None
    emergency_contacts: Optional[Dict[str, str]] = None
    most_searched_queries: Optional[List[str]] = None
    bus_stands: Optional[List[str]] = None
    airports_nearby: Optional[List[str]] = None
    major_crops: Optional[List[str]] = None
    government_hospitals: Optional[List[str]] = None
    police_stations_count: Optional[int] = None
    electricity_provider: Optional[List[str]] = None
    water_supply_authority: Optional[List[str]] = None
    municipal_bodies: Optional[List[str]] = None
    popular_government_services: Optional[List[str]] = None
    important_official_links: Optional[List[Dict[str, str]]] = None
    government_offices: Optional[List[str]] = None
    seo_keywords: Optional[List[str]] = None
    status: Optional[ContentStatus] = None
    assigned_to: Optional[UUID] = None
    reviewer_notes: Optional[str] = None
    scheduled_publish_at: Optional[datetime] = None

class DistrictOut(DistrictBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==========================================
# Service Schemas
# ==========================================
class ServiceBase(BaseModel):
    district_id: UUID
    name: str
    slug: str
    category: str = "OTHER"
    category_id: Optional[UUID] = None
    official_link: str
    step_by_step_guide: List[Any] = []
    faqs: List[Dict[str, str]] = []
    warning_notes: Optional[str] = None
    related_services_links: List[Dict[str, str]] = []
    status: ContentStatus = ContentStatus.PUBLISHED
    assigned_to: Optional[UUID] = None
    reviewer_notes: Optional[str] = None
    scheduled_publish_at: Optional[datetime] = None
    is_sponsored: bool = False
    sponsor_link: Optional[str] = None

    @field_validator("official_link")
    @classmethod
    def validate_https(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("official_link must use HTTPS")
        return v

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    district_id: Optional[UUID] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None
    category_id: Optional[UUID] = None
    official_link: Optional[str] = None
    step_by_step_guide: Optional[List[Any]] = None
    faqs: Optional[List[Dict[str, str]]] = None
    warning_notes: Optional[str] = None
    related_services_links: Optional[List[Dict[str, str]]] = None
    status: Optional[ContentStatus] = None
    assigned_to: Optional[UUID] = None
    reviewer_notes: Optional[str] = None
    scheduled_publish_at: Optional[datetime] = None
    is_sponsored: Optional[bool] = None
    sponsor_link: Optional[str] = None

    @field_validator("official_link")
    @classmethod
    def validate_https(cls, v: Optional[str]) -> Optional[str]:
        if v and not v.startswith("https://"):
            raise ValueError("official_link must use HTTPS")
        return v

class ServiceOut(ServiceBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==========================================
# BlogPost Schemas
# ==========================================
class BlogPostBase(BaseModel):
    title: str
    slug: str
    content_blocks: List[Dict[str, Any]] = []
    status: ContentStatus = ContentStatus.DRAFT
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    og_image: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    canonical_url: Optional[str] = None
    robots: Optional[str] = "index,follow"
    schema_markup: Optional[Any] = None
    assigned_to: Optional[UUID] = None
    reviewer_notes: Optional[str] = None
    scheduled_publish_at: Optional[datetime] = None

class BlogPostCreate(BlogPostBase):
    og_image: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    canonical_url: Optional[str] = None
    robots: Optional[str] = "index,follow"
    schema_markup: Optional[Any] = None

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content_blocks: Optional[List[Dict[str, Any]]] = None
    status: Optional[ContentStatus] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    og_image: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    canonical_url: Optional[str] = None
    robots: Optional[str] = None
    schema_markup: Optional[Any] = None
    assigned_to: Optional[UUID] = None
    reviewer_notes: Optional[str] = None
    scheduled_publish_at: Optional[datetime] = None

class BlogPostOut(BlogPostBase):
    id: UUID
    author_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# PageTemplate Schemas
# ==========================================
class PageTemplateBase(BaseModel):
    page_type: str
    title_template: str
    description_template: str
    content_template: Dict[str, Any] = {}
    is_active: bool = True

class PageTemplateCreate(PageTemplateBase):
    pass

class PageTemplateUpdate(BaseModel):
    page_type: Optional[str] = None
    title_template: Optional[str] = None
    description_template: Optional[str] = None
    content_template: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class PageTemplateOut(PageTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==========================================
# AnalyticsLog Schemas
# ==========================================
class AnalyticsLogBase(BaseModel):
    event_type: str
    target_type: Optional[str] = None
    target_id: Optional[UUID] = None
    state_slug: Optional[str] = None
    district_slug: Optional[str] = None
    service_slug: Optional[str] = None
    query_text: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class AnalyticsLogCreate(AnalyticsLogBase):
    pass

class AnalyticsLogOut(AnalyticsLogBase):
    id: UUID
    timestamp: datetime

    class Config:
        from_attributes = True

class AnalyticsMetricSummary(BaseModel):
    total_views: int
    top_districts: List[Dict[str, Any]]
    top_services: List[Dict[str, Any]]
    trending_queries: List[Dict[str, Any]]
    clicks_ctr: List[Dict[str, Any]]

# ==========================================
# SEOMetadata Schemas
# ==========================================
class SEOMetadataBase(BaseModel):
    page_type: str
    page_id: Optional[UUID] = None
    slug: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    schema_markup: Dict[str, Any] = {}
    is_auto_generated: bool = True

class SEOMetadataCreate(SEOMetadataBase):
    pass

class SEOMetadataUpdate(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    schema_markup: Optional[Dict[str, Any]] = None
    is_auto_generated: Optional[bool] = None

class SEOMetadataOut(SEOMetadataBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# InternalLink Schemas
# ==========================================
class InternalLinkBase(BaseModel):
    source_type: str
    source_id: UUID
    target_type: str
    target_id: UUID
    relation_type: str = "RELATED"
    weight: int = 0
    is_auto_generated: bool = True

class InternalLinkCreate(InternalLinkBase):
    pass

class InternalLinkOut(InternalLinkBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# AuditLog Schemas
# ==========================================
class AuditLogCreate(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[UUID] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None

class AuditLogOut(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    action: str
    entity_type: str
    entity_id: Optional[UUID] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# ==========================================
# AdSlot Schemas
# ==========================================
class AdSlotBase(BaseModel):
    page_type: str
    position: str
    ad_code: str
    ad_type: str = "ADSENSE"
    is_active: bool = True
    priority: int = 0

class AdSlotCreate(AdSlotBase):
    pass

class AdSlotUpdate(BaseModel):
    page_type: Optional[str] = None
    position: Optional[str] = None
    ad_code: Optional[str] = None
    ad_type: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None

class AdSlotOut(AdSlotBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==========================================
# IngestionLog Schemas
# ==========================================
class IngestionLogOut(BaseModel):
    id: UUID
    source_type: str
    file_name: Optional[str] = None
    status: str
    records_total: int
    records_created: int
    records_updated: int
    records_failed: int
    errors: List[Any] = []
    performed_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class IngestionSummary(BaseModel):
    status: str
    message: str
    summary: Dict[str, Any]
    log_id: Optional[UUID] = None


# ==========================================
# MediaFile Schemas
# ==========================================
class MediaFileOut(BaseModel):
    id: UUID
    filename: str
    original_name: str
    mime_type: str
    file_size: int
    url: str
    alt_text: Optional[str] = None
    uploaded_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Task Schemas
# ==========================================
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[UUID] = None
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[UUID] = None
    due_date: Optional[datetime] = None

class TaskOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    status: str
    assigned_to: Optional[UUID] = None
    created_by: Optional[UUID] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# Notification Schemas
# ==========================================
class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    message: Optional[str] = None
    link: Optional[str] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# ContentVersion Schemas
# ==========================================
class ContentVersionOut(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    content_data: Optional[Any] = None
    version_note: Optional[str] = None
    created_by: Optional[UUID] = None
    created_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContentVersionCreate(BaseModel):
    entity_type: str
    entity_id: UUID
    content_data: Optional[Any] = None
    version_note: Optional[str] = None


# ==========================================
# UserSession Schemas
# ==========================================
class UserSessionOut(BaseModel):
    id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    current_page: Optional[str] = None
    editing_status: Optional[str] = None
    is_active: bool
    last_activity: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Content Template Schemas
# ==========================================
class ContentTemplateCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    template_type: str
    content_blocks: List[Dict[str, Any]] = []
    seo: Optional[Dict[str, Any]] = None
    thumbnail: Optional[str] = None

class ContentTemplateUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    template_type: Optional[str] = None
    content_blocks: Optional[List[Dict[str, Any]]] = None
    seo: Optional[Dict[str, Any]] = None
    thumbnail: Optional[str] = None

class ContentTemplateOut(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    template_type: str
    content_blocks: List[Dict[str, Any]] = []
    seo: Optional[Dict[str, Any]] = None
    thumbnail: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# VerifiedPortal Schemas
# ==========================================
class VerifiedPortalCreate(BaseModel):
    district_id: UUID
    name: str
    url: str
    category: str = "OTHER"
    description: Optional[str] = None
    is_active: bool = True

class VerifiedPortalUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class VerifiedPortalOut(BaseModel):
    id: UUID
    district_id: UUID
    name: str
    url: str
    category: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# Reusable Component Schemas
# ==========================================
class ReusableComponentCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    component_type: str
    content_data: Dict[str, Any]

class ReusableComponentUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    component_type: Optional[str] = None
    content_data: Optional[Dict[str, Any]] = None

class ReusableComponentOut(BaseModel):
    id: UUID
    name: str
    slug: str
    component_type: str
    content_data: Dict[str, Any]
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# Workflow Schemas
# ==========================================
class WorkflowAction(BaseModel):
    action: Literal["submit_for_review", "approve", "publish", "reject", "request_changes", "archive"]
    reviewer_notes: Optional[str] = None

class WorkflowStateUpdate(BaseModel):
    status: ContentStatus
    reviewer_notes: Optional[str] = None
    assigned_to: Optional[UUID] = None
    scheduled_publish_at: Optional[datetime] = None

# ==========================================
# Nested/Detailed Output Schemas
# ==========================================
class StateDetailOut(StateOut):
    districts: List[DistrictOut] = []

    class Config:
        from_attributes = True

class DistrictDetailOut(DistrictOut):
    services: List[ServiceOut] = []
    verified_portals: List[VerifiedPortalOut] = []
    state_name: Optional[str] = None
    state_slug: Optional[str] = None

    class Config:
        from_attributes = True

class ServiceDetailOut(ServiceOut):
    district_name: Optional[str] = None
    district_slug: Optional[str] = None
    state_name: Optional[str] = None
    state_slug: Optional[str] = None

    class Config:
        from_attributes = True

class BlogPostDetailOut(BlogPostOut):
    author_name: Optional[str] = None

    class Config:
        from_attributes = True

