from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Literal
from uuid import UUID
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: Literal["admin", "user"] = "user"


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[Literal["admin", "user"]] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    full_name: str
    role: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ModelUpdate(BaseModel):
    general_model_name: Optional[str] = None
    release_date: Optional[date] = None
    context_length: Optional[int] = None


class ModelResponse(BaseModel):
    id: UUID
    model_name: str
    input_cost_per_token: Optional[Decimal] = None
    output_cost_per_token: Optional[Decimal] = None
    tpm: Optional[int] = None
    rpm: Optional[int] = None
    litellm_updated_at: Optional[datetime] = None
    litellm_created_at: Optional[datetime] = None
    litellm_updated_by: Optional[str] = None
    litellm_created_by: Optional[str] = None
    general_model_name: Optional[str] = None
    release_date: Optional[date] = None
    context_length: Optional[int] = None

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    project_name: str
    project_alias: str


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    project_alias: Optional[str] = None


class ProjectResponse(BaseModel):
    id: UUID
    project_name: str
    project_alias: str
    created_by: UUID
    updated_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = None
    model_count: Optional[int] = None
    my_role: Optional[str] = None

    model_config = {"from_attributes": True}


class ProjectModelAdd(BaseModel):
    model_id: UUID


class ProjectModelResponse(BaseModel):
    id: UUID
    project_id: UUID
    model_id: UUID
    added_at: datetime
    added_by: Optional[UUID] = None
    model: Optional[ModelResponse] = None

    model_config = {"from_attributes": True}


class MemberAdd(BaseModel):
    user_id: UUID
    role: Literal["owner", "member"] = "member"


class MemberUpdate(BaseModel):
    role: Literal["owner", "member"]


class MemberResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    role: str
    added_by: Optional[UUID] = None
    added_at: datetime
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class KeyCreate(BaseModel):
    key_name: str
    project_id: UUID
    user_id: Optional[UUID] = None
    type: Literal["personal", "service"]
    max_budget: Optional[float] = None
    expires: Optional[datetime] = None
    models: List[str] = []
    tpm_limit: Optional[int] = None
    rpm_limit: Optional[int] = None


class KeyResponse(BaseModel):
    id: str
    key_display: str
    key_alias: str
    key_token: str
    project_id: UUID
    user_id: Optional[UUID] = None
    type: str
    spend: Decimal
    max_budget: Optional[Decimal] = None
    expires: Optional[datetime] = None
    models: List[str] = []
    created_at: datetime
    updated_at: datetime
    last_active: Optional[datetime] = None
    tpm_limit: Optional[int] = None
    rpm_limit: Optional[int] = None
    created_by: UUID

    model_config = {"from_attributes": True}


class KeyCreateResponse(KeyResponse):
    raw_key: Optional[str] = None
