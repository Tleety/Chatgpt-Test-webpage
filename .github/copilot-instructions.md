# GitHub Copilot Instructions

## Primary Requirement

**Always read and follow the coding best practices documented in the [README.md](../README.md) file before making any code suggestions or implementations.**

## Key Guidelines to Follow

### 1. Technology-Specific Best Practices
Before working with any code in this repository, reference the detailed coding guidelines in README.md for:

- **HTML/CSS/JavaScript**: Semantic HTML5, modern ES6+ features, separation of concerns
- **Jekyll**: Convention-over-configuration, frontmatter usage, DRY principles
- **Phaser 3**: CDN loading, proper game structure, modular code
- **Go + WebAssembly**: Standard Go structure, lightweight modules, proper build flags
- **Bevy Game Engine + Rust**: Entity-Component-System architecture, WASM-compatible patterns, modular systems
- **Jest Testing**: Comprehensive coverage, jsdom environment, TDD approach
- **Rust Testing**: Unit tests with `cargo test`, integration tests, 95% code coverage with `cargo-tarpaulin`

### 2. Design Coherence
Maintain visual and functional consistency by following the design guidelines in README.md:
- Use shared `style.css` for consistent styling
- Follow standard header structure and navigation patterns
- Apply established color palette and responsive design principles

### 3. Testing Requirements
When adding new features or modifying existing code:
- Follow the unit testing guidelines outlined in README.md
- Write tests before or alongside implementation (TDD approach)
- Ensure comprehensive test coverage for initialization, core logic, edge cases, and UI interactions
- Use Jest framework with jsdom environment for browser compatibility
- **For Bevy/Rust code**: Maintain 95% code coverage using `cargo-tarpaulin`, write unit tests for all components, systems, and resources
- **Always run test suite**: Execute `cargo test` for Bevy components after any changes to ensure functionality

### 4. Code Organization
- Keep code modular and maintainable
- Follow the established directory structure
- Separate concerns appropriately
- Use consistent naming conventions (kebab-case for classes, modern JavaScript features)
- **For Bevy/Rust code**: Follow ECS patterns, separate systems/components/resources, use descriptive component names, implement proper error handling

## Bevy Game Engine Specific Guidelines

### ECS Architecture Best Practices
- **Components**: Use simple data structs, avoid logic in components
- **Systems**: Keep systems focused on single responsibilities, use system parameters efficiently
- **Resources**: Use for global game state, prefer `Res<T>` and `ResMut<T>` over `Resource`
- **Queries**: Write efficient queries, use filters and change detection when appropriate

### Rust/WASM Integration
- Use `wasm-bindgen` for JavaScript interop
- Minimize JavaScript <-> WASM boundary crossings for performance
- Handle errors gracefully with `Result<T, JsValue>` for WASM functions
- Use feature flags to separate native and WASM-specific code

### Performance Guidelines
- Prefer systems over closures for game logic
- Use `Changed<T>` and `Added<T>` filters to avoid unnecessary work
- Bundle related components together
- Use `Commands` for deferred entity operations

### Testing Requirements for Bevy
- **Unit Test Coverage**: Maintain 95% code coverage using `cargo-tarpaulin`
- **Component Tests**: Test component initialization and data integrity
- **System Tests**: Test system logic with mock worlds and resources
- **Integration Tests**: Test WASM exports and JavaScript interop
- **Test Structure**: Place unit tests in `#[cfg(test)]` modules within source files
- **Run Tests**: Always execute `cargo test` after changes to verify functionality

## Development Workflow

1. **Read README.md first** - Always review the current coding best practices
2. **Check existing patterns** - Look at how similar functionality is implemented
3. **Follow test guidelines** - Ensure any new code includes appropriate tests
4. **Maintain consistency** - Keep styling, structure, and patterns consistent with existing code
5. **Update documentation** - If adding new features, consider updating README.md guidelines
6. **Run Bevy tests** - For Rust/Bevy changes, execute `cargo test` and verify 95% coverage with `cargo tarpaulin`

## Important Notes

- This is a GitHub Pages site with diverse web technologies
- Test visualization system is important - maintain compatibility
- Mobile-friendly responsive design is required
- Accessibility attributes should be included in HTML
- Build instructions for different technologies are documented in README.md
- **Bevy game must maintain 95% test coverage** - Use `cargo tarpaulin --out html` to verify coverage
- **CI/CD pipeline runs Bevy tests** - All Rust code changes trigger automated test execution

Always prioritize reading and understanding the comprehensive guidelines in README.md before suggesting any code changes or implementations.