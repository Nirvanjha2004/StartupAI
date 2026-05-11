"""FastAPI app entry point for PitchIQ"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import auth, tasks, gateway
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic"""
    # Startup
    print("Starting PitchIQ backend...")
    yield
    # Shutdown
    print("Shutting down PitchIQ backend...")

app = FastAPI(
    title="PitchIQ",
    description="AI-powered email generation for outreach",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(gateway.router, prefix="/api/chat", tags=["gateway"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
