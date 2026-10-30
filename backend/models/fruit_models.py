"""
FruitQualityAI — Pydantic Data Models
=======================================
Defines the shape of data flowing through the API:
request bodies, response bodies, and Firestore documents.

These models are used for:
- Validating incoming request data
- Shaping outgoing response data
- Documenting the API (visible in /docs)
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class QualityLabel(str, Enum):
    """Possible quality classification labels for a fruit."""
    HEALTHY = "Healthy"
    DAMAGED = "Damaged"
    ROTTEN = "Rotten"
    UNKNOWN = "Unknown"


# ---------------------------------------------------------------------------
# Fruit Analysis Result
# Returned by the AI service after processing an image.
# ---------------------------------------------------------------------------

class FruitResult(BaseModel):
    """Result of analyzing a single fruit in an image."""
    fruit_type: str = Field(..., description="Detected fruit variety (e.g. Apple, Mango)")
    quality: QualityLabel = Field(..., description="Quality classification label")
    confidence: Optional[float] = Field(
        None, ge=0.0, le=1.0,
        description="Model confidence score (0.0 to 1.0). Null if model not loaded."
    )


class InspectionResponse(BaseModel):
    """
    Response returned to the frontend after an image is submitted for inspection.
    Populated only when the AI model is integrated.
    """
    inspection_id: str = Field(..., description="Unique ID of the saved inspection record")
    fruit_count: int = Field(..., description="Number of fruits detected in the image")
    results: list[FruitResult] = Field(
        default_factory=list,
        description="Per-fruit analysis results. Empty until AI model is connected."
    )
    image_url: Optional[str] = Field(None, description="URL of the uploaded image (if stored)")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    model_loaded: bool = Field(
        False,
        description="Whether the AI model was available during this inspection."
    )
    message: str = Field(
        "AI model not yet integrated.",
        description="Status message for the frontend to display."
    )


# ---------------------------------------------------------------------------
# Inspection History Record
# Structure of a document stored in Firestore.
# ---------------------------------------------------------------------------

class InspectionRecord(BaseModel):
    """A single inspection record as stored in Firestore."""
    inspection_id: str
    fruit_count: int
    results: list[FruitResult]
    image_url: Optional[str] = None
    timestamp: datetime
    model_loaded: bool
    notes: Optional[str] = Field(None, description="Optional user notes for this inspection")


# ---------------------------------------------------------------------------
# Analytics Summary
# Aggregated statistics returned by the analytics endpoint.
# ---------------------------------------------------------------------------

class QualitySummary(BaseModel):
    """Count of each quality label across all inspections."""
    healthy: int = 0
    damaged: int = 0
    rotten: int = 0


class AnalyticsSummary(BaseModel):
    """High-level analytics summary returned to the dashboard."""
    total_inspections: int = 0
    total_fruits_counted: int = 0
    quality_summary: QualitySummary = Field(default_factory=QualitySummary)
    most_common_fruit: Optional[str] = None
    message: str = "Analytics will be available once inspections are recorded."
