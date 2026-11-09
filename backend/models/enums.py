"""Domain enumerations shared by the ORM models and the Pydantic schemas."""

import enum


class AppRole(str, enum.Enum):
    admin_officer = "admin_officer"
    station_manager = "station_manager"
    account_officer = "account_officer"


class CorrStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    under_review = "under_review"
    responded = "responded"
    closed = "closed"
    returned = "returned"


class CorrPriority(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class CorrDirection(str, enum.Enum):
    incoming = "incoming"
    outgoing = "outgoing"


# Which statuses a letter may legally move to next (workflow guard).
STATUS_FLOW: dict[CorrStatus, list[CorrStatus]] = {
    CorrStatus.pending: [CorrStatus.assigned, CorrStatus.returned],
    CorrStatus.assigned: [CorrStatus.under_review, CorrStatus.returned],
    CorrStatus.under_review: [CorrStatus.responded, CorrStatus.returned],
    CorrStatus.responded: [CorrStatus.closed, CorrStatus.under_review],
    CorrStatus.returned: [CorrStatus.assigned],
    CorrStatus.closed: [],
}
