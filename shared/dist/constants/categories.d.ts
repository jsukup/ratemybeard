import type { CategoryName, CategoryConfig } from '../types';
/**
 * Category configuration for the rating system
 */
export declare const CATEGORY_CONFIGS: CategoryConfig[];
export declare const LEGACY_CATEGORY_MAP: Record<string, CategoryName>;
export declare const CATEGORY_THRESHOLDS: {
    readonly Elite: {
        readonly min: 0;
        readonly max: 10;
    };
    readonly Beautiful: {
        readonly min: 10;
        readonly max: 30;
    };
    readonly Average: {
        readonly min: 30;
        readonly max: 70;
    };
    readonly 'Below Average': {
        readonly min: 70;
        readonly max: 90;
    };
    readonly 'Needs Work': {
        readonly min: 90;
        readonly max: 100;
    };
};
export declare function getCategoryConfig(categoryName: CategoryName): CategoryConfig | undefined;
export declare function getCategoryFromPercentile(percentile: number): CategoryName;
export declare function mapLegacyCategory(oldCategory: string): CategoryName;
export declare function getCategoryBadgeColor(category: CategoryName): string;
export declare function getCategoryDescription(category: CategoryName): string;
export declare function getCategoryLabel(category: CategoryName): string;
export declare const MIN_RATINGS_FOR_RANKING = 10;
export declare const DEFAULT_CATEGORY: CategoryName;
//# sourceMappingURL=categories.d.ts.map