#!/bin/bash

# Build script for Bevy WebAssembly game
set -e

echo "Building Bevy game for WebAssembly..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Build the WebAssembly package
wasm-pack build --target web --out-dir pkg --no-typescript

echo "Build complete! Generated files in pkg/ directory."
echo "You can now serve the directory and open index.html"