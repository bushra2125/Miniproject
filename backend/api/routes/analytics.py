"""
FruitQualityAI — Analytics API Router
========================================
Handles endpoints for aggregated statistics and quality trend summaries.

Endpoints:
    GET /api/analytics/summary    — Return aggregated counts and quality stats
"""

from fastapi import APIRouter, HTTPException, status

from services import firebase_service

router = APIRouter()


@router.get("/summary")
async def analytics_summary():
    """
    Return a summary of all inspections stored in Firestore.

    Includes:
        - Total number of inspections
        - Total fruits counted
        - Breakdown of Healthy / Damaged / Rotten counts
        - Most commonly detected fruit type

    Requires Firebase to be configured (see README → Step 4).
    """
    try:
        summary = firebase_service.get_analytics_summary()
        return summary
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
