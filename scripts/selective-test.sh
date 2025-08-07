#!/bin/bash

# Script to run selective tests based on which components changed
# Used by CI/CD pipeline for optimized testing

set -e

BUILD_STRATEGY="${1:-full}"

echo "Running tests for strategy: $BUILD_STRATEGY"
echo "============================================"

case "$BUILD_STRATEGY" in
    "wasm-only")
        echo "Running WASM-related tests only..."
        npx jest --testPathPattern="(wasm|movement|pathfinding|unit)" --verbose
        ;;
    "jekyll-only")
        echo "Running Jekyll/todo-related tests only..."
        npx jest --testPathPattern="(todo|jekyll)" --verbose
        ;;
    "tests-only")
        echo "Running core test infrastructure tests..."
        npx jest --testPathPattern="(test-visualizer|deployment)" --verbose
        ;;
    "snake-only")
        echo "Running Snake game tests only..."
        npx jest --testPathPattern="snake" --verbose
        ;;
    "main-site-only")
        echo "Running main site tests only..."
        npx jest --testPathPattern="(top-bar|version)" --verbose
        ;;
    "full")
        echo "Running all tests..."
        npm test
        ;;
    *)
        echo "Unknown strategy: $BUILD_STRATEGY, running all tests..."
        npm test
        ;;
esac

echo "Test execution completed for strategy: $BUILD_STRATEGY"