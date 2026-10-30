"""
FruitQualityAI — Firebase / Firestore Service
==============================================
All database read and write operations are isolated here.
API route handlers should call these functions — never talk to Firestore directly.

CURRENT STATE:
    Firebase is not configured until you add your service account key.
    All functions check whether the Firestore client is available and raise
    a clear error if it is not, rather than crashing silently.

FIRESTORE COLLECTION STRUCTURE (planned):
    inspections/
        {inspection_id}/
            fruit_count      : int
            results          : list[dict]
            image_url        : str | null
            timestamp        : datetime
            model_loaded     : bool
            notes            : str | null
"""

from datetime import datetime
from typing import Optional

from core.firebase_init import db


def _require_db():
    """Raises a RuntimeError if Firestore is not initialized."""
    if db is None:
        raise RuntimeError(
            "Firestore is not configured. "
            "Please add your Firebase service account key and restart the server. "
            "See README.md → Step 4."
        )


# ---------------------------------------------------------------------------
# Write Operations
# ---------------------------------------------------------------------------

def save_inspection(inspection_data: dict) -> str:
    """
    Save a new inspection record to Firestore.

    Args:
        inspection_data: Dictionary matching the InspectionRecord model shape.

    Returns:
        The auto-generated Firestore document ID (inspection_id).

    Raises:
        RuntimeError: If Firestore is not configured.
    """
    _require_db()

    collection_ref = db.collection("inspections")
    doc_ref = collection_ref.document()  # Auto-generate document ID
    inspection_data["inspection_id"] = doc_ref.id
    inspection_data["timestamp"] = datetime.utcnow()
    doc_ref.set(inspection_data)

    return doc_ref.id


# ---------------------------------------------------------------------------
# Read Operations
# ---------------------------------------------------------------------------

def get_all_inspections(limit: int = 50) -> list[dict]:
    """
    Retrieve the most recent inspections, ordered by timestamp descending.

    Args:
        limit: Maximum number of records to return (default 50).

    Returns:
        List of inspection record dicts.

    Raises:
        RuntimeError: If Firestore is not configured.
    """
    _require_db()

    docs = (
        db.collection("inspections")
        .order_by("timestamp", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    return [doc.to_dict() for doc in docs]


def get_inspection_by_id(inspection_id: str) -> Optional[dict]:
    """
    Retrieve a single inspection record by its ID.

    Args:
        inspection_id: The Firestore document ID.

    Returns:
        Inspection dict if found, None otherwise.

    Raises:
        RuntimeError: If Firestore is not configured.
    """
    _require_db()

    doc = db.collection("inspections").document(inspection_id).get()
    return doc.to_dict() if doc.exists else None


def get_analytics_summary() -> dict:
    """
    Aggregate statistics across all inspection records.

    Returns:
        Dict with total_inspections, total_fruits_counted, quality_summary,
        most_common_fruit, and a status message.

    Raises:
        RuntimeError: If Firestore is not configured.
    """
    _require_db()

    docs = db.collection("inspections").stream()

    total_inspections = 0
    total_fruits = 0
    quality_counts = {"Healthy": 0, "Damaged": 0, "Rotten": 0}
    fruit_type_counts: dict[str, int] = {}

    for doc in docs:
        data = doc.to_dict()
        total_inspections += 1
        total_fruits += data.get("fruit_count", 0)

        for result in data.get("results", []):
            quality = result.get("quality", "Unknown")
            if quality in quality_counts:
                quality_counts[quality] += 1

            fruit_type = result.get("fruit_type", "Unknown")
            fruit_type_counts[fruit_type] = fruit_type_counts.get(fruit_type, 0) + 1

    most_common = (
        max(fruit_type_counts, key=fruit_type_counts.get)
        if fruit_type_counts
        else None
    )

    return {
        "total_inspections": total_inspections,
        "total_fruits_counted": total_fruits,
        "quality_summary": {
            "healthy": quality_counts["Healthy"],
            "damaged": quality_counts["Damaged"],
            "rotten": quality_counts["Rotten"],
        },
        "most_common_fruit": most_common,
        "message": (
            "Analytics will be available once inspections are recorded."
            if total_inspections == 0
            else "Analytics summary retrieved successfully."
        ),
    }
