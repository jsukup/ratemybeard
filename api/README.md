# LooxMaxx API

This is the backend API for LooxMaxx, an AI-Powered Attractiveness Analyzer. It uses FastAPI and DeepFace to analyze images and provide attractiveness scores.

## API Endpoints

### `GET /`

- **Description**: Health check endpoint
- **Response**: `{"message": "Welcome to LooxMaxx API"}`

### `POST /analyze`

- **Description**: Analyzes a face image and returns an attractiveness score
- **Request Body**:

  ```json
  {
    "image_data": "base64-encoded-image-data"
  }
  ```

- **Response**:

  ```json
  {
    "score": 85.5,
    "processing_time": 2.45
  }
  ```

- **Status Codes**:
  - `200 OK`: Analysis successful
  - `422 Unprocessable Entity`: Face detection or analysis failed
  - `500 Internal Server Error`: Server error

## Development Setup

1. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Run the server locally:

   ```
   uvicorn main:app --reload
   ```

3. Access the API documentation:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## Deployment

### Deploying to Vercel

1. Make sure you have the Vercel CLI installed:

   ```
   npm install -g vercel
   ```

2. Deploy from the current directory:

   ```
   vercel
   ```

## Score Calculation

The attractiveness score is calculated using various factors from the DeepFace analysis, including:

- Age (optimal range is considered 25-35)
- Dominant emotion (positive emotions contribute to higher scores)
- Gender is not a factor in scoring

The final score is normalized to a scale of 0-100.
