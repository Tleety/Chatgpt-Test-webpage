# Snake Game Unit Tests

This directory contains unit tests for the Snake game logic.

## Test Files

- `snake-game-logic.js` - Core game logic extracted into a testable module
- `snake-game-logic.test.js` - Comprehensive unit tests covering all game functionality

## Running Tests

```bash
# Install dependencies
npm install

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Coverage

The tests cover:

- **Initialization**: Game setup, snake placement, food placement
- **Direction Changes**: Valid moves, preventing 180-degree turns
- **Collision Detection**: Wall collisions, self-collisions, food collisions
- **Snake Movement**: Forward movement, growing when eating food, collision handling
- **Food Placement**: Valid positioning, avoiding snake body
- **Game State**: State management, reset functionality
- **Edge Cases**: Small game areas, crowded game areas

All tests use the Jest testing framework with jsdom environment for browser compatibility.