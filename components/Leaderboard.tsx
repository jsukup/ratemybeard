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
import { AlertCircle, Star, Trophy, Users, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdContainer } from "@/components/AdScript";
import { getLeaderboardData } from "@/utils/medianCalculation";

// Updated interface for the new rating system
interface LeaderboardImage {
  id: string;
  username: string;
  image_url: string;
  median_score: number;
  rating_count: number;
  created_at: string;
  category: string;
}

type CategoryName = "Smoke Shows" | "Monets" | "Mehs" | "Plebs" | "Dregs";

interface CategoryConfig {
  name: CategoryName;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  { 
    name: "Smoke Shows", 
    label: "🔥 The Smoke Shows", 
    icon: <Trophy className="h-4 w-4" />, 
    color: "bg-yellow-500",
    description: "Top 10% - Absolutely stunning!"
  },
  { 
    name: "Monets", 
    label: "🎨 The Monets", 
    icon: <Star className="h-4 w-4" />, 
    color: "bg-purple-500",
    description: "Top 11-30% - Beautiful from afar"
  },
  { 
    name: "Mehs", 
    label: "😐 The Mehs", 
    icon: <Users className="h-4 w-4" />, 
    color: "bg-blue-500",
    description: "Middle 31-70% - Average attractiveness"
  },
  { 
    name: "Plebs", 
    label: "👎 The Plebs", 
    icon: <TrendingUp className="h-4 w-4" />, 
    color: "bg-orange-500",
    description: "Bottom 71-90% - Below average"
  },
  { 
    name: "Dregs", 
    label: "💀 The Dregs", 
    icon: <AlertCircle className="h-4 w-4" />, 
    color: "bg-red-500",
    description: "Bottom 10% - Needs improvement"
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
  const [activeCategory, setActiveCategory] = useState<CategoryName>("Smoke Shows");
  const [refreshKey, setRefreshKey] = useState(0);

  // Categorize images by their category (with safety check)
  const categorizedImages = Array.isArray(images) ? images.reduce((acc, image) => {
    const category = image.category as CategoryName;
    if (!acc[category]) acc[category] = [];
    acc[category].push(image);
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

      const result = await getLeaderboardData({
        minRatings: MIN_RATINGS_FOR_RANKING,
        limit: 1000,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      if (result === null) {
        throw new Error('Failed to fetch leaderboard data');
      }

      setImages(result.data || []);

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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalImages}</div>
            <div className="text-sm text-muted-foreground">Ranked Images</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalRatings.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Ratings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{averageRating.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Navigation */}
      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryName)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
          {CATEGORY_CONFIGS.map((config) => (
            <TabsTrigger key={config.name} value={config.name} className="text-xs p-2 sm:p-3">
              <span className="hidden md:inline">{config.icon}</span>
              <span className="ml-0 md:ml-1 truncate">{config.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORY_CONFIGS.map((config) => {
          const categoryImages = categorizedImages[config.name] || [];
          
          return (
            <TabsContent key={config.name} value={config.name}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {config.icon}
                    {config.label}
                    <Badge variant="secondary">{categoryImages.length}</Badge>
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
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
                            <TableHead className="text-center text-xs">Rating</TableHead>
                            <TableHead className="text-center text-xs hidden sm:table-cell">Votes</TableHead>
                            <TableHead className="text-center text-xs hidden md:table-cell">Submitted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryImages.map((image, index) => {
                            const globalRank = images.findIndex(img => img.id === image.id) + 1;
                            const isNewSubmission = image.id === submittedEntryId;
                            
                            return (
                              <TableRow 
                                key={image.id}
                                className={isNewSubmission ? "bg-green-50 border-green-200" : ""}
                              >
                                <TableCell className="font-medium text-xs">
                                  #{globalRank}
                                </TableCell>
                                <TableCell>
                                  <div className="relative">
                                    <img 
                                      src={image.image_url} 
                                      alt={`${image.username}'s submission`}
                                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                                      loading="lazy"
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
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                                    <span className="font-bold text-sm sm:text-lg">
                                      {image.median_score.toFixed(2)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center hidden sm:table-cell">
                                  <Badge variant="outline" className="text-xs">
                                    {image.rating_count}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center text-xs text-muted-foreground hidden md:table-cell">
                                  {formatDate(image.created_at)}
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
            </TabsContent>
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
        adFormat="horizontal"
        responsive={true}
      />
    </div>
  );
}