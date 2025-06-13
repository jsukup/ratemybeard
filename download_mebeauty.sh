#!/bin/bash
set -e

# Directory paths
DATASET_DIR="/root/looxmaxx/api/data/mebeauty"
IMAGES_DIR="${DATASET_DIR}/cropped_images"
SCORES_DIR="${DATASET_DIR}/scores"
REPO_URL="https://github.com/fbplab/MEBeauty-database.git"
REPO_DIR="/tmp/mebeauty-repo"

echo "Setting up directories for MEBeauty dataset..."

# Create directories if they don't exist
mkdir -p "${IMAGES_DIR}/flat"
mkdir -p "${SCORES_DIR}"

# Clone the repository if it doesn't exist
if [ ! -d "${REPO_DIR}" ]; then
    echo "Cloning MEBeauty repository..."
    git clone "${REPO_URL}" "${REPO_DIR}"
else
    echo "Repository already exists, pulling latest changes..."
    cd "${REPO_DIR}"
    git pull
fi

echo "Copying cropped images to dataset directory..."

# Get all image files from the repository and copy to the flat directory
find "${REPO_DIR}/cropped_images/images_crop_align_mtcnn" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -exec cp {} "${IMAGES_DIR}/flat" \;

echo "Copying score files to dataset directory..."

# Copy score files - updated path to include /scores subdirectory
for scorefile in "${REPO_DIR}/scores/generic_scores_all_2022.xlsx" "${REPO_DIR}/scores/train_2022.txt" "${REPO_DIR}/scores/val_2022.txt" "${REPO_DIR}/scores/test_2022.txt"; do
    if [ -f "${scorefile}" ]; then
        cp "${scorefile}" "${SCORES_DIR}/"
        echo "Copied $(basename "${scorefile}")"
    else
        echo "Warning: Score file $(basename "${scorefile}") not found in repository"
    fi
done

# Also copy backup score files in case the 2022 versions are missing
echo "Copying backup score files if needed..."
for backup_scorefile in "${REPO_DIR}/scores/generic_scores_all.xlsx" "${REPO_DIR}/scores/train.txt" "${REPO_DIR}/scores/val.txt" "${REPO_DIR}/scores/test.txt"; do
    base_filename=$(basename "${backup_scorefile}")
    primary_file="${SCORES_DIR}/$(echo "${base_filename}" | sed 's/\./_2022\./g')"
    # Only copy if the 2022 version doesn't exist
    if [ ! -f "${primary_file}" ] && [ -f "${backup_scorefile}" ]; then
        cp "${backup_scorefile}" "${SCORES_DIR}/"
        echo "Copied backup file ${base_filename}"
    fi
done

# Count the images and score files
FLAT_IMAGE_COUNT=$(find "${IMAGES_DIR}/flat" -type f | wc -l)
SCORE_FILE_COUNT=$(find "${SCORES_DIR}" -type f | wc -l)

echo "MEBeauty dataset preparation complete!"
echo "--------------------------------------"
echo "Dataset location: ${DATASET_DIR}"
echo "Images: ${IMAGES_DIR}/flat (${FLAT_IMAGE_COUNT} files)"
echo "Scores: ${SCORES_DIR} (${SCORE_FILE_COUNT} files)"

# Clean up
echo "Cleaning up temporary files..."
# Remove the temporary repository
rm -rf "${REPO_DIR}"

echo "Done!" 