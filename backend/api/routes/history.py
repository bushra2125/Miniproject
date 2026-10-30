"""
FruitQualityAI — History API Router
======================================
Handles endpoints for retrieving past inspection records from Firestore.

Endpoints:
    GET /api/history/             — List recent inspections
    GET /api/history/{id}         — Get a single inspection by ID
"""

from fastapi import APIRouter, HTTPException, Query, status

from services import firebase_service

router = APIRouter()


@router.get("/")
async def list_inspections(limit: int = Query(default=50, ge=1, le=200)):
    """
    Return a list of the most recent inspection records from Firestore.

    Query params:
        limit (int): Number of records to return. Default 50, max 200.

    Requires Firebase to be configured (see README → Step 4).
    """
    try:
        records = firebase_service.get_all_inspections(limit=limit)
        return {
            "count": len(records),
            "inspections": records,
        }
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )


@router.get("/{inspection_id}")
async def get_inspection(inspection_id: str):
    """
    Return a single inspection record by its Firestore document ID.

    Requires Firebase to be configured (see README → Step 4).
    """
    try:
        record = firebase_service.get_inspection_by_id(inspection_id)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{inspection_id}' not found.",
        )

    return record
