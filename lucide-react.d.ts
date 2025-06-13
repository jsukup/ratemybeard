// Type declarations for lucide-react

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    stroke?: string | number;
  }
  
  export type Icon = ComponentType<IconProps>;
  
  export const Camera: Icon;
  export const AlertCircle: Icon;
} 