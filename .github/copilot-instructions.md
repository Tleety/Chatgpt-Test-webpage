# GitHub Copilot Instructions

## Primary Requirement

**Always read and follow the coding best practices documented in the [README.md](../README.md) file before making any code suggestions or implementations.**

## Key Guidelines to Follow

### 1. Technology-Specific Best Practices
Before working with any code in this repository, reference the detailed coding guidelines in README.md for:

- **HTML/CSS/JavaScript**: Semantic HTML5, modern ES6+ features, separation of concerns
- **Jekyll**: Convention-over-configuration, frontmatter usage, DRY principles
- **Go + WebAssembly**: Standard Go structure, lightweight modules, proper build flags
- **Jest Testing**: Comprehensive coverage, jsdom environment, TDD approach

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

### 4. Code Organization
- Keep code modular and maintainable
- Follow the established directory structure
- Separate concerns appropriately
- Use consistent naming conventions (kebab-case for classes, modern JavaScript features)

## Development Workflow

1. **Read README.md first** - Always review the current coding best practices
2. **Check existing patterns** - Look at how similar functionality is implemented
3. **Follow test guidelines** - Ensure any new code includes appropriate tests
4. **Maintain consistency** - Keep styling, structure, and patterns consistent with existing code
5. **Update documentation** - If adding new features, consider updating README.md guidelines

## Important Notes

- This is a GitHub Pages site with diverse web technologies
- Test visualization system is important - maintain compatibility
- Mobile-friendly responsive design is required
- Accessibility attributes should be included in HTML
- Build instructions for different technologies are documented in README.md

Always prioritize reading and understanding the comprehensive guidelines in README.md before suggesting any code changes or implementations.