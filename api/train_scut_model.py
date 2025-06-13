"""
SCUT-FBP5500 Beauty Prediction Model Training Script

This script trains a MobileNetV2-based model on the SCUT-FBP5500 dataset
to predict facial beauty scores (1-5 scale).

Features:
- Supports training with both MobileNetV2 and ResNet50 architectures
- Can use pre-trained weights from ImageNet or train from scratch
- Includes data augmentation and preprocessing specific to beauty prediction
- Supports hyperparameter optimization to find the best model configuration
- Mixed-precision training for improved performance on modern GPUs
- Creates evaluation metrics and visualizations

Basic usage:
python train_beauty_model.py

Hyperparameter optimization:
python train_beauty_model.py --optimize-hyperparams --optimization-trials 20

Quick training (for testing):
python train_beauty_model.py --quick-train

Full training with specific parameters:
python train_beauty_model.py --model mobilenetv2 --epochs 50 --batch-size 32 --lr 0.001
"""

import os
import sys
import logging
import time
import json
import datetime
import traceback

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
logger = logging.getLogger("beauty_model_training")

# Configure paths - update to use absolute paths for certainty
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DATASET_DIR = os.path.join(DATA_DIR, "SCUT-FBP5500")
IMAGES_DIR = os.path.join(DATASET_DIR, "Images")
LABELS_FILE = os.path.join(DATASET_DIR, "labels.txt")
NPZ_FILE = os.path.join(DATASET_DIR, "scut_fpb5500-cmprsd.npz")
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "beauty_model_scut_resnet50.h5")
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
    Check if the dataset exists in the expected location.
    This function is simplified since we know exactly where the images are.
    """
    global IMAGES_DIR, LABELS_FILE

    # Check if the images directory exists
    if not os.path.exists(IMAGES_DIR):
        logger.error(f"Images directory not found at {IMAGES_DIR}")
        return False

    # Count the number of image files
    img_count = len(
        [
            f
            for f in os.listdir(IMAGES_DIR)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]
    )
    logger.info(f"Found {img_count} images in {IMAGES_DIR}")

    if img_count < 10:  # Lower threshold for testing purposes
        logger.error(
            f"Too few images found ({img_count}). Expected around 5500 images."
        )
        return False

    # Check if the labels file exists
    if not os.path.exists(LABELS_FILE):
        logger.warning(f"Labels file not found at {LABELS_FILE}")

        # Try a few common locations for the labels file
        possible_label_files = [
            os.path.join(os.path.dirname(IMAGES_DIR), "labels.txt"),
            os.path.join(os.path.dirname(IMAGES_DIR), "rating.txt"),
            os.path.join(os.path.dirname(IMAGES_DIR), "ratings.txt"),
        ]

        for label_file in possible_label_files:
            if os.path.exists(label_file):
                LABELS_FILE = label_file
                logger.info(f"Found labels file at {LABELS_FILE}")
                break
        else:
            # Will generate synthetic ratings when loading metadata
            logger.warning(
                "No labels file found. Will generate synthetic ratings for demonstration."
            )

    logger.info(
        f"Dataset verified: Images found at {IMAGES_DIR}, labels at {LABELS_FILE if os.path.exists(LABELS_FILE) else 'will use synthetic labels'}."
    )
    return True


def load_dataset_metadata():
    """
    Load the dataset metadata from the labels.txt file and/or NPZ file.
    Returns a DataFrame with image paths and ratings.
    """
    try:
        # First try to read from the labels.txt file
        if os.path.exists(LABELS_FILE):
            logger.info(f"Loading labels from {LABELS_FILE}")

            # Initialize lists for filenames and ratings
            filenames = []
            ratings = []

            # Read the labels file
            with open(LABELS_FILE, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        # Assume format is: filename rating [other_info]
                        filename = parts[0]
                        try:
                            rating = float(parts[1])
                            filenames.append(filename)
                            ratings.append(rating)
                        except ValueError:
                            logger.warning(f"Could not parse rating from line: {line}")

            if not filenames:
                logger.error("No valid entries found in labels file")

                # Try to use the NPZ file as fallback
                if os.path.exists(NPZ_FILE):
                    return load_from_npz()
                return None

            # Create DataFrame
            df = pd.DataFrame({"Filename": filenames, "Rating_Mean": ratings})

            logger.info(f"Loaded {len(df)} entries from labels file")

        # If labels file doesn't exist, try to use the NPZ file
        elif os.path.exists(NPZ_FILE):
            logger.info(f"Labels file not found. Trying to load from NPZ file.")
            return load_from_npz()

        else:
            logger.warning(
                f"Neither labels file nor NPZ file found. Generating synthetic ratings."
            )
            # Create synthetic ratings for all images in the directory
            image_files = [
                f
                for f in os.listdir(IMAGES_DIR)
                if f.lower().endswith((".jpg", ".jpeg", ".png"))
            ]

            if not image_files:
                logger.error(f"No image files found in {IMAGES_DIR}")
                return None

            logger.info(f"Generating synthetic ratings for {len(image_files)} images")

            # Use random ratings with a normal distribution centered around 3.0
            np.random.seed(42)  # For reproducibility
            ratings = np.random.normal(3.0, 0.7, len(image_files))
            ratings = np.clip(ratings, 1.0, 5.0)  # Ensure ratings are in range 1-5

            # Create dataframe
            df = pd.DataFrame({"Filename": image_files, "Rating_Mean": ratings})

            logger.info(
                f"Created synthetic ratings with mean: {ratings.mean():.2f}, std: {ratings.std():.2f}"
            )

        # Add full image paths
        df["image_path"] = df["Filename"].apply(
            lambda x: os.path.join(IMAGES_DIR, x) if not os.path.isabs(x) else x
        )

        # Check that all images exist
        df["exists"] = df["image_path"].apply(os.path.exists)
        missing_count = (~df["exists"]).sum()

        if missing_count > 0:
            logger.warning(
                f"{missing_count} images referenced in labels file are missing"
            )

            # Filter out missing images
            missing_images = df[~df["exists"]]
            logger.warning(
                f"First few missing images: {missing_images['Filename'].head().tolist()}"
            )

            # Remove missing images from the dataset
            df = df[df["exists"]]
            logger.info(
                f"Filtered out {missing_count} missing images, {len(df)} images remaining"
            )

        logger.info(f"Loaded metadata for {len(df)} images")

        # Check the distribution of ratings
        logger.info(
            f"Rating range: {df['Rating_Mean'].min():.2f} - {df['Rating_Mean'].max():.2f}"
        )
        logger.info(
            f"Rating mean: {df['Rating_Mean'].mean():.2f}, std: {df['Rating_Mean'].std():.2f}"
        )

        return df
    except Exception as e:
        logger.error(f"Error loading dataset metadata: {str(e)}")
        return None


def load_from_npz():
    """Load dataset from NPZ file if available"""
    try:
        logger.info(f"Loading data from NPZ file: {NPZ_FILE}")
        data = np.load(NPZ_FILE)

        # Check what arrays are in the NPZ file
        logger.info(f"Arrays in NPZ file: {list(data.keys())}")

        # Assuming the NPZ file contains 'filenames' and 'ratings' arrays
        # Adjust these keys based on the actual content of your NPZ file
        if "filenames" in data and "ratings" in data:
            filenames = data["filenames"]
            ratings = data["ratings"]

            # Check if filenames are stored as bytes and convert to strings if needed
            if isinstance(filenames[0], bytes):
                filenames = [f.decode("utf-8") for f in filenames]

            df = pd.DataFrame({"Filename": filenames, "Rating_Mean": ratings})

            logger.info(f"Loaded {len(df)} entries from NPZ file")
            return df
        else:
            logger.error("NPZ file does not contain expected arrays")
            return None
    except Exception as e:
        logger.error(f"Error loading from NPZ file: {str(e)}")
        return None


class BeautyDataGenerator(tf.keras.utils.Sequence):
    """Generator for loading and preprocessing beauty dataset images"""

    def __init__(
        self,
        data,
        batch_size=BATCH_SIZE,
        input_size=IMG_SIZE,
        shuffle=True,
        preprocessing=None,
        augment=False,
        channel_mode="rgb",
    ):
        """
        Initialize the data generator

        Args:
            data: DataFrame with image_path and Rating_Mean columns
            batch_size: Number of images per batch
            input_size: Input image size (height, width)
            shuffle: Whether to shuffle the data at the end of each epoch
            preprocessing: Preprocessing function to apply to each image ('mobilenet', 'resnet' or None)
            augment: Whether to apply data augmentation
            channel_mode: 'rgb' or 'bgr' for color channel order
        """
        self.data = data
        self.batch_size = batch_size
        self.input_size = input_size
        self.shuffle = shuffle
        self.channel_mode = channel_mode

        # Set preprocessing function based on model type
        if preprocessing == "mobilenet":
            self.preprocessing = tf.keras.applications.mobilenet_v2.preprocess_input
            logger.info("Using MobileNetV2 preprocessing")
        elif preprocessing == "resnet":
            self.preprocessing = tf.keras.applications.resnet50.preprocess_input
            logger.info("Using ResNet50 preprocessing")
        else:
            # Simple normalization
            self.preprocessing = lambda x: x / 255.0
            logger.info("Using simple normalization preprocessing")

        # Data augmentation
        self.augment = augment
        if augment:
            self.augmentation = tf.keras.Sequential(
                [
                    tf.keras.layers.RandomFlip("horizontal"),
                    tf.keras.layers.RandomRotation(0.05),
                    tf.keras.layers.RandomZoom(0.1),
                    tf.keras.layers.RandomBrightness(0.1),
                    tf.keras.layers.RandomContrast(0.1),
                ]
            )
            logger.info("Data augmentation enabled")

        # Try to convert to tf.data.Dataset for better performance
        try:
            # Check if we're running with TensorFlow 2.x that fully supports tf.data
            if tf.__version__.startswith("2."):
                self.use_tf_data = True
                logger.info("Using tf.data.Dataset for efficient data loading")
                self._create_dataset()
            else:
                self.use_tf_data = False
                logger.info("Using Keras Sequence for data loading")
                self.indices = np.arange(len(self.data))
                if self.shuffle:
                    np.random.shuffle(self.indices)
        except Exception as e:
            logger.warning(f"Error creating tf.data.Dataset: {e}")
            logger.info("Falling back to standard Keras Sequence")
            self.use_tf_data = False
            self.indices = np.arange(len(self.data))
            if self.shuffle:
                np.random.shuffle(self.indices)

    def _create_dataset(self):
        """Create a tf.data.Dataset for more efficient data loading"""
        # Get image paths and labels
        image_paths = self.data["image_path"].values
        labels = self.data["Rating_Mean"].values

        # Create dataset from tensors
        self.dataset = tf.data.Dataset.from_tensor_slices((image_paths, labels))

        # Apply shuffle if needed
        if self.shuffle:
            # Buffer size = dataset size for perfect shuffle
            self.dataset = self.dataset.shuffle(
                buffer_size=len(self.data), reshuffle_each_iteration=True
            )

        # Map function to load and preprocess images
        def load_and_preprocess_image(img_path, label):
            # Load image
            img = tf.io.read_file(img_path)
            img = tf.image.decode_image(img, channels=3, expand_animations=False)
            img = tf.image.resize(img, self.input_size)

            # Data type conversion
            img = tf.cast(img, tf.float32)

            # Apply channel conversion if needed
            if self.channel_mode == "bgr":
                img = tf.reverse(img, axis=[-1])  # RGB to BGR

            # Apply augmentation if enabled
            if self.augment:
                img = self.augmentation(tf.expand_dims(img, 0))[0]

            # Apply preprocessing (converting to function that works with tensors)
            if (
                self.preprocessing
                == tf.keras.applications.mobilenet_v2.preprocess_input
            ):
                # Apply MobileNetV2 preprocessing manually with tensors
                img = img / 127.5
                img = img - 1.0
            elif self.preprocessing == tf.keras.applications.resnet50.preprocess_input:
                # Apply ResNet50 preprocessing manually with tensors
                img = img[..., ::-1]  # RGB to BGR
                mean = [103.939, 116.779, 123.68]
                img = img - mean
            else:
                # Simple normalization
                img = img / 255.0

            return img, label

        # Apply the preprocessing function
        self.dataset = self.dataset.map(
            load_and_preprocess_image,
            num_parallel_calls=tf.data.AUTOTUNE,  # Parallelize data loading
        )

        # Batch the data
        self.dataset = self.dataset.batch(self.batch_size)

        # Prefetch data for better performance
        self.dataset = self.dataset.prefetch(tf.data.AUTOTUNE)

        # Create iterator
        self.iterator = iter(self.dataset)

        # Calculate steps per epoch
        self.steps_per_epoch = len(self.data) // self.batch_size
        if len(self.data) % self.batch_size > 0:
            self.steps_per_epoch += 1

    def __len__(self):
        """Number of batches per epoch"""
        if hasattr(self, "steps_per_epoch"):
            return self.steps_per_epoch
        return int(np.ceil(len(self.data) / self.batch_size))

    def __getitem__(self, index):
        """Get a batch of data"""
        if self.use_tf_data:
            try:
                # Get next batch from the dataset
                return next(self.iterator)
            except StopIteration:
                # Reset the iterator if we reached the end
                self.iterator = iter(self.dataset)
                return next(self.iterator)
        else:
            # Standard Sequence implementation
            # Get batch indices
            batch_indices = self.indices[
                index * self.batch_size : (index + 1) * self.batch_size
            ]
            batch_data = self.data.iloc[batch_indices]

            # Initialize batch arrays
            batch_x = np.zeros(
                (len(batch_data), self.input_size[0], self.input_size[1], 3),
                dtype=np.float32,
            )
            batch_y = np.zeros((len(batch_data),), dtype=np.float32)

            # Load and preprocess images
            for i, (_, row) in enumerate(batch_data.iterrows()):
                try:
                    # Load image
                    img = tf.keras.preprocessing.image.load_img(
                        row["image_path"], target_size=self.input_size
                    )
                    img_array = tf.keras.preprocessing.image.img_to_array(img)

                    # Apply channel conversion if needed
                    if self.channel_mode == "bgr":
                        img_array = img_array[..., ::-1]  # RGB to BGR

                    # Apply augmentation
                    if self.augment:
                        img_array = self.augmentation(tf.expand_dims(img_array, 0))[0]

                    # Apply preprocessing
                    img_array = self.preprocessing(img_array)

                    batch_x[i] = img_array
                    batch_y[i] = row["Rating_Mean"]
                except Exception as e:
                    logger.warning(
                        f"Error processing image {row['image_path']}: {str(e)}"
                    )
                    # Use zeros for the image and mean rating for the label to minimize impact
                    batch_y[i] = self.data["Rating_Mean"].mean()

            return batch_x, batch_y

    def on_epoch_end(self):
        """Called at the end of each epoch"""
        if not self.use_tf_data and self.shuffle:
            np.random.shuffle(self.indices)

    def get_tf_dataset(self):
        """Return the tf.data.Dataset object if available"""
        if self.use_tf_data:
            return self.dataset
        else:
            logger.warning("tf.data.Dataset not available for this generator")
            return None


def create_model(
    model_type="mobilenetv2",
    input_shape=(*IMG_SIZE, 3),
    trainable_base=False,
    dropout_rate=0.5,
    learning_rate=LEARNING_RATE,
    use_pretrained=True,
):
    """
    Create a beauty prediction model based on a pre-trained CNN

    Args:
        model_type: 'mobilenetv2' or 'resnet50'
        input_shape: Input shape for the model
        trainable_base: Whether to make the base model trainable
        dropout_rate: Dropout rate for the classifier head
        learning_rate: Learning rate for the optimizer
        use_pretrained: Whether to use pre-trained weights (ImageNet)

    Returns:
        Compiled Keras model
    """
    weights = "imagenet" if use_pretrained else None
    if not use_pretrained:
        logger.info(f"Creating model WITHOUT pre-trained weights")

    if model_type.lower() == "mobilenetv2":
        base_model = tf.keras.applications.MobileNetV2(
            input_shape=input_shape, include_top=False, weights=weights
        )
        preprocessing_func = "mobilenet"
        logger.info(f"Creating model with MobileNetV2 base")
    elif model_type.lower() == "resnet50":
        base_model = tf.keras.applications.ResNet50(
            input_shape=input_shape, include_top=False, weights=weights
        )
        preprocessing_func = "resnet"
        logger.info(f"Creating model with ResNet50 base")
    else:
        raise ValueError(f"Unsupported model type: {model_type}")

    # Freeze the base model if not trainable
    base_model.trainable = trainable_base
    logger.info(f"Base model trainable: {trainable_base}")

    # Add classification head
    x = base_model.output
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dense(1024, activation="relu")(x)
    x = tf.keras.layers.Dropout(dropout_rate)(x)
    x = tf.keras.layers.Dense(512, activation="relu")(x)
    x = tf.keras.layers.Dropout(dropout_rate)(x)
    x = tf.keras.layers.Dense(1)(x)  # Linear activation for regression

    model = tf.keras.Model(inputs=base_model.input, outputs=x)

    # Compile model
    optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(optimizer=optimizer, loss="mse", metrics=["mae"])

    return model, preprocessing_func


def train_model(
    data_train,
    data_val,
    model_type="mobilenetv2",
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    trainable_base=False,
    learning_rate=LEARNING_RATE,
    output_path="beauty_model.h5",
    use_pretrained=True,
):
    """
    Train the beauty prediction model

    Args:
        data_train: Training data DataFrame
        data_val: Validation data DataFrame
        model_type: Model architecture to use ('mobilenetv2' or 'resnet50')
        epochs: Number of epochs to train
        batch_size: Batch size for training
        trainable_base: Whether to make the base model trainable
        learning_rate: Learning rate for the optimizer
        output_path: Path to save the trained model
        use_pretrained: Whether to use pre-trained weights (ImageNet)

    Returns:
        Training history
    """
    global gpus

    try:
        # Create model
        model, preprocessing_func = create_model(
            model_type=model_type,
            trainable_base=trainable_base,
            learning_rate=learning_rate,
            use_pretrained=use_pretrained,
        )

        # Print model summary
        model.summary(print_fn=logger.info)

        # Log the model size and total parameters
        total_params = model.count_params()
        logger.info(f"Total model parameters: {total_params:,}")
        model_memory_footprint_mb = (
            total_params * 4 / (1024 * 1024)
        )  # Assuming float32 (4 bytes)
        logger.info(
            f"Approximate model memory footprint: {model_memory_footprint_mb:.2f} MB"
        )

        # Create data generators with optimized batch size for GPU
        # Adjust batch size if needed based on GPU memory
        if batch_size > 64 and gpus and len(gpus) > 0:
            logger.info(
                f"Reducing batch size from {batch_size} to 64 to optimize GPU usage"
            )
            batch_size = 64

        train_generator = BeautyDataGenerator(
            data_train,
            batch_size=batch_size,
            preprocessing=preprocessing_func,
            augment=True,
        )

        val_generator = BeautyDataGenerator(
            data_val,
            batch_size=batch_size,
            preprocessing=preprocessing_func,
            augment=False,
        )

        # Calculate steps per epoch to show more frequent progress
        steps_per_epoch = len(train_generator)
        validation_steps = len(val_generator)
        logger.info(f"Training with {steps_per_epoch} steps per epoch")
        logger.info(f"Validation with {validation_steps} steps per epoch")

        # Callbacks
        checkpoint_callback = tf.keras.callbacks.ModelCheckpoint(
            output_path, monitor="val_loss", save_best_only=True, verbose=1
        )

        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=5, restore_best_weights=True, verbose=1
        )

        reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6, verbose=1
        )

        # Add TensorBoard callback for better visualization
        tensorboard_log_dir = os.path.join(
            LOG_DIR, f"tensorboard_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )
        tensorboard_callback = tf.keras.callbacks.TensorBoard(
            log_dir=tensorboard_log_dir,
            histogram_freq=1,
            write_graph=True,
            update_freq="epoch",
        )

        # Time-based model checkpoints to save intermediate results
        # Using correct filename format for save_weights_only=True
        time_checkpoint = tf.keras.callbacks.ModelCheckpoint(
            os.path.join(
                os.path.dirname(output_path), f"checkpoint_{{epoch:02d}}.weights.h5"
            ),
            save_freq="epoch",
            save_weights_only=True,
            verbose=0,
        )

        # Start time measurement
        start_time = time.time()
        logger.info(f"Starting training on {time.strftime('%Y-%m-%d %H:%M:%S')}")

        # Train model
        logger.info(f"Starting training for {epochs} epochs")
        history = model.fit(
            train_generator,
            validation_data=val_generator,
            epochs=epochs,
            callbacks=[
                checkpoint_callback,
                early_stopping,
                reduce_lr,
                tensorboard_callback,
                time_checkpoint,
            ],
        )

        # Calculate elapsed time
        elapsed_time = time.time() - start_time
        hours, remainder = divmod(elapsed_time, 3600)
        minutes, seconds = divmod(remainder, 60)
        logger.info(
            f"Training completed in {int(hours)}h {int(minutes)}m {int(seconds)}s"
        )

        # Save model
        model.save(output_path)
        logger.info(f"Model saved to {output_path}")

        # Save model in TF SavedModel format (more portable)
        tf_model_path = output_path.replace(".h5", "_saved_model")
        tf.keras.models.save_model(model, tf_model_path)
        logger.info(
            f"Model also saved in TensorFlow SavedModel format to {tf_model_path}"
        )

        return history
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        logger.error(traceback.format_exc())  # Log full stack trace
        return None


def fine_tune_model(model, train_generator, val_generator):
    """Fine-tune the model by unfreezing some layers"""
    try:
        logger.info("Fine-tuning model")

        # Unfreeze some layers of the base model
        for layer in model.layers[0].layers[-30:]:  # Unfreeze the last 30 layers
            layer.trainable = True

        # Recompile with a lower learning rate
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE / 10),
            loss="mean_squared_error",
            metrics=["mae"],
        )

        # Create callbacks
        checkpoint = tf.keras.callbacks.ModelCheckpoint(
            MODEL_PATH, monitor="val_loss", verbose=1, save_best_only=True, mode="min"
        )

        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=15, verbose=1, restore_best_weights=True
        )

        reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.2, patience=7, verbose=1, min_lr=1e-6
        )

        callbacks = [checkpoint, early_stopping, reduce_lr]

        # Start fine-tuning
        logger.info("Starting model fine-tuning")
        start_time = time.time()

        history = model.fit(
            train_generator,
            epochs=30,  # Fewer epochs for fine-tuning
            validation_data=val_generator,
            callbacks=callbacks,
        )

        fine_tuning_time = time.time() - start_time
        logger.info(f"Fine-tuning completed in {fine_tuning_time:.2f} seconds")

        return history
    except Exception as e:
        logger.error(f"Error during fine-tuning: {str(e)}")
        return None


def evaluate_model(model, test_generator, test_df=None):
    """Evaluate the trained model on the test set"""
    try:
        logger.info("Evaluating model on test set")

        # Get the evaluation metrics
        metrics = model.evaluate(test_generator)
        logger.info(f"Test MSE: {metrics[0]:.4f}, Test MAE: {metrics[1]:.4f}")

        if test_df is not None:
            # Make predictions
            test_generator.reset()
            predictions = model.predict(test_generator)

            # Get the true labels
            true_labels = test_df["Rating_Mean"].values

            # Calculate and log some statistics
            errors = np.abs(predictions.flatten() - true_labels)
            logger.info(f"Mean Absolute Error: {np.mean(errors):.4f}")
            logger.info(f"Std of Absolute Error: {np.std(errors):.4f}")
            logger.info(
                f"Min/Max Prediction: {np.min(predictions):.4f}/{np.max(predictions):.4f}"
            )
            logger.info(
                f"Min/Max True Value: {np.min(true_labels):.4f}/{np.max(true_labels):.4f}"
            )

        return metrics
    except Exception as e:
        logger.error(f"Error evaluating model: {str(e)}")
        return None


def plot_training_history(history, fine_tuning_history=None):
    """Plot training and validation metrics"""
    try:
        plt.figure(figsize=(12, 5))

        # Plot training and validation loss
        plt.subplot(1, 2, 1)
        plt.plot(history.history["loss"], label="Train Loss")
        plt.plot(history.history["val_loss"], label="Val Loss")

        if fine_tuning_history:
            # Offset epochs for fine-tuning history
            offset = len(history.history["loss"])
            epochs_fine_tune = range(
                offset, offset + len(fine_tuning_history.history["loss"])
            )

            plt.plot(
                epochs_fine_tune,
                fine_tuning_history.history["loss"],
                label="Train Loss (Fine-tuning)",
            )
            plt.plot(
                epochs_fine_tune,
                fine_tuning_history.history["val_loss"],
                label="Val Loss (Fine-tuning)",
            )

        plt.title("Loss Curves")
        plt.xlabel("Epoch")
        plt.ylabel("Mean Squared Error")
        plt.legend()

        # Plot training and validation mean absolute error
        plt.subplot(1, 2, 2)
        plt.plot(history.history["mae"], label="Train MAE")
        plt.plot(history.history["val_mae"], label="Val MAE")

        if fine_tuning_history:
            plt.plot(
                epochs_fine_tune,
                fine_tuning_history.history["mae"],
                label="Train MAE (Fine-tuning)",
            )
            plt.plot(
                epochs_fine_tune,
                fine_tuning_history.history["val_mae"],
                label="Val MAE (Fine-tuning)",
            )

        plt.title("Mean Absolute Error Curves")
        plt.xlabel("Epoch")
        plt.ylabel("MAE")
        plt.legend()

        plt.tight_layout()
        plt.savefig(os.path.join(MODELS_DIR, "training_history.png"))
        logger.info(
            f"Training history plot saved to {os.path.join(MODELS_DIR, 'training_history.png')}"
        )
    except Exception as e:
        logger.error(f"Error plotting training history: {str(e)}")


def configure_logger():
    """Configure the logger with file handler"""
    try:
        # Create log directory
        os.makedirs(LOG_DIR, exist_ok=True)

        # Create file handler
        file_handler = logging.FileHandler(
            os.path.join(
                LOG_DIR,
                f"training_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log",
            )
        )
        file_handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(formatter)

        # Add the handler to the logger
        logger.addHandler(file_handler)
        logger.setLevel(logging.INFO)
        logger.info("Logger configured with file handler")
    except Exception as e:
        logger.error(f"Failed to configure file logger: {str(e)}")
        # Continue with console logging only


def test_model(model_path=MODEL_PATH):
    """Test the trained model by making predictions on a few sample images"""
    try:
        logger.info(f"Testing model from {model_path}")

        # Load the model
        model = tf.keras.models.load_model(model_path)
        logger.info("Model loaded successfully")

        # Find a few sample images to test
        if os.path.exists(IMAGES_DIR):
            image_files = [
                f
                for f in os.listdir(IMAGES_DIR)
                if f.lower().endswith((".jpg", ".jpeg", ".png"))
            ][:5]

            if not image_files:
                logger.error("No image files found for testing")
                return False

            logger.info(f"Testing model on {len(image_files)} sample images")

            # Process each image
            for img_file in image_files:
                img_path = os.path.join(IMAGES_DIR, img_file)

                # Load and preprocess the image
                img = tf.keras.preprocessing.image.load_img(
                    img_path, target_size=IMG_SIZE
                )
                img_array = tf.keras.preprocessing.image.img_to_array(img)
                img_array = tf.keras.applications.mobilenet_v2.preprocess_input(
                    img_array
                )
                img_array = np.expand_dims(img_array, axis=0)

                # Make prediction
                prediction = model.predict(img_array, verbose=0)
                score = float(prediction[0][0])

                # Ensure score is in range 1-5
                score = min(max(score, 1.0), 5.0)

                logger.info(f"Image: {img_file}, Predicted beauty score: {score:.2f}")

            return True
        else:
            logger.error(f"Images directory not found at {IMAGES_DIR}")
            return False

    except Exception as e:
        logger.error(f"Error testing model: {str(e)}")
        return False


def parse_args():
    """Parse command line arguments"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Train a beauty prediction model on the SCUT-FBP5500 dataset"
    )

    # Model configuration
    parser.add_argument(
        "--model",
        type=str,
        default="mobilenetv2",
        choices=["mobilenetv2", "resnet50"],
        help="Model architecture to use (default: mobilenetv2)",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=EPOCHS,
        help=f"Number of training epochs (default: {EPOCHS})",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=BATCH_SIZE,
        help=f"Batch size for training (default: {BATCH_SIZE})",
    )
    parser.add_argument(
        "--lr",
        type=float,
        default=LEARNING_RATE,
        help=f"Learning rate (default: {LEARNING_RATE})",
    )
    parser.add_argument(
        "--trainable-base",
        action="store_true",
        help="Make the base model trainable (default: False)",
    )
    parser.add_argument(
        "--no-pretrained",
        action="store_true",
        help="Train model without pre-trained weights (faster but less accurate)",
    )

    # Hyperparameter optimization
    parser.add_argument(
        "--optimize-hyperparams",
        action="store_true",
        help="Run hyperparameter optimization before training",
    )
    parser.add_argument(
        "--optimization-trials",
        type=int,
        default=10,
        help="Number of trials for hyperparameter optimization (default: 10)",
    )
    parser.add_argument(
        "--optimization-epochs",
        type=int,
        default=5,
        help="Number of epochs per trial for hyperparameter optimization (default: 5)",
    )

    # Paths
    parser.add_argument(
        "--data-dir",
        type=str,
        default=DATA_DIR,
        help=f"Data directory (default: {DATA_DIR})",
    )
    parser.add_argument(
        "--images-dir",
        type=str,
        default="",
        help="Direct path to the images directory (overrides --data-dir)",
    )
    parser.add_argument(
        "--labels-file",
        type=str,
        default="",
        help="Direct path to the labels file (overrides --data-dir)",
    )
    parser.add_argument(
        "--model-path",
        type=str,
        default=MODEL_PATH,
        help=f"Path to save the trained model (default: {MODEL_PATH})",
    )

    # Actions
    parser.add_argument(
        "--test-only",
        action="store_true",
        help="Only test an existing model, no training",
    )
    parser.add_argument(
        "--force", action="store_true", help="Force training even if model exists"
    )
    parser.add_argument(
        "--quick-train",
        action="store_true",
        help="Use smaller model and fewer epochs for faster training (for testing)",
    )
    parser.add_argument(
        "--list-images",
        action="store_true",
        help="List available image folders in the data directory",
    )

    return parser.parse_args()


def list_available_image_folders():
    """List available folders with images in the data directory"""
    logger.info(f"Searching for image folders in {DATA_DIR}...")

    # Just list the expected folder since we know the structure now
    if os.path.exists(IMAGES_DIR):
        img_count = len(
            [
                f
                for f in os.listdir(IMAGES_DIR)
                if f.lower().endswith((".jpg", ".jpeg", ".png"))
            ]
        )
        logger.info(f"Found {img_count} images in {IMAGES_DIR}")
    else:
        logger.error(f"Expected images directory not found at {IMAGES_DIR}")

        # For completeness, still look for other potential image folders
        image_folders = []
        for root, dirs, files in os.walk(DATA_DIR):
            image_files = [
                f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png"))
            ]
            if image_files:
                image_folders.append((root, len(image_files)))

        if image_folders:
            image_folders.sort(key=lambda x: x[1], reverse=True)
            logger.info(f"Alternative image folders found:")
            for folder, count in image_folders:
                logger.info(f"  {folder}: {count} images")


# Create hyperparameter optimization model builder
def build_model_for_tuning(hp):
    """Create a model with hyperparameters that can be tuned by Keras Tuner.

    Args:
        hp: HyperParameters instance for defining the search space

    Returns:
        A compiled Keras model
    """
    # Define the hyperparameter search space
    model_type = hp.Choice(
        "model_type", ["mobilenetv2", "resnet50"], default="mobilenetv2"
    )
    learning_rate = hp.Float(
        "learning_rate", min_value=1e-4, max_value=1e-2, sampling="log"
    )
    dropout_rate = hp.Float("dropout_rate", min_value=0.2, max_value=0.5, step=0.1)
    dense_units = hp.Int("dense_units", min_value=128, max_value=1024, step=128)
    use_pretrained = hp.Boolean("use_pretrained", default=True)

    # Select weights based on use_pretrained choice
    weights = "imagenet" if use_pretrained else None

    # Create base model
    if model_type == "mobilenetv2":
        base_model = tf.keras.applications.MobileNetV2(
            input_shape=(*IMG_SIZE, 3), include_top=False, weights=weights
        )
        preprocessing_func = "mobilenet"
    else:
        base_model = tf.keras.applications.ResNet50(
            input_shape=(*IMG_SIZE, 3), include_top=False, weights=weights
        )
        preprocessing_func = "resnet"

    # Freeze the base model
    base_model.trainable = hp.Boolean("trainable_base", default=False)

    # Add classification head
    x = base_model.output
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dense(dense_units, activation="relu")(x)
    x = tf.keras.layers.Dropout(dropout_rate)(x)
    x = tf.keras.layers.Dense(dense_units // 2, activation="relu")(x)
    x = tf.keras.layers.Dropout(dropout_rate)(x)
    outputs = tf.keras.layers.Dense(1)(x)  # Linear activation for regression

    model = tf.keras.Model(inputs=base_model.input, outputs=outputs)

    # Compile model
    optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(optimizer=optimizer, loss="mse", metrics=["mae"])

    return model


def run_hyperparameter_optimization(
    train_data, val_data, output_dir, max_trials=10, epochs=5
):
    """Run hyperparameter optimization using Keras Tuner.

    Args:
        train_data: Training data DataFrame
        val_data: Validation data DataFrame
        output_dir: Directory to save results
        max_trials: Number of trials to run
        epochs: Number of epochs for each trial

    Returns:
        Best hyperparameters and best model
    """
    if kt is None:
        raise ImportError(
            "keras-tuner is not installed. Install with: pip install keras-tuner"
        )

    # Create tuner directory
    tuner_dir = os.path.join(output_dir, "tuner")
    os.makedirs(tuner_dir, exist_ok=True)

    # Create preprocessing function for MobileNetV2
    preprocessing_func = "mobilenet"

    # Create data generators
    train_generator = BeautyDataGenerator(
        train_data,
        batch_size=BATCH_SIZE,
        preprocessing=preprocessing_func,
        augment=True,
    )

    val_generator = BeautyDataGenerator(
        val_data,
        batch_size=BATCH_SIZE,
        preprocessing=preprocessing_func,
        augment=False,
    )

    # Define early stopping callback
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=3, restore_best_weights=True
    )

    # Create tuner
    tuner = kt.RandomSearch(
        build_model_for_tuning,
        objective="val_loss",
        max_trials=max_trials,  # Use parameter instead of hardcoded value
        executions_per_trial=1,
        directory=tuner_dir,
        project_name="beauty_model_tuning",
    )

    # Alternative: Use Hyperband for more efficient search
    # tuner = kt.Hyperband(
    #     build_model_for_tuning,
    #     objective="val_loss",
    #     max_epochs=10,
    #     factor=3,
    #     directory=tuner_dir,
    #     project_name="beauty_model_tuning",
    # )

    # Print search space summary
    tuner.search_space_summary()

    # Search for best hyperparameters
    logger.info("Starting hyperparameter search...")
    tuner.search(
        train_generator,
        validation_data=val_generator,
        epochs=epochs,  # Use parameter instead of hardcoded value
        callbacks=[early_stopping],
    )

    # Get best hyperparameters
    best_hp = tuner.get_best_hyperparameters(1)[0]
    logger.info(f"Best hyperparameters: {best_hp.values}")

    # Build model with best hyperparameters
    best_model = tuner.hypermodel.build(best_hp)

    # Save hyperparameter results
    hp_results_path = os.path.join(output_dir, "best_hyperparameters.json")
    with open(hp_results_path, "w") as f:
        json.dump(best_hp.values, f, indent=2)
    logger.info(f"Best hyperparameters saved to {hp_results_path}")

    return best_hp, best_model


def main():
    """Main function to train beauty prediction model"""
    # Parse command line arguments
    args = parse_args()

    # Update global variables based on args
    global DATA_DIR, DATASET_DIR, IMAGES_DIR, LABELS_FILE, MODEL_PATH, EPOCHS, BATCH_SIZE, gpus
    if args.data_dir != DATA_DIR:
        DATA_DIR = args.data_dir
        DATASET_DIR = os.path.join(DATA_DIR, "SCUT-FBP5500")
        IMAGES_DIR = (
            args.images_dir if args.images_dir else os.path.join(DATASET_DIR, "Images")
        )
        LABELS_FILE = (
            args.labels_file
            if args.labels_file
            else os.path.join(DATASET_DIR, "labels.txt")
        )
    elif args.images_dir:
        # User specified images directory directly
        IMAGES_DIR = args.images_dir

    if args.labels_file:
        # User specified labels file directly
        LABELS_FILE = args.labels_file

    if args.model_path != MODEL_PATH:
        MODEL_PATH = args.model_path

    # Apply quick-train settings if requested
    if args.quick_train:
        logger.info("Using quick training settings (smaller model, fewer epochs)")
        args.epochs = min(args.epochs, 5)  # Limit to 5 epochs
        args.batch_size = min(args.batch_size, 16)  # Small batch size
        args.no_pretrained = True  # No pretrained weights

        # Update the model path to avoid overwriting a full model
        MODEL_PATH = MODEL_PATH.replace(".h5", "_quick.h5")
        args.model_path = MODEL_PATH
        logger.info(f"Changed model path to {MODEL_PATH} for quick training")

    # Create output directories if they don't exist
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)

    # Configure logger
    configure_logger()

    logger.info("Starting beauty model training script")
    logger.info(f"TensorFlow version: {tf.__version__}")
    logger.info(f"Arguments: {args}")

    # Just list available image folders and exit if requested
    if args.list_images:
        list_available_image_folders()
        return

    # Detect available GPUs
    try:
        # Try to get NVIDIA GPU info first using subprocess
        try:
            import subprocess

            nvidia_smi = subprocess.check_output(
                "nvidia-smi", shell=True, stderr=subprocess.DEVNULL
            )
            logger.info(f"NVIDIA SMI detected:\n{nvidia_smi.decode('utf-8').strip()}")
        except:
            logger.info("nvidia-smi not available or no NVIDIA GPU found")

        # Check if CUDA is available through TensorFlow
        gpus = tf.config.experimental.list_physical_devices("GPU")
        if gpus:
            logger.info(f"TensorFlow detected {len(gpus)} GPU(s): {gpus}")

            # Configure GPU memory settings
            for gpu in gpus:
                # Prevent TensorFlow from allocating all GPU memory at once
                tf.config.experimental.set_memory_growth(gpu, True)
                logger.info(f"Enabled memory growth for GPU {gpu}")

            # Enable mixed precision for better performance on modern NVIDIA GPUs
            try:
                policy = tf.keras.mixed_precision.Policy("mixed_float16")
                tf.keras.mixed_precision.set_global_policy(policy)
                logger.info(
                    f"Enabled mixed precision training with policy: {policy.name}"
                )
            except Exception as e:
                logger.warning(f"Couldn't set mixed precision policy: {str(e)}")

        else:
            gpus = []
            logger.warning("No GPUs detected by TensorFlow")

    except Exception as e:
        logger.error(f"Error during GPU detection: {str(e)}")
        logger.error(traceback.format_exc())
        gpus = []
        logger.warning("Falling back to CPU-only mode")

    # GPU summary
    if gpus and len(gpus) > 0:
        logger.info(f"Training will use GPU acceleration with {len(gpus)} GPU(s)")
    else:
        logger.info("Training will run on CPU only")

    # Test mode - just test the model and exit
    if args.test_only:
        if os.path.exists(MODEL_PATH):
            logger.info(f"Testing existing model at {MODEL_PATH}")
            test_model(MODEL_PATH)
            return
        else:
            logger.warning(f"Model file not found at {MODEL_PATH}.")
            # Ask if we should train the model first
            try:
                response = (
                    input("Would you like to train the model first? (y/n): ")
                    .strip()
                    .lower()
                )
                if response == "y" or response == "yes":
                    logger.info("Proceeding to train the model first...")
                    args.test_only = False  # Switch to training mode
                    args.force = True  # Force training
                else:
                    logger.info("Exiting as requested.")
                    return
            except Exception:
                # In case we're in a non-interactive environment
                logger.error(
                    "Cannot test a non-existent model. Run without --test-only to train the model first."
                )
                return

    # Check if model already exists
    if os.path.exists(MODEL_PATH) and not args.force:
        logger.info(f"Model already exists at {MODEL_PATH}. Use --force to overwrite.")
        logger.info("Testing existing model instead...")
        test_model(MODEL_PATH)
        return

    # Verify dataset
    logger.info(f"Verifying dataset...")
    logger.info(f"Looking for images in: {IMAGES_DIR}")
    logger.info(f"Looking for labels file at: {LABELS_FILE}")
    if not extract_dataset():
        logger.error("Failed to verify dataset")
        return

    # Load metadata
    logger.info("Loading dataset metadata...")
    metadata = load_dataset_metadata()
    if metadata is None or len(metadata) == 0:
        logger.error("Failed to load dataset metadata")
        return

    logger.info(f"Loaded metadata for {len(metadata)} images")

    # Create train/validation/test split
    try:
        # Split into train and temp sets
        train_data, temp_data = train_test_split(
            metadata, test_size=0.3, random_state=42
        )

        # Split temp into validation and test sets
        val_data, test_data = train_test_split(
            temp_data, test_size=0.5, random_state=42
        )

        logger.info(
            f"Data split: Train: {len(train_data)}, "
            f"Validation: {len(val_data)}, Test: {len(test_data)}"
        )

        # Save splits for later use
        train_data.to_csv(os.path.join(DATA_DIR, "train_data.csv"), index=False)
        val_data.to_csv(os.path.join(DATA_DIR, "val_data.csv"), index=False)
        test_data.to_csv(os.path.join(DATA_DIR, "test_data.csv"), index=False)

        # Run hyperparameter optimization if requested
        best_hp = None
        if args.optimize_hyperparams:
            try:
                logger.info("Starting hyperparameter optimization...")
                hp_output_dir = os.path.join(os.path.dirname(MODEL_PATH), "hp_tuning")
                os.makedirs(hp_output_dir, exist_ok=True)

                # Run hyperparameter optimization with command line parameters
                best_hp, best_model = run_hyperparameter_optimization(
                    train_data,
                    val_data,
                    hp_output_dir,
                    max_trials=args.optimization_trials,
                    epochs=args.optimization_epochs,
                )

                logger.info("Hyperparameter optimization completed")
                logger.info(f"Best hyperparameters: {best_hp.values}")

                # Use the best hyperparameters for training
                args.model = best_hp.values.get("model_type", args.model)
                args.lr = best_hp.values.get("learning_rate", args.lr)
                args.trainable_base = best_hp.values.get(
                    "trainable_base", args.trainable_base
                )
                args.no_pretrained = not best_hp.values.get(
                    "use_pretrained", not args.no_pretrained
                )

                logger.info(
                    f"Updated training parameters based on optimization: model={args.model}, lr={args.lr}, trainable_base={args.trainable_base}, no_pretrained={args.no_pretrained}"
                )

            except ImportError:
                logger.warning(
                    "keras-tuner is not installed. Skipping hyperparameter optimization."
                )
                logger.warning("Install keras-tuner with: pip install keras-tuner")
            except Exception as e:
                logger.error(f"Error during hyperparameter optimization: {str(e)}")
                logger.error(traceback.format_exc())
                logger.warning("Continuing with default hyperparameters")

        # Define model configuration
        model_config = {
            "model_type": args.model,
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "trainable_base": args.trainable_base,
            "learning_rate": args.lr,
            "output_path": MODEL_PATH,
            "use_pretrained": not args.no_pretrained,
        }

        logger.info(f"Model configuration: {model_config}")

        # Train the model
        history = train_model(data_train=train_data, data_val=val_data, **model_config)

        if history is None:
            logger.error("Training failed")
            return

        # Evaluate on test set
        logger.info("Evaluating on test set...")
        model = tf.keras.models.load_model(MODEL_PATH)

        # Create test generator
        _, preprocessing_func = create_model(
            model_type=model_config["model_type"],
            use_pretrained=model_config["use_pretrained"],
        )
        test_generator = BeautyDataGenerator(
            test_data,
            batch_size=model_config["batch_size"],
            preprocessing=preprocessing_func,
            augment=False,
        )

        # Evaluate
        results = model.evaluate(test_generator)
        logger.info(f"Test loss (MSE): {results[0]:.4f}")
        logger.info(f"Test MAE: {results[1]:.4f}")

        # Save evaluation results
        with open(
            os.path.join(os.path.dirname(MODEL_PATH), "evaluation_results.json"), "w"
        ) as f:
            json.dump(
                {
                    "test_loss": float(results[0]),
                    "test_mae": float(results[1]),
                    "training_epochs": len(history.history["loss"]),
                    "final_train_loss": float(history.history["loss"][-1]),
                    "final_val_loss": float(history.history["val_loss"][-1]),
                    "timestamp": datetime.datetime.now().isoformat(),
                    "model_config": model_config,
                    "hyperparameter_optimization": best_hp.values if best_hp else None,
                },
                f,
                indent=4,
            )

        logger.info(
            f"Model training completed successfully. Model saved to {MODEL_PATH}"
        )

        # Test the trained model
        logger.info("Testing the trained model...")
        test_model(MODEL_PATH)

        # Plot training history
        try:
            import matplotlib.pyplot as plt

            plt.figure(figsize=(12, 4))

            # Plot loss
            plt.subplot(1, 2, 1)
            plt.plot(history.history["loss"], label="Train")
            plt.plot(history.history["val_loss"], label="Validation")
            plt.title("Model Loss")
            plt.ylabel("Loss")
            plt.xlabel("Epoch")
            plt.legend()

            # Plot MAE
            plt.subplot(1, 2, 2)
            plt.plot(history.history["mae"], label="Train")
            plt.plot(history.history["val_mae"], label="Validation")
            plt.title("Model MAE")
            plt.ylabel("MAE")
            plt.xlabel("Epoch")
            plt.legend()

            # Save plot
            plot_path = os.path.join(
                os.path.dirname(MODEL_PATH), "training_history.png"
            )
            plt.tight_layout()
            plt.savefig(plot_path)
            logger.info(f"Training history plot saved to {plot_path}")
        except Exception as e:
            logger.warning(f"Failed to create training history plot: {str(e)}")

    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        traceback.print_exc()


if __name__ == "__main__":
    main()
