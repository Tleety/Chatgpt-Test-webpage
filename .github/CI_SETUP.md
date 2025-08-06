# CI/CD Setup Instructions

This repository now includes automated testing and deployment workflows via GitHub Actions. To ensure all unit tests are required to pass before merging, the repository maintainer should configure the following branch protection rules.

## Required Branch Protection Rules

Navigate to: **Settings > Branches > Add rule** for the `main` branch

### Required Status Checks
Enable the following required status checks:
- `PR Tests Required` (from the "PR Validation" workflow) - **CRITICAL FOR MERGE PROTECTION**
- `Unit Tests` (from the "CI/CD Pipeline" workflow)

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

### 1. PR Validation (`pr-validation.yml`) - **PRIMARY MERGE PROTECTION**
- **Purpose**: Enforce unit test requirements for all pull requests
- **Triggers**: Pull request events (opened, updated, reopened)
- **Actions**: 
  - Installs dependencies with `npm ci`
  - Runs `npm test` with strict validation
  - Creates "PR Tests Required" status check that **MUST PASS** for merging
  - Generates test summary and validation report

### 2. CI/CD Pipeline (`ci.yml`)
- **Purpose**: Complete build, test, and deployment pipeline
- **Triggers**: Push to main, Pull requests to main
- **Actions**:
  - **Test Job**: Runs all unit tests
  - **Build Job**: Builds all project components (Go WASM, Jekyll site)
  - **Deploy Job**: Deploys to GitHub Pages (only on main branch pushes)

## Testing Coverage

Current test coverage includes:
- **Snake Game Logic** (37 tests): Game mechanics, collision detection, state management
- **Snake Game UI** (4 tests): UI interactions and keyboard handling  
- **Todo List Logic** (37 tests): Task management, data persistence, input validation
- **Top Bar Component** (8 tests): Navigation and UI consistency
- **WASM Game Collision** (26 tests): Collision detection and movement in WebAssembly game
- **Deployment Info** (20 tests): CI/CD integration and deployment information generation
- **Version Update** (26 tests): Version management and update system

**Total: 158 tests across 7 test suites** - **ALL MUST PASS FOR PR MERGE**

## Benefits

With these workflows and branch protection rules:
1. **Guaranteed test validation**: The "PR Tests Required" status check prevents merging PRs with failing tests
2. **No broken code in main**: All 158 tests must pass before merge
3. **Automated deployment**: Successful builds automatically deploy to GitHub Pages
4. **Build validation**: All project components (JS, Go WASM, Jekyll) are built and validated
5. **Fast feedback**: Test failures are caught early in pull requests
6. **Coverage tracking**: Test coverage information is available in CI logs

## Critical Setup Required

⚠️ **IMPORTANT**: To enforce test requirements, the repository administrator must configure branch protection rules in GitHub settings:

1. Go to **Settings > Branches**
2. Add a rule for the `main` branch
3. Enable **"Require status checks to pass before merging"**
4. Select the **"PR Tests Required"** status check as required
5. Optionally require **"Unit Tests"** from the CI/CD pipeline as well

**Without these branch protection rules, PRs can still be merged even if tests fail.**

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