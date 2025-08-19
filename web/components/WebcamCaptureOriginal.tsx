// @ts-nocheck - This file is preserved for reference only and not used in the application
"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Add NodeJS namespace for Timeout
declare global {
  namespace NodeJS {
    interface Timeout {
      _idleTimeout: number;
      _idlePrev: unknown;
      _idleNext: unknown;
      _idleStart: number;
      _onTimeout: () => void;
      _timerArgs: unknown;
      _repeat: unknown;
    }
  }
}

interface WebcamCaptureProps {
  onImageCapture: (image: string | null) => void;
}

export default function WebcamCaptureOriginal({ onImageCapture }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [key, setKey] = useState<number>(Date.now()); // Add a key to force remount
  const [faceDetected, setFaceDetected] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [facePositionedTime, setFacePositionedTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const [isDeepFaceReady, setIsDeepFaceReady] = useState(false);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stableDetectionCount = useRef(0);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Get available camera devices
  useEffect(() => {
    let mounted = true;

    async function getDevices() {
      try {
        // First request permission to access media devices
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Then get the list of devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (mounted) {
          setDevices(videoDevices);
          
          // Select the first device by default if no device is selected
          if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        }

        // Stop tracks from permission request to avoid keeping multiple streams open
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error("Error accessing camera devices:", error);
      }
    }

    // Check for devices when component mounts
    getDevices();

    // Also listen for devicechange events
    navigator.mediaDevices.addEventListener('devicechange', getDevices);

    return () => {
      mounted = false;
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, [selectedDeviceId]);

  // Initialize DeepFace (in a real implementation)
  useEffect(() => {
    let mounted = true;
    
    async function loadDeepFace() {
      try {
        // This is where you would initialize DeepFace in a real implementation
        // For demo purposes, we're simulating it with a timeout
        setTimeout(() => {
          if (mounted) {
            setIsDeepFaceReady(true);
            console.log("DeepFace is ready to use");
          }
        }, 1000);
        
        // In a real implementation, you would do something like:
        // await import('deepface');
        // setIsDeepFaceReady(true);
      } catch (error) {
        console.error("Failed to load DeepFace:", error);
      }
    }
    
    loadDeepFace();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Face detection with DeepFace and auto-capture logic
  useEffect(() => {
    if (imgSrc || !isDeepFaceReady) return;
    
    // Clear existing interval if any
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    setFaceDetectionActive(true);
    
    // Start detection interval
    detectionIntervalRef.current = setInterval(async () => {
      if (!webcamRef.current) return;
      
      try {
        // Get current screenshot
        const screenshot = webcamRef.current.getScreenshot();
        if (!screenshot) return;
        
        /* In a real implementation, you would use DeepFace here like:
        
        const result = await DeepFace.detectFace(screenshot, {
          detector_backend: "retinaface",
        });
        
        const isFaceDetected = result && result.length > 0;
        */
        
        // For demo, we're simulating face detection with more realistic behavior
        // Higher probability of true once detection has started (simulating tracking)
        const isFaceDetected = faceDetected 
          ? Math.random() > 0.05  // 95% chance to maintain detection if already detected
          : Math.random() > 0.7; // 70% chance to not detect - less sensitive (was 0.5)
        
        setFaceDetected(isFaceDetected);
        
        const now = Date.now();
        
        if (isFaceDetected) {
          // Increment stable detection counter - measures how long the face stays detected
          stableDetectionCount.current += 1;
          
          if (!facePositionedTime && autoCapture) {
            setFacePositionedTime(now);
          // Start countdown after 1.5 seconds (15 * 100ms intervals) of stable detection - less strict (was 10)
          } else if (autoCapture && stableDetectionCount.current >= 15 && countdown === null) {
            setCountdown(3);
          }
        } else {
          // Reset when face is no longer detected
          stableDetectionCount.current = 0;
          if (autoCapture) {
            setFacePositionedTime(null);
            setCountdown(null);
          }
        }
      } catch (error) {
        console.error("Face detection error:", error);
      }
    }, 100); // Check every 100ms for smoother detection
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      setFaceDetectionActive(false);
    };
  }, [imgSrc, autoCapture, isDeepFaceReady, faceDetected, countdown, facePositionedTime]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null || countdown === 0) return;
    
    const timer = setTimeout(() => {
      const newCount = countdown - 1;
      setCountdown(newCount);
      
      if (newCount === 0) {
        // When countdown reaches 0, capture image
        setShowFlash(true);
        setTimeout(() => {
          capture();
          setShowFlash(false);
          setCountdown(null);
          setFacePositionedTime(null);
          stableDetectionCount.current = 0;
        }, 300);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  const capture = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      const imageSrc = webcamRef.current?.getScreenshot({
        width: 1920,
        height: 1080
      }) || null;
      setImgSrc(imageSrc);
      onImageCapture(imageSrc);
      setIsTransitioning(false);
    }, 300);
  };

  const retake = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setImgSrc(null);
      onImageCapture(null);
      setFaceDetected(false);
      setFacePositionedTime(null);
      setCountdown(null);
      stableDetectionCount.current = 0;
      setIsTransitioning(false);
    }, 300);
  };

  const toggleCamera = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setFacingMode(prevMode => 
        prevMode === "user" ? "environment" : "user"
      );
      setIsTransitioning(false);
    }, 300);
  };

  const handleDeviceChange = (deviceId: string) => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setSelectedDeviceId(deviceId);
      // Force remount of Webcam component
      setKey(Date.now());
      setIsTransitioning(false);
    }, 300);
  };

  const toggleAutoCapture = () => {
    setAutoCapture(prev => !prev);
    setFacePositionedTime(null);
    setCountdown(null);
    stableDetectionCount.current = 0;
  };

  // Determine video constraints based on device selection
  const videoConstraints = isMobile && !selectedDeviceId
    ? {
        width: 1920,
        height: 1080,
        facingMode: facingMode
      }
    : {
        width: 1920,
        height: 1080,
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
      };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {!imgSrc && (
        <div className="w-full max-w-xl flex items-center justify-between gap-2 mb-2">
          {devices.length > 1 && (
            <div className="flex-1">
              <Select value={selectedDeviceId} onValueChange={handleDeviceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${devices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button
            className={`${devices.length > 1 ? '' : 'ml-auto'}`}
            onClick={toggleAutoCapture}
          >
            {autoCapture ? "Disable Auto-Capture" : "Enable Auto-Capture"}
          </Button>
        </div>
      )}
      
      <div className="relative w-full max-w-xl overflow-hidden rounded-lg bg-muted aspect-video shadow-lg transition-all duration-300 ease-in-out">
        {isTransitioning && (
          <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {showFlash && (
          <div className="absolute inset-0 bg-white z-20 animate-flash"></div>
        )}
        
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center">
            <div className="text-8xl font-bold text-white animate-pulse">
              {countdown}
            </div>
          </div>
        )}
        
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="captured"
            className="w-full h-full object-cover transition-opacity duration-300 ease-in-out"
          />
        ) : (
          <>
            <Webcam
              key={key}
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover transition-opacity duration-300 ease-in-out"
              screenshotQuality={1}
              imageSmoothing={true}
              onUserMediaError={(err: any) => console.error("Webcam error:", err)}
            />
            {/* Face positioning overlay - Taller Oval Shape without face features */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[95%] 
                         ${faceDetected ? 'border-[#00ff4c]' : 'border-white'} border-4 border-solid rounded-[50%] 
                         transition-colors duration-500 ease-in-out pointer-events-none
                         flex items-center justify-center opacity-90`}
            >
              {faceDetected && (
                <div className="absolute inset-0 bg-[#00ff4c]/10 rounded-[50%] animate-pulse"></div>
              )}

              {/* Status indicator for face detection */}
              <div className={`absolute bottom-[-30px] left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300
                ${faceDetected ? 'bg-[#00ff4c]/90 text-black' : 'bg-gray-800/70 text-white'}`}>
                {!faceDetected ? 'Searching...' : 
                  countdown ? 'Ready!' : 
                  autoCapture && facePositionedTime ? 'Hold still...' : 'Face Detected'}
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mt-2">
        <Button
          onClick={imgSrc ? retake : capture}
          className="flex-1 px-6 py-2 h-12 text-base transition-all duration-300 hover:scale-105"
          disabled={isTransitioning || countdown !== null || (!imgSrc && autoCapture)}
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
        
        {isMobile && !imgSrc && devices.length <= 1 && (
          <Button 
            onClick={toggleCamera} 
            className="sm:w-auto h-12 text-base transition-all duration-300 hover:scale-105"
            disabled={isTransitioning || countdown !== null}
          >
            Switch Camera
          </Button>
        )}
      </div>
      
      {/* Static position guide text below the buttons */}
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
    </div>
  );
} 