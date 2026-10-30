"""
FruitQualityAI — FastAPI Application Entry Point
=================================================
This is the main file that starts the backend server.

Run with:
    uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from api.routes import fruits, history, analytics
from services import ai_service

# ---------------------------------------------------------------------------
# Application Instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="FruitQualityAI API",
    description=(
        "Backend API for the AI-Based Smart Fruit Sorting, "
        "Counting and Quality Assessment System."
    ),
    version="0.1.0",
)
@app.on_event("startup")
async def startup_event():
    """Load the trained orange model when the API starts."""
    ai_service.load_model()
# ---------------------------------------------------------------------------
# CORS Middleware
# Allow the React frontend (running on localhost:5173) to talk to this API.
# In production, replace with your actual frontend domain.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register API Routers
# Each router handles a specific area of the application.
# ---------------------------------------------------------------------------
app.include_router(fruits.router, prefix="/api/fruits", tags=["Fruits"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


# ---------------------------------------------------------------------------
# Health Check Endpoint
# A simple endpoint to confirm the server is running.
# Visit: http://localhost:8000/health
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health_check():
    """Returns the current status of the API server."""
    return {
        "status": "ok",
        "message": "FruitQualityAI API is running.",
        "version": "0.1.0",
    }


# ---------------------------------------------------------------------------
# Root Endpoint
# ---------------------------------------------------------------------------
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — points to the interactive API docs."""
    return {
        "message": "Welcome to FruitQualityAI API.",
        "docs": "/docs",
        "health": "/health",
    }
