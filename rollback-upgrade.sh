#!/bin/bash

# Next.js Upgrade Rollback Script for LooxMaxx

echo "============================================="
echo "  LooxMaxx Next.js Upgrade Rollback Script  "
echo "============================================="

# Check if backup exists
if [ ! -d "./backup" ] || [ ! -f "./backup/package.json" ] || [ ! -f "./backup/next.config.js" ]; then
  echo "❌ Error: Backup files not found. Cannot rollback."
  exit 1
fi

# Step 1: Restore backup files
echo "🔄 Restoring backup files..."
cp backup/package.json package.json
cp backup/next.config.js next.config.js
echo "✅ Configuration files restored"

# Step 2: Remove added type files
echo "🗑️ Removing added type files..."
rm -f global.d.ts
echo "✅ Removed type files"

# Step 3: Clean installation
echo "🧹 Cleaning installation..."
rm -rf node_modules
rm -rf .next
echo "✅ Cleaned project files"

# Step 4: Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install
echo "✅ Dependencies reinstalled"

echo "============================================="
echo "✅ Rollback completed!"
echo "📋 Next steps:"
echo "  1. Run 'npm run dev' to test the application"
echo "  2. Verify the application has been restored"
echo "=============================================" 