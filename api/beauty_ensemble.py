"""
Ensemble Beauty Prediction Module

This module provides functions for making ensemble predictions using both
the SCUT-FBP5500 and MEBeauty models. It handles preprocessing of images
for each model and combines predictions with appropriate weighting.

Usage:
    from beauty_ensemble import predict_beauty_ensemble

    # For a file path
    score = predict_beauty_ensemble('/path/to/image.jpg')

    # For an image loaded with PIL
    from PIL import Image
    img = Image.open('/path/to/image.jpg')
    score = predict_beauty_ensemble(img)

    # For a numpy array
    import numpy as np
    img_array = np.array(...)  # Your image as numpy array
    score = predict_beauty_ensemble(img_array)
"""

import os
import logging
import numpy as np
import tensorflow as tf
from PIL import Image
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
SCUT_MODEL_PATH = os.path.join(MODELS_DIR, "beauty_model_scut_resnet50.tflite")
MEBEAUTY_MODEL_PATH = os.path.join(MODELS_DIR, "beauty_model_mebeauty_resnet50.tflite")


# Load models
def load_tflite_model(model_path):
    """Load a TFLite model and return an interpreter"""
    try:
        # Load the TFLite model and allocate tensors
        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()
        return interpreter
    except Exception as e:
        logger.error(f"Error loading TFLite model from {model_path}: {e}")
        logger.error(traceback.format_exc())
        return None


# Global model instances (loaded on first use)
scut_interpreter = None
mebeauty_interpreter = None


def get_scut_model():
    """Get the SCUT model interpreter, loading it if needed"""
    global scut_interpreter
    if scut_interpreter is None:
        scut_interpreter = load_tflite_model(SCUT_MODEL_PATH)
    return scut_interpreter


def get_mebeauty_model():
    """Get the MEBeauty model interpreter, loading it if needed"""
    global mebeauty_interpreter
    if mebeauty_interpreter is None:
        mebeauty_interpreter = load_tflite_model(MEBEAUTY_MODEL_PATH)
    return mebeauty_interpreter


def preprocess_for_scut(image, target_size=(224, 224)):
    """
    Preprocess an image for the SCUT model (ResNet50).

    Args:
        image: PIL.Image, numpy array, or path to image file
        target_size: Tuple of (height, width) to resize image to

    Returns:
        Preprocessed image as numpy array ready for inference
    """
    try:
        # Convert to PIL Image if a file path or numpy array
        if isinstance(image, str):
            image = Image.open(image)
        elif isinstance(image, np.ndarray):
            image = Image.fromarray(image)

        # Resize the image
        image = image.resize(target_size)

        # Convert to RGB if needed (in case of RGBA or grayscale)
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Convert to numpy array and expand dims for batch
        img_array = np.array(image).astype(np.float32)

        # Apply ResNet50 preprocessing
        img_array = tf.keras.applications.resnet50.preprocess_input(img_array)

        # Add batch dimension if needed
        if len(img_array.shape) == 3:
            img_array = np.expand_dims(img_array, axis=0)

        return img_array

    except Exception as e:
        logger.error(f"Error preprocessing image for SCUT model: {e}")
        logger.error(traceback.format_exc())
        return None


def preprocess_for_mebeauty(image, target_size=(224, 224)):
    """
    Preprocess an image for the MEBeauty model (ResNet50).

    Args:
        image: PIL.Image, numpy array, or path to image file
        target_size: Tuple of (height, width) to resize image to

    Returns:
        Preprocessed image as numpy array ready for inference
    """
    try:
        # Convert to PIL Image if a file path or numpy array
        if isinstance(image, str):
            image = Image.open(image)
        elif isinstance(image, np.ndarray):
            image = Image.fromarray(image)

        # Resize the image
        image = image.resize(target_size)

        # Convert to RGB if needed (in case of RGBA or grayscale)
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Convert to numpy array and expand dims for batch
        img_array = np.array(image).astype(np.float32)

        # Apply ResNet50 preprocessing
        img_array = tf.keras.applications.resnet50.preprocess_input(img_array)

        # Add batch dimension if needed
        if len(img_array.shape) == 3:
            img_array = np.expand_dims(img_array, axis=0)

        return img_array

    except Exception as e:
        logger.error(f"Error preprocessing image for MEBeauty model: {e}")
        logger.error(traceback.format_exc())
        return None


def predict_with_tflite(interpreter, preprocessed_image):
    """
    Make prediction with a TFLite model

    Args:
        interpreter: TFLite interpreter
        preprocessed_image: Preprocessed image as numpy array

    Returns:
        Prediction value
    """
    try:
        # Get input and output tensors
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        # Check if the input shape matches
        input_shape = input_details[0]["shape"]
        if preprocessed_image.shape[1:3] != tuple(input_shape[1:3]):
            logger.warning(
                f"Input shape mismatch: {preprocessed_image.shape} vs {input_shape}"
            )
            # Resize to match if needed
            preprocessed_image = tf.image.resize(
                preprocessed_image, (input_shape[1], input_shape[2])
            ).numpy()

        # Set the input tensor
        interpreter.set_tensor(input_details[0]["index"], preprocessed_image)

        # Run inference
        interpreter.invoke()

        # Get the output tensor
        output_data = interpreter.get_tensor(output_details[0]["index"])

        # Return the prediction (assuming single value for beauty score)
        return float(output_data[0][0])

    except Exception as e:
        logger.error(f"Error predicting with TFLite model: {e}")
        logger.error(traceback.format_exc())
        return None


def predict_beauty_ensemble(image, scut_weight=0.5, mebeauty_weight=0.5):
    """
    Make an ensemble prediction using both SCUT and MEBeauty models

    Args:
        image: PIL.Image, numpy array, or path to image file
        scut_weight: Weight to give the SCUT model prediction (0-1)
        mebeauty_weight: Weight to give the MEBeauty model prediction (0-1)

    Returns:
        Dictionary with ensemble score and individual model scores
    """
    result = {
        "ensemble_score": None,
        "scut_score": None,
        "mebeauty_score": None,
        "error": None,
    }

    try:
        # Adjust weights to ensure they sum to 1
        total_weight = scut_weight + mebeauty_weight
        if total_weight != 1.0:
            scut_weight = scut_weight / total_weight
            mebeauty_weight = mebeauty_weight / total_weight

        # Get models
        scut_model = get_scut_model()
        mebeauty_model = get_mebeauty_model()

        if scut_model is None or mebeauty_model is None:
            result["error"] = "Failed to load one or both models"
            return result

        # Preprocess image for each model
        scut_img = preprocess_for_scut(image)
        mebeauty_img = preprocess_for_mebeauty(image)

        if scut_img is None or mebeauty_img is None:
            result["error"] = "Failed to preprocess image for one or both models"
            return result

        # Make predictions
        scut_score = predict_with_tflite(scut_model, scut_img)
        mebeauty_score = predict_with_tflite(mebeauty_model, mebeauty_img)

        # Store individual scores
        result["scut_score"] = scut_score
        result["mebeauty_score"] = mebeauty_score

        # Calculate ensemble score if both predictions were successful
        if scut_score is not None and mebeauty_score is not None:
            # Both models use a 1-5 scale, so we can average directly
            result["ensemble_score"] = (scut_weight * scut_score) + (
                mebeauty_weight * mebeauty_score
            )
        else:
            if scut_score is not None:
                # Fall back to just SCUT if MEBeauty failed
                result["ensemble_score"] = scut_score
                result["error"] = "MEBeauty model prediction failed, using only SCUT"
            elif mebeauty_score is not None:
                # Fall back to just MEBeauty if SCUT failed
                result["ensemble_score"] = mebeauty_score
                result["error"] = "SCUT model prediction failed, using only MEBeauty"
            else:
                result["error"] = "Both model predictions failed"

    except Exception as e:
        result["error"] = f"Error in ensemble prediction: {str(e)}"
        logger.error(result["error"])
        logger.error(traceback.format_exc())

    return result


# Simple test function
def test_ensemble(image_path):
    """Test the ensemble prediction on a sample image"""
    logger.info(f"Testing ensemble prediction on {image_path}...")
    result = predict_beauty_ensemble(image_path)

    if result["error"]:
        logger.error(f"Ensemble prediction error: {result['error']}")
    else:
        logger.info(f"SCUT score: {result['scut_score']:.2f}")
        logger.info(f"MEBeauty score: {result['mebeauty_score']:.2f}")
        logger.info(f"Ensemble score: {result['ensemble_score']:.2f}")

    return result


# If run directly, test on a sample image
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test ensemble beauty prediction")
    parser.add_argument("image_path", help="Path to test image")
    parser.add_argument(
        "--scut-weight", type=float, default=0.5, help="Weight for SCUT model (0-1)"
    )
    parser.add_argument(
        "--mebeauty-weight",
        type=float,
        default=0.5,
        help="Weight for MEBeauty model (0-1)",
    )

    args = parser.parse_args()

    result = predict_beauty_ensemble(
        args.image_path,
        scut_weight=args.scut_weight,
        mebeauty_weight=args.mebeauty_weight,
    )

    print("\nEnsemble Beauty Prediction Results:")
    print("-" * 40)

    if result["error"]:
        print(f"Error: {result['error']}")
    else:
        print(f"SCUT score:      {result['scut_score']:.2f}")
        print(f"MEBeauty score:  {result['mebeauty_score']:.2f}")
        print(f"Ensemble score:  {result['ensemble_score']:.2f}")
        print(
            f"Used weights:    SCUT={args.scut_weight:.2f}, MEBeauty={args.mebeauty_weight:.2f}"
        )
