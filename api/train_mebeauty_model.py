"""
MEBeauty Facial Attractiveness Prediction Model Training Script

This script trains a ResNet50-based model on the MEBeauty dataset
to predict facial beauty scores (1-5 scale) across multiple ethnicities.

Features:
- Uses ResNet50 architecture with pretrained ImageNet weights
- Handles multi-ethnic faces from the MEBeauty dataset
- Includes data augmentation and preprocessing specific to beauty prediction
- Supports hyperparameter optimization to find the best model configuration
- Mixed-precision training for improved performance on modern GPUs
- Creates evaluation metrics and visualizations

Basic usage:
python train_mebeauty_model.py

Hyperparameter optimization:
python train_mebeauty_model.py --optimize-hyperparams --optimization-trials 20

Quick training (for testing):
python train_mebeauty_model.py --quick-train

Full training with specific parameters:
python train_mebeauty_model.py --epochs 50 --batch-size 32 --lr 0.001
"""

import os
import sys
import logging
import time
import json
import datetime
import traceback
import argparse

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split

import tensorflow as tf

# For hyperparameter optimization - import at the top level
try:
    import keras_tuner as kt
except ImportError:
    kt = None
    pass  # Will handle the missing import later when needed

# Suppress TensorFlow warnings
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
logging.getLogger("tensorflow").setLevel(logging.ERROR)

# Configure logging
logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("mebeauty_model_training")

# Configure paths - update to use absolute paths for certainty
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DATASET_DIR = os.path.join(DATA_DIR, "mebeauty")
IMAGES_DIR = os.path.join(
    DATASET_DIR, "cropped_images", "flat"
)  # Updated to use the flat directory
SCORES_DIR = os.path.join(DATASET_DIR, "scores")
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "beauty_model_mebeauty_resnet50.h5")
LOG_DIR = os.path.join(MODELS_DIR, "logs")

# Training parameters
BATCH_SIZE = 16
EPOCHS = 30
LEARNING_RATE = 0.001
IMG_SIZE = (224, 224)

# Global variables
gpus = None  # Will be set in main()


def extract_dataset():
    """
    Check if the MEBeauty dataset exists in the expected location.
    This function verifies path structure and availability of images and score files.
    """
    global IMAGES_DIR, SCORES_DIR

    # Check if the images directory exists
    if not os.path.exists(IMAGES_DIR):
        logger.error(f"Images directory not found at {IMAGES_DIR}")
        return False

    # Check if the scores directory exists
    if not os.path.exists(SCORES_DIR):
        logger.error(f"Scores directory not found at {SCORES_DIR}")
        return False

    # Count the number of image files
    img_count = len(
        [
            f
            for f in os.listdir(IMAGES_DIR)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]
    )

    if img_count == 0:
        logger.error(f"No images found in {IMAGES_DIR}")
        return False

    logger.info(f"Found {img_count} images in the MEBeauty dataset")
    return True


def load_mebeauty_data():
    """
    Load the MEBeauty dataset from files.
    Returns lists of image paths and beauty scores
    """
    try:
        # First, let's check for train/val/test split files according to 60/20/20 ratio
        train_file = os.path.join(SCORES_DIR, "train_2022.txt")
        val_file = os.path.join(SCORES_DIR, "val_2022.txt")
        test_file = os.path.join(SCORES_DIR, "test_2022.txt")

        # Check if the score files exist
        if (
            os.path.exists(train_file)
            and os.path.exists(val_file)
            and os.path.exists(test_file)
        ):
            logger.info("Found train/val/test split files, loading...")

            # Load data from train split - space-separated file with path and score
            train_paths = []
            train_scores = []
            with open(train_file, "r") as f:
                for line in f:
                    parts = line.strip().split(" ")
                    if len(parts) >= 2:
                        # Get just the filename from the path
                        img_name = os.path.basename(parts[0])
                        # Create path to the flattened image
                        img_path = os.path.join(IMAGES_DIR, img_name)
                        # Get the score (last element)
                        score = float(parts[-1])
                        if os.path.exists(img_path):
                            train_paths.append(img_path)
                            train_scores.append(score)

            # Load data from validation split
            val_paths = []
            val_scores = []
            with open(val_file, "r") as f:
                for line in f:
                    parts = line.strip().split(" ")
                    if len(parts) >= 2:
                        img_name = os.path.basename(parts[0])
                        img_path = os.path.join(IMAGES_DIR, img_name)
                        score = float(parts[-1])
                        if os.path.exists(img_path):
                            val_paths.append(img_path)
                            val_scores.append(score)

            # Load data from test split
            test_paths = []
            test_scores = []
            with open(test_file, "r") as f:
                for line in f:
                    parts = line.strip().split(" ")
                    if len(parts) >= 2:
                        img_name = os.path.basename(parts[0])
                        img_path = os.path.join(IMAGES_DIR, img_name)
                        score = float(parts[-1])
                        if os.path.exists(img_path):
                            test_paths.append(img_path)
                            test_scores.append(score)

            logger.info(
                f"Loaded {len(train_paths)} train, {len(val_paths)} validation, {len(test_paths)} test samples"
            )
            return (
                train_paths,
                train_scores,
                val_paths,
                val_scores,
                test_paths,
                test_scores,
            )

        # If split files don't exist, load from generic_scores_all_2022.xlsx
        else:
            logger.info(
                "Train/val/test split files not found, loading from generic scores file..."
            )
            scores_file = os.path.join(SCORES_DIR, "generic_scores_all_2022.xlsx")

            if not os.path.exists(scores_file):
                logger.error(f"Scores file not found at {scores_file}")
                # Try the non-2022 version as fallback
                scores_file = os.path.join(SCORES_DIR, "generic_scores_all.xlsx")
                if not os.path.exists(scores_file):
                    logger.error("No score files found. Cannot continue.")
                    return None

            # Load the scores from the Excel file
            logger.info(f"Loading scores from {scores_file}")
            scores_df = pd.read_excel(scores_file)

            # Display column names to debug
            logger.info(f"Columns in score file: {scores_df.columns.tolist()}")

            # Check if 'image' and 'mean' columns exist
            if "image" not in scores_df.columns or "mean" not in scores_df.columns:
                logger.error(
                    "Expected columns 'image' and 'mean' not found in score file"
                )
                # Try to infer columns based on content
                image_col = None
                score_col = None
                for col in scores_df.columns:
                    # Check if column has string values that look like image paths
                    if scores_df[col].dtype == "object" and any(
                        str(val).endswith((".jpg", ".png", ".jpeg"))
                        for val in scores_df[col].dropna()
                    ):
                        image_col = col
                    # Check if column has numeric values between 1-10
                    elif (
                        scores_df[col].dtype in ["float64", "float32", "int64", "int32"]
                        and scores_df[col].mean() >= 1
                        and scores_df[col].mean() <= 10
                    ):
                        score_col = col

                if image_col and score_col:
                    logger.info(
                        f"Using inferred columns: image={image_col}, score={score_col}"
                    )
                    # Rename to expected column names
                    scores_df = scores_df.rename(
                        columns={image_col: "image", score_col: "mean"}
                    )
                else:
                    logger.error("Could not infer image and score columns from data")
                    return None

            # Get image names and mean scores
            # Use just the filename without any path information
            image_names = [
                os.path.basename(str(img)) for img in scores_df["image"].values
            ]
            scores = scores_df["mean"].values

            # Create full paths to images
            image_paths = [
                os.path.join(IMAGES_DIR, img_name) for img_name in image_names
            ]

            # Check if images exist
            valid_indices = [
                i for i, path in enumerate(image_paths) if os.path.exists(path)
            ]
            valid_paths = [image_paths[i] for i in valid_indices]
            valid_scores = [scores[i] for i in valid_indices]

            logger.info(f"Found {len(valid_paths)} valid images with scores")

            # Split into train, validation, and test sets (60/20/20)
            train_paths, temp_paths, train_scores, temp_scores = train_test_split(
                valid_paths, valid_scores, test_size=0.4, random_state=42
            )

            val_paths, test_paths, val_scores, test_scores = train_test_split(
                temp_paths, temp_scores, test_size=0.5, random_state=42
            )

            logger.info(
                f"Split data into {len(train_paths)} train, {len(val_paths)} validation, {len(test_paths)} test samples"
            )
            return (
                train_paths,
                train_scores,
                val_paths,
                val_scores,
                test_paths,
                test_scores,
            )

    except Exception as e:
        logger.error(f"Error loading MEBeauty dataset: {str(e)}")
        logger.error(traceback.format_exc())
        return None


def prepare_tf_dataset(
    image_paths, scores, batch_size, shuffle=True, augment=False, is_train=True
):
    """
    Create a tf.data.Dataset from image paths and scores

    Args:
        image_paths: List of image file paths
        scores: List of beauty scores
        batch_size: Batch size for the dataset
        shuffle: Whether to shuffle the dataset
        augment: Whether to apply data augmentation
        is_train: Whether this is the training dataset

    Returns:
        tf.data.Dataset object
    """

    def load_and_preprocess(img_path, label):
        # Read and decode the image
        img = tf.io.read_file(img_path)
        img = tf.image.decode_jpeg(img, channels=3)
        img = tf.image.resize(img, IMG_SIZE)

        # Handle preprocessing (using ResNet50 standard preprocessing)
        # Convert RGB to BGR
        img = tf.reverse(img, axis=[-1])
        # Subtract ImageNet mean pixel values
        mean = [103.939, 116.779, 123.68]
        img = img - mean

        return img, label

    def augment_image(img, label):
        # Apply random horizontal flipping
        img = tf.image.random_flip_left_right(img)

        # Apply random brightness adjustment
        img = tf.image.random_brightness(img, max_delta=0.2)

        # Apply random contrast adjustment
        img = tf.image.random_contrast(img, lower=0.8, upper=1.2)

        return img, label

    # Create the base dataset
    dataset = tf.data.Dataset.from_tensor_slices((image_paths, scores))

    # Apply shuffling if requested
    if shuffle:
        dataset = dataset.shuffle(buffer_size=len(image_paths), seed=42)

    # Apply preprocessing to all images
    dataset = dataset.map(load_and_preprocess, num_parallel_calls=tf.data.AUTOTUNE)

    # Apply augmentation if requested (only on training data)
    if augment and is_train:
        dataset = dataset.map(augment_image, num_parallel_calls=tf.data.AUTOTUNE)

    # Batch and prefetch the dataset
    dataset = dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)

    return dataset


class BeautyModelHyperModel(kt.HyperModel):
    """
    Hypermodel for beauty prediction model hyperparameter tuning
    """

    def __init__(self, input_shape=(*IMG_SIZE, 3)):
        self.input_shape = input_shape

    def build(self, hp):
        """
        Build the model with hyperparameters

        Args:
            hp: Hyperparameters object

        Returns:
            Compiled Keras model
        """
        # Always use ResNet50 as base model for MEBeauty
        base_model = tf.keras.applications.ResNet50(
            input_shape=self.input_shape, include_top=False, weights="imagenet"
        )

        # Trainable base option
        trainable_base = hp.Boolean("trainable_base", default=True)
        base_model.trainable = trainable_base

        # Create model
        inputs = tf.keras.Input(shape=self.input_shape)
        x = base_model(inputs, training=False)
        x = tf.keras.layers.GlobalAveragePooling2D()(x)

        # Dense layers
        dense_units = hp.Int("dense_units", min_value=128, max_value=1024, step=128)
        x = tf.keras.layers.Dense(dense_units, activation="relu")(x)

        # Dropout
        dropout_rate = hp.Float("dropout_rate", min_value=0.1, max_value=0.5, step=0.1)
        x = tf.keras.layers.Dropout(dropout_rate)(x)

        # Output layer
        outputs = tf.keras.layers.Dense(1)(x)

        model = tf.keras.Model(inputs, outputs)

        # Compile model
        learning_rate = hp.Float(
            "learning_rate", min_value=1e-4, max_value=1e-2, sampling="log"
        )
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
            loss="mse",
            metrics=["mae"],
        )

        return model

    def fit(self, hp, model, *args, **kwargs):
        """
        Custom fit method to handle hyperparameter adjustment

        Args:
            hp: Hyperparameters object
            model: Keras model
            *args, **kwargs: Arguments for model.fit()

        Returns:
            Result of model.fit()
        """
        # Get callbacks from kwargs or create empty list
        callbacks = kwargs.get("callbacks", [])

        # Add learning rate scheduler if requested
        if hp.Boolean("use_lr_scheduler", default=False):
            lr_scheduler = tf.keras.callbacks.ReduceLROnPlateau(
                monitor="val_loss", factor=0.2, patience=5, min_lr=1e-6, verbose=1
            )
            callbacks.append(lr_scheduler)

        # Update callbacks in kwargs
        kwargs["callbacks"] = callbacks

        return model.fit(*args, **kwargs)


def create_model(
    input_shape=(*IMG_SIZE, 3),
    trainable_base=False,
    dropout_rate=0.5,
    dense_units=512,
    learning_rate=LEARNING_RATE,
    use_pretrained=True,
):
    """
    Create a beauty prediction model based on ResNet50

    Args:
        input_shape: Input shape for the model
        trainable_base: Whether to make the base model trainable
        dropout_rate: Dropout rate for the classifier head
        dense_units: Number of units in the dense layer
        learning_rate: Learning rate for the optimizer
        use_pretrained: Whether to use pre-trained weights (ImageNet)

    Returns:
        Compiled Keras model
    """
    weights = "imagenet" if use_pretrained else None
    if not use_pretrained:
        logger.info(f"Creating model WITHOUT pre-trained weights")

    # For MEBeauty, we'll always use ResNet50
    base_model = tf.keras.applications.ResNet50(
        input_shape=input_shape, include_top=False, weights=weights
    )
    logger.info(f"Creating model with ResNet50 base")

    # Set trainable status for base model
    base_model.trainable = trainable_base
    logger.info(f"Base model trainable: {trainable_base}")

    # Create model
    inputs = tf.keras.Input(shape=input_shape)
    x = base_model(inputs, training=trainable_base)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)

    # Add dense layer with specified units
    x = tf.keras.layers.Dense(dense_units, activation="relu")(x)
    x = tf.keras.layers.Dropout(dropout_rate)(x)

    # Output layer (1 unit for regression)
    outputs = tf.keras.layers.Dense(1)(x)

    model = tf.keras.Model(inputs, outputs)

    # Compile model
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="mse",
        metrics=["mae"],
    )

    return model


def train_and_evaluate(
    train_dataset,
    val_dataset,
    test_dataset,
    model_type="resnet50",
    batch_size=BATCH_SIZE,
    epochs=EPOCHS,
    learning_rate=LEARNING_RATE,
    trainable_base=False,
    dropout_rate=0.5,
    dense_units=512,
    use_mixed_precision=False,
    use_pretrained=True,
    save_path=MODEL_PATH,
    quick_train=False,
):
    """
    Train and evaluate the beauty prediction model

    Args:
        train_dataset: Training dataset
        val_dataset: Validation dataset
        test_dataset: Test dataset
        model_type: Not used (always ResNet50 for MEBeauty)
        batch_size: Batch size for training
        epochs: Number of epochs to train
        learning_rate: Learning rate for the optimizer
        trainable_base: Whether to make the base model trainable
        dropout_rate: Dropout rate for the classifier head
        dense_units: Number of units in the dense layer
        use_mixed_precision: Whether to use mixed precision training
        use_pretrained: Whether to use pre-trained weights (ImageNet)
        save_path: Path to save the trained model
        quick_train: Whether to do a quick training run (for testing)

    Returns:
        Dictionary of training history and evaluation results
    """
    # Create the directory to save the model if it doesn't exist
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    # Configure mixed precision if requested
    if use_mixed_precision:
        logger.info("Enabling mixed precision training")
        policy = tf.keras.mixed_precision.Policy("mixed_float16")
        tf.keras.mixed_precision.set_global_policy(policy)

    # Create the model
    model = create_model(
        trainable_base=trainable_base,
        dropout_rate=dropout_rate,
        dense_units=dense_units,
        learning_rate=learning_rate,
        use_pretrained=use_pretrained,
    )

    # Set up callbacks
    checkpoint_path = os.path.join(
        os.path.dirname(save_path), f"checkpoint_{{epoch:02d}}.weights.h5"
    )

    callbacks = [
        # Save model weights after each epoch
        tf.keras.callbacks.ModelCheckpoint(
            checkpoint_path, save_weights_only=True, save_best_only=False
        ),
        # Early stopping based on validation loss
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=10, restore_best_weights=True
        ),
        # Learning rate scheduler
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.2, patience=5, min_lr=1e-6, verbose=1
        ),
        # TensorBoard logging
        tf.keras.callbacks.TensorBoard(
            log_dir=os.path.join(
                LOG_DIR, datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
            ),
            histogram_freq=1,
            write_graph=True,
        ),
    ]

    # Adjust epochs for quick training
    if quick_train:
        logger.info("Quick training mode enabled, reducing epochs")
        epochs = min(epochs, 5)

    # Train the model
    logger.info(f"Starting model training for {epochs} epochs")
    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=epochs,
        callbacks=callbacks,
        verbose=1,
    )

    # Save the model
    logger.info(f"Saving model to {save_path}")
    model.save(save_path)

    # Also save in TensorFlow SavedModel format (more portable)
    tf_model_path = save_path.replace(".h5", "_saved_model")
    tf.keras.models.save_model(model, tf_model_path)
    logger.info(f"Model also saved in TensorFlow SavedModel format to {tf_model_path}")

    # Evaluate the model on the test dataset
    logger.info("Evaluating model on test dataset")
    test_loss, test_mae = model.evaluate(test_dataset, verbose=1)
    logger.info(f"Test loss: {test_loss:.4f}, Test MAE: {test_mae:.4f}")

    # Create a plot of the training history
    plt.figure(figsize=(12, 5))

    # Plot training and validation loss
    plt.subplot(1, 2, 1)
    plt.plot(history.history["loss"], label="Training Loss")
    plt.plot(history.history["val_loss"], label="Validation Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.title("Training and Validation Loss")
    plt.legend()

    # Plot training and validation MAE
    plt.subplot(1, 2, 2)
    plt.plot(history.history["mae"], label="Training MAE")
    plt.plot(history.history["val_mae"], label="Validation MAE")
    plt.xlabel("Epoch")
    plt.ylabel("MAE")
    plt.title("Training and Validation MAE")
    plt.legend()

    plt.tight_layout()

    # Save the plot
    plot_path = os.path.join(os.path.dirname(save_path), "training_history.png")
    plt.savefig(plot_path)
    logger.info(f"Saved training history plot to {plot_path}")

    # Create a dictionary with the model configuration and results
    results = {
        "test_loss": test_loss,
        "test_mae": test_mae,
        "training_epochs": len(history.history["loss"]),
        "final_train_loss": history.history["loss"][-1],
        "final_val_loss": history.history["val_loss"][-1],
        "timestamp": datetime.datetime.now().isoformat(),
        "model_config": {
            "model_type": "resnet50",  # Always ResNet50 for MEBeauty
            "epochs": epochs,
            "batch_size": batch_size,
            "trainable_base": trainable_base,
            "learning_rate": learning_rate,
            "output_path": save_path,
            "use_pretrained": use_pretrained,
        },
    }

    # Save the results to a JSON file
    results_path = os.path.join(os.path.dirname(save_path), "evaluation_results.json")
    with open(results_path, "w") as f:
        json.dump(results, f, indent=4)

    logger.info(f"Saved evaluation results to {results_path}")

    return results


def find_best_hyperparameters(train_dataset, val_dataset, max_trials=20, epochs=10):
    """
    Find the best hyperparameters for the model using Keras Tuner

    Args:
        train_dataset: Training dataset
        val_dataset: Validation dataset
        max_trials: Maximum number of trials to run
        epochs: Number of epochs for each trial

    Returns:
        Dictionary of best hyperparameters
    """
    if kt is None:
        logger.error("Keras Tuner is not installed")
        return None

    # Define the hypermodel builder
    def build_model(hp):
        # Hyperparameters to optimize
        lr = hp.Float("learning_rate", min_value=1e-4, max_value=1e-2, sampling="log")
        dropout_rate = hp.Float("dropout_rate", min_value=0.0, max_value=0.5, step=0.1)
        dense_units = hp.Int("dense_units", min_value=64, max_value=512, step=64)
        trainable_base = hp.Boolean("trainable_base")
        batch_size = hp.Choice("batch_size", values=[16, 32, 64])

        # Create model with these hyperparameters
        model = create_model(
            trainable_base=trainable_base,
            dropout_rate=dropout_rate,
            dense_units=dense_units,
            learning_rate=lr,
        )
        return model

    # Create the tuner
    tuner = kt.RandomSearch(
        build_model,
        objective="val_loss",
        max_trials=max_trials,
        directory=os.path.join(MODELS_DIR, "hp_tuning"),
        project_name="mebeauty_hyperparameters",
        overwrite=False,
    )

    # Early stopping callback
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=5, restore_best_weights=True
    )

    # Search for the best hyperparameters
    logger.info(f"Starting hyperparameter search with {max_trials} trials")
    tuner.search(
        train_dataset,
        validation_data=val_dataset,
        epochs=epochs,
        callbacks=[early_stopping],
    )

    # Get the best hyperparameters
    best_hp = tuner.get_best_hyperparameters(1)[0]
    logger.info(f"Best hyperparameters: {best_hp.values}")

    # Return as a dictionary
    return best_hp.values


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Train a facial beauty prediction model on the MEBeauty dataset"
    )
    parser.add_argument(
        "--batch-size", type=int, default=BATCH_SIZE, help="Batch size for training"
    )
    parser.add_argument(
        "--epochs", type=int, default=EPOCHS, help="Number of epochs to train"
    )
    parser.add_argument("--lr", type=float, default=LEARNING_RATE, help="Learning rate")
    parser.add_argument(
        "--trainable-base",
        action="store_true",
        help="Make the base model trainable (fine-tuning)",
    )
    parser.add_argument(
        "--no-pretrained",
        action="store_true",
        help="Don't use pre-trained weights (ImageNet)",
    )
    parser.add_argument("--augment", action="store_true", help="Use data augmentation")
    parser.add_argument(
        "--mixed-precision", action="store_true", help="Use mixed precision training"
    )
    parser.add_argument(
        "--quick-train",
        action="store_true",
        help="Do a quick training run (for testing)",
    )
    parser.add_argument(
        "--output", type=str, default=MODEL_PATH, help="Path to save the trained model"
    )
    parser.add_argument(
        "--optimize-hyperparams",
        action="store_true",
        help="Perform hyperparameter optimization",
    )
    parser.add_argument(
        "--optimization-trials",
        type=int,
        default=20,
        help="Number of hyperparameter optimization trials",
    )
    parser.add_argument(
        "--optimization-epochs",
        type=int,
        default=10,
        help="Number of epochs to train during hyperparameter optimization",
    )
    return parser.parse_args()


def main():
    """Main function to train and evaluate the model"""
    # Parse command line arguments
    args = parse_args()

    # Check if we have GPU
    global gpus
    gpus = tf.config.list_physical_devices("GPU")
    if gpus:
        logger.info(f"Found {len(gpus)} GPU(s)")
        # Limit memory growth to avoid OOM
        for gpu in gpus:
            try:
                tf.config.experimental.set_memory_growth(gpu, True)
                logger.info(f"Set memory growth for {gpu}")
            except RuntimeError as e:
                logger.error(f"Error setting memory growth: {str(e)}")
    else:
        logger.warning("No GPUs found, using CPU only")

    # Extract dataset information
    if not extract_dataset():
        logger.error("Failed to extract dataset information")
        return 1

    # Load data
    data = load_mebeauty_data()
    if data is None:
        logger.error("Failed to load data")
        return 1

    train_paths, train_scores, val_paths, val_scores, test_paths, test_scores = data

    # Create TF datasets
    train_dataset = prepare_tf_dataset(
        train_paths,
        train_scores,
        batch_size=args.batch_size,
        shuffle=True,
        augment=args.augment,
        is_train=True,
    )
    val_dataset = prepare_tf_dataset(
        val_paths, val_scores, batch_size=args.batch_size, shuffle=False, is_train=False
    )
    test_dataset = prepare_tf_dataset(
        test_paths,
        test_scores,
        batch_size=args.batch_size,
        shuffle=False,
        is_train=False,
    )

    # Hyperparameter optimization if requested
    if args.optimize_hyperparams:
        if kt is None:
            logger.error(
                "Keras Tuner is not installed. Please install it with 'pip install keras-tuner'"
            )
            return 1

        logger.info(
            f"Performing hyperparameter optimization with {args.optimization_trials} trials and {args.optimization_epochs} epochs per trial"
        )
        best_hp = find_best_hyperparameters(
            train_dataset,
            val_dataset,
            max_trials=args.optimization_trials,
            epochs=args.optimization_epochs,
        )

        # Train the model with the best hyperparameters
        logger.info("Training model with best hyperparameters")
        history = train_and_evaluate(
            train_dataset,
            val_dataset,
            test_dataset,
            batch_size=best_hp["batch_size"],
            epochs=args.epochs,
            learning_rate=best_hp["learning_rate"],
            trainable_base=best_hp["trainable_base"],
            dropout_rate=best_hp["dropout_rate"],
            dense_units=best_hp["dense_units"],
            use_mixed_precision=args.mixed_precision,
            use_pretrained=not args.no_pretrained,
            save_path=args.output,
            quick_train=args.quick_train,
        )
    else:
        # Train with command line parameters
        logger.info("Training model with command line parameters")
        history = train_and_evaluate(
            train_dataset,
            val_dataset,
            test_dataset,
            batch_size=args.batch_size,
            epochs=args.epochs,
            learning_rate=args.lr,
            trainable_base=args.trainable_base,
            dropout_rate=0.5,  # Default
            dense_units=512,  # Default
            use_mixed_precision=args.mixed_precision,
            use_pretrained=not args.no_pretrained,
            save_path=args.output,
            quick_train=args.quick_train,
        )

    logger.info("Training completed!")
    # Save the model configuration for reference
    config = {
        "dataset": "MEBeauty",
        "model_type": "ResNet50",
        "batch_size": (
            args.batch_size if not args.optimize_hyperparams else best_hp["batch_size"]
        ),
        "epochs": args.epochs,
        "learning_rate": (
            args.lr if not args.optimize_hyperparams else best_hp["learning_rate"]
        ),
        "trainable_base": (
            args.trainable_base
            if not args.optimize_hyperparams
            else best_hp["trainable_base"]
        ),
        "dropout_rate": (
            0.5 if not args.optimize_hyperparams else best_hp["dropout_rate"]
        ),
        "dense_units": 512 if not args.optimize_hyperparams else best_hp["dense_units"],
        "use_mixed_precision": args.mixed_precision,
        "use_pretrained": not args.no_pretrained,
        "augmentation": args.augment,
        "test_mae": history["test_mae"],
        "test_mse": history.get("test_mse", None),
        "val_mae": history.get("val_mae", None),
        "val_mse": history.get("val_mse", None),
        "train_time": history.get("train_time", None),
    }

    # Save the configuration to a JSON file
    config_path = os.path.join(
        os.path.dirname(args.output), "mebeauty_model_config.json"
    )
    with open(config_path, "w") as f:
        json.dump(config, f, indent=4)

    logger.info(f"Model configuration saved to {config_path}")
    return 0


if __name__ == "__main__":
    main()
