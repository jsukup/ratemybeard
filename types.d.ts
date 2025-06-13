// This file contains type declarations for modules that don't have their own type definitions

declare module 'react-webcam' {
  import { Component } from 'react';
  
  export interface WebcamProps {
    audio?: boolean;
    audioConstraints?: MediaStreamConstraints['audio'];
    forceScreenshotSourceSize?: boolean;
    imageSmoothing?: boolean;
    mirrored?: boolean;
    minScreenshotHeight?: number;
    minScreenshotWidth?: number;
    onUserMedia?: (stream: MediaStream) => void;
    onUserMediaError?: (error: string | DOMException) => void;
    screenshotFormat?: 'image/webp' | 'image/png' | 'image/jpeg';
    screenshotQuality?: number;
    videoConstraints?: MediaStreamConstraints['video'];
    style?: React.CSSProperties;
    className?: string;
    ref?: React.RefObject<Webcam>;
  }
  
  export default class Webcam extends Component<WebcamProps> {
    getScreenshot(options?: { width?: number; height?: number }): string | null;
  }
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

// Custom JSX type definitions
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
} 