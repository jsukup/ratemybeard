"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from 'next/dynamic';
import Leaderboard from "@/components/Leaderboard";
import { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { AdContainer } from "@/components/AdScriptFixed";

// Dynamically import WebcamCaptureSimple to prevent SSR issues
const WebcamCaptureSimple = dynamic(() => import('@/components/WebcamCaptureSimple'), {
  ssr: false,
  loading: () => <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Loading Camera...</div>
});

// Check if Supabase is properly configured
const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Define base URL for API calls
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

// Custom spinner component
function Spinner({ className }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-t-2 border-primary ${className || 'h-4 w-4'}`}></div>
  );
}

// Wrap the main content in a separate component to use hooks
function HomeContent() {
  // Removed useModel dependency since we're using server-side prediction
  const [hasImage, setHasImage] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [scoreScale, setScoreScale] = useState<number>(5); // Default to 5-point scale
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [screenName, setScreenName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState("analyze");
  const [submittedEntryId, setSubmittedEntryId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [modelsPreloaded, setModelsPreloaded] = useState(false);

  // Preload models when the component mounts
  useEffect(() => {
    // Function to preload models
    const preloadModels = async () => {
      try {
        console.log('Initiating model preloading...');
        const response = await fetch(`${BASE_URL}/api/ensemble`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Model preloading initiated:', result);
          setModelsPreloaded(true);
        } else {
          console.warn('Failed to initiate model preloading');
        }
      } catch (error) {
        console.error('Error initiating model preload:', error);
      }
    };

    // Call the preload function
    preloadModels();
  }, []);

  // Function to ensure the 'images' bucket exists
  const ensureImagesBucketExists = async () => {
    try {
      // Instead of trying to create the bucket (which requires admin privileges),
      // let's just check if we can get the bucket details
      const { data, error } = await supabase.storage
        .from('images')
        .list('public', { limit: 1 });
      
      if (error) {
        console.error("Error accessing images bucket:", error);
        // Additional debugging info
        if (error.message.includes('The resource was not found')) {
          console.error("The 'images' bucket doesn't exist. Create it in the Supabase dashboard.");
        } else if (error.message.includes('permission')) {
          console.error("Permission denied to access the 'images' bucket.");
        }
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error checking images bucket access:", err);
      return false;
    }
  };

  const handleImageCapture = (image: string | null) => {
    setHasImage(!!image);
    setCurrentImage(image);
    setScore(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!currentImage) return;
    
    setAnalyzing(true);
    setProgressValue(0);
    setError(null);
    
    // Start progress animation
    const interval = setInterval(() => {
      setProgressValue((prev) => {
        const newValue = prev + Math.random() * 10;
        return newValue > 90 ? 90 : newValue;
      });
    }, 300);
    
    setProgressInterval(interval);
    
    try {
      // Set a client-side timeout for the entire operation (35 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 seconds to account for network latency
      
      // First check model status if we haven't confirmed preloading
      if (!modelsPreloaded) {
        try {
          const checkResponse = await fetch('/api/ensemble', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (checkResponse.ok) {
            setModelsPreloaded(true);
          }
        } catch (checkError) {
          console.warn('Failed to check model status:', checkError);
        }
      }
      
      // Use server-side API instead of client-side prediction
      const response = await fetch(`${BASE_URL}/api/ensemble`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_data: currentImage }),
        signal: controller.signal
      }).catch(error => {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. The server took too long to respond. Please try again.');
        }
        throw error;
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Not JSON, get the text and log it
        const textResponse = await response.text();
        console.error('Received non-JSON response:', textResponse.substring(0, 150) + '...');
        throw new Error('The server returned an invalid response format');
      }
      
      // Now we can safely parse JSON
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze image');
      }
      
      // Clear the progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
      
      // Set progress to 100% to indicate completion
      setProgressValue(100);
      
      // Check if this was a fallback result
      const wasFallback = result._fallback === true;
      
      // Wait a moment for the progress to complete visually
      setTimeout(() => {
        setScore(result.ensemble_score);
        setScoreScale(5); // Always using 5-point scale
        setAnalyzing(false);
        
        // Show a warning if we used fallback
        if (wasFallback) {
          console.warn('Used fallback scores due to server timeout');
          setError('Note: The analysis took longer than expected. For more accurate results, please try again.');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Clear the progress interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
      
      // Provide more specific error messages
      let errorMessage = 'Failed to analyze image';
      
      if (error instanceof Error) {
        if (error.message.includes('timed out') || error.message.includes('timeout')) {
          errorMessage = 'The analysis took too long. Please try again or use a different photo.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('format')) {
          errorMessage = 'The server returned an invalid response. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Set error state
      setError(errorMessage);
      setAnalyzing(false);
      setProgressValue(0);
    }
  };

  // Check if screen name is already taken
  const checkScreenNameExists = async (name: string) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, skipping database check');
      return false;
    }
    
    try {
      // Use ILIKE for case-insensitive matching
      const { data, error } = await supabase
        .from('entries')
        .select('screen_name')
        .ilike('screen_name', name.trim())
        .limit(1);
      
      if (error) {
        console.error('Error checking screen name:', error);
        throw error;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking screen name:', error);
      // Return true to prevent submission when there's an error checking
      // This is safer than allowing potentially duplicate names
      return true;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setFormError(null);
      
      // Check if agree terms checkbox is checked
      if (!agreeTerms) {
        setFormError('Please check the checkbox to proceed.');
        setSubmitting(false);
        return;
      }
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured) {
        setFormError('Database connection not available. Please try again later.');
        setSubmitting(false);
        return;
      }
      
      // Ensure the images bucket exists
      const bucketExists = await ensureImagesBucketExists();
      if (!bucketExists) {
        setFormError('Unable to access image storage. Please try again later or contact support if the issue persists.');
        setSubmitting(false);
        return;
      }
      
      // Check if screen name is already taken
      const nameExists = await checkScreenNameExists(screenName);
      if (nameExists) {
        setFormError('This username is already taken. Please choose a different one.');
        setSubmitting(false);
        return;
      }
      
      if (!currentImage) {
        setFormError('No image captured. Please take a photo first.');
        setSubmitting(false);
        return;
      }
      
      // Upload image to Supabase Storage
      try {
        console.log("Starting image upload to Supabase...");
        console.log("Current image format:", currentImage ? currentImage.substring(0, 50) + "..." : "No image");
        
        const imageData = currentImage.split(',')[1];
        console.log("Image data extracted:", imageData ? `${imageData.substring(0, 20)}... (length: ${imageData.length})` : "Failed to extract image data");
        
        if (!imageData) {
          setFormError('Invalid image data. Please try again.');
          setSubmitting(false);
          return;
        }
        
        const fileName = `${Date.now()}_${screenName.replace(/\s+/g, '_')}.jpg`;
        console.log("Generated filename:", fileName);
        
        // Check if Supabase is properly configured
        if (!supabase) {
          console.error("Supabase client is not initialized!");
          throw new Error('Supabase not configured');
        }
        
        // Convert base64 to Uint8Array for better browser compatibility
        console.log("Converting base64 to binary...");
        const binaryData = atob(imageData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        console.log("Converted to Uint8Array, length:", bytes.length);
        
        console.log("Attempting to upload to Supabase storage...");
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(`public/${fileName}`, bytes, {
            contentType: 'image/jpeg'
          });
        
        console.log("Upload result:", uploadError ? "Error" : "Success");
        
        if (uploadError) {
          console.error("Supabase storage upload error:", uploadError);
          console.error("Error message:", uploadError.message);
          console.error("Error details:", uploadError);
          setFormError(`Storage error: ${uploadError.message}`);
          throw uploadError;
        }
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(`public/${fileName}`);
        
        const imageUrl = publicUrlData.publicUrl;
        
        // Insert entry into Supabase
        console.log("Inserting entry with screen name:", screenName, "and score:", score);
        
        try {
          // With the database schema changed to accept decimals, we don't need to convert
          
          const { data: insertData, error: insertError } = await supabase
            .from('entries')
            .insert([
              {
                user_id: 'anonymous', // In a real app, use actual user IDs if available
                screen_name: screenName,
                score: score, // Use the original decimal score
                image_url: imageUrl,
                image_name: fileName,
                is_visible: true
              }
            ])
            .select();
          
          if (insertError) {
            console.error("Error inserting entry:", insertError);
            setFormError(`Database error: ${insertError.message || 'Failed to save entry'}`);
            throw insertError;
          }
          
          if (insertData && insertData.length > 0) {
            console.log("Successfully inserted entry:", insertData[0]);
            setSubmittedEntryId(insertData[0].id);
          } else {
            console.warn("Entry was inserted but no data was returned");
            // Try to fetch the newly created entry
            try {
              const { data: fetchedEntry, error: fetchError } = await supabase
                .from('entries')
                .select('*')
                .eq('screen_name', screenName)
                .order('created_at', { ascending: false })
                .limit(1);
                
              if (fetchError) throw fetchError;
              
              if (fetchedEntry && fetchedEntry.length > 0) {
                console.log("Found entry after insertion:", fetchedEntry[0]);
                setSubmittedEntryId(fetchedEntry[0].id);
              } else {
                console.error("Could not find the inserted entry");
              }
            } catch (err) {
              console.error("Error fetching newly created entry:", err);
            }
          }
          
          // Reset form
          setShowDialog(false);
          setScreenName("");
          setAgreeTerms(false);
          setError(null);
          
          // Switch to the leaderboard tab
          setActiveTab("leaderboard");
          
        } catch (err) {
          console.error('Error inserting entry:', err);
          setFormError('Failed to insert entry into database');
        }
        
      } catch (err) {
        console.error('Image upload error:', err);
        setError('Failed to upload image. Please try again later.');
        setFormError('Failed to upload image. Please try again later.');
      }
      
    } catch (err) {
      console.error('Submission error:', err);
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to submit to leaderboard';
      
      if (err instanceof Error) {
        // Log the detailed error for debugging
        console.error('Error details:', err.message);
        
        // Set a more specific error message based on the context
        if (err.message.includes('storage')) {
          errorMessage = 'Error uploading image. Please try again.';
        } else if (err.message.includes('duplicate')) {
          errorMessage = 'This username is already taken. Please choose a different one.';
        } else if (err.message.includes('permission')) {
          errorMessage = 'Permission denied. Please try again later.';
        } else if (err.message.includes('bucket')) {
          errorMessage = 'Storage configuration error. Please try again later.';
        }
      }
      
      setError(errorMessage);
      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8 flex flex-col items-center gap-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 logo-animation">
              <img 
                src="/mainlogo.png" 
                alt="LooxMaxx Logo" 
                className="h-24 mx-auto"
              />
            </div>
            <p className="text-xl text-white drop-shadow-lg font-semibold">
              🤯 Just Like Hot or Not....But With AI! 🤯
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full max-w-7xl">
            {/* Left Ad Space (desktop only) */}
            <aside className="hidden lg:block lg:col-span-2">
              <AdContainer 
                className="h-full"
                adSlot="left-sidebar-vertical"
                adFormat="vertical"
              />
            </aside>

            {/* Main Application Area */}
            <div className="col-span-1 lg:col-span-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="analyze">Analyze Photo</TabsTrigger>
                  <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                </TabsList>
                
                {/* Mobile-only ad between tabs and content */}
                <div className="block lg:hidden my-2">
                  <AdContainer 
                    className="w-full h-24"
                    adSlot="mobile-mid-horizontal"
                    adFormat="horizontal"
                    responsive={true}
                  />
                </div>

                <TabsContent value="analyze" className="mt-4 space-y-6">
                  <Card className="p-4 sm:p-6">
                    {hasImage && score !== null ? (
                      <div className="flex flex-col items-center mb-6">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-bold mb-2">Your Score: {typeof score === 'number' ? score.toFixed(2) : score}/{scoreScale}</h2>
                          <p className="text-muted-foreground">
                            Based on our AI analysis, your attractiveness score is {typeof score === 'number' ? score.toFixed(2) : score} out of {scoreScale}.
                          </p>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                          <Button className="px-4" onClick={() => handleImageCapture(null)}>
                            Take New Photo
                          </Button>
                          <Button onClick={() => setShowDialog(true)}>
                            Add to Leaderboard
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    
                    {analyzing && (
                      <div className="mb-6">
                        <p className="text-center mb-2">Analyzing your photo...</p>
                        <Progress value={progressValue} className="h-2" />
                      </div>
                    )}
                    
                    {error && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <WebcamCaptureSimple onImageCapture={handleImageCapture} />
                    
                    {hasImage && score === null && !analyzing && (
                      <div className="flex justify-center mt-4">
                        <Button className="px-8 py-2 h-11" onClick={handleAnalyze}>
                          Analyze Photo
                        </Button>
                      </div>
                    )}
                  </Card>
                  
                  {/* Ad container at the bottom of the Analyze tab */}
                  <AdContainer 
                    className="w-full h-28"
                    adSlot="analyze-bottom-horizontal"
                    adFormat="horizontal"
                    responsive={true}
                  />
                </TabsContent>
                
                <TabsContent value="leaderboard" className="mt-4">
                  <Leaderboard submittedEntryId={submittedEntryId} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Ad Space (desktop only) */}
            <aside className="hidden lg:block lg:col-span-2">
              <AdContainer 
                className="h-full"
                adSlot="right-sidebar-vertical"
                adFormat="vertical"
              />
            </aside>
          </div>
        </div>
        
        {/* Submit to Leaderboard Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit to Leaderboard</DialogTitle>
              <DialogDescription>
                Submit your photo to the leaderboard. Your photo and score will be visible publicly.
              </DialogDescription>
            </DialogHeader>
            
            {formError && (
              <Alert variant="destructive" className="my-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screen-name">Screen Name</Label>
                <Input
                  id="screen-name"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  placeholder="Choose a screen name"
                  required
                  disabled={submitting}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={agreeTerms} 
                  onCheckedChange={(checked: boolean | 'indeterminate') => setAgreeTerms(checked === true)}
                  disabled={submitting}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to share my photo publicly and confirm that I am over 18 years old.
                </Label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <><Spinner className="mr-2 h-4 w-4" /> Submitting...</> : 'Submit'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Footer with proper positioning */}
      <footer className="py-4 border-t border-gray-800 bg-black/30 backdrop-blur-sm w-full">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">&copy; 2025 looxmaxx. All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Main component wrapped with ModelProvider
export default function Home() {
  // We can still wrap with ModelProvider for fallback, but it's not strictly necessary
  // since we're now using server-side prediction
  return <HomeContent />;
}