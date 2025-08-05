# ChatGPT Test Webpage

This repository hosts a small GitHub Pages site that links to a few minimal web projects.
View the site live at https://tleety.github.io/Chatgpt-Test-webpage/.

## Projects

- **Todo List** – Interactive todo list built with Jekyll, featuring add/complete/delete functionality.
- **Simple Phaser Game** – Phaser 3 example with a bouncing logo.
- **Go WASM Game** – Tiny Go WebAssembly demo that moves a square with the arrow keys.

## Running locally

1. **Open the landing page**
   ```
   open index.html
   ```
   This lets you click through to each project.

2. **Run the Jekyll site**
   ```
   cd jekyll-site
   jekyll serve
   ```
   Requires a Ruby environment with Jekyll installed.

3. **Run the Phaser demo**
   ```
   open phaser-game/index.html
   ```
   It loads Phaser from a CDN, so no build step is necessary.

4. **Build the Go WASM demo**
   ```
   cd go-wasm-game
   GOOS=js GOARCH=wasm go build -o game.wasm
   ```
   After building, serve the folder with any static web server and open `index.html` in a browser.

## Testing

Unit tests are available for multiple projects and are **required to pass** for all deployments and merges:

```bash
# Install test dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

**Current Test Coverage:**
- **Snake Game Logic**: Comprehensive tests for game mechanics, collision detection, and state management
- **Todo List Logic**: Full test suite for task management, data persistence, and input validation
- **Snake Game UI**: Tests for user interface interactions and keyboard handling
- **Top Bar Component**: Tests for navigation and UI consistency

**Total: 84 tests across 4 test suites** (automatically synchronized with CI/CD pipeline)

### Test Visualizer

The [Test Visualizer](test-results.html) provides a real-time dashboard showing test results directly from the CI/CD pipeline. **All test results are fetched from GitHub Actions**, ensuring the visualizer displays the same results that determine deployment success/failure.

**Key Features:**
- ✅ **Real Pipeline Results**: Fetches actual test results from GitHub Actions workflows
- ✅ **Live Updates**: Auto-refreshes every 2 minutes to show latest test status
- ✅ **Accurate Data**: Shows the same test results that control deployments
- ✅ **No Environment Issues**: Eliminates browser vs CI/CD environment mismatches

**How it Works:**
```
GitHub Actions Workflow → Jest Test Execution → API Results → Test Visualizer
```

The visualizer uses the GitHub Actions API to fetch the latest workflow run results, parsing Jest output to display comprehensive test summaries and individual test file statuses.

See [TESTING.md](TESTING.md) for detailed information about the test suite.

### CI/CD Pipeline

This repository includes automated testing and deployment via GitHub Actions:

- **All pull requests** must pass unit tests before merging
- **Main branch pushes** trigger full build and deployment to GitHub Pages
- **Test failures** prevent deployment and require fixes before merge

See [CI/CD Setup Instructions](.github/CI_SETUP.md) for configuration details.

## Coding Guidelines

### Technologies Used

This project uses a diverse set of technologies to demonstrate different web development approaches:

- **HTML/CSS/JavaScript** - Core web technologies for the main landing page and Snake game
- **Jekyll** - Ruby-based static site generator for the todo list project
- **Phaser 3** - JavaScript game framework loaded via CDN for interactive demos
- **Go + WebAssembly** - Compiled Go code running in the browser for performance-critical applications
- **Jest** - JavaScript testing framework with jsdom environment for unit testing
- **GitHub Pages** - Static site hosting and deployment

### Coding Best Practices

#### HTML/CSS/JavaScript
- Use semantic HTML5 elements (`<header>`, `<main>`, `<section>`)
- Maintain consistent class naming conventions (kebab-case)
- Keep CSS organized with logical grouping and consistent indentation
- Use modern JavaScript features (ES6+) where appropriate
- Separate concerns: structure (HTML), presentation (CSS), behavior (JavaScript)
- Include proper meta tags and accessibility attributes

#### Jekyll
- Follow Jekyll's convention-over-configuration approach
- Use frontmatter consistently for page metadata
- Organize content in logical directory structures
- Leverage Jekyll's built-in features (layouts, includes) for DRY principles

#### Phaser 3
- Load Phaser from CDN for simplicity in demo projects
- Structure game code with clear initialization, update, and render phases
- Use Phaser's built-in systems (scenes, sprites, physics) appropriately
- Keep game logic modular and testable where possible

#### Go + WebAssembly
- Use standard Go project structure
- Keep WASM modules focused and lightweight
- Provide clear build instructions with proper GOOS/GOARCH flags
- Include necessary runtime files (`wasm_exec.js`)

### Unit Testing Guidelines

Our testing approach emphasizes comprehensive coverage and maintainable test code:

#### Test Structure
- Use Jest as the primary testing framework
- Configure jsdom environment for browser API compatibility
- Organize tests with clear `describe` blocks and descriptive test names
- Use `beforeEach` for consistent test setup

#### Test Coverage Areas
- **Initialization**: Verify proper setup and default states
- **Core Logic**: Test all business logic functions thoroughly
- **Edge Cases**: Handle boundary conditions and error states
- **State Management**: Validate state transitions and persistence
- **UI Interactions**: Test user interface behavior and responses

#### Best Practices
- Write tests before or alongside implementation (TDD approach)
- Keep tests focused and atomic (one assertion per concept)
- Use descriptive test names that explain the expected behavior
- Mock external dependencies and browser APIs when necessary
- Maintain test independence (no shared state between tests)

### Design Coherence Guidelines

To maintain visual and functional consistency across all project pages:

#### Shared Styling
- Use the common `style.css` for consistent typography and color schemes
- Maintain the standard header structure with logo, title, and navigation
- Apply consistent spacing and layout patterns
- Use the established color palette: dark header (#333), light background (#f0f0f0)

#### Navigation Consistency
- Include standard navigation links in the top bar
- Link to the main page, projects section, and test visualizer
- Use consistent hover effects and interaction patterns
- Ensure all pages can navigate back to the main landing page

#### Component Design
- Use project cards with consistent icon and layout structure
- Maintain responsive design principles across all pages
- Apply consistent button styles and interactive elements
- Use standard fonts (Segoe UI stack) throughout the project

### CI/CD and Deployment Guidelines

Our development workflow enforces quality through automated testing and deployment:

#### Required Testing
- **All unit tests must pass** before code can be merged to main branch
- Tests are automatically run on every pull request and push to main
- Failed tests prevent deployment and require immediate fixes
- Local testing is recommended before pushing: `npm test`

#### GitHub Actions Workflows
- **Test Suite**: Fast unit test execution for quick feedback on PRs
- **CI/CD Pipeline**: Complete build, test, and deployment process
- **Deployment**: Automatic deployment to GitHub Pages on successful main branch builds

#### Branch Protection
- Main branch is protected and requires passing status checks
- Pull requests must be up to date with main before merging
- All contributors (including administrators) must follow the same rules

#### Pre-commit Best Practices
- Run tests locally before committing: `npm test`
- Ensure all builds complete successfully
- Verify Go WASM builds work: `cd go-wasm-game && GOOS=js GOARCH=wasm go build -o game.wasm`
- Test Jekyll builds locally: `cd jekyll-site && bundle exec jekyll serve`

### Test Visualization

Our test visualization system provides comprehensive insight into test execution:

#### Test Results Page
- Displays real-time test execution results in a visual format
- Shows test suite summary with pass/fail statistics
- Provides detailed test case breakdown with timing information
- Includes interactive features for exploring test details

#### Integration with CI/CD
- Tests are automatically executed and results updated
- Visual indicators show test status at a glance
- Historical test data helps track project health over time
- Failed tests are highlighted with detailed error information

#### Accessing Test Results
- Navigate to the test visualizer via the main page navigation
- Direct link available at `test-results.html`
- Results are updated after each test run
- Mobile-friendly responsive design for viewing on any device

## License

The Go runtime file `wasm_exec.js` is licensed under the BSD-style license from the Go authors.
