# app/utils/groq_resume_parser.py
"""
Minimal Groq LLM-based resume parser.
Single function, single prompt, strict JSON output.
"""
import json
import logging
from typing import Dict, Any
from fastapi import HTTPException
from app.utils.groq_client import get_groq_client
from app.schemas.resume import ResumeExtractedData

logger = logging.getLogger(__name__)

# Get central Groq client
client = get_groq_client()

# Strict JSON prompt
RESUME_PARSING_PROMPT = """Extract ALL information from this resume and return ONLY valid JSON.

Resume Text:
{resume_text}

CRITICAL RULES:
1. Return ONLY the JSON object - no markdown, no explanations, no extra text
2. Extract ALL skills, projects, work experience, certifications, and awards
3. For descriptions: If original is <20 words, enhance to 2-3 sentences. Otherwise keep original.
4. Categorize skills: Frontend, Backend, Database, DevOps, Cloud, AI/ML, Mobile, Other
5. Skill levels: Beginner, Intermediate, Advanced
6. NEVER use the person's name in descriptions - write in first person or passive voice
   - BAD: "Ramitha developed..." or "John built..."
   - GOOD: "Developed..." or "Built..." or "Participated in..."

JSON Schema (MUST match exactly):
{{
  "name": "Full Name",
  "title": "Current/Target Job Title",
  "location": "City, Country",
  "email": "email@example.com",
  "about": "2-3 sentence professional summary",
  "github": "username",
  "linkedin": "username", 
  "website": "https://...",
  "work_experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start Date - End Date",
      "location": "City, Country",
      "description": "2-3 sentences about responsibilities and impact"
    }}
  ],
  "projects": [
    {{
      "title": "Project Name",
      "description": "2-3 sentences about what it does and impact",
      "tech": ["Technology1", "Technology2"],
      "features": ["Feature 1", "Feature 2"]
    }}
  ],
  "skills": [
    {{
      "name": "Skill Name",
      "level": "Beginner|Intermediate|Advanced",
      "category": "Frontend|Backend|Database|DevOps|Cloud|AI/ML|Mobile|Other"
    }}
  ],
  "certifications": [
    {{
      "name": "Certificate Name",
      "issuer": "Issuing Organization",
      "year": "YYYY",
      "description": "Brief description"
    }}
  ],
  "achievements": [
    {{
      "title": "Achievement Title",
      "issuer": "Organization",
      "date": "YYYY or Month YYYY",
      "type": "award|internship|other",
      "description": "1-2 sentences"
    }}
  ]
}}

Return ONLY the JSON object. Start with {{ and end with }}.
"""


def parse_resume_with_groq(resume_text: str) -> ResumeExtractedData:
    """
    Parse resume using Groq LLM.
    
    Args:
        resume_text: Raw text extracted from resume
        
    Returns:
        ResumeExtractedData: Validated structured resume data
        
    Raises:
        ValueError: If LLM returns invalid JSON or validation fails
        Exception: If Groq API call fails
    """
    try:
        # Truncate if too long
        max_chars = 12000
        if len(resume_text) > max_chars:
            logger.warning(f"Resume text truncated from {len(resume_text)} to {max_chars} chars")
            resume_text = resume_text[:max_chars]
        
        # Format prompt
        prompt = RESUME_PARSING_PROMPT.format(resume_text=resume_text)
        
        logger.info("Calling Groq API for resume parsing...")
        
        # Call Groq
        if not client:
            raise HTTPException(status_code=500, detail="Groq API key not configured.")
            
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise resume parser. Return ONLY valid JSON, no markdown, no explanations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",  # Fast and accurate
            temperature=0.1,  # Low for consistency
            max_tokens=4000
        )
        
        # Extract response
        response_text = chat_completion.choices[0].message.content
        logger.info(f"Received {len(response_text)} characters from Groq")
        
        # Clean response
        response_text = response_text.strip()
        
        # Remove markdown code fences if present
        if response_text.startswith("```"):
            response_text = response_text.split("```", 1)[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            if "```" in response_text:
                response_text = response_text.rsplit("```", 1)[0]
            response_text = response_text.strip()
        
        # Find JSON object boundaries
        first_brace = response_text.find('{')
        last_brace = response_text.rfind('}')
        if first_brace != -1 and last_brace != -1:
            response_text = response_text[first_brace:last_brace+1]
        
        # Parse JSON
        try:
            parsed_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {str(e)}")
            logger.error(f"Response text: {response_text[:500]}")
            raise ValueError(f"Invalid JSON from Groq: {str(e)}")
        
        # Validate with Pydantic
        extracted_data = ResumeExtractedData(**parsed_data)
        
        logger.info(
            f"Successfully parsed resume: {len(extracted_data.work_experience)} work exp, "
            f"{len(extracted_data.projects)} projects, {len(extracted_data.skills)} skills, "
            f"{len(extracted_data.certifications)} certs, {len(extracted_data.achievements)} achievements"
        )
        
        return extracted_data
        
    except Exception as e:
        logger.error(f"Groq resume parsing failed: {str(e)}", exc_info=True)
        raise
