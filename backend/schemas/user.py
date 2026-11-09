from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from models.enums import AppRole


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: AppRole = AppRole.account_officer
    department_id: int | None = None
    station: str | None = Field(default=None, max_length=120)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=160)
    department_id: int | None = None
    station: str | None = Field(default=None, max_length=120)
    is_active: bool | None = None


class UserRoleUpdate(BaseModel):
    role: AppRole


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: AppRole
    department_id: int | None
    station: str | None
    is_active: bool
    created_at: datetime
