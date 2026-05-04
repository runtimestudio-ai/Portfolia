from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from app.utils.limiter import limiter
import os

# Routers
from app.api.v1.routes import (
    summary,
    user,
    auth,
    project,
    achievements,
    skills,
    profile,
    preview,
    portfolio,
    cron,
    resume,
    ai,
    contact,
    portfolio_editor,
)

# Models (force registration)
from app.models.user import User
from app.models.project import Project

# ─────────────────────────────────────────────
# CREATE APP (ONLY ONCE)
# ─────────────────────────────────────────────
app = FastAPI()
app.state.limiter = limiter

# ─────────────────────────────────────────────
# TRUSTED HOSTS (FIXES INVALID HOST HEADER)
# ─────────────────────────────────────────────
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "portfolia-awd7.onrender.com",
        "*.onrender.com",
        "portfolia-ai.vercel.app",
    ],
)

# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
origins = [
    "https://portfolia-ai.vercel.app",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ─────────────────────────────────────────────
# HTTPS REDIRECT (PRODUCTION ONLY)
# ─────────────────────────────────────────────
if os.getenv("ENV") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# ─────────────────────────────────────────────
# SECURITY HEADERS
# ─────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# ─────────────────────────────────────────────
# RATE LIMIT HANDLER
# ─────────────────────────────────────────────
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )

# ─────────────────────────────────────────────
# ROUTERS
# ─────────────────────────────────────────────
app.include_router(cron.router)
app.include_router(summary.router, tags=["GitHub Summary"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user.router, tags=["Auth"])
app.include_router(project.router, prefix="/projects", tags=["Projects"])
app.include_router(achievements.router)
app.include_router(skills.router)
app.include_router(profile.router)
app.include_router(preview.router)
app.include_router(portfolio.router)
app.include_router(portfolio_editor.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(resume.router, tags=["Resumes"])
app.include_router(contact.router)
