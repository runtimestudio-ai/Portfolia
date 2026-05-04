# app/schemas/portfolio_draft.py
"""
Pydantic schemas for portfolio draft API endpoints.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any


class PortfolioDraftResponse(BaseModel):
    """Response schema for draft GET endpoint"""
    data: Dict[str, Any]
    updated_at: datetime

    class Config:
        from_attributes = True  # Enables ORM mode for SQLAlchemy models


class PortfolioDraftUpdateRequest(BaseModel):
    """Request schema for draft POST endpoint"""
    data: Dict[str, Any]


class PublishResponse(BaseModel):
    """Response schema for publish endpoint"""
    message: str
