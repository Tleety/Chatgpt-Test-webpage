#!/bin/bash

# Build script for Bevy WASM game
set -e

echo "Building Bevy WASM game..."

# Install wasm-pack if not available
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM package
echo "Compiling Rust to WebAssembly..."
wasm-pack build --target web --out-dir pkg --release

echo "Bevy WASM game built successfully!"
echo "You can now open index.html in a web server to play the game."