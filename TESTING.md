# Unit Tests

This repository contains comprehensive unit tests for multiple projects.

## Test Files

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