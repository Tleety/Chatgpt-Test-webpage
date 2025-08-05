# Test Integration and Automatic Discovery

The test visualizer page (`test-results.html`) automatically discovers and executes tests from the actual Jest test files used in the CI/CD pipeline.

## How It Works

1. **Automatic Test Discovery**: The `build-test-definitions.js` script parses all Jest test files (`*.test.js`) and extracts test definitions
2. **Browser-Compatible Generation**: Test logic is converted from Jest syntax to browser-compatible JavaScript
3. **Dynamic Updates**: New tests added to Jest files are automatically included when regenerating

## Test Files Included

- `snake-game-logic.test.js` - Logic tests for the Snake game
- `snake-game-ui.test.js` - UI and event handling tests  
- `todo-list-logic.test.js` - TodoList functionality tests
- `top-bar.test.js` - Top bar component tests

## Adding New Tests

1. Add tests to any existing `*.test.js` file using Jest syntax
2. Run `npm run build:test-definitions` to regenerate the test definitions
3. The new tests will automatically appear in the test visualizer

## Architecture

```
Jest Test Files (*.test.js)
     ↓ (parsed by)
build-test-definitions.js
     ↓ (generates)
test-definitions.js
     ↓ (loaded by)
test-results.html
```

## Commands

- `npm run build:test-definitions` - Regenerate test definitions from Jest files
- `npm test` - Run Jest tests in Node.js (CI/CD pipeline)
- Open `test-results.html` in browser - Run browser-compatible tests

## Automatic Test Count

Current test count extracted from Jest files: **84 tests**

The test visualizer will always show the exact same number of tests as the CI/CD pipeline, ensuring complete synchronization.