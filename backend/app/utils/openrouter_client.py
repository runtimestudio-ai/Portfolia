import os
from typing import List
import httpx
from fastapi import HTTPException

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
PRIMARY_MODEL = os.getenv("MODEL", "google/gemma-2-9b-it:free")
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "meta-llama/llama-3.2-3b-instruct:free")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


async def generate_variants_from_openrouter(prompt: str, n_variants: int = 3) -> List[str]:
    """
    Calls OpenRouter and returns a list of `n_variants` text completions.
    No FastAPI route logic here; this is a reusable utility.
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not configured.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": PRIMARY_MODEL,
        "messages": [
            {"role": "user", "content": prompt},
        ],
        "n": n_variants,
        "temperature": 0.6,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(OPENROUTER_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError:
        # Simple fallback once with the secondary model
        payload["model"] = FALLBACK_MODEL
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(OPENROUTER_URL, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError:
            raise HTTPException(
                status_code=502,
                detail="AI service temporarily unavailable, please try again.",
            )

    # Extract plain text variants
    choices = data.get("choices", [])
    texts: List[str] = []
    for idx, choice in enumerate(choices[:n_variants], start=1):
        message = choice.get("message") or {}
        content = message.get("content") or ""
        texts.append(str(content).strip())

    if not texts:
        raise HTTPException(
            status_code=502,
            detail="AI service returned an empty response, please try again.",
        )

    return texts
