import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Enum, ForeignKey,
    UniqueConstraint, Numeric, Integer, Date, Text, func
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app.database import Base


class User(Base):
    __tablename__ = "crm_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)  # nullable for SSO-only users
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum("admin", "user", name="crm_user_role"), nullable=False, default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    # SSO profile fields
    department_name = Column(String(255), nullable=True)
    department_fullname = Column(Text, nullable=True)
    department_id = Column(Integer, nullable=True)
    staff_code = Column(String(50), nullable=True)
    company_title = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    auth_provider = Column(String(20), nullable=False, server_default="local")  # "local" or "sso"


class Model(Base):
    __tablename__ = "crm_models"

    id = Column(UUID(as_uuid=True), primary_key=True)
    model_name = Column(String(255), nullable=False)
    input_cost_per_token = Column(Numeric(20, 10), nullable=True)
    output_cost_per_token = Column(Numeric(20, 10), nullable=True)
    tpm = Column(Integer, nullable=True)
    rpm = Column(Integer, nullable=True)
    litellm_updated_at = Column(DateTime(timezone=True), nullable=True)
    litellm_created_at = Column(DateTime(timezone=True), nullable=True)
    litellm_updated_by = Column(String(100), nullable=True)
    litellm_created_by = Column(String(100), nullable=True)
    general_model_name = Column(String(100), nullable=True)
    release_date = Column(Date, nullable=True)
    context_length = Column(Integer, nullable=True)


class Project(Base):
    __tablename__ = "crm_projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_name = Column(String(100), nullable=False)
    project_alias = Column(String(50), unique=True, nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("crm_users.id"), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("crm_users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ProjectModel(Base):
    __tablename__ = "crm_project_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("crm_projects.id", ondelete="CASCADE"), nullable=False)
    model_id = Column(UUID(as_uuid=True), ForeignKey("crm_models.id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    added_by = Column(UUID(as_uuid=True), ForeignKey("crm_users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (UniqueConstraint("project_id", "model_id"),)


class ProjectMember(Base):
    __tablename__ = "crm_project_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("crm_projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("crm_users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum("owner", "member", name="crm_member_role"), nullable=False, default="member")
    added_by = Column(UUID(as_uuid=True), ForeignKey("crm_users.id", ondelete="SET NULL"), nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("project_id", "user_id"),)


class Key(Base):
    __tablename__ = "crm_keys"

    id = Column(String(64), primary_key=True)
    key_token = Column(String(100), unique=True, nullable=False, index=True)
    key_alias = Column(String(100), nullable=False)
    key_display = Column(String(20), nullable=False)
    spend = Column(Numeric(20, 10), nullable=False, default=0)
    max_budget = Column(Numeric(20, 10), nullable=True)
    expires = Column(DateTime(timezone=True), nullable=True)
    models = Column(ARRAY(Text), nullable=False, server_default="{}")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    litellm_created_by = Column(String(100), nullable=True)
    litellm_updated_by = Column(String(100), nullable=True)
    last_active = Column(DateTime(timezone=True), nullable=True)
    tpm_limit = Column(Integer, nullable=True)
    rpm_limit = Column(Integer, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("crm_users.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("crm_projects.id"), nullable=False)
    type = Column(Enum("service", "personal", name="crm_key_type"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("crm_users.id"), nullable=False)
