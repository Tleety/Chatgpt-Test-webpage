# Bevy Game Foundation

A minimal Bevy game engine foundation built with Rust and compiled to WebAssembly for browser deployment.

## About

This project demonstrates the core concepts of the Bevy game engine:

- **Entity-Component-System (ECS) Architecture**: Demonstrates component-based design patterns
- **Game Loop**: Proper timing and rendering cycles
- **WebAssembly Integration**: Rust code compiled to run efficiently in browsers
- **Physics Simulation**: Basic sprite movement and collision detection
- **Foundation for Expansion**: Structured to easily add full Bevy features

## Features

- Animated sprites with physics simulation
- Bouncing behavior with edge collision detection
- Real-time rendering with proper game loop timing
- Canvas-based 2D graphics
- WebAssembly performance optimization
- **Comprehensive Test Coverage**: Unit tests with 95% coverage target
- **CI/CD Integration**: Automated testing and coverage reporting

## Building

To build the WebAssembly version:

```bash
# Install dependencies (if not already installed)
rustup target add wasm32-unknown-unknown
cargo install wasm-pack

# Build the project
./build.sh
```

This will generate the WebAssembly files in the `pkg/` directory.

## Testing

This project maintains high-quality code through comprehensive testing:

### Running Tests

```bash
# Run unit tests
cargo test --lib

# Run integration tests  
cargo test --test integration_test

# Run all tests
cargo test
```

### Code Coverage

We target 95% code coverage for all business logic:

```bash
# Install coverage tool
cargo install cargo-tarpaulin

# Generate coverage report
cargo tarpaulin --lib --out html --out lcov --output-dir target/coverage

# Check coverage with threshold
./check-coverage.sh
```

**Note**: Some WASM-specific functions cannot be tested in unit tests and are excluded from coverage calculations. All testable business logic achieves high coverage.

### Test Structure

- **Unit Tests**: Located in `src/lib.rs` within `#[cfg(test)]` modules
- **Integration Tests**: Located in `tests/` directory  
- **Coverage Reports**: Generated in `target/coverage/`
- **CI Integration**: Tests run automatically on all commits

### GitHub Copilot Integration

This project includes specific Copilot instructions for Bevy development:

- Follow ECS architecture patterns
- Maintain 95% test coverage for new code
- Write tests before or alongside implementation
- Use proper Rust/WASM error handling
- Follow Bevy coding conventions

## Running

After building, serve the directory with any static web server and open `index.html`:

```bash
# Example with Python
python3 -m http.server 8000

# Example with Node.js
npx serve .
```

Then navigate to `http://localhost:8000/bevy-game/`

## Architecture

### Current Implementation
- Custom game loop using `requestAnimationFrame`
- Canvas 2D rendering context
- Basic sprite component system
- Physics simulation (velocity, collision)

### Bevy Integration Path
The project is structured to easily migrate to full Bevy:

1. **Phase 1** (Current): Custom WASM implementation with Bevy-style architecture
2. **Phase 2**: Integrate Bevy's ECS system
3. **Phase 3**: Add Bevy's rendering pipeline
4. **Phase 4**: Full Bevy feature set (audio, input, scenes, etc.)

## Code Structure

- `src/lib.rs` - Main WASM entry point and game logic
- `src/main.rs` - Native Rust entry point
- `tests/` - Integration tests
- `build.sh` - WebAssembly build script
- `check-coverage.sh` - Coverage validation script
- `index.html` - Web interface and game container
- `pkg/` - Generated WebAssembly files (after build)
- `target/coverage/` - Test coverage reports

## Dependencies

- **wasm-bindgen**: Rust/WebAssembly/JavaScript interop
- **web-sys**: Web API bindings for Rust
- **js-sys**: JavaScript API bindings for Rust
- **bevy** (optional): Full game engine features (future integration)
- **cargo-tarpaulin**: Code coverage analysis
- **wasm-bindgen-test**: WASM-specific testing framework

## Development Guidelines

### Bevy/Rust Best Practices

1. **ECS Patterns**: Use components for data, systems for logic
2. **Error Handling**: Use `Result<T, JsValue>` for WASM functions
3. **Performance**: Minimize JavaScript ↔ WASM boundary crossings
4. **Testing**: Write comprehensive unit tests for all business logic
5. **Coverage**: Maintain 95% test coverage for testable code

### Adding New Features

1. Write tests first (TDD approach)
2. Implement minimal viable functionality
3. Ensure tests pass with `cargo test`
4. Verify coverage with `cargo tarpaulin`
5. Update documentation as needed

### CI/CD Integration

The project includes GitHub Actions workflows that:

- Run unit tests on every commit
- Generate coverage reports
- Build WASM modules
- Deploy to GitHub Pages
- Enforce code quality standards

## Testing Philosophy

This project follows test-driven development (TDD) principles:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **Boundary Testing**: Test edge cases and error conditions
- **Performance Testing**: Verify frame rate and memory usage
- **Coverage Reporting**: Ensure comprehensive test coverage

The codebase is designed to be incrementally upgraded from this foundation to a full Bevy implementation while maintaining high test coverage and code quality.