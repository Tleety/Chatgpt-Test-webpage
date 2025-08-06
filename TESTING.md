# Unit Tests

This repository contains comprehensive unit tests for multiple projects.

## Test Files

### Snake Game Tests
- `snake-game-logic.js` - Core game logic extracted into a testable module
- `snake-game-logic.test.js` - Comprehensive unit tests covering all game functionality
- `snake-game-ui.test.js` - UI interaction tests for the Snake game

### Todo List Tests
- `todo-list-logic.js` - Todo list logic extracted into a testable module
- `todo-list-logic.test.js` - Comprehensive unit tests covering all todo functionality

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

### Snake Game Tests
The Snake game tests cover:

- **Initialization**: Game setup, snake placement, food placement
- **Direction Changes**: Valid moves, preventing 180-degree turns
- **Collision Detection**: Wall collisions, self-collisions, food collisions
- **Snake Movement**: Forward movement, growing when eating food, collision handling
- **Food Placement**: Valid positioning, avoiding snake body
- **Game State**: State management, reset functionality
- **Edge Cases**: Small game areas, crowded game areas

### Todo List Tests
The Todo list tests cover:

- **Initialization**: Logic setup, localStorage integration
- **Task Management**: Adding, updating, deleting tasks
- **Task State**: Toggling completion status, task retrieval
- **Data Persistence**: localStorage save/load operations
- **Task Statistics**: Counting total, completed, and pending tasks
- **Input Validation**: Handling empty inputs, text trimming
- **HTML Security**: XSS prevention through proper escaping
- **Edge Cases**: Empty lists, rapid operations, corrupted data
- **Error Handling**: Graceful degradation when localStorage unavailable

All tests use the Jest testing framework with jsdom environment for browser compatibility.