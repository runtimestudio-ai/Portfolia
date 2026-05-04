from fastapi import Depends, APIRouter
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.dependencies.auth_user import get_current_user
from app.schemas.user import UsernameResponse

# Router registered in main.py with prefix="/api/v1"
# FINAL PATHS:
#   GET /api/v1/me
#   GET /api/v1/me/username
router = APIRouter()

@router.get("/me")
def get_current_user_details(current_user: User = Depends(get_current_user)):
    return {
        "full_name": current_user.full_name,
        "username": current_user.username,
        "email": current_user.email,
        "id": current_user.id
    }


@router.get("/me/username", response_model=UsernameResponse)
def get_my_username(current_user: User = Depends(get_current_user)):
    """
    Get the current user's username to use with public portfolio endpoint.
    
    This helper endpoint returns the exact username value needed for:
    GET /api/portfolio/{username}
    
    Example usage:
    1. POST /login → get access_token
    2. GET /api/v1/me/username (with Bearer token) → get username
    3. GET /api/portfolio/{username} (no auth needed)
    
    Returns:
        username: The User.username field (lowercase, unique)
    """
    return {"username": current_user.username}
