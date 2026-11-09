from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base
from models.enums import CorrDirection, CorrPriority, CorrStatus


class Correspondence(Base):
    """One letter in the register, incoming or outgoing."""

    __tablename__ = "correspondence"
    __table_args__ = (
        Index("ix_correspondence_status", "status"),
        Index("ix_correspondence_date_received", "date_received"),
        Index("ix_correspondence_company", "company_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    reference_number: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    direction: Mapped[CorrDirection] = mapped_column(
        Enum(CorrDirection, native_enum=False, length=16), nullable=False
    )
    date_received: Mapped[date] = mapped_column(Date, nullable=False)
    letter_title: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(180), nullable=False)
    contact_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    priority: Mapped[CorrPriority] = mapped_column(
        Enum(CorrPriority, native_enum=False, length=16), nullable=False, default=CorrPriority.normal
    )
    status: Mapped[CorrStatus] = mapped_column(
        Enum(CorrStatus, native_enum=False, length=20), nullable=False, default=CorrStatus.pending
    )

    admin_officer_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    station_manager_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    account_officer_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )

    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    department = relationship("Department", back_populates="correspondence")
    history = relationship(
        "CorrespondenceStatusHistory",
        back_populates="correspondence",
        cascade="all, delete-orphan",
        order_by="CorrespondenceStatusHistory.changed_at.desc()",
    )


class CorrespondenceStatusHistory(Base):
    """Append-only audit trail of every status change."""

    __tablename__ = "correspondence_status_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    correspondence_id: Mapped[int] = mapped_column(
        ForeignKey("correspondence.id", ondelete="CASCADE"), nullable=False, index=True
    )
    old_status: Mapped[CorrStatus | None] = mapped_column(
        Enum(CorrStatus, native_enum=False, length=20), nullable=True
    )
    new_status: Mapped[CorrStatus] = mapped_column(
        Enum(CorrStatus, native_enum=False, length=20), nullable=False
    )
    changed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    correspondence = relationship("Correspondence", back_populates="history")
