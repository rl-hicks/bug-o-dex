from datetime import date

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import check_database_connection
from app.dependencies import get_current_user, get_db, require_admin_user
from app.models import BugEntry, ContactMessage, User
from app.routers import auth
from app.routers import identify
from app.routers import uploads


app = FastAPI(
    title="Bug-O-Dex API",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.include_router(auth.router)
app.include_router(uploads.router)
app.include_router(identify.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.cors_origins.split(",")
        if origin.strip()
    ],
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
    is_public: bool = False


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
    is_public: bool | None = None


class PublicBugEntryRead(BaseModel):
    id: str
    image_url: str
    common_name: str
    category: str | None = None
    short_description: str | None = None
    date_found: date | None = None


class ContactMessageCreate(BaseModel):
    name: str | None = Field(default=None, max_length=80)
    email: str | None = Field(default=None, max_length=120)
    message: str = Field(min_length=20, max_length=300)


class ContactMessageRead(BaseModel):
    id: str
    name: str | None = None
    email: str | None = None
    message: str
    created_at: str


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/db-check")
def database_check():
    if settings.is_production:
        raise HTTPException(status_code=404, detail="Not found")

    try:
        check_database_connection()
        return {"database": "connected"}
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed",
        )


@app.get("/public/bug-entries")
def list_public_bug_entries(
    db: Session = Depends(get_db),
):
    if settings.public_vault_user_id is None:
        return []

    statement = (
        select(BugEntry)
        .where(
            BugEntry.is_public == True,
            BugEntry.user_id == settings.public_vault_user_id,
        )
        .order_by(BugEntry.created_at.desc())
    )
    bug_entries = db.scalars(statement).all()

    return [
        PublicBugEntryRead(
            id=str(entry.id),
            image_url=entry.image_url,
            common_name=entry.common_name,
            category=entry.category,
            short_description=entry.short_description,
            date_found=entry.date_found,
        )
        for entry in bug_entries
    ]


@app.get("/public/bug-entries/{bug_entry_id}")
def get_public_bug_entry(
    bug_entry_id: str,
    db: Session = Depends(get_db),
):
    if settings.public_vault_user_id is None:
        raise HTTPException(
            status_code=404,
            detail="Bug entry not found",
        )

    statement = select(BugEntry).where(
        BugEntry.id == bug_entry_id,
        BugEntry.is_public == True,
        BugEntry.user_id == settings.public_vault_user_id,
    )

    bug_entry = db.scalar(statement)

    if bug_entry is None:
        raise HTTPException(
            status_code=404,
            detail="Bug entry not found",
        )

    return PublicBugEntryRead(
        id=str(bug_entry.id),
        image_url=bug_entry.image_url,
        common_name=bug_entry.common_name,
        category=bug_entry.category,
        short_description=bug_entry.short_description,
        date_found=bug_entry.date_found,
    )


@app.post("/contact-messages")
def create_contact_message(
    payload: ContactMessageCreate,
    db: Session = Depends(get_db),
):
    name = payload.name.strip() if payload.name else None
    email = payload.email.strip() if payload.email else None
    message = payload.message.strip()

    if len(message) < 20:
        raise HTTPException(
            status_code=422,
            detail="Message must be at least 20 characters.",
        )

    contact_message = ContactMessage(
        name=name or None,
        email=email or None,
        message=message,
    )

    db.add(contact_message)
    db.commit()

    return {"message": "Message received."}


@app.get("/admin/status")
def get_admin_status(
    current_user: User = Depends(require_admin_user),
):
    return {
        "is_admin": True,
        "user_id": str(current_user.id),
    }


@app.get("/admin/contact-messages")
def list_contact_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
):
    statement = select(ContactMessage).order_by(ContactMessage.created_at.desc())
    contact_messages = db.scalars(statement).all()

    return [
        ContactMessageRead(
            id=str(contact_message.id),
            name=contact_message.name,
            email=contact_message.email,
            message=contact_message.message,
            created_at=contact_message.created_at.isoformat(),
        )
        for contact_message in contact_messages
    ]


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
        is_public=payload.is_public,
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