#!/bin/bash

# Mobile App Build Script for CI/CD

set -e

echo "========================================="
echo "Afribok Mobile App Build Process"
echo "========================================="

# Variables
BUILD_DIR="mobile"
APP_VERSION=$(grep '"version":' package.json | head -1 | awk -F'"' '{print $4}')
BUILD_NUMBER=${BUILD_NUMBER:-1}
BUILD_TYPE=${BUILD_TYPE:-"debug"}

echo "[1/5] Installing dependencies..."
cd $BUILD_DIR
npm install

echo "[2/5] Running tests..."
npm test -- --coverage

echo "[3/5] Building Android APK..."
if [ "$BUILD_TYPE" = "release" ]; then
    eas build --platform android --non-interactive
else
    echo "Debug mode: Skipping Android build"
fi

echo "[4/5] Building iOS IPA..."
if [ "$BUILD_TYPE" = "release" ]; then
    eas build --platform ios --non-interactive
else
    echo "Debug mode: Skipping iOS build"
fi

echo "[5/5] Creating build artifacts..."
mkdir -p build-artifacts
cp -r .eas/build-artifacts/* build-artifacts/ 2>/dev/null || true

echo ""
echo "========================================="
echo "Build complete!"
echo "Version: $APP_VERSION"
echo "Build Number: $BUILD_NUMBER"
echo "========================================="
