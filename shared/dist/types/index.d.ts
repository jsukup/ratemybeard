export * from './supabase';
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}
export interface RatingSliderProps {
    imageId: string;
    onRatingSubmit: (rating: number, updatedStats?: {
        median_score: number;
        rating_count: number;
    }) => void;
    disabled?: boolean;
    className?: string;
}
export interface RatingButtonsGridProps {
    imageId: string;
    onSubmit: (rating: number) => void;
    disabled?: boolean;
    compact?: boolean;
}
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}
export interface ImageModalProps extends ModalProps {
    image: {
        id: string;
        image_url: string;
        username: string;
        median_score?: number;
        rating_count?: number;
    };
    rank?: number | null;
}
export interface ReportModalProps extends ModalProps {
    imageId: string;
    username: string;
    imageUrl: string;
}
export interface WebcamCaptureProps {
    onImageCapture?: (image: string | null) => void;
    onImageUploaded?: (imageData: {
        id: string;
        username: string;
        image_url: string;
    }) => void;
    onAddToLeaderboard?: () => void;
}
export interface SessionData {
    sessionId: string;
    createdAt: string;
    expiresAt: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface LeaderboardDataParams {
    minRatings?: number;
    limit?: number;
    sortBy?: 'median_score' | 'rating_count' | 'created_at';
    sortOrder?: 'asc' | 'desc';
    includeUnrated?: boolean;
}
export interface LeaderboardDataResult {
    data: import('./supabase').LeaderboardImage[];
    totalCount: number;
}
export interface AppError {
    code: string;
    message: string;
    details?: any;
}
export interface PlatformSpecific {
    storage: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<void>;
        remove: (key: string) => Promise<void>;
    };
    camera: {
        hasPermission: () => Promise<boolean>;
        requestPermission: () => Promise<boolean>;
        takePicture: () => Promise<string>;
    };
    navigation: {
        navigate: (route: string, params?: any) => void;
        goBack: () => void;
    };
}
//# sourceMappingURL=index.d.ts.map