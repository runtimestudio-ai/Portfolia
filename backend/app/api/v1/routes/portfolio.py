from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.dependencies.auth_user import get_db, get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.project import Project
from app.models.skills import Skill
from app.models.certificates import Certificate
from app.models.work_experience import WorkExperience
from app.models.awards import Award
from typing import Optional
from app.utils.limiter import limiter

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])

# Reserved usernames that cannot be used for portfolios
# Prevents conflicts with app routes and common pages
RESERVED_USERNAMES = {
    "dashboard", "auth", "projects", "portfolio", "api", 
    "landing", "profile", "admin", "settings", "export",
    "achievements", "skills", "main-portfolio", "dummy-portfolio",
    "login", "signup", "logout", "about", "contact", "help", 
    "terms", "privacy", "support", "blog", "docs", "faq"
}



@router.put("/settings")
async def update_portfolio_settings(
    settings: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update authenticated user's portfolio settings:
    - is_public
    - theme_preference
    - analytics_enabled
    """
    if "theme_preference" in settings:
        if settings["theme_preference"] not in ["classic", "creative", "modern"]:
            raise HTTPException(
                status_code=400, 
                detail="Invalid theme preference"
            )
        current_user.theme_preference = settings["theme_preference"]
        
    if "is_public" in settings:
        current_user.is_public = settings["is_public"]
        
    if "analytics_enabled" in settings:
        current_user.analytics_enabled = settings["analytics_enabled"]
        
    db.commit()
    return {"message": "Settings updated successfully"}


@router.get("/{username}")
@limiter.limit("100/minute")
def get_portfolio_by_username(request: Request, username: str, db: Session = Depends(get_db)):
    """
    Get complete portfolio data by username.
    Public endpoint - no authentication required.
    
    Returns:
        - 200: Portfolio data (if public)
        - 400: Invalid username (reserved)
        - 403: Portfolio is private
        - 404: User not found
    
    Example:
        GET /api/portfolio/johndoe
    """
    # Validate against reserved usernames
    if username.lower() in RESERVED_USERNAMES:
        print(f"[DEBUG] Username '{username}' is RESERVED - returning 400")
        raise HTTPException(status_code=400, detail="Invalid username")
    
    # Case-insensitive username lookup
    # This ensures /portfolio/JohnDoe and /portfolio/johndoe both work
    user = db.query(User).filter(
        func.lower(User.username) == username.lower()
    ).first()
    
    print(f"[DEBUG] Looking up username: '{username}'")
    print(f"[DEBUG] User found: {user is not None}")
    if user:
        print(f"[DEBUG] User.username: '{user.username}'")
        print(f"[DEBUG] User.is_public: {user.is_public}")
    
    if not user:
        print(f"[DEBUG] User NOT FOUND - returning 404")
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Check privacy setting
    if not user.is_public:
        print(f"[DEBUG] Portfolio is PRIVATE - returning 403")
        raise HTTPException(status_code=403, detail="Portfolio is private")
    
    print(f"[DEBUG] Fetching portfolio data for user_id: {user.id}")
    # Fetch all portfolio data
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    projects = db.query(Project).filter(Project.owner_id == user.id).all()
    skills = db.query(Skill).filter(Skill.user_id == user.id).all()
    certificates = db.query(Certificate).filter(Certificate.user_id == user.id).all()
    work_experience = db.query(WorkExperience).filter(WorkExperience.user_id == user.id).all()
    awards = db.query(Award).filter(Award.user_id == user.id).all()
    
    print(f"[DEBUG] Profile: {profile is not None}, Projects: {len(projects)}, Skills: {len(skills)}")
    
    # Build comprehensive portfolio response
    portfolio_data = {
        "username": user.username,  # Return actual casing
        "name": profile.name if profile and profile.name else user.full_name,
        "title": profile.title if profile else "Developer",
        "tagline": "Building the future with code, one project at a time",
        "location": profile.location if profile else "",
        "email": profile.email if profile else user.email,
        "github": profile.github if profile else "",
        "linkedin": profile.linkedin if profile else "",
        "website": profile.website if profile else "",
        "avatar": profile.avatar if profile else "",
        "about": profile.bio if profile else "",
        "theme_preference": user.theme_preference or "classic",
        "is_public": user.is_public,
        "analytics_enabled": user.analytics_enabled,
        
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description or "",
                "image": p.link or "https://via.placeholder.com/400x250",
                "tech": p.stack if isinstance(p.stack, list) else (p.stack.split(",") if p.stack else []),
                "features": p.features.split(",") if isinstance(p.features, str) else (p.features or []),
                "stars": p.stars or 0,
                "forks": p.forks or 0,
                "demo": p.link,
                "repo": p.link,
                "featured": False
            }
            for p in projects
        ],
        
        "achievements": [
            {
                "title": w.title,
                "issuer": w.organization,
                "date": w.duration,
                "type": w.status or "internship",
                "description": w.description or ""
            }
            for w in work_experience
        ] + [
            {
                "title": a.title,
                "issuer": a.organization,
                "date": a.year,
                "type": a.category or "award",
                "description": a.description or ""
            }
            for a in awards
        ],
        
        "certificates": [
            {
                "title": c.title,
                "issuer": c.description or "Unknown",
                "date": c.year,
                "credentialId": c.credential_id
            }
            for c in certificates
        ],
        
        "skills": [
            {
                "name": s.name,
                "level": s.level,
                "category": s.category
            }
            for s in skills
        ]
    }
    
    return portfolio_data


@router.get("/{username}/public-check")
@limiter.limit("100/minute")
def check_portfolio_public(request: Request, username: str, db: Session = Depends(get_db)):
    """
    Quick check if a portfolio exists and is public.
    Used for routing decisions on frontend.
    
    Returns:
        - exists: boolean - whether user exists
        - is_public: boolean - whether portfolio is public
        - username: string - actual username casing
    
    Example:
        GET /api/portfolio/johndoe/public-check
        Response: {"exists": true, "is_public": true, "username": "JohnDoe"}
    """
    # Check reserved usernames
    if username.lower() in RESERVED_USERNAMES:
        return {
            "exists": False,
            "is_public": False,
            "username": username
        }
    
    # Case-insensitive lookup
    user = db.query(User).filter(
        func.lower(User.username) == username.lower()
    ).first()
    
    if not user:
        return {
            "exists": False,
            "is_public": False,
            "username": username
        }
    
    return {
        "exists": True,
        "is_public": user.is_public,
        "username": user.username  # Return actual casing
    }


@router.get("/existing")
def get_existing_portfolio_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get existing portfolio data for duplicate detection during resume import.
    Authenticated endpoint - requires valid user session.
    
    Returns simplified data for comparison:
        - projects: list of project titles
        - skills: list of skill names
        - work_experience: list of {title, company}
        - certifications: list of {name, issuer}
        - achievements: list of {title, issuer}
    
    Used by resume upload flow to detect duplicates before import.
    """
    
    # Fetch existing data
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    work_exp = db.query(WorkExperience).filter(WorkExperience.user_id == current_user.id).all()
    certs = db.query(Certificate).filter(Certificate.user_id == current_user.id).all()
    achievements = db.query(Award).filter(Award.user_id == current_user.id).all()
    
    return {
        "projects": [{"title": p.title} for p in projects],
        "skills": [{"name": s.name} for s in skills],
        "work_experience": [
            {"title": w.title, "company": w.organization} 
            for w in work_exp
        ],
        "certifications": [
            {"name": c.title, "issuer": c.issuer} 
            for c in certs
        ],
        "achievements": [
            {"title": a.title, "issuer": a.organization} 
            for a in achievements
        ]
    }

