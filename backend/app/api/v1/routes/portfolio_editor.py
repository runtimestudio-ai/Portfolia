# app/api/v1/routes/portfolio_editor.py
"""
Portfolio Editor API routes for draft/publish functionality.

Provides endpoints for:
- GET /portfolio/editor - Get working copy (draft)
- POST /portfolio/editor - Save working copy
- POST /portfolio/publish - Publish working copy to live
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies.auth_user import get_db, get_current_user
from app.models.user import User
from app.schemas.portfolio_draft import (
    PortfolioDraftResponse,
    PortfolioDraftUpdateRequest,
    PublishResponse
)
from app.utils.portfolio_draft import (
    get_or_create_draft,
    save_draft,
    publish_draft
)


router = APIRouter(prefix="/portfolio", tags=["Portfolio Editor"])


@router.get("/editor", response_model=PortfolioDraftResponse)
def get_portfolio_editor_draft(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the working copy (draft) of the portfolio for the authenticated user.
    
    If no draft exists, creates one from the current published state.
    
    Returns:
        - data: Full portfolio snapshot as JSON
        - updated_at: Last updated timestamp
    
    Example:
        GET /api/v1/portfolio/editor
        Headers: Authorization: Bearer <token>
    """
    draft = get_or_create_draft(db, current_user.id)
    
    return PortfolioDraftResponse(
        data=draft.data,
        updated_at=draft.updated_at
    )


@router.post("/editor", response_model=PortfolioDraftResponse)
def save_portfolio_editor_draft(
    request: PortfolioDraftUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save/update the working copy (draft) of the portfolio.
    
    Validates the structure and saves the draft.
    Creates a new draft if one doesn't exist.
    
    Args:
        request: PortfolioDraftUpdateRequest with data field
    
    Returns:
        - data: Saved portfolio data
        - updated_at: New timestamp
    
    Example:
        POST /api/v1/portfolio/editor
        Headers: Authorization: Bearer <token>
        Body: {
            "data": {
                "profile": {...},
                "projects": [...],
                "skills": [...],
                "work_experiences": [...],
                "certificates": [...],
                "awards": [...],
                "settings": {...}
            }
        }
    """
    draft = save_draft(db, current_user.id, request.data)
    
    return PortfolioDraftResponse(
        data=draft.data,
        updated_at=draft.updated_at
    )


@router.post("/publish", response_model=PublishResponse)
def publish_portfolio_draft(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Publish the working copy (draft) to become the live portfolio.
    
    This operation:
    1. Loads the draft
    2. Deletes existing portfolio data
    3. Recreates from draft JSON
    4. Updates user settings
    
    Note: This is a destructive operation.
    
    Returns:
        - message: Success message
    
    Example:
        POST /api/v1/portfolio/publish
        Headers: Authorization: Bearer <token>
    """
    publish_draft(db, current_user.id)
    
    return PublishResponse(
        message="Portfolio published successfully"
    )
