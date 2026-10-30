"""
FruitQualityAI — Firebase Admin SDK Initialization
====================================================
Initializes the Firebase Admin SDK once when the application starts.
All other modules should import `db` from here to access Firestore.

Usage:
    from core.firebase_init import db
    collection_ref = db.collection("inspections")

Setup:
    1. Download your Firebase service account key from Firebase Console.
    2. Save it as: backend/core/firebase-service-account.json
    3. Set FIREBASE_SERVICE_ACCOUNT_PATH in your .env file.
    NEVER commit the service account JSON file to Git.
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore

from core.config import settings

# ---------------------------------------------------------------------------
# Initialize the Firebase app only once.
# If it has already been initialized (e.g. during hot-reload), skip it.
# ---------------------------------------------------------------------------
if not firebase_admin._apps:
    from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
service_account_path = Path(settings.firebase_service_account_path)

if not service_account_path.is_absolute():
    service_account_path = BASE_DIR / service_account_path

    if os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        print(f"[Firebase] Initialized using: {service_account_path}")
    else:
        # Server starts without Firebase if the key is not yet configured.
        # Routes that need Firestore will raise a clear error at request time.
        print(
            "[Firebase] WARNING: Service account file not found at "
            f"'{service_account_path}'. "
            "Firestore will not be available until the key is configured. "
            "See README.md → Step 4 for setup instructions."
        )

# ---------------------------------------------------------------------------
# Firestore client — import this in service modules
# ---------------------------------------------------------------------------
db = firestore.client() if firebase_admin._apps else None
