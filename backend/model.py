import tensorflow as tf
import numpy as np
from preprocessing import focus_and_features


MODEL_PATH = "models/orange_hybrid_mobilenetv3_color.keras"
MEAN_PATH = "models/color_mean.npy"
STD_PATH = "models/color_std.npy"
CLASS_PATH = "models/class_names.txt"


print("Loading orange fruit model...")

model = tf.keras.models.load_model(MODEL_PATH)

mu = np.load(MEAN_PATH)
sd = np.load(STD_PATH)

with open(CLASS_PATH, "r") as f:
    CLASSES = [line.strip() for line in f if line.strip()]

print("✅ Model loaded!")
print("Classes:", CLASSES)


def predict_image(image_array):

    # Same preprocessing used during training
    crop, features = focus_and_features(image_array)

    # Normalize color features
    features = ((features - mu) / sd).astype(np.float32)

    # Prepare inputs
    image_input = crop.astype(np.float32)[None]
    color_input = features[None]

    # Prediction
    probabilities = model.predict(
        {
            "image": image_input,
            "color": color_input
        },
        verbose=0
    )[0]

    predicted_index = int(np.argmax(probabilities))

    predicted_class = CLASSES[predicted_index]

    confidence = float(
        probabilities[predicted_index]
    )

    # All probabilities
    scores = {
        class_name: float(probability)
        for class_name, probability in zip(
            CLASSES,
            probabilities
        )
    }

    return {
        "prediction": predicted_class,
        "confidence": confidence,
        "scores": scores
    }