import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from supabase import create_client
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.event_logging import log_event
from app.models.user import User


router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


async def read_upload_with_limit(file: UploadFile, max_bytes: int) -> bytes:
    chunks: list[bytes] = []
    total_bytes = 0

    while chunk := await file.read(1024 * 1024):
        total_bytes += len(chunk)

        if total_bytes > max_bytes:
            raise HTTPException(
                status_code=413,
                detail="Image file is too large. Maximum upload size is 10 MB.",
            )

        chunks.append(chunk)

    return b"".join(chunks)


@router.post("")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WEBP images are allowed.",
        )

    extension = ALLOWED_IMAGE_TYPES[file.content_type]
    object_path = f"users/{current_user.id}/{uuid.uuid4()}{extension}"

    try:
        file_bytes = await read_upload_with_limit(file, settings.max_upload_bytes)
    except HTTPException:
        log_event(
            db,
            "upload_failed",
            user_id=current_user.id,
            event_metadata={
                "content_type": file.content_type,
                "reason": "file_too_large",
            },
        )
        raise

    supabase = create_client(
        settings.supabase_url,
        settings.supabase_secret_key,
    )

    try:
        supabase.storage.from_(settings.supabase_bucket_name).upload(
            path=object_path,
            file=file_bytes,
            file_options={
                "content-type": file.content_type,
                "upsert": "false",
            },
        )
    except Exception:
        log_event(
            db,
            "upload_failed",
            user_id=current_user.id,
            event_metadata={"content_type": file.content_type},
        )
        raise HTTPException(
            status_code=500,
            detail="Image upload failed. Please try again.",
        )

    public_url = supabase.storage.from_(
        settings.supabase_bucket_name
    ).get_public_url(object_path)

    return {"image_url": public_url}