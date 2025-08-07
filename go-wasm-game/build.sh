#!/bin/bash
# Build script for Go WASM game
# This compiles the Go source code to WebAssembly

echo "Building Go WASM game..."
GOOS=js GOARCH=wasm go build -o main.wasm
echo "Build complete! main.wasm created successfully."