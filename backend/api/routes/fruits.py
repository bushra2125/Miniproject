"""
FruitQualityAI — Fruits API Router
=====================================
Handles endpoints related to image submission and fruit inspection.

Endpoints:
    POST /api/fruits/analyze   — Upload an image for AI analysis
    GET  /api/fruits/status    — Check if the AI model is loaded and ready
"""

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from services import ai_service
from services.firebase_service import save_inspection

router = APIRouter()


@router.get("/status")
async def model_status():
    """
    Check whether the AI model is loaded and ready for inference.
    Use this from the frontend to show a 'Model Ready' / 'Model Not Available' badge.
    """
    loaded = ai_service.is_model_loaded()
    return {
        "model_loaded": loaded,
        "message": (
            "AI model is ready for inference."
            if loaded
            else (
                "AI model is not loaded. "
                "Add your trained model to backend/ml_models/ "
                "and update MODEL_PATH in .env."
            )
        ),
    }


@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_fruit_image(file: UploadFile = File(...)):
    allowed_types = {"image/jpeg", "image/png", "image/webp"}

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}",
        )

    image_bytes = await file.read()
    result = ai_service.analyze_image(image_bytes)

    if result.get("model_loaded") and result.get("results"):
        try:
            inspection_data = {
                "fruit_count": result["fruit_count"],
                "results": result["results"],
                "image_url": None,
                "model_loaded": result["model_loaded"],
                "notes": "Orange quality classification",
            }

            inspection_id = save_inspection(inspection_data)
            result["inspection_id"] = inspection_id
            result["saved_to_firestore"] = True

        except Exception as exc:
            print(f"[Firestore] Failed to save inspection: {exc}")
            result["saved_to_firestore"] = False
            result["database_message"] = (
                "Prediction succeeded, but saving failed."
            )

    return result