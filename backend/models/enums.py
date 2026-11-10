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


# the workflow map: the key is the current status, the list is where the letter may go next
# frontend/src/utils/constants.js has a copy of this, so if I change one I change the other
STATUS_FLOW: dict[CorrStatus, list[CorrStatus]] = {
    CorrStatus.pending: [CorrStatus.assigned, CorrStatus.returned],
    CorrStatus.assigned: [CorrStatus.under_review, CorrStatus.returned],
    CorrStatus.under_review: [CorrStatus.responded, CorrStatus.returned],
    CorrStatus.responded: [CorrStatus.closed, CorrStatus.under_review],
    CorrStatus.returned: [CorrStatus.assigned],
    CorrStatus.closed: [],
}
