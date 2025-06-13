# Next.js 13 to 14 Upgrade Guide for LooxMaxx

This document outlines the upgrade process from Next.js 13.5.1 to Next.js 14.x for the LooxMaxx project.

## Changes Made

### 1. Package Updates

- Updated Next.js from 13.5.1 to 14.1.4
- Updated React from 18.2.0 to latest 18.2.x
- Updated TypeScript from 5.2.2 to 5.4.5
- Updated various dependencies to their latest compatible versions
- Added proper TypeScript type definitions

### 2. Configuration Changes

- Modified `next.config.js`:
  - Removed `output: 'export'` since we're using API routes and server components
  - Updated image configuration to use optimization instead of disabling it
  - Added support for experimental features like server actions

### 3. App Router Compatibility

- Next.js 14 fully embraces the app router pattern we're already using
- Our directory structure remains compatible with the new version

### 4. Hydration Fixes

- Added `suppressHydrationWarning` to the HTML root element
- This prevents hydration mismatches from browser extensions or plugins
- Updated the RootLayout component to handle client/server differences

### 5. TypeScript Enhancements

- Added `global.d.ts` to provide type definitions for Next.js modules
- Updated `tsconfig.json` to include the new type files
- Added `skipLibCheck: true` to avoid type conflicts (if not already present)

## Breaking Changes to Watch For

### 1. Server Components

- Next.js 14 makes React Server Components the default
- We've kept our "use client" directives where needed
- Any new components should consider whether they need client-side interactivity

### 2. Image Component

- The Next.js Image component has some API changes
- We're now using the optimized version instead of unoptimized

### 3. API Routes

- Our API routes in `app/api` should be compatible with the new format
- The route handlers are fully supported in Next.js 14

## Common Issues and Solutions

### 1. Hydration Errors

If you see hydration errors like:

'''
Error: A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
'''

Check that:

- The `suppressHydrationWarning` attribute is present on the HTML element
- You're not using client-specific code in server components
- All your components with state are properly marked with `"use client"` directive

### 2. Type Errors

If you encounter TypeScript errors related to Next.js modules:

- Check that `global.d.ts` is included in tsconfig.json
- Make sure all the type packages (@types/node, @types/react, etc.) are installed
- Try running `npm install --save-dev @types/next` if needed

## Verification Process

After upgrading, follow these steps to verify everything is working correctly:

1. **Development Server**
   - Run `npm run dev` and verify the server starts without errors
   - Check for any deprecation warnings in the console

2. **Functionality Testing**
   - Test webcam capture functionality
   - Test image analysis with the backend
   - Test leaderboard submission and display
   - Verify responsive design on mobile and desktop

3. **Build Process**
   - Run `npm run build` to ensure the production build completes successfully
   - Check for any optimization warnings

4. **Performance Check**
   - Verify that page load times are same or better
   - Check that image optimization is working correctly

## Rollback Plan

If issues arise that cannot be quickly resolved:

1. Run the rollback script:

   ```bash
   ./rollback-upgrade.sh
   ```

2. Or manually:
   - Revert package.json changes
   - Revert next.config.js
   - Remove added type files
   - Clear node_modules and reinstall

## Additional Resources

- [Next.js 14 Upgrade Guide](https://nextjs.org/docs/messages/app-router-migration)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js Hydration Strategies](https://nextjs.org/docs/messages/react-hydration-error)
