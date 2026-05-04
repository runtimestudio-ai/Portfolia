from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.utils.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False, unique=True, index=True)
    full_name = Column(String, nullable=False)  # keep original case
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Portfolio settings
    is_public = Column(Boolean, default=True, nullable=False)
    theme_preference = Column(String, default="classic", nullable=True)
    analytics_enabled = Column(Boolean, default=False, nullable=False)

    # Password reset fields
    reset_token = Column(String, nullable=True, index=True)
    reset_token_expires = Column(DateTime, nullable=True)

    # Email verification fields
    is_verified = Column(Boolean, default=False, nullable=False)
    otp_code = Column(String, nullable=True)
    otp_expires = Column(DateTime, nullable=True)
    google_id = Column(String, nullable=True)

    projects = relationship("Project", back_populates="owner")
    work_experiences = relationship("WorkExperience", back_populates="owner")
    certificates = relationship("Certificate", back_populates="owner")
    awards = relationship("Award", back_populates="owner")
    skills = relationship("Skill", back_populates="user")
    profile = relationship("Profile", back_populates="user", uselist=False)
    portfolio_draft = relationship("PortfolioDraft", back_populates="user", uselist=False)