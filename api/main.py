from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import os
import json
from typing import Optional
import logging
import cv2
import tensorflow as tf
from beauty_ensemble import predict_beauty_ensemble

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
IMG_SIZE = (224, 224)

# Initialize models
beauty_model = None


# Load the trained beauty prediction model
def load_beauty_model():
    """Load the trained beauty prediction model from file or create a fallback model"""
    global beauty_model

    try:
        model_path = os.path.join(
            os.path.dirname(__file__), "models", "beauty_model_scut_resnet50.h5"
        )

        if not os.path.exists(model_path):
            logger.warning(f"Trained beauty model not found at: {model_path}")
            # Fall back to creating an untrained model
            return create_untrained_beauty_model()

        logger.info(f"Loading trained beauty model from: {model_path}")
        beauty_model = tf.keras.models.load_model(model_path)
        logger.info("Trained beauty model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Error loading trained beauty model: {str(e)}")
        # Fall back to creating an untrained model
        logger.info("Falling back to untrained model")
        return create_untrained_beauty_model()


# Create a fallback beauty prediction model using ResNet50
def create_untrained_beauty_model():
    """Create a fallback beauty prediction model using ResNet50 without pre-trained weights"""
    global beauty_model

    try:
        logger.info(
            "Creating fallback beauty prediction model with ResNet50 (no pre-trained weights)"
        )

        # Base ResNet50 model without pre-trained weights to avoid downloading
        base_model = tf.keras.applications.ResNet50(
            weights=None, include_top=False, input_shape=(*IMG_SIZE, 3)
        )

        # Add custom top layers similar to trained model
        x = base_model.output
        x = tf.keras.layers.GlobalAveragePooling2D()(x)
        x = tf.keras.layers.Dense(512, activation="relu")(x)
        x = tf.keras.layers.Dropout(0.5)(x)
        x = tf.keras.layers.Dense(128, activation="relu")(x)
        x = tf.keras.layers.Dropout(0.3)(x)
        predictions = tf.keras.layers.Dense(1, activation="linear")(x)

        # Create model
        beauty_model = tf.keras.models.Model(
            inputs=base_model.input, outputs=predictions
        )

        # Compile model with appropriate optimizer and loss
        beauty_model.compile(optimizer="adam", loss="mse")

        logger.info("Fallback beauty model created successfully")
        return True
    except Exception as e:
        logger.error(f"Error creating beauty model: {str(e)}")
        return False


# Load models during initialization
def load_models():
    load_beauty_model()


# Call load_models during startup
load_models()

# Initialize FastAPI app
app = FastAPI(
    title="LooxMaxx API", description="AI-Powered Attractiveness Analyzer API"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, change to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models
class ImageRequest(BaseModel):
    image_data: str  # Base64-encoded image


class AnalysisResponse(BaseModel):
    score: float
    processing_time: float


# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to LooxMaxx API"}


def preprocess_for_beauty_model(image_path):
    """
    Preprocess an image for the beauty prediction model

    Args:
        image_path: Path to the image

    Returns:
        Preprocessed image suitable for the beauty model
    """
    try:
        # Load image and resize to standard size for ResNet50
        img = tf.keras.preprocessing.image.load_img(image_path, target_size=IMG_SIZE)

        # Convert to array
        img_array = tf.keras.preprocessing.image.img_to_array(img)

        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)

        # Apply ResNet50 preprocessing
        img_array = tf.keras.applications.resnet50.preprocess_input(img_array)

        logger.info(
            "Image preprocessed successfully for beauty model using ResNet50 preprocessing"
        )
        return img_array
    except Exception as e:
        logger.error(f"Error preprocessing image for beauty model: {str(e)}")
        raise


def predict_beauty_score(image_path):
    """
    Predict beauty score using our beauty prediction model

    Args:
        image_path: Path to the preprocessed face image

    Returns:
        Predicted beauty score (1-5 scale)
    """
    global beauty_model

    try:
        # Check if model is created
        if beauty_model is None:
            logger.warning("Beauty model not loaded, attempting to load now")
            if not load_beauty_model():
                raise Exception("Beauty model loading failed")

        # Preprocess image
        preprocessed_img = preprocess_for_beauty_model(image_path)

        # Make prediction
        raw_prediction = beauty_model.predict(preprocessed_img)

        # Process the model prediction
        # Get the raw prediction value
        raw_score = float(raw_prediction[0][0])

        # The trained model should output values in the 1-5 range,
        # but we'll clamp them just to be safe
        normalized_score = min(max(raw_score, 1.0), 5.0)
        normalized_score = round(normalized_score, 1)

        logger.info(f"Beauty prediction: {normalized_score:.1f} / 5.0")
        return normalized_score
    except Exception as e:
        logger.error(f"Error during beauty prediction: {str(e)}")
        raise


def preprocess_image(image_path):
    """
    Preprocess an image to enhance face detection accuracy.
    - Adjusts brightness and contrast
    - Applies light sharpening
    - Maintains image quality

    Args:
        image_path: Path to the image to preprocess

    Returns:
        Path to the preprocessed image
    """
    logger.info("Preprocessing image for enhanced face detection")
    try:
        # Open the image
        img = Image.open(image_path)

        # Enhance contrast slightly (1.2 = 20% increase)
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.2)

        # Enhance brightness if the image is too dark
        # Calculate average brightness
        brightness = np.mean(np.array(img))
        if brightness < 100:  # Threshold for dark images
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(1.3)  # Increase brightness by 30%
            logger.info(
                f"Enhanced brightness for dark image (avg brightness: {brightness:.1f})"
            )

        # Apply light sharpening for better facial features
        img = img.filter(ImageFilter.SHARPEN)

        # Save the preprocessed image
        preprocessed_path = f"{os.path.splitext(image_path)[0]}_preprocessed.jpg"
        img.save(preprocessed_path, quality=95)  # Save with high quality

        logger.info("Image preprocessing completed successfully")
        return preprocessed_path
    except Exception as e:
        logger.error(f"Error during image preprocessing: {str(e)}")
        # If preprocessing fails, return the original image path
        return image_path


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(image_request: ImageRequest):
    temp_path = None
    preprocessed_path = None

    try:
        # Parse the base64 image
        image_data = image_request.image_data
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]

        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Save temporarily
        temp_path = "temp_image.jpg"
        image.save(temp_path)

        # Preprocess the image to enhance face detection
        preprocessed_path = preprocess_image(temp_path)

        import time

        start_time = time.time()
        logger.info("Starting face analysis")

        # Try our beauty model first
        try:
            logger.info("Attempting beauty model analysis")
            beauty_score = predict_beauty_score(preprocessed_path)
            logger.info(f"Beauty model score: {beauty_score}")

            # Use the beauty model score directly
            score = beauty_score
            logger.info("Beauty model analysis successful")
        except Exception as beauty_model_error:
            # If beauty model fails, fall back to DeepFace
            logger.warning(f"Beauty model analysis failed: {str(beauty_model_error)}")
            logger.info("Falling back to DeepFace analysis")

            # Import here to avoid initial loading delay
            from deepface import DeepFace

            # Analyze attractiveness with enhanced detection
            try:
                # Attempt with RetinaFace first (most accurate but may fail on certain images)
                try:
                    logger.info("Attempting analysis with RetinaFace detector")
                    analysis = DeepFace.analyze(
                        img_path=preprocessed_path,  # Use preprocessed image
                        actions=["age", "gender", "race", "emotion"],
                        detector_backend="retinaface",  # Use RetinaFace for better accuracy
                        enforce_detection=True,
                        align=True,  # Add face alignment preprocessing
                    )
                    logger.info("RetinaFace detection successful")
                except Exception as retinaface_error:
                    # If RetinaFace fails, try MTCNN as fallback
                    logger.warning(
                        f"RetinaFace detection failed: {str(retinaface_error)}"
                    )
                    logger.info("Falling back to MTCNN detector")
                    try:
                        analysis = DeepFace.analyze(
                            img_path=preprocessed_path,  # Use preprocessed image
                            actions=["age", "gender", "race", "emotion"],
                            detector_backend="mtcnn",  # Try MTCNN as fallback
                            enforce_detection=True,
                            align=True,
                        )
                        logger.info("MTCNN detection successful")
                    except Exception as mtcnn_error:
                        # If MTCNN also fails, try with default detector and disable enforce_detection
                        logger.warning(f"MTCNN detection failed: {str(mtcnn_error)}")
                        logger.info(
                            "Falling back to default detector without enforcement"
                        )
                        analysis = DeepFace.analyze(
                            img_path=preprocessed_path,  # Use preprocessed image
                            actions=["age", "gender", "race", "emotion"],
                            enforce_detection=False,  # Last resort: don't enforce detection
                        )
                        logger.info("Analysis completed with default detector")

                # Get first result if multiple faces detected
                if isinstance(analysis, list):
                    logger.info(
                        f"Multiple faces detected, using first face out of {len(analysis)}"
                    )
                    analysis = analysis[0]

                # Calculate attractiveness score using DeepFace results
                score = calculate_attractiveness_score(analysis)
                logger.info(f"DeepFace score calculation complete: {score}")

            except Exception as e:
                logger.error(f"DeepFace analysis error: {str(e)}")
                raise HTTPException(
                    status_code=422, detail=f"Face analysis failed: {str(e)}"
                )

        finally:
            # Clean up
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            if (
                preprocessed_path
                and os.path.exists(preprocessed_path)
                and preprocessed_path != temp_path
            ):
                os.remove(preprocessed_path)

        processing_time = time.time() - start_time
        logger.info(f"Analysis completed in {processing_time:.2f} seconds")

        return {"score": score, "processing_time": processing_time}

    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


def calculate_attractiveness_score(analysis):
    """
    Calculate an attractiveness score based on DeepFace analysis results.
    This is an enhanced algorithm that considers multiple facial attributes.
    """
    # Extract relevant features
    age = analysis.get("age", 30)
    gender = analysis.get("gender", None)

    # Get dominant emotion and its value
    emotions = analysis.get("emotion", {})
    dominant_emotion = (
        max(emotions.items(), key=lambda x: x[1]) if emotions else ("neutral", 0)
    )
    emotion_confidence = dominant_emotion[1]

    # Get race data
    race = analysis.get("race", {})
    dominant_race = max(race.items(), key=lambda x: x[1])[0] if race else None

    # Start with a base score
    base_score = 50

    # Age factor - creates a bell curve with peak around age 27-32
    if age <= 15:
        # Below 15 years gets a fixed score to avoid inappropriate ratings
        age_factor = 0
    elif 16 <= age <= 40:
        # Peak range with gradual falloff on both sides
        peak_age = 29
        age_factor = 30 * (1 - (abs(age - peak_age) / 25) ** 2)
    else:
        # Older ages with more gradual decline
        age_factor = 30 * max(0, (1 - (age - 40) / 60))

    # Emotion factor - positive emotions contribute more
    emotion_scores = {
        "happy": 25,  # Happiness strongly positively correlated with attractiveness perception
        "neutral": 15,  # Neutral expression moderately positive
        "surprise": 10,  # Surprise slightly positive
        "sad": 0,  # Negative emotions don't contribute positively
        "angry": -5,  # Anger can negatively impact perceived attractiveness
        "disgust": -5,  # Disgust can negatively impact perceived attractiveness
        "fear": -2,  # Fear slightly negative
    }

    # Weight by confidence of emotion detection
    emotion_factor = emotion_scores.get(dominant_emotion[0], 0) * (
        emotion_confidence / 100
    )

    # Gender-specific adjustments (minimal to avoid bias)
    # These are small adjustments based on research showing gender differences in facial preference
    gender_factor = 0
    if gender == "Woman":
        # Research shows symmetry and averageness slightly more important for female faces
        gender_factor = 2
    elif gender == "Man":
        # Research shows stronger jawlines slightly more preferred for male faces
        gender_factor = 2

    # Combine all factors with appropriate weighting
    raw_score = base_score + age_factor + emotion_factor + gender_factor

    # Normalize to 0-100 range with soft bounds
    final_score = min(max(raw_score, 0), 100)

    # Convert 0-100 scale to 1-5 scale for consistency with beauty model
    normalized_score = 1 + (final_score / 25)

    # Round to 1 decimal place
    normalized_score = round(normalized_score, 1)

    # Log scoring breakdown for debugging
    logger.debug(
        f"Score breakdown - Base: {base_score}, Age({age}): {age_factor}, "
        + f"Emotion({dominant_emotion[0]}): {emotion_factor}, Gender({gender}): {gender_factor}"
    )

    return normalized_score


@app.route("/api/predict-beauty-ensemble", methods=["POST"])
def predict_beauty_ensemble_api():
    """API endpoint for ensemble beauty prediction using both SCUT and MEBeauty models"""
    if "file" not in request.files:
        return jsonify({"error": "No file part"})

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"})

    # Check weights (optional parameters)
    scut_weight = float(request.form.get("scut_weight", 0.5))
    mebeauty_weight = float(request.form.get("mebeauty_weight", 0.5))

    try:
        # Create temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        file_path = temp_file.name
        file.save(file_path)

        # Use ensemble prediction function
        result = predict_beauty_ensemble(
            file_path, scut_weight=scut_weight, mebeauty_weight=mebeauty_weight
        )

        # Clean up
        temp_file.close()
        os.unlink(file_path)

        # Return result
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in ensemble beauty prediction: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)})


# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
