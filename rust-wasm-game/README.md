# Rust WASM Game

An interactive bouncing ball game written in Rust and compiled to WebAssembly for high-performance browser execution.

## Features

- **High Performance**: Written in Rust and compiled to WebAssembly for near-native performance
- **Interactive**: Click anywhere on the canvas to redirect the ball
- **Smooth Animation**: 60 FPS animation with delta-time based movement
- **Physics Simulation**: Realistic bouncing physics with collision detection
- **Responsive Design**: Adapts to window resizing automatically

## Game Controls

- **Click**: Click anywhere on the canvas to redirect the ball towards that position
- **Random Velocity Button**: Adds random velocity to the ball for unpredictable movement

## Technical Implementation

### Rust Components

- **Game State Management**: Efficient state handling in Rust
- **Canvas Rendering**: Direct manipulation of HTML5 Canvas via web-sys bindings
- **Physics Engine**: Custom physics implementation with collision detection
- **Event Handling**: Mouse click and window resize event processing

### WASM Integration

- **wasm-bindgen**: Seamless JavaScript-Rust interoperability
- **web-sys**: Direct browser API access from Rust
- **ES6 Modules**: Modern JavaScript module loading

### Performance Optimizations

- **Release Build**: Optimized Rust compilation for size and speed
- **Minimal Dependencies**: Only essential crates included
- **Efficient Rendering**: Direct canvas operations without JavaScript overhead

## Building

To build the WASM module:

```bash
# Install Rust WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-bindgen CLI
cargo install wasm-bindgen-cli

# Build the WASM module
cargo build --target wasm32-unknown-unknown --release

# Generate JavaScript bindings
wasm-bindgen --out-dir pkg --target web target/wasm32-unknown-unknown/release/rust_wasm_game.wasm
```

## Project Structure

```
rust-wasm-game/
├── src/
│   └── lib.rs          # Main Rust game logic
├── pkg/                # Generated WASM bindings
│   ├── rust_wasm_game.js
│   ├── rust_wasm_game_bg.wasm
│   └── rust_wasm_game.d.ts
├── Cargo.toml         # Rust dependencies and configuration
└── index.html         # HTML game interface
```

## Dependencies

### Rust Crates

- `wasm-bindgen` - JavaScript-Rust interop
- `web-sys` - Browser API bindings
- `js-sys` - JavaScript type bindings
- `getrandom` - Random number generation (WASM compatible)

### Browser Requirements

- Modern browser with WebAssembly support
- ES6 module support
- HTML5 Canvas support

## Game Logic

The game implements a simple but engaging physics simulation:

1. **Ball State**: Position, velocity, and radius
2. **Movement**: Delta-time based position updates
3. **Collision Detection**: Boundary checking with canvas edges
4. **User Interaction**: Click-to-redirect mechanics
5. **Rendering**: Direct canvas drawing with visual effects

## Integration

This game is part of a larger GitHub Pages site showcasing various web technologies. It demonstrates how Rust can be used for high-performance web applications through WebAssembly compilation.