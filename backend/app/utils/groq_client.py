import os
import logging
from typing import List, Optional
from groq import Groq
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Default model for Groq
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY not found in environment")
        return None
    return Groq(api_key=api_key)

async def generate_variants_from_groq(prompt: str, n_variants: int = 1, system_message: str = "You are a helpful assistant.") -> List[str]:
    """
    Calls Groq and returns a list of text completions.
    """
    client = get_groq_client()
    if not client:
        raise HTTPException(status_code=500, detail="Groq API key not configured.")

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt},
            ],
            model=DEFAULT_GROQ_MODEL,
            temperature=0.8,
            max_tokens=2048,
        )
        
        content = chat_completion.choices[0].message.content
        if not content:
            raise HTTPException(status_code=502, detail="AI service returned an empty response.")
        
        # If n_variants > 1 was requested, but Groq's SDK doesn't support 'n' for all models easily 
        # (or it might be expensive), we just return the single content as a list.
        # The prompt in ai.py already handles splitting 3 variants by |||.
        return [content.strip()]

    except Exception as e:
        logger.error(f"Groq API call failed: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Groq AI service error: {str(e)}"
        )
