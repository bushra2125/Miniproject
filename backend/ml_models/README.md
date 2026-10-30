# ml_models/

This folder stores your trained AI model files.

## Files to place here

| Format | Extension | Framework |
|--------|-----------|-----------|
| Keras / TensorFlow | `.h5` | TensorFlow 2.x |
| PyTorch | `.pt` or `.pth` | PyTorch |
| TensorFlow Lite | `.tflite` | TensorFlow Lite (edge devices) |
| ONNX | `.onnx` | Cross-framework |

## How to integrate your model

1. Copy your model file into this folder (e.g. `fruit_classifier.h5`)
2. Update `MODEL_PATH` in `backend/.env`:
   ```
   MODEL_PATH=ml_models/fruit_classifier.h5
   ```
3. Open `backend/services/ai_service.py` and implement the `load_model()` and
   `analyze_image()` functions following the TODO comments inside.

## Why are model files excluded from Git?

Model files are typically hundreds of MB to several GB in size.
They are excluded from Git via `.gitignore` to keep the repository small and fast.
Store your models separately (e.g. Google Drive, Hugging Face Hub, or cloud storage)
and document the download link here.

## Download Link (fill in when available)

> Model download: _not yet published_
