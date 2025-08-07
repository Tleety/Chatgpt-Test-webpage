#!/bin/bash

# Script to run selective builds based on which components changed
# Used by CI/CD pipeline for optimized building

set -e

BUILD_STRATEGY="${1:-full}"

echo "Running build for strategy: $BUILD_STRATEGY"
echo "============================================"

build_wasm() {
    echo "Building Go WASM module..."
    cd go-wasm-game
    GOOS=js GOARCH=wasm go build -o game.wasm
    cd ..
    echo "✅ WASM build completed"
}

build_jekyll() {
    echo "Building Jekyll site..."
    cd jekyll-site
    gem install bundler jekyll
    bundle install
    bundle exec jekyll build
    cd ..
    echo "✅ Jekyll build completed"
}

case "$BUILD_STRATEGY" in
    "wasm-only")
        echo "Building WASM game only..."
        build_wasm
        ;;
    "jekyll-only")
        echo "Building Jekyll site only..."
        build_jekyll
        ;;
    "tests-only"|"snake-only"|"main-site-only")
        echo "No build required for strategy: $BUILD_STRATEGY"
        ;;
    "full")
        echo "Building all components..."
        build_wasm
        build_jekyll
        echo "✅ Full build completed"
        ;;
    *)
        echo "Unknown strategy: $BUILD_STRATEGY, building all components..."
        build_wasm
        build_jekyll
        ;;
esac

echo "Build execution completed for strategy: $BUILD_STRATEGY"