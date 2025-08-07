#!/bin/bash

# Script to detect which components have changed
# Used by CI/CD pipeline for selective building

set -e

# Function to check if files in a directory have changed
check_component_changes() {
    local component_name="$1"
    local paths="$2"
    local base_ref="${3:-HEAD~1}"
    
    echo "Checking changes for $component_name..." >&2
    
    # Try different comparison strategies
    if git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
        if git diff --name-only "$base_ref"...HEAD | grep -E "$paths" > /dev/null; then
            echo "true"
        else
            echo "false"
        fi
    else
        # Fallback: compare with previous commit or check if files exist
        if git diff --name-only HEAD~1 2>/dev/null | grep -E "$paths" > /dev/null; then
            echo "true"
        elif [[ "$paths" == *"scripts"* ]] && ls scripts/*.sh > /dev/null 2>&1; then
            # For CI changes, check if we've added new scripts
            echo "true"
        else
            echo "false"
        fi
    fi
}

# Get the base reference (main branch or fallback)
BASE_REF="${1:-HEAD~1}"

echo "Detecting changes compared to $BASE_REF"
echo "================================================"

# Check each component
WASM_CHANGED=$(check_component_changes "WASM Game" "^go-wasm-game/" "$BASE_REF")
JEKYLL_CHANGED=$(check_component_changes "Jekyll Site" "^jekyll-site/" "$BASE_REF")
SNAKE_CHANGED=$(check_component_changes "Snake Game" "^snake-game/|snake-game-logic\.js" "$BASE_REF")
MAIN_SITE_CHANGED=$(check_component_changes "Main Site" "^(index\.html|style\.css|top-bar\.js|todo-list-logic\.js|favicon\.svg)$" "$BASE_REF")
TESTS_CHANGED=$(check_component_changes "Tests" "^tests/" "$BASE_REF")
CI_CHANGED=$(check_component_changes "CI/CD" "^\.github/workflows/|^scripts/" "$BASE_REF")

# Output results
echo "Component Change Detection Results:"
echo "=================================="
echo "WASM_CHANGED=$WASM_CHANGED"
echo "JEKYLL_CHANGED=$JEKYLL_CHANGED" 
echo "SNAKE_CHANGED=$SNAKE_CHANGED"
echo "MAIN_SITE_CHANGED=$MAIN_SITE_CHANGED"
echo "TESTS_CHANGED=$TESTS_CHANGED"
echo "CI_CHANGED=$CI_CHANGED"

# Determine build strategy
if [[ "$WASM_CHANGED" == "true" && "$JEKYLL_CHANGED" == "false" && "$MAIN_SITE_CHANGED" == "false" && "$SNAKE_CHANGED" == "false" ]]; then
    BUILD_STRATEGY="wasm-only"
elif [[ "$JEKYLL_CHANGED" == "true" && "$WASM_CHANGED" == "false" && "$MAIN_SITE_CHANGED" == "false" && "$SNAKE_CHANGED" == "false" ]]; then
    BUILD_STRATEGY="jekyll-only"
elif [[ "$WASM_CHANGED" == "false" && "$JEKYLL_CHANGED" == "false" && "$MAIN_SITE_CHANGED" == "false" && "$SNAKE_CHANGED" == "false" && "$TESTS_CHANGED" == "true" ]]; then
    BUILD_STRATEGY="tests-only"
else
    BUILD_STRATEGY="full"
fi

echo "BUILD_STRATEGY=$BUILD_STRATEGY"

# Output to GitHub Actions environment if running in CI
if [[ -n "$GITHUB_ENV" ]]; then
    echo "WASM_CHANGED=$WASM_CHANGED" >> "$GITHUB_ENV"
    echo "JEKYLL_CHANGED=$JEKYLL_CHANGED" >> "$GITHUB_ENV"
    echo "SNAKE_CHANGED=$SNAKE_CHANGED" >> "$GITHUB_ENV"
    echo "MAIN_SITE_CHANGED=$MAIN_SITE_CHANGED" >> "$GITHUB_ENV"
    echo "TESTS_CHANGED=$TESTS_CHANGED" >> "$GITHUB_ENV"
    echo "CI_CHANGED=$CI_CHANGED" >> "$GITHUB_ENV"
    echo "BUILD_STRATEGY=$BUILD_STRATEGY" >> "$GITHUB_ENV"
fi

echo "================================================"
echo "Recommended build strategy: $BUILD_STRATEGY"