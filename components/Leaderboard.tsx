"use client";

import { useEffect, useState, useRef } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Star, Trophy, Users, TrendingUp, Sparkles, Flag } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdContainer } from "@/components/AdScriptFixed";
import { getLeaderboardData } from "@/utils/medianCalculation";
import { getRatingColor, getRatingBgColor } from "@/lib/utils";
import { InlineRatingSlider } from "@/components/InlineRatingSlider";
import { getOrCreateSessionId } from "@/lib/session";
import { ImageModal } from "@/components/ImageModal";
import { ReportModal } from "@/components/ReportModal";
import { MobileRatingModal } from "@/components/MobileRatingModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Updated interface for the new rating system
interface LeaderboardImage {
  id: string;
  username: string;
  image_url: string;
  median_score: number;
  rating_count: number;
  created_at: string;
  category: string;
  isUnrated?: boolean;
}

type CategoryName = "Newest" | "Elite" | "Beautiful" | "Average" | "Below Average" | "Needs Work";

interface CategoryConfig {
  name: CategoryName;
  label: string;
  icon: React.ReactNode | null;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  { 
    name: "Newest", 
    label: "Latest Uploads", 
    icon: null, 
    color: "bg-gradient-to-r from-emerald-500 to-green-500",
    description: "Fresh uploads waiting for ratings - be the first to rate!"
  },
  { 
    name: "Elite", 
    label: "Elite Feet", 
    icon: null, 
    color: "bg-gradient-to-r from-yellow-400 to-amber-500",
    description: "Top 10% - The absolute finest feet you'll find here"
  },
  { 
    name: "Beautiful", 
    label: "Keen Kicks", 
    icon: null, 
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    description: "Top 11-30% - Genuinely attractive and well-maintained"
  },
  { 
    name: "Average", 
    label: "Jiggy Piggys", 
    icon: null, 
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    description: "Middle 31-70% - Probably attracting some perv's attention"
  },
  { 
    name: "Below Average", 
    label: "Crows Toes", 
    icon: null, 
    color: "bg-gradient-to-r from-orange-500 to-red-400",
    description: "Bottom 71-90% - Are you even human?"
  },
  { 
    name: "Needs Work", 
    label: "Puke", 
    icon: null, 
    color: "bg-gradient-to-r from-red-500 to-rose-600",
    description: "Bottom 10% - Consider amputation"
  },
];

const MIN_RATINGS_FOR_RANKING = 10;

interface LeaderboardProps {
  submittedEntryId?: string | null;
}

// Custom spinner component
function Spinner({ className }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-t-2 border-primary ${className || 'h-4 w-4'}`}></div>
  );
}

export default function Leaderboard({ submittedEntryId }: LeaderboardProps) {
  const [images, setImages] = useState<LeaderboardImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryName>("Newest");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedImage, setSelectedImage] = useState<LeaderboardImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportImage, setReportImage] = useState<LeaderboardImage | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [mobileRatingImage, setMobileRatingImage] = useState<LeaderboardImage | null>(null);
  const [isMobileRatingModalOpen, setIsMobileRatingModalOpen] = useState(false);

  // Map old category names to new ones for backward compatibility
  const mapOldCategoryToNew = (oldCategory: string): CategoryName => {
    switch (oldCategory) {
      case 'Smoke Shows': return 'Elite';
      case 'Monets': return 'Beautiful';
      case 'Mehs': return 'Average';
      case 'Plebs': return 'Below Average';
      case 'Dregs': return 'Needs Work';
      case 'Newest': return 'Newest';
      default: return 'Average'; // fallback
    }
  };

  // Categorize images by their category (with safety check and mapping)
  const categorizedImages = Array.isArray(images) ? images.reduce((acc, image) => {
    const mappedCategory = mapOldCategoryToNew(image.category);
    if (!acc[mappedCategory]) acc[mappedCategory] = [];
    acc[mappedCategory].push(image);
    return acc;
  }, {} as Record<CategoryName, LeaderboardImage[]>) : {} as Record<CategoryName, LeaderboardImage[]>;

  // Get stats for display (with safety checks)
  const totalImages = Array.isArray(images) ? images.length : 0;
  const totalRatings = Array.isArray(images) ? images.reduce((sum, img) => sum + img.rating_count, 0) : 0;
  const averageRating = totalRatings > 0 && Array.isArray(images)
    ? images.reduce((sum, img) => sum + (img.median_score * img.rating_count), 0) / totalRatings 
    : 0;

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Database connection not configured. Please check your environment variables.');
      }

      // Fetch both rated and unrated images
      const [ratedResult, unratedResult] = await Promise.all([
        // Fetch rated images for categories
        getLeaderboardData({
          minRatings: MIN_RATINGS_FOR_RANKING,
          limit: 1000,
          sortBy: 'median_score',
          sortOrder: 'desc',
          includeUnrated: false
        }),
        // Fetch unrated images for "Newest" tab
        getLeaderboardData({
          minRatings: 0,
          limit: 100,
          sortBy: 'created_at',
          sortOrder: 'desc',
          includeUnrated: true
        })
      ]);

      if (ratedResult === null || unratedResult === null) {
        throw new Error('Failed to fetch leaderboard data');
      }

      // Combine all images and mark unrated ones
      const allImages = [
        ...ratedResult.data.map(img => ({ ...img, isUnrated: img.rating_count < MIN_RATINGS_FOR_RANKING })),
        ...unratedResult.data
          .filter(img => img.rating_count < MIN_RATINGS_FOR_RANKING)
          .map(img => ({ ...img, category: 'Newest', isUnrated: true }))
      ];

      setImages(allImages);

    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      
      let errorMessage = 'Failed to load leaderboard data.';
      if (err instanceof Error) {
        if (err.message.includes('not configured')) {
          errorMessage = 'Database connection not available. Please try again later.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when refreshKey changes
  useEffect(() => {
    fetchLeaderboardData();
  }, [refreshKey]);

  // Auto-refresh when a new entry is submitted
  useEffect(() => {
    if (submittedEntryId) {
      // Wait a moment for the database to update, then refresh
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 1000);
    }
  }, [submittedEntryId]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle mobile rating submission
  const handleMobileRatingSubmit = (rating: number, updatedStats?: { median_score: number; rating_count: number }) => {
    console.log('Mobile rating submitted:', rating, 'Updated stats:', updatedStats);
    
    if (updatedStats && mobileRatingImage) {
      // Optimistic update - immediately update the image data
      setImages(prevImages => 
        prevImages.map(img => 
          img.id === mobileRatingImage.id 
            ? { 
                ...img, 
                rating_count: updatedStats.rating_count,
                median_score: updatedStats.median_score 
              }
            : img
        )
      );
    }
    
    // Close modal
    setIsMobileRatingModalOpen(false);
    setMobileRatingImage(null);
    
    // Also trigger full refresh to ensure consistency
    // Delayed to allow confetti animation to complete
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      console.log('Leaderboard refresh triggered after mobile rating');
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getCategoryBadgeColor = (category: CategoryName) => {
    const config = CATEGORY_CONFIGS.find(c => c.name === category);
    return config?.color || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center space-y-4">
          <Spinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4" 
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="m-4">
        <CardContent className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Ranked Images Yet</h3>
          <p className="text-muted-foreground mb-4">
            Images need at least {MIN_RATINGS_FOR_RANKING} ratings to appear on the leaderboard.
          </p>
          <Button onClick={handleRefresh}>
            Check Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview - Compact */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4 mb-2">
        <Card>
          <CardContent className="p-2 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-primary">{totalImages}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Ranked Images</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-primary">{totalRatings.toLocaleString()}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Total Ratings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-primary">{averageRating.toFixed(2)}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Average Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Navigation */}
      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryName)}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 mb-2 md:mb-4">
          {CATEGORY_CONFIGS.map((config) => {
            const isActive = activeCategory === config.name;
            const categoryImages = categorizedImages[config.name] || [];
            
            return (
              <button
                key={config.name}
                onClick={() => setActiveCategory(config.name)}
                className={`
                  relative group overflow-hidden rounded-lg md:rounded-xl p-2 md:p-4 lg:p-5 transition-all duration-300 ease-out
                  transform hover:scale-105 hover:shadow-xl active:scale-95
                  border-2 text-white font-semibold text-xs md:text-sm lg:text-base
                  ${
                    isActive 
                      ? `${config.color} border-white shadow-lg scale-105` 
                      : `${config.color} border-transparent opacity-80 hover:opacity-100`
                  }
                `}
              >
                {/* Background overlay for better text contrast */}
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center space-y-1 md:space-y-2">
                  {config.icon && (
                    <div className="flex items-center justify-center">
                      {config.icon}
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-bold leading-tight">{config.label}</div>
                    <div className="text-xs opacity-90 mt-0.5 md:mt-1 hidden sm:block">
                      {categoryImages.length} {categoryImages.length === 1 ? 'image' : 'images'}
                    </div>
                  </div>
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-1 bg-white rounded-full"></div>
                )}
                
                {/* Hover effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity duration-300"></div>
              </button>
            );
          })}
        </div>
        
        {/* Category Description - Hidden on mobile for space optimization */}
        <div className="hidden md:block mb-2 p-3 bg-card rounded-lg border-l-4 border-primary">
          <p className="text-lg text-center italic">
            {CATEGORY_CONFIGS.find(c => c.name === activeCategory)?.description}
          </p>
        </div>

        {CATEGORY_CONFIGS.map((config) => {
          const categoryImages = categorizedImages[config.name] || [];
          const isActive = activeCategory === config.name;
          
          if (!isActive) return null;
          
          return (
            <div key={config.name}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {config.icon && config.icon}
                    {config.label}
                    <Badge variant="secondary">{categoryImages.length}</Badge>
                  </CardTitle>
                  <CardDescription>Click on an image to see it full size</CardDescription>
                </CardHeader>
                
                <CardContent className="p-3 md:p-6">
                  {categoryImages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No images in this category yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-xs">Rank</TableHead>
                            <TableHead className="w-16 sm:w-20 text-xs">Image</TableHead>
                            <TableHead className="text-xs">Username</TableHead>
                            <TableHead className="text-center text-xs min-w-[200px] hidden sm:table-cell">Rate</TableHead>
                            <TableHead className="text-center text-xs sm:hidden">Rate</TableHead>
                            <TableHead className="text-center text-xs">Rating</TableHead>
                            <TableHead className="text-center text-xs hidden sm:table-cell">Votes</TableHead>
                            <TableHead className="text-center text-xs">Flag</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryImages.map((image, index) => {
                            // For "Newest" tab, don't show rankings since they're unrated
                            // For other categories, show category-based ranking
                            const isNewestTab = activeCategory === "Newest";
                            const displayRank = isNewestTab ? null : index + 1;
                            const isNewSubmission = image.id === submittedEntryId;
                            
                            return (
                              <TableRow 
                                key={image.id}
                                className={isNewSubmission ? "bg-green-50 border-green-200" : ""}
                              >
                                <TableCell className="font-medium text-xs">
                                  {isNewestTab ? (
                                    <Badge variant="outline" className="text-xs">
                                      New
                                    </Badge>
                                  ) : (
                                    `#${displayRank}`
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="relative group">
                                    <img 
                                      src={image.image_url} 
                                      alt={`${image.username}'s submission`}
                                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg transition-all duration-300 ease-in-out hover:scale-[2.5] hover:z-50 hover:shadow-2xl cursor-pointer relative"
                                      loading="lazy"
                                      onClick={() => {
                                        setSelectedImage(image);
                                        setIsModalOpen(true);
                                      }}
                                    />
                                    {isNewSubmission && (
                                      <Badge className="absolute -top-2 -right-2 text-xs bg-green-500">
                                        New!
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-xs sm:text-sm max-w-24 truncate">
                                  {image.username}
                                </TableCell>
                                <TableCell className="text-center hidden sm:table-cell min-w-[200px]">
                                  {image.isUnrated || image.rating_count < MIN_RATINGS_FOR_RANKING ? (
                                    <ErrorBoundary>
                                      <InlineRatingSlider 
                                        imageId={image.id}
                                        onRatingSubmit={(rating, updatedStats) => {
                                          console.log('Rating submitted successfully:', rating);
                                          console.log('Updated stats received:', updatedStats);
                                          
                                          if (updatedStats) {
                                            // Optimistic update - immediately update the image data
                                            setImages(prevImages => 
                                              prevImages.map(img => 
                                                img.id === image.id 
                                                  ? { 
                                                      ...img, 
                                                      rating_count: updatedStats.rating_count,
                                                      median_score: updatedStats.median_score 
                                                    }
                                                  : img
                                              )
                                            );
                                          }
                                          
                                          // Also trigger full refresh to ensure consistency
                                          // Delayed to allow confetti animation to complete
                                          setTimeout(() => {
                                            setRefreshKey(prev => prev + 1);
                                            console.log('Leaderboard refresh triggered');
                                          }, 2000);
                                        }}
                                        className="w-full max-w-[180px] mx-auto"
                                      />
                                    </ErrorBoundary>
                                  ) : (
                                    <div className="text-xs text-muted-foreground">
                                      Already rated
                                    </div>
                                  )}
                                </TableCell>
                                {/* Mobile rating button - shows when rate column is hidden */}
                                <TableCell className="text-center sm:hidden">
                                  {image.isUnrated || image.rating_count < MIN_RATINGS_FOR_RANKING ? (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => {
                                        setMobileRatingImage(image);
                                        setIsMobileRatingModalOpen(true);
                                      }}
                                    >
                                      Rate
                                    </Button>
                                  ) : (
                                    <div className="text-xs text-muted-foreground">
                                      Rated
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {image.isUnrated || image.rating_count < MIN_RATINGS_FOR_RANKING ? (
                                    <Badge variant="outline" className="text-xs">
                                      Needs {Math.max(0, MIN_RATINGS_FOR_RANKING - image.rating_count)} more ratings
                                    </Badge>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                                      <span className={getRatingColor(image.median_score)}>
                                        {image.median_score.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-center hidden sm:table-cell">
                                  <Badge variant="outline" className="text-xs">
                                    {image.rating_count}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                    onClick={() => {
                                      setReportImage(image);
                                      setIsReportModalOpen(true);
                                    }}
                                    title="Report this image"
                                  >
                                    <Flag className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </Tabs>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Refresh Leaderboard
        </Button>
      </div>

      {/* Ad Container */}
      <AdContainer 
        className="w-full h-24"
        adSlot="leaderboard-bottom-horizontal"
        adFormat="leaderboard"
        responsive={true}
      />

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedImage(null);
          }}
          image={selectedImage}
          rank={selectedImage.isUnrated || selectedImage.rating_count < MIN_RATINGS_FOR_RANKING ? null : images.findIndex(img => img.id === selectedImage.id) + 1}
        />
      )}

      {/* Report Modal */}
      {reportImage && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setReportImage(null);
          }}
          imageId={reportImage.id}
          username={reportImage.username}
          imageUrl={reportImage.image_url}
        />
      )}

      {/* Mobile Rating Modal */}
      {mobileRatingImage && (
        <MobileRatingModal
          isOpen={isMobileRatingModalOpen}
          onClose={() => {
            setIsMobileRatingModalOpen(false);
            setMobileRatingImage(null);
          }}
          image={{
            id: mobileRatingImage.id,
            image_url: mobileRatingImage.image_url,
            username: mobileRatingImage.username,
          }}
          onRatingSubmit={handleMobileRatingSubmit}
        />
      )}

    </div>
  );
}