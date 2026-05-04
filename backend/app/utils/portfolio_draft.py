# app/utils/portfolio_draft.py
"""
Utility functions for managing portfolio drafts and publishing.

This module handles the working copy vs published portfolio state.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.models.profile import Profile
from app.models.project import Project
from app.models.skills import Skill
from app.models.certificates import Certificate
from app.models.work_experience import WorkExperience
from app.models.awards import Award
from app.models.draft import PortfolioDraft
from typing import Dict, Any


def get_portfolio_snapshot(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Build a complete snapshot of the user's current published portfolio.
    
    Returns a dictionary matching the structure of the public portfolio API.
    This snapshot can be used to initialize a draft or to get current state.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    projects = db.query(Project).filter(Project.owner_id == user_id).all()
    skills = db.query(Skill).filter(Skill.user_id == user_id).all()
    work_experiences = db.query(WorkExperience).filter(WorkExperience.user_id == user_id).all()
    certificates = db.query(Certificate).filter(Certificate.user_id == user_id).all()
    awards = db.query(Award).filter(Award.user_id == user_id).all()
    
    snapshot = {
        "profile": {
            "name": profile.name if profile else user.full_name,
            "email": profile.email if profile else user.email,
            "title": profile.title if profile else "",
            "location": profile.location if profile else "",
            "bio": profile.bio if profile else "",
            "github": profile.github if profile else "",
            "linkedin": profile.linkedin if profile else "",
            "website": profile.website if profile else "",
            "avatar": profile.avatar if profile else ""
        },
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description or "",
                "type": p.type,
                "stack": p.stack if isinstance(p.stack, list) else (p.stack.split(",") if p.stack else []),
                "features": p.features if isinstance(p.features, list) else (p.features.split(",") if p.features else []),
                "link": p.link,
                "stars": p.stars or 0,
                "forks": p.forks or 0,
                "imported": p.imported,
                "ai_summary": p.ai_summary,
                "saved": p.saved
            }
            for p in projects
        ],
        "skills": [
            {
                "name": s.name,
                "level": s.level,
                "category": s.category,
                "experience": getattr(s, 'experience', None)
            }
            for s in skills
        ],
        "work_experiences": [
            {
                "title": w.title,
                "organization": w.organization,
                "duration": w.duration,
                "description": w.description or "",
                "skills": w.skills or [],
                "status": w.status or ""
            }
            for w in work_experiences
        ],
        "certificates": [
            {
                "title": c.title,
                "issuer": getattr(c, 'issuer', c.description or ""),
                "year": c.year,
                "credential_id": c.credential_id,
                "description": c.description or ""
            }
            for c in certificates
        ],
        "awards": [
            {
                "title": a.title,
                "organization": a.organization,
                "year": a.year,
                "description": a.description or "",
                "category": getattr(a, 'category', None)
            }
            for a in awards
        ],
        "settings": {
            "is_public": user.is_public,
            "theme_preference": user.theme_preference or "classic",
            "analytics_enabled": user.analytics_enabled
        }
    }
    
    return snapshot


def get_or_create_draft(db: Session, user_id: int) -> PortfolioDraft:
    """
    Get the existing draft for a user, or create one from current published state.
    
    If no draft exists, creates one with a snapshot of the current portfolio.
    """
    draft = db.query(PortfolioDraft).filter(PortfolioDraft.user_id == user_id).first()
    
    if draft:
        return draft
    
    # Create new draft from current snapshot
    snapshot = get_portfolio_snapshot(db, user_id)
    draft = PortfolioDraft(
        user_id=user_id,
        data=snapshot
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    
    return draft


def save_draft(db: Session, user_id: int, data: Dict[str, Any]) -> PortfolioDraft:
    """
    Save/update the draft for a user with new data.
    
    Validates that the data has the required structure.
    Creates a new draft if one doesn't exist.
    """
    # Validate basic structure
    required_keys = ["profile", "projects", "skills", "work_experiences", "certificates", "awards", "settings"]
    missing_keys = [key for key in required_keys if key not in data]
    
    if missing_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid draft data structure. Missing keys: {', '.join(missing_keys)}"
        )
    
    # Get or create draft
    draft = db.query(PortfolioDraft).filter(PortfolioDraft.user_id == user_id).first()
    
    if draft:
        # Update existing
        draft.data = data
    else:
        # Create new
        draft = PortfolioDraft(
            user_id=user_id,
            data=data
        )
        db.add(draft)
    
    db.commit()
    db.refresh(draft)
    
    return draft


def publish_draft(db: Session, user_id: int) -> None:
    """
    Publish the draft to become the live portfolio.
    
    This operation:
    1. Loads the draft
    2. Deletes existing portfolio data
    3. Recreates from draft JSON
    4. Updates user settings
    
    Note: This is a destructive operation that deletes and recreates entities.
    """
    # Load draft
    draft = db.query(PortfolioDraft).filter(PortfolioDraft.user_id == user_id).first()
    
    if not draft:
        raise HTTPException(
            status_code=404,
            detail="No draft found to publish. Save a draft first."
        )
    
    print(f"DEBUG: Draft found for user {user_id}")
    data = draft.data
    print(f"DEBUG: Draft data keys: {data.keys() if data else 'None'}")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"DEBUG: User found: {user.username}")
    
    # Delete existing portfolio data (destructive operation)
    db.query(Project).filter(Project.owner_id == user_id).delete()
    db.query(Skill).filter(Skill.user_id == user_id).delete()
    db.query(WorkExperience).filter(WorkExperience.user_id == user_id).delete()
    db.query(Certificate).filter(Certificate.user_id == user_id).delete()
    db.query(Award).filter(Award.user_id == user_id).delete()
    
    # Upsert profile
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    profile_data = data.get("profile", {})
    
    if profile:
        # Update existing profile - only update fields that exist in Profile model
        profile.name = profile_data.get("name", profile.name)
        profile.email = profile_data.get("email", profile.email)
        profile.title = profile_data.get("title", profile.title)
        profile.location = profile_data.get("location", profile.location)
        profile.bio = profile_data.get("about", profile_data.get("bio", profile.bio))  # Map 'about' to 'bio'
        profile.github = profile_data.get("github", profile.github)
        profile.linkedin = profile_data.get("linkedin", profile.linkedin)
        profile.website = profile_data.get("website", profile.website)
        profile.avatar = profile_data.get("avatar", profile.avatar)
    else:
        # Create new profile
        profile = Profile(
            user_id=user_id,
            name=profile_data.get("name", ""),
            email=profile_data.get("email", ""),
            title=profile_data.get("title", ""),
            location=profile_data.get("location", ""),
            bio=profile_data.get("about", profile_data.get("bio", "")),  # Map 'about' to 'bio'
            github=profile_data.get("github", ""),
            linkedin=profile_data.get("linkedin", ""),
            website=profile_data.get("website", ""),
            avatar=profile_data.get("avatar", "")
        )
        db.add(profile)
    
    # Recreate projects
    for proj_data in data.get("projects", []):
        project = Project(
            owner_id=user_id,
            title=proj_data.get("title", ""),
            description=proj_data.get("description", ""),
            type=proj_data.get("type", "others"),
            stack=proj_data.get("stack", []),
            features=proj_data.get("features", []),
            link=proj_data.get("link", ""),
            stars=proj_data.get("stars", 0),
            forks=proj_data.get("forks", 0),
            imported=proj_data.get("imported", False),
            ai_summary=proj_data.get("ai_summary", False),
            saved=proj_data.get("saved", True)
        )
        db.add(project)
    
    # Recreate skills
    for skill_data in data.get("skills", []):
        skill = Skill(
            user_id=user_id,
            name=skill_data.get("name"),
            level=skill_data.get("level"),
            category=skill_data.get("category"),
            experience=skill_data.get("experience", "")  # Default to empty string if not provided
        )
        db.add(skill)
    
    # Recreate work experiences
    for we_data in data.get("work_experiences", []):
        work_exp = WorkExperience(
            user_id=user_id,
            title=we_data.get("title"),
            organization=we_data.get("organization"),
            duration=we_data.get("duration"),
            location=we_data.get("location", ""),
            description=we_data.get("description"),
            skills=we_data.get("skills", []),
            status=we_data.get("status", "")
        )
        db.add(work_exp)
    
    # Recreate certificates
    for cert_data in data.get("certificates", []):
        cert = Certificate(
            user_id=user_id,
            title=cert_data.get("title"),
            issuer=cert_data.get("issuer"),
            year=cert_data.get("year"),
            credential_id=cert_data.get("credential_id"),
            description=cert_data.get("description"),
            status=cert_data.get("status", "")
        )
        db.add(cert)
    
    # Recreate awards
    for award_data in data.get("awards", []):
        award = Award(
            user_id=user_id,
            title=award_data.get("title"),
            organization=award_data.get("organization"),
            year=award_data.get("year"),
            description=award_data.get("description"),
            category=award_data.get("category")
        )
        db.add(award)
    
    # Update user settings
    settings = data.get("settings", {})
    user.is_public = settings.get("is_public", user.is_public)
    user.theme_preference = settings.get("theme_preference", user.theme_preference)
    user.analytics_enabled = settings.get("analytics_enabled", user.analytics_enabled)
    
    db.commit()
