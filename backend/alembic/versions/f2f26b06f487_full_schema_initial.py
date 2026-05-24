"""full_schema_initial

Revision ID: f2f26b06f487
Revises:
Create Date: 2026-05-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "f2f26b06f487"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("role", sa.String(), server_default="DISTRICT_EDITOR"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- states ---
    op.create_table(
        "states",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(), unique=True, nullable=False),
        sa.Column("slug", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- districts ---
    op.create_table(
        "districts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("state_id", UUID(as_uuid=True), sa.ForeignKey("states.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), index=True, nullable=False),
        sa.Column("overview", sa.Text(), nullable=True),
        sa.Column("famous_places", JSONB(), nullable=True),
        sa.Column("railway_stations", JSONB(), nullable=True),
        sa.Column("industries_overview", sa.Text(), nullable=True),
        sa.Column("odop", sa.Text(), nullable=True),
        sa.Column("emergency_contacts", JSONB(), nullable=True),
        sa.Column("most_searched_queries", JSONB(), nullable=True),
        sa.Column("status", sa.String(), server_default="PUBLISHED"),
        sa.Column("assigned_to", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewer_notes", sa.Text(), nullable=True),
        sa.Column("scheduled_publish_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- service_categories ---
    op.create_table(
        "service_categories",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("parent_id", UUID(as_uuid=True), sa.ForeignKey("service_categories.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("icon", sa.String(), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0")),
        sa.Column("status", sa.String(), server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- services ---
    op.create_table(
        "services",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("district_id", UUID(as_uuid=True), sa.ForeignKey("districts.id"), nullable=False),
        sa.Column("name", sa.String(), index=True, nullable=False),
        sa.Column("slug", sa.String(), index=True, nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("category_id", UUID(as_uuid=True), sa.ForeignKey("service_categories.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("official_link", sa.String(), nullable=False),
        sa.Column("step_by_step_guide", JSONB(), server_default=sa.text("'[]'::jsonb")),
        sa.Column("required_docs", JSONB(), server_default=sa.text("'[]'::jsonb")),
        sa.Column("fee", sa.String(), nullable=True),
        sa.Column("processing_time", sa.String(), nullable=True),
        sa.Column("timings", sa.String(), nullable=True),
        sa.Column("helpline", sa.String(), nullable=True),
        sa.Column("warning_notes", sa.Text(), nullable=True),
        sa.Column("is_sponsored", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("sponsor_link", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- blog_posts ---
    op.create_table(
        "blog_posts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("meta_title", sa.String(), nullable=True),
        sa.Column("meta_description", sa.Text(), nullable=True),
        sa.Column("content_blocks", JSONB(), server_default=sa.text("'[]'::jsonb")),
        sa.Column("status", sa.String(), server_default="DRAFT"),
        sa.Column("author_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("og_title", sa.String(), nullable=True),
        sa.Column("og_description", sa.Text(), nullable=True),
        sa.Column("canonical_url", sa.String(), nullable=True),
        sa.Column("robots", sa.String(), server_default="index,follow"),
        sa.Column("schema_markup", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- user_sessions ---
    op.create_table(
        "user_sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("last_activity", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("current_page", sa.String(), nullable=True),
        sa.Column("editing_status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- content_versions ---
    op.create_table(
        "content_versions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("entity_type", sa.String(), index=True, nullable=False),
        sa.Column("entity_id", UUID(as_uuid=True), index=True, nullable=False),
        sa.Column("content_data", JSONB(), nullable=True),
        sa.Column("version_note", sa.String(), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- role_permissions ---
    op.create_table(
        "role_permissions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("role", sa.String(), index=True, nullable=False),
        sa.Column("permission", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("role", "permission", name="_role_perm_uc"),
    )

    # --- content_templates ---
    op.create_table(
        "content_templates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("template_type", sa.String(), index=True, nullable=False),
        sa.Column("content_blocks", JSONB(), server_default=sa.text("'[]'::jsonb")),
        sa.Column("seo", JSONB(), nullable=True),
        sa.Column("thumbnail", sa.String(), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- reusable_components ---
    op.create_table(
        "reusable_components",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("component_type", sa.String(), index=True, nullable=False),
        sa.Column("content_data", JSONB(), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- audit_logs ---
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("action", sa.String(), nullable=False, index=True),
        sa.Column("entity_type", sa.String(), nullable=False, index=True),
        sa.Column("entity_id", sa.String(), nullable=True, index=True),
        sa.Column("old_values", JSONB(), nullable=True),
        sa.Column("new_values", JSONB(), nullable=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- analytics_logs ---
    op.create_table(
        "analytics_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("event_type", sa.String(), index=True, nullable=False),
        sa.Column("entity_type", sa.String(), nullable=True, index=True),
        sa.Column("entity_id", sa.String(), nullable=True),
        sa.Column("query_text", sa.Text(), nullable=True),
        sa.Column("target_id", sa.String(), nullable=True),
        sa.Column("referrer", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("country", sa.String(), nullable=True),
        sa.Column("clicks", sa.Integer(), server_default=sa.text("0")),
        sa.Column("impressions", sa.Integer(), server_default=sa.text("0")),
        sa.Column("ctr", sa.Float(), server_default=sa.text("0.0")),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- media_files ---
    op.create_table(
        "media_files",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("file_type", sa.String(), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("alt_text", sa.Text(), nullable=True),
        sa.Column("tags", JSONB(), server_default=sa.text("'[]'::jsonb")),
        sa.Column("folder", sa.String(), nullable=True),
        sa.Column("uploaded_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- tasks ---
    op.create_table(
        "tasks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("assigned_to", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("assigned_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("priority", sa.String(), server_default="MEDIUM"),
        sa.Column("status", sa.String(), server_default="PENDING"),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- notifications ---
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("type", sa.String(), server_default="INFO"),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- ad_slots ---
    op.create_table(
        "ad_slots",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("slot_name", sa.String(), nullable=False),
        sa.Column("slot_location", sa.String(), nullable=False),
        sa.Column("content_type", sa.String(), server_default="IMAGE"),
        sa.Column("content_url", sa.String(), nullable=True),
        sa.Column("link_url", sa.String(), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("impressions", sa.Integer(), server_default=sa.text("0")),
        sa.Column("clicks", sa.Integer(), server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- seo_metadata ---
    op.create_table(
        "seo_metadata",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("page_url", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("meta_title", sa.String(), nullable=True),
        sa.Column("meta_description", sa.Text(), nullable=True),
        sa.Column("og_image", sa.String(), nullable=True),
        sa.Column("og_title", sa.String(), nullable=True),
        sa.Column("og_description", sa.Text(), nullable=True),
        sa.Column("canonical_url", sa.String(), nullable=True),
        sa.Column("robots", sa.String(), server_default="index,follow"),
        sa.Column("schema_markup", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- internal_links ---
    op.create_table(
        "internal_links",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_url", sa.String(), nullable=False),
        sa.Column("target_url", sa.String(), nullable=False),
        sa.Column("anchor_text", sa.String(), nullable=True),
        sa.Column("link_type", sa.String(), server_default="MANUAL"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- page_templates ---
    op.create_table(
        "page_templates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("page_type", sa.String(), unique=True, nullable=False),
        sa.Column("layout", JSONB(), nullable=False),
        sa.Column("sections", JSONB(), server_default=sa.text("'[]'::jsonb")),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- ingestion_logs ---
    op.create_table(
        "ingestion_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("records_processed", sa.Integer(), server_default=sa.text("0")),
        sa.Column("records_failed", sa.Integer(), server_default=sa.text("0")),
        sa.Column("status", sa.String(), server_default="PENDING"),
        sa.Column("error_detail", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("ingestion_logs")
    op.drop_table("page_templates")
    op.drop_table("internal_links")
    op.drop_table("seo_metadata")
    op.drop_table("ad_slots")
    op.drop_table("notifications")
    op.drop_table("tasks")
    op.drop_table("media_files")
    op.drop_table("analytics_logs")
    op.drop_table("audit_logs")
    op.drop_table("reusable_components")
    op.drop_table("content_templates")
    op.drop_table("role_permissions")
    op.drop_table("content_versions")
    op.drop_table("user_sessions")
    op.drop_table("blog_posts")
    op.drop_table("services")
    op.drop_table("service_categories")
    op.drop_table("districts")
    op.drop_table("states")
    op.drop_table("users")
