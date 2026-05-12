"""
AI-related endpoints (e.g., project description enhancement).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.auth_user import get_current_user
from app.database import get_db
from app.schemas.ai import EnhanceProjectRequest, EnhanceProjectResponse, EnhancedVariant
from app.utils.groq_client import generate_variants_from_groq
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/ping")
async def ping():
    """Health check endpoint to verify AI router is wired correctly."""
    return {"status": "ok", "message": "AI router is wired correctly"}


@router.post(
    "/enhance/project",
    response_model=EnhanceProjectResponse,
    status_code=status.HTTP_200_OK,
)
async def enhance_project_description(
    payload: EnhanceProjectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Use AI to generate enhanced project description variants.
    Does NOT modify the database. Returns 3 suggestions.
    """
    # Validate tones count (safety check in addition to schema validation)
    if not payload.tones or len(payload.tones) == 0:
        raise HTTPException(status_code=400, detail="At least one tone must be provided.")
    if len(payload.tones) > 2:
        raise HTTPException(status_code=400, detail="At most two tones are allowed.")

    # Basic description guard
    description = payload.description.strip()
    if not description:
        raise HTTPException(status_code=400, detail="Description cannot be empty.")

    # Map length to word range (used only in the prompt text)
    length_map = {
        "short": "40-60 words",
        "medium": "80-120 words",
        "long": "150-200 words",
    }
    length_hint = length_map.get(payload.length, "80-120 words")

    # Determine tones
    primary_tone = payload.tones[0]
    secondary_tone = payload.tones[1] if len(payload.tones) > 1 else None

    # Build the system + user prompt
    system_prompt = (
        "You are an expert technical portfolio writer. "
        "You rewrite software project descriptions to be clear, professional, impactful, "
        "and aligned with industry standards. Never fabricate achievements or metrics."
    )

    tech_stack_str = ", ".join(payload.tech_stack) if payload.tech_stack else "Not specified"

    user_prompt = f"""
Rewrite the following project description.

Project Title: {payload.title}
Current Description: {description}
Tech Stack: {tech_stack_str}

Tone requirements:
- Primary tone: {primary_tone}
"""
    if secondary_tone:
        user_prompt += f"- Secondary tone (subtle): {secondary_tone}\n"

    user_prompt += f"""
Length: {payload.length} description (~{length_hint}).

Rules:
1. Generate EXACTLY 3 variations.
2. Each variation must be a single plain-text paragraph.
3. Use the delimiter "|||" between variations.
4. Format: Variation 1 ||| Variation 2 ||| Variation 3
5. DO NOT include any other text, headings, or numbering.
6. Primary tone must dominate; Secondary tone (if any) should be a subtle influence.
7. Keep content truthful and concise.
"""

    full_prompt = system_prompt + "\n\n" + user_prompt

    # Call Groq helper
    try:
        # Use n_variants=1 because the prompt asks for 3 variations in one block separated by |||
        raw_texts = await generate_variants_from_groq(user_prompt, n_variants=1, system_message=system_prompt)
    except HTTPException:
        raise

    # Process the response to extract the 3 variants
    texts = []
    if raw_texts:
        content = raw_texts[0]
        # Split by the delimiter |||
        if '|||' in content:
            parts = content.split('|||')
            texts = [p.strip() for p in parts if p.strip()]
        else:
            # Fallback: try splitting by double newlines if no delimiter found
            parts = content.split('\n\n')
            texts = [p.strip() for p in parts if p.strip()]

    # Ensure we don't return more than 3
    texts = texts[:3]

    # If the model didn't use ||| but still returned something, fallback to the whole content as one variant
    if not texts and raw_texts:
        texts = [raw_texts[0]]

    variants = [
        EnhancedVariant(id=index, text=text)
        for index, text in enumerate(texts[:3], start=1)
    ]

    return EnhanceProjectResponse(variants=variants)
