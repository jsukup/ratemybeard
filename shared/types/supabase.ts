export type ImageEntry = {
  id: string;
  username: string;
  image_url: string;
  image_name?: string;
  median_score?: number;
  rating_count: number;
  is_visible: boolean;
  created_at: string;
};

export type Rating = {
  id: string;
  image_id: string;
  rating: number;
  session_id: string;
  ip_address?: string;
  created_at: string;
};

export type LeaderboardImage = {
  id: string;
  username: string;
  image_url: string;
  median_score: number;
  rating_count: number;
  created_at: string;
  category: string;
  isUnrated?: boolean;
};

export type CategoryName = "Newest" | "Elite" | "Beautiful" | "Average" | "Below Average" | "Needs Work";

export interface CategoryConfig {
  name: CategoryName;
  label: string;
  icon: React.ReactNode | null;
  color: string;
  description: string;
}

export interface RatingSubmission {
  imageId: string;
  rating: number;
}

export interface RatingSubmissionData {
  rating: number;
  imageId: string;
  sessionId: string;
  ipAddress?: string;
}

export interface RatingResponse {
  success: boolean;
  rating: {
    id: string;
    rating: number;
    imageId: string;
    createdAt: string;
  };
  statsUpdated: boolean;
  updatedStats?: {
    median_score: number;
    rating_count: number;
  };
  message: string;
}