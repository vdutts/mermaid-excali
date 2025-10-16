#!/bin/bash

# Production deployment script for Mermaid-Excalidraw converter
# This ensures consistent builds and prevents version drift

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Step 1: Clean install
echo "📦 Cleaning and reinstalling dependencies..."
cd frontend
rm -rf node_modules package-lock.json dist
npm install

# Step 2: Verify versions
echo "🔍 Verifying locked versions..."
EXCALIDRAW_VERSION=$(node -p "require('./package.json').dependencies['@excalidraw/excalidraw']")
MERMAID_VERSION=$(node -p "require('./package.json').dependencies['@excalidraw/mermaid-to-excalidraw']")

if [[ $EXCALIDRAW_VERSION == *"^"* ]] || [[ $EXCALIDRAW_VERSION == *"~"* ]]; then
    echo "❌ ERROR: @excalidraw/excalidraw version is not locked! Found: $EXCALIDRAW_VERSION"
    exit 1
fi

if [[ $MERMAID_VERSION == *"^"* ]] || [[ $MERMAID_VERSION == *"~"* ]]; then
    echo "❌ ERROR: @excalidraw/mermaid-to-excalidraw version is not locked! Found: $MERMAID_VERSION"
    exit 1
fi

echo "✅ Versions are locked:"
echo "   @excalidraw/excalidraw: $EXCALIDRAW_VERSION"
echo "   @excalidraw/mermaid-to-excalidraw: $MERMAID_VERSION"

# Step 3: Build
echo "🔨 Building production bundle..."
npm run build

# Step 4: Verify build
if [ ! -d "dist" ]; then
    echo "❌ ERROR: Build failed - dist directory not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ ERROR: Build failed - index.html not found"
    exit 1
fi

echo "✅ Build successful!"

# Step 5: Check for critical files
echo "🔍 Verifying critical files..."
if ! grep -q "normalizeElement" dist/assets/*.js; then
    echo "⚠️  WARNING: normalizeElement function not found in build - this may cause issues!"
fi

echo ""
echo "✅ Production build complete!"
echo "📁 Build output: frontend/dist"
echo ""
echo "Next steps:"
echo "  1. Test locally: cd frontend && npm run preview"
echo "  2. Deploy the 'frontend/dist' directory to your hosting provider"
echo "  3. Verify Mermaid diagrams render correctly in production"
echo ""
