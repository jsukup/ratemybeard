// Type declarations for modules without @types packages

declare module 'react' {
  // Basic React hooks
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useRef<T>(initialValue: T): { current: T };
  export function useId(): string;

  // Event types
  export interface ChangeEvent<T extends Element> {
    target: T & {
      value: string;
      checked?: boolean;
    };
    currentTarget: T & {
      value: string;
      checked?: boolean;
    };
  }

  // Utility types
  export type FC<P = {}> = FunctionComponent<P>;
  export interface FunctionComponent<P = {}> {
    (props: P): JSX.Element | null;
  }
}

declare module 'next' {
  export type Metadata = {
    title?: string;
    description?: string;
    keywords?: string[];
    authors?: { name: string; url?: string }[];
    viewport?: string;
    [key: string]: any;
  };
}

declare module 'next/font/google' {
  export function Inter(options: { subsets: string[] }): {
    className: string;
    style: { fontFamily: string };
  };
}

declare module 'next/script' {
  import { DetailedHTMLProps, ScriptHTMLAttributes } from 'react';
  
  type ScriptProps = {
    id?: string;
    strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload';
    onLoad?: () => void;
    onReady?: () => void;
    onError?: () => void;
    src?: string;
    async?: boolean;
    defer?: boolean;
    crossOrigin?: string;
  } & DetailedHTMLProps<ScriptHTMLAttributes<HTMLScriptElement>, HTMLScriptElement>;
  
  export default function Script(props: ScriptProps): JSX.Element;
}

declare module 'lucide-react' {
  import * as React from 'react';
  
  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    stroke?: string | number;
  }
  
  export type Icon = React.FC<IconProps>;
  
  export const Camera: Icon;
  export const AlertCircle: Icon;
  // Add other icons you're using as needed
} 