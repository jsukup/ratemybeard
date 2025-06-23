"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import Webcam from "react-webcam";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Add a browser check to avoid server-side errors
const isBrowser = typeof window !== 'undefined';

interface WebcamCaptureProps {
  onImageCapture: (image: string | null) => void;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

export default function WebcamCaptureSimple({ onImageCapture }: WebcamCaptureProps) {
  const [imgSrc, setImgSrc] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [videoDevices, setVideoDevices] = React.useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>("");
  const [showFlash, setShowFlash] = React.useState(false);
  
  const webcamRef = React.useRef<Webcam | null>(null);

  // Get available video devices
  async function getVideoDevices() {
    try {
      // First request permission to access media devices
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      
      // Then enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      
      const formattedDevices = videoInputs.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${videoInputs.indexOf(device) + 1}`
      }));
      
      setVideoDevices(formattedDevices);
      
      // Select the first device by default if we have devices and none is selected
      if (formattedDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(formattedDevices[0].deviceId);
      }
      
      setHasPermission(true);
    } catch (err) {
      console.error("Error getting video devices:", err);
      setError("Could not access camera devices. Please check permissions.");
      setHasPermission(false);
    }
  }

  // Initialize webcam
  async function initializeWebcam() {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get video devices if we don't have them yet
      if (videoDevices.length === 0) {
        await getVideoDevices();
      }
      
      setHasPermission(true);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Could not access webcam. Please check permissions.");
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle device change
  function handleDeviceChange(deviceId: string) {
    setSelectedDeviceId(deviceId);
  }

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
      const screenshot = webcamRef.current.getScreenshot({
        width: video.videoWidth,
        height: video.videoHeight
      });
      
      if (screenshot) {
        setImgSrc(screenshot);
        onImageCapture(screenshot);
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

  // Retake photo
  function retake() {
    setIsLoading(true);
    setImgSrc(null);
    onImageCapture(null);
    
    // Re-initialize webcam
    initializeWebcam();
  }

  // Initialize webcam and get devices on component mount
  React.useEffect(() => {
    // Get video devices first
    getVideoDevices().then(() => {
      // Then initialize webcam
      initializeWebcam();
    });
    
    // Listen for device changes (e.g., when a camera is plugged in or removed)
    navigator.mediaDevices.addEventListener('devicechange', getVideoDevices);
    
    // Cleanup on unmount
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getVideoDevices);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    aspectRatio: 16/9,
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    facingMode: "user"
  };

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
                onClick={initializeWebcam}
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
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
                onUserMedia={() => setIsLoading(false)}
                mirrored={true}
                screenshotQuality={1}
                imageSmoothing={true}
              />
            )}
          </div>
        )}
      </div>
      
      {!imgSrc && (
        <div className="w-full max-w-xl space-y-3">
          {/* Camera selection dropdown */}
          {videoDevices.length > 1 && (
            <Select
              value={selectedDeviceId}
              onValueChange={handleDeviceChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {videoDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mt-2">
        <Button
          onClick={imgSrc ? retake : capture}
          className="flex-1 px-6 py-2 h-12 text-base transition-all duration-300 hover:scale-105"
          disabled={isLoading || hasPermission === false}
        >
          {imgSrc ? (
            <>
              Retake Photo
            </>
          ) : (
            <>
              <Camera className="mr-2 h-5 w-5" />
              Take Photo
            </>
          )}
        </Button>
      </div>
      
      {/* Simple instruction text */}
      {!imgSrc && (
        <div className="flex flex-col items-center w-full max-w-xl mt-2">
          <p className="text-center text-muted-foreground text-sm w-full">
            Position yourself in the camera view and click the Take Photo button.
          </p>
          <a 
            href="mailto:hello@ratemyfeet.com" 
            className="mt-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Suggestions? Problems? Contact Us!
          </a>
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
}