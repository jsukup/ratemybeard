# TASK_ASSIGNMENT.md

## Worktree: ratemyfeet-branding
## Branch: task/branding 
## Priority: low

## Description:
Update Branding and UI Components - Complete Rebrand from LooxMaxx to RateMyFeet

## Primary Reference Files:
- **Task 11**: `.taskmaster/tasks/task_011.txt`

## Assigned Tasks: 11

### Instructions for Claude Code:
1. **READ FIRST**: `.taskmaster/tasks/task_011.txt` for complete branding specifications
2. **COORDINATE**: With Task 1 (AI cleanup) on 'looxmaxx' branding removal division
3. **COMPREHENSIVE**: This is a complete visual and textual rebrand
4. **CONSISTENCY**: Ensure brand consistency across all touchpoints

## Task 11: Update Branding and UI Components
- **Priority**: Low (can run parallel to other work)
- **Dependencies**: Task 1 (coordinate branding removal responsibilities)
- **Reference**: `.taskmaster/tasks/task_011.txt`

### Key Deliverables (from task_011.txt):
1. Replace all 'looxmaxx' references with 'RateMyFeet'
2. Update logos, colors, and UI elements
3. Update meta tags and SEO content
4. Implement new brand color scheme
5. Update navigation and header components

### Brand Configuration (from task_011.txt):
```javascript
// constants/branding.js
export const BRAND_CONFIG = {
  name: 'RateMyFeet',
  tagline: 'Rate the attractiveness of feet',
  primaryColor: '#FF6B6B',
  secondaryColor: '#4ECDC4',
  logoUrl: '/images/ratemyfeet-logo.png',
  faviconUrl: '/favicon-ratemyfeet.ico'
};
```

### CSS Variables Update (from task_011.txt):
```css
:root {
  --brand-primary: #FF6B6B;
  --brand-secondary: #4ECDC4;
  --brand-accent: #45B7D1;
  --brand-text: #2C3E50;
  --brand-background: #F8F9FA;
}
```

### Meta Tags Update (from task_011.txt):
```javascript
const brandingMeta = {
  title: 'RateMyFeet - Rate Foot Attractiveness',
  description: 'A lighthearted platform for rating foot attractiveness through user-generated scoring',
  keywords: 'feet, rating, attractiveness, community, fun'
};
```

## Comprehensive Branding Changes:

### 1. Text Content Updates:
- **App Name**: 'LooxMaxx' → 'RateMyFeet'
- **Taglines**: Update all marketing copy and descriptions
- **Page Titles**: Update HTML titles and meta descriptions
- **Error Messages**: Update any branded error text
- **Help/About Content**: Rebrand informational content

### 2. Visual Elements:
- **Logo**: Replace main logo with RateMyFeet branding
- **Favicon**: Update favicon.ico and related icon files
- **Color Scheme**: Implement new brand colors throughout
- **Typography**: Update font choices if specified
- **Component Styling**: Update UI component themes

### 3. Code References:
- **Variable Names**: Update any 'looxmaxx' variable references
- **File Names**: Rename files containing old brand references
- **Comments**: Update code comments with old branding
- **Configuration**: Update config files with new brand info

### 4. Assets and Files:
- **Images**: Replace branded images and graphics
- **Icons**: Update app icons and favicons
- **Manifest**: Update PWA manifest with new branding
- **SEO Files**: Update robots.txt, sitemap references

## Coordination with Task 1 (AI Cleanup):
- **Division of Work**: Coordinate with AI cleanup team on 'looxmaxx' removal
- **Suggested Split**: 
  - Task 1: Remove 'looxmaxx' from AI-related files and dependencies
  - Task 11: Replace with 'RateMyFeet' and handle all visual/UI branding

## Files to Focus On:
- `app/layout.tsx` - Update meta tags and titles
- `app/page.tsx` - Update main content and headers
- `components/` - Update all component text and styling
- `public/` - Replace logos, favicons, and manifest
- `styles/` or CSS files - Update color variables and themes
- `package.json` - Update project name and description
- Configuration files with brand references

## Test Strategy (from task_011.txt):
- Verify all old branding references are removed by searching codebase
- Test logo displays correctly across different screen sizes
- Validate color scheme consistency throughout the application
- Check that all meta tags and SEO content is updated
- Verify favicon and app icons display correctly

## Search and Replace Operations:
- Search for: 'looxmaxx', 'LooxMaxx', 'LOOXMAXX'
- Replace with: 'ratemyfeet', 'RateMyFeet', 'RATEMYFEET'
- Update URLs, domains, and external references
- Update social media and external service configurations

## Dependencies & Coordination:
- **Coordinate with**: Task 1 (AI cleanup) on branding removal division
- **Independent of**: Most other tasks - can run in parallel
- **Provides**: Updated branding for final integration

## DO NOT MODIFY:
- Core functionality or business logic
- Database schema or API endpoints
- Complex component behavior (focus on styling/text)
- Performance optimization code

## Work Sequence:
1. ✅ Read `.taskmaster/tasks/task_011.txt` thoroughly
2. ⬜ Coordinate with Task 1 team on branding removal division
3. ⬜ Create new brand assets (logos, favicons)
4. ⬜ Update CSS variables and color scheme
5. ⬜ Search and replace all text references
6. ⬜ Update meta tags and SEO content
7. ⬜ Update navigation and header components
8. ⬜ Test branding consistency across all pages
9. ⬜ Verify old branding completely removed

## Success Criteria:
- No 'looxmaxx' references remain anywhere in codebase
- All visual elements reflect RateMyFeet branding
- New color scheme consistently applied
- Meta tags and SEO updated for new brand
- Logo and favicon display correctly on all devices
- Brand consistency maintained across all user touchpoints