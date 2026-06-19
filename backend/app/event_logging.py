from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import EventLog


def log_event(
    db: Session,
    event_type: str,
    user_id: UUID | None = None,
    event_metadata: dict[str, Any] | None = None,
) -> None:
    try:
        event = EventLog(
            event_type=event_type,
            user_id=user_id,
            event_metadata=event_metadata,
        )

        db.add(event)
        db.commit()
    except Exception:
        db.rollback()
