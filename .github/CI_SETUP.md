# CI/CD Setup Instructions

This repository now includes automated testing and deployment workflows via GitHub Actions. To ensure all unit tests are required to pass before merging, the repository maintainer should configure the following branch protection rules.

## Required Branch Protection Rules

Navigate to: **Settings > Branches > Add rule** for the `main` branch

### Required Status Checks
Enable the following required status checks:
- `Unit Tests` (from the "Test Suite" workflow)
- `Run Tests` (from the "CI/CD Pipeline" workflow)

### Recommended Settings
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- ✅ **Require conversation resolution before merging**
- ✅ **Include administrators** (applies rules to administrators too)

### Optional Settings
- ✅ **Require a pull request before merging**
  - Require at least 1 approving review
  - Dismiss stale reviews when new commits are pushed
- ✅ **Restrict pushes that create files that exceed a size limit**

## Workflows Included

### 1. Test Suite (`test.yml`)
- **Purpose**: Focused on running unit tests quickly
- **Triggers**: Push to main, Pull requests to main
- **Actions**: 
  - Installs dependencies with `npm ci`
  - Runs `npm test` with verbose output
  - Generates coverage reports

### 2. CI/CD Pipeline (`ci.yml`)
- **Purpose**: Complete build, test, and deployment pipeline
- **Triggers**: Push to main, Pull requests to main
- **Actions**:
  - **Test Job**: Runs all unit tests
  - **Build Job**: Builds all project components (Go WASM, Jekyll site)
  - **Deploy Job**: Deploys to GitHub Pages (only on main branch pushes)

## Testing Coverage

Current test coverage includes:
- **Todo List Logic** (38 tests): Task management, data persistence, input validation
- **Top Bar Component** (13 tests): Navigation and UI consistency
- **Deployment Info** (14 tests): Build and deployment information
- **Version Update** (10 tests): Version management functionality

**Total: 75 tests across 4 test suites**

## Benefits

With these workflows and branch protection rules:
1. **No broken code in main**: All tests must pass before merge
2. **Automated deployment**: Successful builds automatically deploy to GitHub Pages
3. **Build validation**: All project components (JS, Go WASM, Jekyll) are built and validated
4. **Fast feedback**: Test failures are caught early in pull requests
5. **Coverage tracking**: Test coverage information is available in CI logs

## Local Development

Developers should run tests locally before pushing:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode during development
npm run test:watch
```

All tests must pass locally and in CI before changes can be merged to main.