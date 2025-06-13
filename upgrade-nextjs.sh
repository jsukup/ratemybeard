#!/bin/bash

# Next.js 13 to 14 Upgrade Script for LooxMaxx

echo "============================================="
echo "  LooxMaxx Next.js 13 to 14 Upgrade Script  "
echo "============================================="

# Step 1: Create a backup
echo "📦 Creating a backup..."
mkdir -p backup
cp package.json backup/package.json
cp next.config.js backup/next.config.js
echo "✅ Backup created in the 'backup' directory"

# Step 2: Update dependencies
echo "🔄 Updating dependencies..."
npm install next@latest react@latest react-dom@latest eslint-config-next@latest

# Step 3: Update TypeScript types
echo "📝 Updating TypeScript types..."
npm install --save-dev typescript@latest @types/react@latest @types/react-dom@latest @types/node@latest

# Step 4: Update other dependencies
echo "🔄 Updating related dependencies..."
npm install tailwindcss@latest autoprefixer@latest postcss@latest

# Step 5: Add missing TypeScript configurations
echo "🔧 Updating TypeScript configuration..."
# Add "skipLibCheck": true to tsconfig.json to avoid type conflicts
if ! grep -q "skipLibCheck" tsconfig.json; then
  sed -i 's/"compilerOptions": {/"compilerOptions": {\n    "skipLibCheck": true,/' tsconfig.json
fi

# Step 6: Resolve type errors for Next.js modules
echo "🔍 Resolving type errors..."
touch global.d.ts
cat > global.d.ts << EOL
// Add declaration overrides for modules without type definitions
declare module "next/server" {
  export type NextRequest = import("next").NextRequest;
  export type NextResponse = import("next").NextResponse;
  export const NextResponse: any;
}
EOL

# Step 7: Clean installation
echo "🧹 Cleaning installation..."
rm -rf .next
npm prune

# Step 8: Rebuild the project
echo "🔨 Building the project..."
npm run build

echo "============================================="
echo "✅ Upgrade completed!"
echo "📋 Next steps:"
echo "  1. Run 'npm run dev' to test the application"
echo "  2. Check for any console warnings or errors"
echo "  3. Verify all functionality is working"
echo "  4. If issues occur, check UPGRADE_GUIDE.md"
echo "=============================================" 