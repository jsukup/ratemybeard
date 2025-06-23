# RateMyFeet Branding System

This directory contains the complete branding system for RateMyFeet, including configuration, components, and assets.

## 🎨 Overview

This branding system provides a consistent visual identity and user experience across the entire RateMyFeet application. It includes:

- **Brand Configuration** - Centralized constants and configuration
- **CSS Variables** - Consistent styling tokens  
- **Logo Components** - Flexible logo components with placeholders
- **SEO Components** - Optimized meta tags and structured data

## 📁 Structure

```
/ratemyfeet-branding/
├── constants/
│   └── branding.ts          # Brand configuration and constants
├── styles/
│   └── brand-variables.css  # CSS custom properties
├── components/
│   ├── BrandLogo.tsx        # Logo component with placeholders
│   └── SEOHead.tsx          # SEO meta tags component
└── README.md               # This file
```

## 🖼️ Asset Placeholders

**IMPORTANT**: This system includes placeholder components that need actual brand assets.

### Required Assets

When you have your actual brand assets, replace these file paths in `constants/branding.ts`:

#### Logos
- `/images/ratemyfeet-logo.png` - Main logo
- `/images/ratemyfeet-logo-light.png` - Light variant
- `/images/ratemyfeet-logo-dark.png` - Dark variant
- `/images/ratemyfeet-icon.png` - Icon only
- `/images/ratemyfeet-wordmark.png` - Text only

#### Favicons  
- `/favicon-ratemyfeet.ico` - Main favicon
- `/favicon-16x16.png` - 16x16 favicon
- `/favicon-32x32.png` - 32x32 favicon
- `/apple-touch-icon.png` - Apple touch icon

#### Social Media
- `/images/og-image.png` - 1200x630 Open Graph image
- `/images/twitter-card.png` - 1200x600 Twitter card

### Placeholder Behavior

Until actual assets are provided:
- Logo components show a gradient placeholder with the first letter "R"
- Favicon falls back to browser default
- Social sharing uses default images

## 🎨 Brand Colors

- **Primary**: `#FF6B6B` (Coral red)
- **Secondary**: `#4ECDC4` (Teal)  
- **Accent**: `#45B7D1` (Blue)

## 🔧 Usage

### Logo Component

```tsx
import BrandLogo from '@/components/BrandLogo';

// Basic logo with placeholder
<BrandLogo variant="main" size="lg" showText />

// Header logo
<HeaderLogo />
```

### SEO Meta Tags

```tsx
import SEOHead from '@/components/SEOHead';

<SEOHead 
  title="Page Title"
  description="Page description"
  keywords={['keyword1', 'keyword2']}
/>
```

### CSS Variables

```css
.my-component {
  background-color: var(--brand-primary);
  color: var(--brand-text-inverse);
}
```

## 📝 Todo Checklist

### When You Get Brand Assets:

- [ ] Replace logo placeholder paths in `constants/branding.ts`
- [ ] Add actual logo files to `/images/` directory  
- [ ] Generate favicon set from main logo
- [ ] Create social media images (1200x630, 1200x600)
- [ ] Test all logo variants and sizes
- [ ] Verify social media sharing previews

**Status**: Ready for asset integration - all placeholder infrastructure complete!

**Next Steps**: 
1. Acquire brand assets (logo, favicon, etc.)
2. Replace placeholder paths in `constants/branding.ts`  
3. Test all components with real assets