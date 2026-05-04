from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.utils.database import Base


class PortfolioDraft(Base):
    __tablename__ = "portfolio_drafts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), unique=True, index=True, nullable=False)
    data = Column(JSON, nullable=False)  # Full portfolio snapshot as JSON
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="portfolio_draft")
