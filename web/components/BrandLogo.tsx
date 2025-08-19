"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { BRAND_CONFIG, getBrandAsset } from '@/constants/branding';

// Logo variant types
export type LogoVariant = 'main' | 'light' | 'dark' | 'icon' | 'wordmark';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BrandLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  showText?: boolean;
  href?: string;
  onClick?: () => void;
  priority?: boolean; // For Next.js Image priority loading
  placeholder?: 'show' | 'hide' | 'blur';
}

// Size configurations
const LOGO_SIZES = {
  xs: { width: 24, height: 24, text: 'text-sm' },
  sm: { width: 32, height: 32, text: 'text-base' },
  md: { width: 40, height: 40, text: 'text-lg' },
  lg: { width: 48, height: 48, text: 'text-xl' },
  xl: { width: 64, height: 64, text: 'text-2xl' },
  '2xl': { width: 80, height: 80, text: 'text-3xl' },
} as const;

// Placeholder component for when logo assets aren't available
function LogoPlaceholder({ 
  size, 
  variant, 
  showText, 
  className = '' 
}: { 
  size: LogoSize; 
  variant: LogoVariant; 
  showText?: boolean;
  className?: string;
}) {
  const { width, height, text } = LOGO_SIZES[size];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon placeholder */}
      <div 
        className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center text-white font-bold shadow-md"
        style={{ width, height }}
      >
        <span className={`${text} leading-none`}>
          {BRAND_CONFIG.name.charAt(0)}
        </span>
      </div>
      
      {/* Text logo */}
      {(showText || variant === 'wordmark') && (
        <span className={`font-bold brand-text-gradient ${text} whitespace-nowrap`}>
          {BRAND_CONFIG.name}
        </span>
      )}
    </div>
  );
}

// Main logo component
export default function BrandLogo({
  variant = 'main',
  size = 'md',
  className = '',
  showText = false,
  href,
  onClick,
  priority = false,
  placeholder = 'show'
}: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const logoSrc = getBrandAsset('logo', variant);
  const { width, height, text } = LOGO_SIZES[size];

  // Determine if we should show placeholder
  const shouldShowPlaceholder = 
    placeholder === 'show' || 
    imageError || 
    !logoSrc || 
    (placeholder === 'blur' && !imageLoaded);

  // Logo content
  const logoContent = shouldShowPlaceholder ? (
    <LogoPlaceholder 
      size={size} 
      variant={variant} 
      showText={showText}
      className={className}
    />
  ) : (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Actual logo image */}
      <div className="relative">
        <Image
          src={logoSrc}
          alt={`${BRAND_CONFIG.name} logo`}
          width={width}
          height={height}
          priority={priority}
          className="object-contain"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
        
        {/* Blur placeholder while loading */}
        {placeholder === 'blur' && !imageLoaded && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg animate-pulse"
            style={{ width, height }}
          />
        )}
      </div>
      
      {/* Text accompanying the logo */}
      {(showText || variant === 'wordmark') && (
        <span className={`font-bold brand-text-gradient ${text} whitespace-nowrap`}>
          {BRAND_CONFIG.name}
        </span>
      )}
    </div>
  );

  // Wrap with link if href provided
  if (href) {
    return (
      <a 
        href={href}
        className="inline-flex items-center transition-opacity hover:opacity-80"
        onClick={onClick}
      >
        {logoContent}
      </a>
    );
  }

  // Wrap with button if onClick provided (but no href)
  if (onClick) {
    return (
      <button 
        type="button"
        className="inline-flex items-center transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded"
        onClick={onClick}
      >
        {logoContent}
      </button>
    );
  }

  // Plain logo
  return logoContent;
}

// Specialized logo components for common use cases

export function HeaderLogo({ size = 'lg', className = '' }: { size?: LogoSize; className?: string }) {
  return (
    <BrandLogo
      variant="main"
      size={size}
      showText={true}
      href="/"
      priority={true}
      className={className}
    />
  );
}

export function FooterLogo({ size = 'md', className = '' }: { size?: LogoSize; className?: string }) {
  return (
    <BrandLogo
      variant="light"
      size={size}
      showText={true}
      href="/"
      className={className}
    />
  );
}

export function FaviconLogo({ size = 'sm' }: { size?: LogoSize }) {
  return (
    <BrandLogo
      variant="icon"
      size={size}
      showText={false}
      placeholder="hide"
    />
  );
}

export function LoadingLogo({ size = 'xl', className = '' }: { size?: LogoSize; className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <BrandLogo
        variant="icon"
        size={size}
        showText={false}
        placeholder="show"
      />
    </div>
  );
}

// Logo with animated gradient effect
export function AnimatedLogo({ 
  size = 'lg', 
  className = '' 
}: { 
  size?: LogoSize; 
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <BrandLogo
        variant="main"
        size={size}
        showText={true}
        className="animate-pulse"
      />
      
      {/* Animated glow effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent opacity-20 blur-lg animate-ping"
        style={{ 
          animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          animationDelay: '1s'
        }}
      />
    </div>
  );
}

// Logo with brand tagline
export function LogoWithTagline({ 
  size = 'lg', 
  className = '',
  vertical = false
}: { 
  size?: LogoSize; 
  className?: string;
  vertical?: boolean;
}) {
  const { text } = LOGO_SIZES[size];
  
  return (
    <div className={`${vertical ? 'flex flex-col items-center text-center' : 'flex items-center'} gap-3 ${className}`}>
      <BrandLogo
        variant="main"
        size={size}
        showText={!vertical}
      />
      
      {vertical && (
        <div className="flex flex-col items-center gap-1">
          <span className={`font-bold brand-text-gradient ${text}`}>
            {BRAND_CONFIG.name}
          </span>
          <span className="text-brand-text-secondary text-sm">
            {BRAND_CONFIG.tagline}
          </span>
        </div>
      )}
      
      {!vertical && (
        <div className="flex flex-col">
          <span className={`font-bold brand-text-gradient ${text}`}>
            {BRAND_CONFIG.name}
          </span>
          <span className="text-brand-text-secondary text-xs -mt-1">
            {BRAND_CONFIG.tagline}
          </span>
        </div>
      )}
    </div>
  );
}

// Development helper component
export function LogoShowcase({ className = '' }: { className?: string }) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const variants: LogoVariant[] = ['main', 'light', 'dark', 'icon', 'wordmark'];
  const sizes: LogoSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

  return (
    <div className={`p-8 bg-white border rounded-lg ${className}`}>
      <h3 className="text-xl font-bold mb-6 text-brand-text-primary">Logo Showcase (Development Only)</h3>
      
      {/* Variants */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4 text-brand-text-secondary">Variants</h4>
        <div className="grid grid-cols-5 gap-4">
          {variants.map(variant => (
            <div key={variant} className="text-center">
              <div className="mb-2 p-4 bg-gray-50 rounded">
                <BrandLogo variant={variant} size="lg" showText={variant === 'wordmark'} />
              </div>
              <span className="text-xs text-brand-text-muted">{variant}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4 text-brand-text-secondary">Sizes</h4>
        <div className="flex items-end gap-4 flex-wrap">
          {sizes.map(size => (
            <div key={size} className="text-center">
              <div className="mb-2 p-2 bg-gray-50 rounded">
                <BrandLogo variant="main" size={size} showText />
              </div>
              <span className="text-xs text-brand-text-muted">{size}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Special Components */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-brand-text-secondary">Special Components</h4>
        <div className="space-y-4">
          <div className="p-4 bg-gray-900 rounded">
            <FooterLogo />
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <LogoWithTagline />
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <LogoWithTagline vertical />
          </div>
        </div>
      </div>
    </div>
  );
}