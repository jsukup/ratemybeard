declare module '@radix-ui/react-icons' {
  import * as React from 'react'

  interface IconProps extends React.SVGProps<SVGSVGElement> {
    children?: never
    color?: string
    size?: string | number
  }

  type IconComponent = React.ForwardRefExoticComponent<IconProps>

  export const ReloadIcon: IconComponent
  export const UpdateIcon: IconComponent
  // Add other icons as needed
} 