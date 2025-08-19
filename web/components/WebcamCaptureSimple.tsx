"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import Webcam from "react-webcam";
import { isMobile } from 'react-device-detect';
import { supabase } from '@/lib/supabase';
import UsernameInput from './UsernameInput';

// Utility function to convert data URL to File object
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

interface WebcamCaptureProps {
  onImageCapture?: (image: string | null) => void;
  onImageUploaded?: (imageData: { id: string; username: string; image_url: string }) => void;
  onAddToLeaderboard?: () => void;
}


export default function WebcamCaptureSimple({ onImageCapture, onImageUploaded, onAddToLeaderboard }: WebcamCaptureProps) {
  const [imgSrc, setImgSrc] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showGuide, setShowGuide] = React.useState(true);
  const [showFlash, setShowFlash] = React.useState(false);
  const [showUsernameInput, setShowUsernameInput] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [webcamKey, setWebcamKey] = React.useState(0); // For component remounting
  
  const webcamRef = React.useRef<Webcam | null>(null);


  // Handle camera errors and remounting
  const handleCameraError = (error: string | Error) => {
    console.error("Camera error:", error);
    const errorMessage = error instanceof Error ? error.message : error;
    
    if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
      setError("Camera access denied. Please allow camera permissions and try again.");
    } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("No camera found")) {
      setError("No camera found on this device.");
    } else if (errorMessage.includes("NotReadableError")) {
      setError("Camera is being used by another application. Please close other apps and try again.");
    } else {
      setError("Could not access camera. Please check permissions and try again.");
    }
    setHasPermission(false);
  };

  // Remount webcam component to reinitialize camera
  const remountWebcam = () => {
    console.log("Remounting webcam component");
    setWebcamKey(prev => prev + 1);
    setError(null);
    setIsLoading(true);
  };

  // Stop webcam stream
  function stopWebcam() {
    if (webcamRef.current?.stream) {
      webcamRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }

  // Handle successful camera initialization
  const handleCameraReady = () => {
    console.log(`Camera ready - Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
    setHasPermission(true);
    setIsLoading(false);
    setError(null);
  };



  // Capture photo with higher quality settings
  function capture() {
    if (!webcamRef.current) return;
    
    setIsLoading(true);
    
    try {
      // Flash effect
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 150);
      
      // Get the webcam video element dimensions
      const video = webcamRef.current.video;
      
      // Check if video dimensions are valid
      if (!video || !video.videoWidth || !video.videoHeight || 
          video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video dimensions not ready for capture');
        setError("Camera not ready. Please wait a moment and try again.");
        setIsLoading(false);
        return;
      }
      
      // Use the exact dimensions of the video element for the screenshot
      // This ensures what you see is what you get
      const screenshot = webcamRef.current.getScreenshot({
        width: video.videoWidth,
        height: video.videoHeight
      });
      
      if (screenshot) {
        setImgSrc(screenshot);
        onImageCapture?.(screenshot);
        
        // Stop the webcam after capturing
        stopWebcam();
      } else {
        setError("Failed to capture photo. Please try again.");
      }
    } catch (err) {
      console.error("Error capturing photo:", err);
      setError("Failed to capture photo");
    } finally {
      setIsLoading(false);
    }
  }

  // Retake photo with transition effect
  function retake() {
    setIsLoading(true);
    setImgSrc(null);
    onImageCapture?.(null);
    setShowUsernameInput(false);
    
    // Remount webcam component for fresh initialization
    remountWebcam();
  }




  // Initialize component
  React.useEffect(() => {
    console.log(`Initializing camera component - Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
    setIsLoading(true);
    
    // Cleanup on unmount
    return () => {
      stopWebcam();
    };
  }, []);

  // Device-specific camera constraints
  const videoConstraints = React.useMemo(() => {
    if (isMobile) {
      // Mobile: Prefer rear camera for foot photography
      return {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: 16/9,
        facingMode: { ideal: "environment" }
      };
    } else {
      // Desktop: Use default camera (usually built-in webcam)
      return {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: 16/9,
        facingMode: "user"
      };
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full max-w-xl overflow-hidden rounded-lg bg-muted aspect-video shadow-lg transition-all duration-300 ease-in-out">
        {isLoading && (
          <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
            <div className="bg-background p-4 rounded-lg max-w-xs text-center">
              <p className="text-destructive font-medium">{error}</p>
              <Button 
                className="mt-3" 
                onClick={remountWebcam}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
        
        {/* Flash effect */}
        {showFlash && (
          <div className="absolute inset-0 bg-white z-20 animate-flash"></div>
        )}
        
        
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="captured"
            className="w-full h-full object-cover bg-black transition-opacity duration-300 ease-in-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            {hasPermission === false ? (
              <p className="text-white text-lg">Camera access denied</p>
            ) : (
              <Webcam
                key={webcamKey}
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
                onUserMedia={handleCameraReady}
                onUserMediaError={handleCameraError}
                mirrored={false}
                screenshotQuality={1}
                imageSmoothing={true}
              />
            )}
          </div>
        )}
      </div>
      
      
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mt-2">
        {!showUsernameInput ? (
          <>
            <Button
              onClick={imgSrc ? retake : capture}
              className="flex-1 px-6 py-2 h-12 text-base transition-all duration-300 hover:scale-105"
              disabled={isLoading || hasPermission === false}
            >
              {imgSrc ? (
                "Retake Photo"
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Take Photo
                </>
              )}
            </Button>
            {imgSrc && (
              <Button
                onClick={() => onAddToLeaderboard?.()}
                className="flex-1 px-6 py-2 h-12 text-base bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                Add to Leaderboard
              </Button>
            )}
          </>
        ) : (
          <div className="w-full">
            <UsernameInput
              onUsernameConfirm={handleUsernameConfirm}
              disabled={isUploading}
            />
          </div>
        )}
      </div>
      
      {/* Helper text */}
      {!imgSrc && !showUsernameInput && (
        <div className="flex flex-col items-center w-full max-w-xl mt-2">
          <a 
            href="mailto:info@ratemyfeet.net" 
            className="mt-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Questions? Suggestions? Contact Us!
          </a>
        </div>
      )}
      
      {isUploading && (
        <div className="flex flex-col items-center w-full max-w-xl mt-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-2"></div>
          <p className="text-center text-muted-foreground text-sm">
            Uploading your image to the leaderboard...
          </p>
        </div>
      )}
      
      {hasPermission === false && !error && (
        <div className="flex flex-col items-center w-full max-w-xl mt-2">
          <p className="text-center text-destructive text-sm w-full">
            Camera access was denied. Please check your browser permissions and try again.
          </p>
        </div>
      )}
    </div>
  );

  // Handle username confirmation and image upload
  async function handleUsernameConfirm(username: string) {
    if (!imgSrc || !username.trim()) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Convert data URL to File object
      const imageFile = dataURLtoFile(imgSrc, `${username}-${Date.now()}.jpg`);
      
      // Generate unique filename
      const fileName = `${Date.now()}-${username}-${Math.random().toString(36).substr(2, 9)}.jpg`;
      
      // Upload image to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image. Please try again.');
      }
      
      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      
      // Save image record to database
      const { data: imageData, error: dbError } = await supabase
        .from('images')
        .insert({
          username: username.trim(),
          image_url: publicUrl,
          median_score: 0,
          rating_count: 0,
          is_visible: true
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save image record. Please try again.');
      }
      
      // Call the callback with uploaded image data
      onImageUploaded?.({
        id: imageData.id,
        username: imageData.username,
        image_url: imageData.image_url
      });
      
      // Reset component state
      setImgSrc(null);
      setShowUsernameInput(false);
      onImageCapture?.(null);
      
    } catch (error) {
      console.error('Error in handleUsernameConfirm:', error);
      
      let errorMessage = 'Failed to upload image. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('upload')) {
          errorMessage = 'Failed to upload image. Please check your connection and try again.';
        } else if (error.message.includes('database')) {
          errorMessage = 'Failed to save image. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }
} 