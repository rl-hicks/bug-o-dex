from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import check_database_connection
from app.dependencies import get_current_user, get_db
from app.models import BugEntry, User

from datetime import date
from pydantic import BaseModel

from app.routers import auth
from app.routers import uploads
from app.routers import identify



app = FastAPI(title="Bug-O-Dex API")

app.include_router(auth.router)
app.include_router(uploads.router)
app.include_router(identify.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BugEntryCreate(BaseModel):
    image_url: str = "https://example.com/placeholder-bug.jpg"
    common_name: str
    category: str | None = None
    ai_identification: str | None = None
    confidence_note: str | None = None
    short_description: str | None = None
    safety_note: str | None = None
    location_context: str | None = None
    date_found: date | None = None

class BugEntryUpdate(BaseModel):
    image_url: str | None = None
    common_name: str | None = None
    category: str | None = None
    ai_identification: str | None = None
    confidence_note: str | None = None
    short_description: str | None = None
    safety_note: str | None = None
    location_context: str | None = None
    date_found: date | None = None


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/db-check")
def database_check():
    try:
        check_database_connection()
        return {"database": "connected"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/bug-entries")
def list_bug_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(BugEntry)
        .where(BugEntry.user_id == current_user.id)
        .order_by(BugEntry.created_at.desc())
    )
    bug_entries = db.scalars(statement).all()

    return bug_entries

@app.get("/bug-entries/{bug_entry_id}")
def get_bug_entry(
    bug_entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(BugEntry).where(
        BugEntry.id == bug_entry_id,
        BugEntry.user_id == current_user.id,
    )

    bug_entry = db.scalar(statement)

    if bug_entry is None:
        raise HTTPException(
            status_code=404,
            detail="Bug entry not found",
        )

    return bug_entry

@app.patch("/bug-entries/{bug_entry_id}")
def update_bug_entry(
    bug_entry_id: str,
    payload: BugEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(BugEntry).where(
        BugEntry.id == bug_entry_id,
        BugEntry.user_id == current_user.id,
    )
    bug_entry = db.scalar(statement)

    if bug_entry is None:
        raise HTTPException(
            status_code=404,
            detail="Bug entry not found",
        )

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(bug_entry, field, value)

    db.commit()
    db.refresh(bug_entry)

    return bug_entry



@app.post("/bug-entries")
def create_bug_entry(
    payload: BugEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bug_entry = BugEntry(
        user_id=current_user.id,
        image_url=payload.image_url,
        common_name=payload.common_name,
        category=payload.category,
        ai_identification=payload.ai_identification,
        confidence_note=payload.confidence_note,
        short_description=payload.short_description,
        safety_note=payload.safety_note,
        location_context=payload.location_context,
        date_found=payload.date_found,
    )

    db.add(bug_entry)
    db.commit()
    db.refresh(bug_entry)

    return bug_entry



@app.delete("/bug-entries/{bug_entry_id}")
def delete_bug_entry(
    bug_entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(BugEntry).where(
        BugEntry.id == bug_entry_id,
        BugEntry.user_id == current_user.id,
    )

    bug_entry = db.scalar(statement)

    if bug_entry is None:
        raise HTTPException(
            status_code=404,
            detail="Bug entry not found",
        )

    db.delete(bug_entry)
    db.commit()

    return {"message": "Bug entry deleted"}