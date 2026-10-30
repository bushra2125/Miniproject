"""
FruitQualityAI — Application Configuration
===========================================
Loads environment variables from the .env file and exposes them
as a single settings object used throughout the application.

Usage:
    from core.config import settings
    print(settings.firebase_project_id)
"""

import os
from dotenv import load_dotenv

# Load variables from the .env file (if it exists)
load_dotenv()


class Settings:
    """Central configuration object for the FruitQualityAI backend."""

    # ---- Firebase ----
    firebase_service_account_path: str = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH", "core/firebase-service-account.json"
    )
    firebase_project_id: str = os.getenv("FIREBASE_PROJECT_ID", "")

    # ---- Application ----
    app_env: str = os.getenv("APP_ENV", "development")
    app_port: int = int(os.getenv("APP_PORT", 8000))

    # ---- CORS ----
    # Parse comma-separated origins into a list
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    ]

    # ---- AI Model ----
    model_path: str = os.getenv("MODEL_PATH", "ml_models/")


# Single shared instance — import this everywhere
settings = Settings()
