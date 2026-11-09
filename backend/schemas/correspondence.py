from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from models.enums import CorrDirection, CorrPriority, CorrStatus


class CorrespondenceCreate(BaseModel):
    direction: CorrDirection = CorrDirection.incoming
    date_received: date
    letter_title: str = Field(min_length=3, max_length=255)
    company_name: str = Field(min_length=2, max_length=180)
    contact_phone: str | None = Field(default=None, max_length=40)
    priority: CorrPriority = CorrPriority.normal
    department_id: int | None = None
    admin_officer_id: int | None = None
    station_manager_id: int | None = None
    account_officer_id: int | None = None
    remarks: str | None = None


class CorrespondenceUpdate(BaseModel):
    letter_title: str | None = Field(default=None, min_length=3, max_length=255)
    company_name: str | None = Field(default=None, min_length=2, max_length=180)
    contact_phone: str | None = Field(default=None, max_length=40)
    priority: CorrPriority | None = None
    department_id: int | None = None
    station_manager_id: int | None = None
    account_officer_id: int | None = None
    remarks: str | None = None


class StatusChangeRequest(BaseModel):
    new_status: CorrStatus
    notes: str | None = Field(default=None, max_length=1000)


class StatusHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    correspondence_id: int
    old_status: CorrStatus | None
    new_status: CorrStatus
    changed_by: int | None
    notes: str | None
    changed_at: datetime


class CorrespondenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference_number: str
    direction: CorrDirection
    date_received: date
    letter_title: str
    company_name: str
    contact_phone: str | None
    priority: CorrPriority
    status: CorrStatus
    admin_officer_id: int | None
    station_manager_id: int | None
    account_officer_id: int | None
    department_id: int | None
    remarks: str | None
    created_at: datetime
    updated_at: datetime
