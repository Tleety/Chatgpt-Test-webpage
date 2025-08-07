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
- `build.sh` - WebAssembly build script
- `index.html` - Web interface and game container
- `pkg/` - Generated WebAssembly files (after build)

## Dependencies

- **wasm-bindgen**: Rust/WebAssembly/JavaScript interop
- **web-sys**: Web API bindings for Rust
- **js-sys**: JavaScript API bindings for Rust
- **bevy** (optional): Full game engine features (future integration)

## Development

To extend this foundation:

1. Add more sprite types and behaviors
2. Implement input handling
3. Add audio support
4. Integrate full Bevy ECS system
5. Add 3D rendering capabilities

The codebase is designed to be incrementally upgraded from this foundation to a full Bevy implementation.