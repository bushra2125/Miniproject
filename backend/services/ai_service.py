
"""
FruitQualityAI - Orange Quality Classification Service
"""

from pathlib import Path
import io

import numpy as np
import tensorflow as tf
from PIL import Image

from preprocessing import focus_and_features


# Paths are resolved relative to the backend folder.
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "orange_hybrid_mobilenetv3_color.keras"
MEAN_PATH = MODEL_DIR / "color_mean.npy"
STD_PATH = MODEL_DIR / "color_std.npy"
CLASS_PATH = MODEL_DIR / "class_names.txt"

_model = None
_color_mean = None
_color_std = None
_classes = []
_model_loaded = False


def load_model() -> bool:
    """Load the trained orange classifier and its preprocessing data."""
    global _model, _color_mean, _color_std, _classes, _model_loaded

    _model_loaded = False

    try:
        required_files = [
            MODEL_PATH,
            MEAN_PATH,
            STD_PATH,
            CLASS_PATH,
        ]

        missing = [str(path) for path in required_files if not path.is_file()]
        if missing:
            print(f"[AI Service] Missing model files: {missing}")
            return False

        _model = tf.keras.models.load_model(str(MODEL_PATH))
        _color_mean = np.load(MEAN_PATH).astype(np.float32)
        _color_std = np.load(STD_PATH).astype(np.float32)

        _color_std = np.where(_color_std == 0, 1.0, _color_std)

        _classes = [
            line.strip()
            for line in CLASS_PATH.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]

        if not _classes:
            raise ValueError("No class names were found.")

        _model_loaded = True
        print(f"[AI Service] Orange model loaded. Classes: {_classes}")
        return True

    except Exception as exc:
        _model = None
        _color_mean = None
        _color_std = None
        _classes = []
        print(f"[AI Service] Model loading failed: {exc}")
        return False


def is_model_loaded() -> bool:
    """Return whether the trained model is ready."""
    return _model_loaded


def analyze_image(image_bytes: bytes) -> dict:
    """Classify one uploaded orange image using the trained model."""

    if not _model_loaded:
        return {
            "model_loaded": False,
            "fruit_count": 0,
            "results": [],
            "message": "The orange classification model is not loaded.",
        }

    try:
        # Decode the upload as RGB.
        with Image.open(io.BytesIO(image_bytes)) as image:
            image = image.convert("RGB")
            image_array = np.asarray(image)

        # Use the exact preprocessing function used by the original model.
        crop, features = focus_and_features(image_array)

        features = np.asarray(features, dtype=np.float32)
        features = (features - _color_mean) / _color_std

        image_input = crop.astype(np.float32)[None, ...]
        color_input = features[None, ...]

        probabilities = _model.predict(
            {"image": image_input, "color": color_input},
            verbose=0,
        )[0]

        if len(probabilities) != len(_classes):
            raise ValueError(
                "Model output count does not match the class-name count."
            )

        index = int(np.argmax(probabilities))
        predicted_class = _classes[index]
        confidence = float(probabilities[index])

        scores = {
            name: float(score)
            for name, score in zip(_classes, probabilities)
        }

        return {
            "model_loaded": True,
            "fruit_count": 1,
            "results": [
                {
                    "fruit_type": "Orange",
                    "quality": predicted_class.title(),
                    "confidence": confidence,
                    "scores": scores,
                }
            ],
            "message": (
                "Orange quality classification complete. "
                "This model classifies one image; it does not detect "
                "or count multiple fruits."
            ),
        }

    except Exception as exc:
        print(f"[AI Service] Image analysis failed: {exc}")
        return {
            "model_loaded": True,
            "fruit_count": 0,
            "results": [],
            "message": f"Image analysis failed: {exc}",
        }
