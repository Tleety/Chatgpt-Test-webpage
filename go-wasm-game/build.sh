#!/bin/bash
# Build script for Go WASM game
# This compiles the Go source code to WebAssembly

echo "Building Go WASM game..."
GOOS=js GOARCH=wasm go build -o game.wasm
echo "Build complete! game.wasm created successfully."