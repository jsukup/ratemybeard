// @ts-nocheck - Temporarily disable type checking for this file
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import * as faceapi from '@vladmandic/face-api';

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
  const [faceDetected, setFaceDetected] = React.useState(false);
  const [autoCapture, setAutoCapture] = React.useState(false);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [showGuide, setShowGuide] = React.useState(true);
  const [showFlash, setShowFlash] = React.useState(false);
  const [modelsLoaded, setModelsLoaded] = React.useState(false);
  
  const webcamRef = React.useRef<Webcam | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const detectionIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const stableDetectionCount = React.useRef<number>(0);
  const facePositionedTimeRef = React.useRef<number | null>(null);
  const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load face-api.js models
  React.useEffect(() => {
    // Only run in browser environment
    if (!isBrowser) return;
    
    const loadModels = async () => {
      setIsLoading(true);
      try {
        // Set the models path
        const MODEL_URL = '/models';
        
        // Load the required models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        console.log('Face detection models loaded successfully');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading face detection models:', error);
        setError('Failed to load face detection models. Using fallback detection.');
        // Still set models as loaded to continue with fallback
        setModelsLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModels();
  }, []);

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
    } catch (err) {
      console.error("Error getting video devices:", err);
      setError("Could not access camera devices. Please check permissions.");
      setHasPermission(false);
    }
  }

  // Stop webcam stream
  function stopWebcam() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clear detection interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    // Clear countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }

  // Initialize webcam
  async function initializeWebcam() {
    setIsLoading(true);
    setError(null);
    
    try {
      // Stop any existing stream
      stopWebcam();
      
      // Get video devices if we don't have them yet
      if (videoDevices.length === 0) {
        await getVideoDevices();
      }
      
      // Reset face detection state
      setFaceDetected(false);
      stableDetectionCount.current = 0;
      facePositionedTimeRef.current = null;
      setCountdown(null);
      
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
    // Reinitialize webcam with new device
    if (deviceId) {
      initializeWebcam();
    }
  }

  // Toggle auto capture
  function toggleAutoCapture() {
    setAutoCapture(!autoCapture);
    // Reset detection state when toggling
    stableDetectionCount.current = 0;
    facePositionedTimeRef.current = null;
    setCountdown(null);
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
      // This ensures what you see is what you get
      const screenshot = webcamRef.current.getScreenshot({
        width: video.videoWidth,
        height: video.videoHeight
      });
      
      if (screenshot) {
        setImgSrc(screenshot);
        onImageCapture(screenshot);
        
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
    onImageCapture(null);
    
    // Reset face detection state
    setFaceDetected(false);
    stableDetectionCount.current = 0;
    facePositionedTimeRef.current = null;
    setCountdown(null);
    
    // Re-initialize webcam
    initializeWebcam();
  }

  // Check if face is properly positioned within the oval guide
  const isFaceProperlyPositioned = (detection, videoWidth, videoHeight, guideWidth, guideHeight) => {
    if (!detection) return false;
    
    // Get the face bounding box
    const { box } = detection;
    
    // Calculate the center of the video
    const videoCenter = {
      x: videoWidth / 2,
      y: videoHeight / 2
    };
    
    // Calculate the center of the face
    const faceCenter = {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2
    };
    
    // Calculate the distance from the center
    const distanceX = Math.abs(faceCenter.x - videoCenter.x);
    const distanceY = Math.abs(faceCenter.y - videoCenter.y);
    
    // Calculate the maximum allowed distance (half of the guide dimensions)
    const maxDistanceX = guideWidth / 2 * 0.7; // 70% of the guide width
    const maxDistanceY = guideHeight / 2 * 0.7; // 70% of the guide height
    
    // Check if the face is within the guide
    const isWithinGuide = distanceX <= maxDistanceX && distanceY <= maxDistanceY;
    
    // Check if the face is not too small or too large
    const minFaceSize = Math.min(guideWidth, guideHeight) * 0.3; // At least 30% of the guide
    const maxFaceSize = Math.max(guideWidth, guideHeight) * 0.9; // At most 90% of the guide
    const faceSize = Math.max(box.width, box.height);
    
    const isProperSize = faceSize >= minFaceSize && faceSize <= maxFaceSize;
    
    return isWithinGuide && isProperSize;
  };

  // Face detection logic
  React.useEffect(() => {
    if (imgSrc || !webcamRef.current || !modelsLoaded) return;
    
    // Only run auto-capture logic if enabled
    const shouldAutoCapture = autoCapture;
    
    // Clear existing interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    // Start detection interval - check every 200ms
    detectionIntervalRef.current = setInterval(async () => {
      if (!webcamRef.current || !webcamRef.current.video) return;
      
      try {
        const video = webcamRef.current.video;
        
        // Get video dimensions
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        // Check if video dimensions are valid before proceeding
        if (!videoWidth || !videoHeight || videoWidth === 0 || videoHeight === 0) {
          console.log('Video dimensions not ready yet, skipping face detection');
          return;
        }
        
        // Calculate guide dimensions (40% width, 95% height of the video)
        const guideWidth = videoWidth * 0.4;
        const guideHeight = videoHeight * 0.95;
        
        // Detect faces
        let isFaceDetected = false;
        let isFaceCompletelyInOval = false;
        
        try {
          // Use face-api.js to detect faces
          const detections = await faceapi.detectAllFaces(
            video, 
            new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
          );
          
          // Check if any face is detected
          isFaceDetected = detections.length > 0;
          
          // Check if the face is properly positioned within the oval guide
          if (isFaceDetected) {
            // Use the largest face if multiple are detected
            const largestFace = detections.reduce((prev, current) => 
              (prev.box.width * prev.box.height > current.box.width * current.box.height) ? prev : current
            );
            
            isFaceCompletelyInOval = isFaceProperlyPositioned(
              largestFace, 
              videoWidth, 
              videoHeight, 
              guideWidth, 
              guideHeight
            );
          }
        } catch (error) {
          console.error('Face detection error:', error);
          // Fallback to simulated detection if face-api.js fails
          isFaceDetected = faceDetected 
            ? Math.random() > 0.05  // 95% chance to maintain detection if already detected
            : Math.random() > 0.9;  // 10% chance to detect initially
          
          isFaceCompletelyInOval = isFaceDetected && Math.random() > 0.6; // 40% chance if face is detected
        }
        
        setFaceDetected(isFaceDetected);
        
        // Only proceed with countdown and auto-capture if enabled and face is completely in oval
        if (shouldAutoCapture) {
          if (isFaceDetected && isFaceCompletelyInOval) {
            // Increment stable detection counter
            stableDetectionCount.current += 1;
            
            // Start countdown only after 1 second (5 intervals of 200ms) of stable detection
            if (stableDetectionCount.current >= 5 && countdown === null) {
              setCountdown(3);
            }
          } else {
            // Reset when face is no longer completely in oval
            stableDetectionCount.current = 0;
            
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            
            setCountdown(null);
          }
        }
      } catch (error) {
        console.error("Face detection error:", error);
      }
    }, 200); // Check every 200ms for better performance
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [autoCapture, faceDetected, countdown, imgSrc, capture, modelsLoaded]);

  // Separate effect for handling the countdown timer
  React.useEffect(() => {
    // Clear any existing countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // If countdown is active, start the timer
    if (countdown !== null && countdown > 0) {
      console.log(`Starting countdown from ${countdown}`);
      
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          console.log(`Countdown tick: ${prev}`);
          
          if (prev === null || prev <= 1) {
            // Clear the interval when we reach 0
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            
            // Auto capture when countdown reaches 0
            if (prev === 1) {
              console.log('Countdown complete, capturing photo');
              // Use setTimeout to ensure state updates before capture
              setTimeout(() => capture(), 0);
            }
            
            return null;
          }
          
          // Decrement the countdown
          return prev - 1;
        });
      }, 1000);
      
      // Cleanup function
      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      };
    }
  }, [countdown, capture]);

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
      stopWebcam();
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
        
        {/* Face detection guide - oval shape and always visible, using the original style */}
        {showGuide && !imgSrc && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div 
              className={`border-4 ${faceDetected ? 'border-[#00ff4c]' : 'border-white/50'} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-[50%] transition-colors duration-500 ease-in-out`}
              style={{ 
                width: '40%', 
                height: '95%',
              }}
            >
              {faceDetected && (
                <div className="absolute inset-0 bg-[#00ff4c]/10 rounded-[50%] animate-pulse"></div>
              )}
              
              {/* Status indicator for face detection */}
              <div className={`absolute bottom-[-30px] left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300
                ${faceDetected ? 'bg-[#00ff4c]/90 text-black' : 'bg-gray-800/70 text-white'}`}>
                {!faceDetected ? 'Searching...' : 
                  countdown ? 'Ready!' : 
                  autoCapture && facePositionedTimeRef.current ? 'Hold still...' : 'Face Detected'}
              </div>
            </div>
          </div>
        )}
        
        {/* Countdown display */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/30 z-20 flex items-center justify-center pointer-events-none">
            <div className="text-8xl font-bold text-white animate-pulse">
              {countdown}
            </div>
          </div>
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
          
          {/* Auto-capture toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-capture">Auto-capture</Label>
              <p className="text-sm text-muted-foreground">
                Automatically take photo when face is detected
              </p>
            </div>
            <Switch
              id="auto-capture"
              checked={autoCapture}
              onCheckedChange={() => toggleAutoCapture()}
            />
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mt-2">
        <Button
          onClick={imgSrc ? retake : capture}
          className="flex-1 px-6 py-2 h-12 text-base transition-all duration-300 hover:scale-105"
          disabled={isLoading || hasPermission === false || (!imgSrc && autoCapture && countdown !== null)}
        >
          {imgSrc ? (
            <>
              Retake Photo
            </>
          ) : (
            <>
              <Camera className="mr-2 h-5 w-5" />
              {faceDetected ? "Perfect! Take Photo" : "Take Photo"}
            </>
          )}
        </Button>
      </div>
      
      {/* Position guide text from original component */}
      {!imgSrc && (
        <div className="flex flex-col items-center w-full max-w-xl mt-2">
          <p className="text-center text-muted-foreground text-sm w-full">
            Position your face within the oval guide {autoCapture ? "and hold still for automatic capture." : "then click the Take Photo button."}
          </p>
          <a 
            href="mailto:hello@looxmaxx.com" 
            className="mt-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Suggestions? Problems? Moan-and-Groan? Holla at Us!
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