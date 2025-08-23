/**
 * RateMyFeet Mobile Color Constants
 * Matches the website brand color scheme
 */

export const colors = {
  // Primary Brand Colors
  primary: '#FF6B6B',        // Coral red - main brand color
  secondary: '#4ECDC4',      // Teal - secondary accent
  accent: '#45B7D1',         // Blue - tertiary accent
  
  // Semantic Colors
  success: '#51CF66',        // Green for success states
  warning: '#FFD43B',        // Yellow for warnings
  error: '#FF6B6B',          // Red for errors (matches primary)
  info: '#45B7D1',           // Blue for info (matches accent)
  
  // Text Colors
  text: {
    primary: '#2C3E50',      // Dark blue-gray for main text
    secondary: '#7F8C8D',    // Medium gray for secondary text
    muted: '#BDC3C7',        // Light gray for muted text
    inverse: '#FFFFFF',      // White for text on dark backgrounds
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',      // White background
    secondary: '#F8F9FA',    // Light gray background
    muted: '#E9ECEF',        // Muted background
    dark: '#2C3E50',         // Dark background
  },
  
  // Border Colors
  border: {
    light: '#E9ECEF',        // Light borders
    medium: '#DEE2E6',       // Medium borders
    dark: '#ADB5BD',         // Dark borders
  },
  
  // Button States
  button: {
    primary: '#FF6B6B',
    primaryHover: '#FF5252',
    secondary: '#4ECDC4',
    secondaryHover: '#26A69A',
    disabled: '#C7C7CC',
    disabledText: '#8E8E93',
  },
  
  // Tab Navigation Colors
  tab: {
    active: '#FF6B6B',
    inactive: '#8E8E93',
    background: '#FFFFFF',
    border: '#E5E5EA',
  },
} as const;

// Gradient definitions
export const gradients = {
  primary: ['#FF6B6B', '#4ECDC4'],
  secondary: ['#4ECDC4', '#45B7D1'],
  hero: ['#FF6B6B', '#45B7D1', '#4ECDC4'],
} as const;

// Shadow colors with brand primary
export const shadows = {
  sm: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
} as const;