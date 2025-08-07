# Rust WASM Game - Minimal Bevy Foundation

A minimal bouncing ball game foundation built with Rust and WebAssembly, designed to be expanded into a full Bevy game engine implementation.

## 🎮 Current Features

- **Interactive Gameplay**: Click anywhere on the canvas to redirect the ball towards your cursor
- **Smooth Animation**: 60 FPS physics simulation with collision detection
- **Responsive Design**: Adapts to different screen sizes and orientations
- **High Performance**: Rust compiled to WebAssembly for optimal browser performance

## 🦀 Architecture Overview

This implementation provides a **minimal foundation** specifically designed for migration to the Bevy game engine:

### Current Structure → Bevy Migration Path

| Current Implementation | Bevy Equivalent | Migration Notes |
|----------------------|-----------------|----------------|
| `Ball` struct | Bevy Components (`Transform`, `Velocity`) | Split into ECS components |
| `GameState` | Bevy `World` and `Resources` | Use Bevy's built-in state management |
| `update()` method | Bevy Systems | Convert to system functions |
| Manual rendering | Bevy Sprite Components | Use Bevy's rendering pipeline |
| Event handling | Bevy Input Events | Use Bevy's input system |

### Planned Bevy Features

```rust
// TODO: Migrate to Bevy ECS architecture
#[derive(Component)]
struct Ball;

#[derive(Component)]
struct Velocity(Vec2);

fn ball_movement_system(
    mut query: Query<(&mut Transform, &Velocity), With<Ball>>,
    time: Res<Time>,
) {
    // Bevy system implementation
}
```

## 🛠️ Technology Stack

- **Rust**: High-performance systems programming language
- **WebAssembly**: Near-native performance in web browsers  
- **wasm-bindgen**: Rust-JavaScript interoperability
- **web-sys**: Web API bindings for Rust
- **Canvas 2D**: Direct rendering to HTML5 canvas

**Future**: Bevy game engine with ECS architecture, WebGL rendering, and comprehensive game development features.

## 🏗️ Building

### Prerequisites

- Rust (latest stable version)
- wasm-pack

### Build Steps

1. **Install wasm-pack** (if not already installed):
   ```bash
   cargo install wasm-pack
   ```

2. **Build the project**:
   ```bash
   ./build.sh
   ```

   Or manually:
   ```bash
   wasm-pack build --target web --out-dir pkg --release
   ```

3. **Serve the game**:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

4. **Open in browser**: Navigate to `http://localhost:8000`

## 🎯 Game Controls

- **Mouse Click**: Click anywhere on the canvas to redirect the ball towards your cursor
- **Automatic Bouncing**: The ball bounces off the edges of the screen
- **Restart**: Use the restart button to reload the game

## 🔧 Project Structure

```
rust-wasm-game/
├── src/
│   └── lib.rs           # Current web-sys implementation (Bevy foundation)
├── pkg/                 # Generated WASM bindings (after build)
├── Cargo.toml          # Rust dependencies and configuration
├── index.html          # Game interface and HTML5 integration
├── build.sh            # Build script for convenience
└── README.md           # This file
```

## 🚀 Migration to Bevy

This implementation is explicitly designed to facilitate migration to Bevy:

### Phase 1: Current Implementation ✅
- [x] Basic game loop with web-sys
- [x] Ball physics and collision detection
- [x] Mouse input handling
- [x] Canvas rendering
- [x] WASM compilation and browser integration

### Phase 2: Bevy Integration (Planned)
- [ ] Replace manual game loop with Bevy App
- [ ] Convert Ball struct to Bevy Components
- [ ] Implement ECS Systems for movement and rendering
- [ ] Add Bevy's input handling system
- [ ] Use Bevy's sprite rendering pipeline
- [ ] Implement Bevy's time and scheduling systems

### Phase 3: Enhanced Features (Future)
- [ ] Advanced physics with Bevy_rapier
- [ ] Multiple balls and complex interactions
- [ ] Particle effects and visual enhancements
- [ ] Audio integration with Bevy_audio
- [ ] Scene management and game states

## 📚 Learning Resources

- [Bevy Book](https://bevyengine.org/learn/book/introduction/)
- [Rust and WebAssembly](https://rustwasm.github.io/docs/book/)
- [wasm-pack Guide](https://rustwasm.github.io/wasm-pack/)
- [ECS Pattern in Bevy](https://bevyengine.org/learn/book/getting-started/ecs/)

## 🎯 Why This Approach?

This foundation provides:
1. **Working Implementation**: Functional game that can be built and played immediately
2. **Clear Migration Path**: Code structure that maps directly to Bevy concepts
3. **Learning Bridge**: Helps understand both low-level WASM and high-level Bevy approaches
4. **Incremental Development**: Can be enhanced step-by-step toward full Bevy implementation

The current implementation demonstrates Rust's WASM capabilities while providing a clear roadmap for expanding into a comprehensive Bevy-based game engine project.