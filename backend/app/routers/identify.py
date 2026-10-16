import json
import logging
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.identify import IdentifyRequest, IdentifyResponse


router = APIRouter(prefix="/identify", tags=["identify"])
logger = logging.getLogger(__name__)


@router.post("", response_model=IdentifyResponse)
async def identify_bug(
    payload: IdentifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prompt = f"""
You are helping power Bug-O-Dex, a child-friendly bug discovery app.

Identify the bug as a best guess from the image and context.

Rules:
- Do not claim scientific certainty.
- Do not pretend to be an authoritative entomologist.
- Keep the language child-friendly.
- If uncertain, use a broad category like "Beetle", "Spider", "Moth/Butterfly", "Ant/Bee/Wasp", "Fly", "True Bug", "Worm/Larva", or "Unknown".
- Safety note should encourage looking without touching unknown bugs.
- Return only valid JSON matching the requested schema.

Discovery context:
- Approximate location/context: {payload.location_context}
- Date found: {payload.date_found or "Unknown"}
- Notes: {payload.notes or "None"}
"""

    stage = "client_initialization"
    try:
        client = OpenAI(api_key=settings.openai_api_key)
        stage = "provider_request"
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {
                            "type": "input_image",
                            "image_url": payload.image_url,
                        },
                    ],
                }
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "bug_identification",
                    "schema": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "common_name": {"type": "string"},
                            "category": {"type": "string"},
                            "short_description": {"type": "string"},
                            "confidence_note": {"type": "string"},
                            "safety_note": {"type": "string"},
                            "best_guess_disclaimer": {"type": "string"},
                        },
                        "required": [
                            "common_name",
                            "category",
                            "short_description",
                            "confidence_note",
                            "safety_note",
                            "best_guess_disclaimer",
                        ],
                    },
                    "strict": True,
                }
            },
        )

        stage = "response_decoding"
        parsed = json.loads(response.output_text)

        stage = "response_validation"
        return IdentifyResponse(**parsed)

    except Exception as exc:
        error_id = uuid4().hex
        # Exception messages, tracebacks, and provider/request bodies can contain
        # credentials or private discovery data. Log only diagnostic metadata.
        logger.error(
            "Bug identification failed error_id=%s stage=%s error_type=%s",
            error_id,
            stage,
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=500,
            detail="Bug identification failed. Please try again.",
            headers={"X-Error-ID": error_id},
        ) from None
