#!/bin/bash

# Script to check Bevy game test coverage
# Ensures 95% coverage threshold is met

cd /home/runner/work/Chatgpt-Test-webpage/Chatgpt-Test-webpage/bevy-game

echo "Running Bevy game unit tests..."
cargo test --lib

echo "Generating coverage report..."
cargo tarpaulin --lib --out html --out lcov --output-dir target/coverage --fail-under 95

if [ $? -eq 0 ]; then
    echo "✅ Coverage test passed! Achieved 95%+ coverage."
    exit 0
else
    echo "❌ Coverage test failed! Below 95% coverage threshold."
    echo "Please add more unit tests to improve coverage."
    exit 1
fi