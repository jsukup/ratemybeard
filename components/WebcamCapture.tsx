"use client";

import React from "react";
import WebcamCaptureSimple from "./WebcamCaptureSimple";

interface WebcamCaptureProps {
  onImageCapture: (image: string | null) => void;
}

export default function WebcamCapture({ onImageCapture }: WebcamCaptureProps) {
  // This is now just a wrapper around the simplified version
  return <WebcamCaptureSimple onImageCapture={onImageCapture} />;
}