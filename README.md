# LooxMaxx – AI-Powered Attractiveness Analyzer

LooxMaxx is a mobile-friendly, single-page web app that allows users to take a real-time photo using their webcam or smartphone camera. The image is analyzed using DeepFace via FastAPI, and an attractiveness score is generated. Users can optionally submit their image, screen name, and score to a public leaderboard.

## Features

- **Real-time Photo Capture**: Take photos with webcam or smartphone camera
- **AI Analysis**: Get an attractiveness score using DeepFace AI
- **Leaderboard**: Submit your photo and score to a public leaderboard
- **Mobile-Friendly**: Responsive design works on desktop and mobile
- **Ad-Supported**: Built with ad placement in mind

## Tech Stack

### Frontend

- ReactJS (Next.js)
- Styling: ShadCN + Tailwind CSS
- Image capture: Webcam API

### Backend

- FastAPI (hosted on Vercel)
- Image analysis via DeepFace
- TFLite models for facial beauty assessment (SCUT-FBP5500 and MEBeauty)

### Database & Storage

- Supabase for storing leaderboard data
- Supabase Storage for user images

### Hosting & Deployment

- Vercel (Main: looxmaxx.com, Staging: staging.looxmaxx.com)

## Installation and Setup

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+ (for FastAPI backend)
- Supabase account

### Frontend Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Supabase credentials:

   '''
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_URL=your_api_url
   SCUT_MODEL_URL=your_scut_model_blob_url
   MEBEAUTY_MODEL_URL=your_mebeauty_model_blob_url
   USE_REAL_MODELS=false
   '''

4. Run the development server:

   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the `api` directory
2. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the FastAPI server:

   ```bash
   uvicorn main:app --reload
   ```

### Supabase Setup

1. Create a new Supabase project
2. Create a table named `entries` with the following schema:

   ```sql
   CREATE TABLE entries (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id TEXT NOT NULL,
     screen_name TEXT NOT NULL,
     score INTEGER NOT NULL,
     image_url TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     is_visible BOOLEAN DEFAULT TRUE
   );
   ```

3. Set up Storage bucket named `images` with public read access

### AdSense Setup

1. Sign up for Google AdSense at [https://www.google.com/adsense](https://www.google.com/adsense)
2. Once approved, get your publisher ID from the AdSense dashboard
3. Replace the placeholder publisher ID in the following files:
   - `components/AdScript.tsx`: Update the `data-ad-client` attribute in the AdContainer component
   - `app/layout.tsx`: Update the src URL in the AdSense Script component
4. Update the `public/ads.txt` file with your publisher information
5. Create ad units in your AdSense dashboard and update the ad slot IDs in the app:
   - Left sidebar ad: Update `adSlot` prop in the AdContainer in `app/page.tsx`
   - Right sidebar ad: Update `adSlot` prop in the AdContainer in `app/page.tsx`
   - Bottom banner ad: Update `adSlot` prop in the AdContainer in `app/page.tsx`
   - In-content ad: Update `adSlot` prop in the AdContainer in `app/page.tsx`
   - Mobile ad: Update `adSlot` prop in the AdContainer in `app/page.tsx`
   - Leaderboard ad: Update `adSlot` prop in the AdContainer in `components/Leaderboard.tsx`

For testing during development, you can use the Google AdSense preview tool to visualize ads without actually displaying them.

## Deployment

### Frontend Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the repository in Vercel Dashboard
3. Configure the environment variables:

   '''
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_URL=your_deployed_api_url
   SCUT_MODEL_URL=your_scut_model_blob_url
   MEBEAUTY_MODEL_URL=your_mebeauty_model_blob_url
   USE_REAL_MODELS=false
   '''

4. Deploy!

### Backend Deployment to Vercel

1. In the Vercel Dashboard, create a new project for the API
2. Point to the `api` directory in your repository
3. Set the settings:
   - Framework Preset: Other
   - Build Command: None
   - Output Directory: None
4. Deploy!

### Domain Configuration

1. Purchase the domain (looxmaxx.com) from GoDaddy or your preferred registrar
2. Configure DNS settings to point to Vercel:
   - Add an A record to point to Vercel's IP address
   - Add CNAME records for www and staging subdomains

## ML Model Integration

The app uses two TFLite models for facial beauty assessment:

1. **SCUT-FBP5500**: A model trained on the SCUT-FBP5500 dataset
2. **MEBeauty**: A model trained on the MEBeauty dataset

### Feature Flag for Model Usage

The app includes a feature flag system to toggle between simulated and real model inference:

- `USE_REAL_MODELS=false`: Uses simulation mode (default)
- `USE_REAL_MODELS=true`: Uses the actual TFLite models

To enable real model inference:

1. Ensure the models are uploaded to Vercel Blob storage
2. Set the model URLs in environment variables:
   - `SCUT_MODEL_URL`: URL to the SCUT-FBP5500 model in Vercel Blob
   - `MEBEAUTY_MODEL_URL`: URL to the MEBeauty model in Vercel Blob
3. Set `USE_REAL_MODELS=true` in environment variables

### Model Uploads

To upload the models to Vercel Blob storage:

```bash
npm run upload-models
```

This script will upload the TFLite models from the `api/models` directory to Vercel Blob storage and output the URLs to use in your environment variables.

## Next Steps for Implementation

1. **Favicon and Logo**:
   - Add a custom logo and favicon to the `public` directory
   - Reference: looxmaxx.com/favicon.ico

2. **Google AdSense Integration**:
   - Sign up for a Google AdSense account
   - Update the AdSense publisher ID in `components/AdScript.tsx`
   - Place ad units strategically in the layout

3. **Analytics Setup**:
   - Implement Google Analytics or similar service
   - Add conversion tracking for key user actions

4. **User Experience Improvements**:
   - Add animations for score display
   - Implement a tutorial or guide for first-time users
   - Add social sharing capabilities

5. **Security Enhancements**:
   - Implement rate limiting on the API
   - Add content moderation for uploaded images
   - Set up image removal workflow

6. **Optimization**:
   - Optimize image handling and compression
   - Implement caching for frequently accessed data
   - Add server-side rendering for SEO benefits

## License

All rights reserved. This is a proprietary project.

## Support

For support, please contact [support@looxmaxx.com](mailto:support@looxmaxx.com).

DEPLOY TEST