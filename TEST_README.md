# Snake Game Tests

This directory contains unit tests for the Snake Game implemented in `phaser-game/index.html`.

## Running Tests

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run all tests:
   ```bash
   npm test
   ```

3. Run tests in watch mode (automatically re-run on file changes):
   ```bash
   npm run test:watch
   ```

## Test Coverage

The test suite includes comprehensive coverage of:

- **Game Initialization**: Starting position, initial state, score tracking
- **Direction Changes**: Valid direction changes and prevention of 180-degree turns
- **Snake Movement**: Forward movement, length changes when eating food
- **Collision Detection**: Wall collisions, self-collisions, game over states
- **Food Mechanics**: Food placement, collision detection with food
- **Game State Management**: State retrieval and immutability
- **Edge Cases**: Empty snake handling, custom dimensions, infinite loop prevention

## Test Structure

- `snake-game.js`: Core game logic extracted from the HTML file
- `snake-game.test.js`: Jest unit tests for all game functions
- Tests are organized by functionality with descriptive test names

## Architecture

The game logic has been extracted into a reusable `SnakeGame` class that can be:
- Tested independently of the Phaser.js rendering layer
- Used with different rendering engines
- Easily extended with new features

The HTML file now uses this class while maintaining identical gameplay behavior.