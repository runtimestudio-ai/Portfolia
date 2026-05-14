from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
import httpx
import os
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.models.user import User
from app.utils.auth import hash_password, verify_password, create_access_token
from app.database import get_db
from app.models.profile import Profile
from app.schemas.auth import SignupResponse
from app.utils.limiter import limiter
from fastapi_csrf_protect import CsrfProtect
from app.utils.security import sanitize_html

import secrets
import random
from datetime import datetime, timedelta
from app.schemas.password_reset import PasswordResetRequest, PasswordResetConfirm, TokenValidationResponse
from app.schemas.otp import VerifyOTPRequest
from app.utils.email import send_reset_email, send_otp_email

router = APIRouter()

@router.get("/csrf")
def get_csrf_token(response: Response, csrf_protect: CsrfProtect = Depends()):
    """
    Get a CSRF token. The token is set in a cookie and returned in the response header.
    Frontend should read the header and include it in state-changing requests.
    """
    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    csrf_protect.set_csrf_cookie(signed_token, response)
    response.headers["X-CSRF-Token"] = csrf_token
    return {"detail": "CSRF token set"}

@router.post("/password-reset-request")
@limiter.exempt
async def password_reset_request(request: Request, reset_data: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Generate a reset token and send an email to the user.
    """
    user = db.query(User).filter(User.email == reset_data.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address.")
    
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    
    await send_reset_email(user.email, token)
    
    return {"message": "Success! A password reset link has been sent to your email."}

@router.get("/validate-reset-token/{token}", response_model=TokenValidationResponse)
def validate_reset_token(token: str, db: Session = Depends(get_db)):
    """
    Verify if a reset token is valid and not expired.
    """
    user = db.query(User).filter(
        User.reset_token == token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        return {"valid": False}
    
    return {"valid": True, "email": user.email}

@router.post("/password-reset-confirm")
@limiter.exempt
def password_reset_confirm(request: Request, confirm_data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Reset the user's password using a valid token.
    """
    user = db.query(User).filter(
        User.reset_token == confirm_data.token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Update password and clear token
    user.hashed_password = hash_password(confirm_data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Password reset successful. You can now log in with your new password."}

@router.post("/signup", response_model=SignupResponse)
@limiter.exempt
async def signup(request: Request, response: Response, user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    # Check if username already exists
    if db.query(User).filter(User.username == user.username.lower()).first():
        raise HTTPException(status_code=409, detail="Username is already taken.")

    # Store lowercase username
    username_lower = user.username.lower()

    # Create User (DB MODEL)
    hashed_pw = hash_password(user.password)
    new_user = User(
        email=user.email,
        username=username_lower,
        full_name=user.full_name,
        hashed_password=hashed_pw,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate OTP
    otp = str(random.randint(100000, 999999))
    new_user.otp_code = otp
    new_user.otp_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    # Send OTP Email
    await send_otp_email(new_user.email, otp)

    return {
        "message": "Verification code sent to your email. Please verify your account.",
        "email": new_user.email,
        "is_verified": False
    }


@router.post("/login")
@limiter.exempt
def login(request: Request, response: Response, user: UserLogin, db: Session = Depends(get_db), csrf_protect: CsrfProtect = Depends()):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    if not db_user.is_verified:
        return JSONResponse(
            status_code=403,
            content={
                "detail": "Account not verified. Please verify your email.",
                "verified": False,
                "email": db_user.email
            }
        )

    token = create_access_token(data={
        "sub": db_user.email,
        "username": db_user.username
    })

    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    csrf_protect.set_csrf_cookie(signed_token, response)
    response.headers["X-CSRF-Token"] = csrf_token

    return {"access_token": token, "token_type": "bearer"}


@router.get("/check-username/{username}")
def check_username(username: str, db: Session = Depends(get_db)):
    username_lower = username.lower()
    exists = db.query(User).filter(User.username == username_lower).first()
    return {"available": not exists, "username": username}

@router.post("/verify-otp")
async def verify_otp(request: Request, response: Response, data: VerifyOTPRequest, db: Session = Depends(get_db), csrf_protect: CsrfProtect = Depends()):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if user.is_verified:
        return {"message": "Account is already verified."}

    if not user.otp_code or user.otp_code != data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    if not user.otp_expires or user.otp_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired.")

    # Success
    user.is_verified = True
    user.otp_code = None
    user.otp_expires = None
    
    # Create profile on verification
    profile = Profile(
        user_id=user.id,
        name=user.full_name or user.username,
        email=user.email,
        title="",
        location="",
        bio="",
        github="",
        linkedin="",
        website="",
        avatar="",
    )
    db.add(profile)
    db.commit()

    # Issue token
    token = create_access_token(data={
        "sub": user.email,
        "username": user.username
    })

    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    csrf_protect.set_csrf_cookie(signed_token, response)
    response.headers["X-CSRF-Token"] = csrf_token

    return {
        "access_token": token,
        "token_type": "bearer",
        "message": "Account verified successfully."
    }

@router.post("/resend-otp")
@limiter.exempt
async def resend_otp(request: Request, email_data: dict, db: Session = Depends(get_db)):
    email = email_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if user.is_verified:
        return {"message": "Account is already verified."}

    # Generate new OTP
    otp = str(random.randint(100000, 999999))
    user.otp_code = otp
    user.otp_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    await send_otp_email(user.email, otp)
    return {"message": "A new verification code has been sent to your email."}


@router.get("/google/login")
async def google_login():
    """Redirects user to Google Login"""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

    # Force HTTPS in production
    if os.getenv("ENV") == "production" and redirect_uri and redirect_uri.startswith("http://"):
        redirect_uri = redirect_uri.replace("http://", "https://")

    scope = "openid email profile"
    url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}&access_type=offline&prompt=consent"
    return RedirectResponse(url)

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handles Google OAuth Callback"""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

    # Force HTTPS in production
    if os.getenv("ENV") == "production" and redirect_uri and redirect_uri.startswith("http://"):
        redirect_uri = redirect_uri.replace("http://", "https://")

    # 1. Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
    
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google Code")

    access_token = token_res.json().get("access_token")

    # 2. Get User Info
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    
    google_user = user_res.json()
    email = google_user.get("email")
    google_id = google_user.get("id")
    full_name = google_user.get("name")
    
    # 3. Check if user exists
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Generate unique username
        base_username = email.split("@")[0]
        # Sanitize username (alphanumeric only)
        base_username = "".join(c for c in base_username if c.isalnum() or c in "_-")
        if len(base_username) < 3:
            base_username = f"user{random.randint(1000, 9999)}"
            
        username = base_username.lower()
        if db.query(User).filter(User.username == username).first():
            username = f"{base_username}{random.randint(1000, 9999)}"

        # Create new user
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            google_id=google_id,
            is_verified=True, # Google Entrusted
            hashed_password="oauth_user_no_password" # Placeholder
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create Profile
        profile = Profile(
            user_id=user.id,
            name=full_name or username,
            email=email,
            avatar=google_user.get("picture", ""),
            title="", location="", bio="", github="", linkedin="", website=""
        )
        db.add(profile)
        db.commit()

    elif not user.google_id:
        # Link existing account
        user.google_id = google_id
        if not user.is_verified:
            user.is_verified = True # Trust Google verification
        db.commit()

    # 4. Generate JWT
    token = create_access_token(data={"sub": user.email, "username": user.username})

    # 5. Redirect to Frontend Dashboard with Token
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080")
    return RedirectResponse(f"{frontend_url}/auth?token={token}")