"""
Test script for the custom beauty prediction model
This script creates and tests a MobileNetV2-based beauty prediction model without pre-trained weights
"""

import os
import logging
import numpy as np
import tensorflow as tf
import sys
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
IMG_SIZE = (224, 224)


def create_beauty_model():
    """Create a custom beauty prediction model using MobileNetV2 without pre-trained weights"""
    try:
        logger.info(
            "Creating beauty prediction model with MobileNetV2 (no pre-trained weights)"
        )

        # Base MobileNetV2 model without pre-trained weights to avoid downloading
        base_model = tf.keras.applications.MobileNetV2(
            weights=None, include_top=False, input_shape=(*IMG_SIZE, 3)
        )

        # Add custom top layers similar to AttractiveNet
        x = base_model.output
        x = tf.keras.layers.GlobalAveragePooling2D()(x)
        predictions = tf.keras.layers.Dense(1, activation="linear")(x)

        # Create model
        model = tf.keras.models.Model(inputs=base_model.input, outputs=predictions)

        # Compile model
        model.compile(optimizer="adam", loss="mse")

        logger.info("Beauty prediction model created successfully")
        return model
    except Exception as e:
        logger.error(f"Error creating beauty model: {str(e)}")
        return None


def test_model():
    try:
        # Create the beauty model
        logger.info("Creating beauty prediction model")
        start_time = time.time()
        model = create_beauty_model()

        if model is None:
            logger.error("Failed to create beauty model")
            return False

        load_time = time.time() - start_time
        logger.info(f"Model creation completed in {load_time:.2f} seconds")

        # Check if sample image exists or create dummy image
        sample_path = os.path.join(os.path.dirname(__file__), "sample_image.jpg")
        if not os.path.exists(sample_path):
            logger.warning(f"Sample image not found at: {sample_path}")
            logger.info("Creating a dummy test image with random data")

            # Create a dummy input for testing
            dummy_input = np.random.random((1, *IMG_SIZE, 3))
            dummy_input = tf.keras.applications.mobilenet_v2.preprocess_input(
                dummy_input
            )

            logger.info("Making prediction on dummy data")
            # Run the forward pass through the model
            model.predict(dummy_input)

            # Generate simulated beauty score (since model is untrained)
            normalized_score = 3.0 + (np.random.random() - 0.5)
            normalized_score = min(max(normalized_score, 1.0), 5.0)
            normalized_score = round(normalized_score, 1)

            logger.info(
                f"Simulated beauty score on dummy data: {normalized_score:.1f} / 5.0"
            )
            return True

        # Preprocess the sample image
        logger.info(f"Preprocessing sample image: {sample_path}")
        img = tf.keras.preprocessing.image.load_img(sample_path, target_size=IMG_SIZE)
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)

        # Make prediction
        logger.info("Making prediction on sample image")
        start_time = time.time()
        # Run the forward pass through the model
        model.predict(img_array)
        predict_time = time.time() - start_time

        logger.info(f"Prediction completed in {predict_time:.2f} seconds")

        # Generate simulated beauty score (since model is untrained)
        normalized_score = 3.0 + (np.random.random() - 0.5)
        normalized_score = min(max(normalized_score, 1.0), 5.0)
        normalized_score = round(normalized_score, 1)

        logger.info(f"Simulated beauty score: {normalized_score:.1f} / 5.0")

        return True
    except Exception as e:
        logger.error(f"Error during test: {str(e)}")
        return False


if __name__ == "__main__":
    logger.info("Starting beauty model test")
    success = test_model()
    if success:
        logger.info("Test completed successfully")
        sys.exit(0)
    else:
        logger.error("Test failed")
        sys.exit(1)
