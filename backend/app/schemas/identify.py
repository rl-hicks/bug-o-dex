from pydantic import BaseModel


class IdentifyRequest(BaseModel):
    image_url: str
    location_context: str
    date_found: str | None = None
    notes: str | None = None


class IdentifyResponse(BaseModel):
    common_name: str
    category: str
    short_description: str
    confidence_note: str
    safety_note: str
    best_guess_disclaimer: str