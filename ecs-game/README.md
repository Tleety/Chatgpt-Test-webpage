# ECS Game

A demonstration of Entity-Component-System (ECS) architecture using the Ebiten game engine and Go WebAssembly.

## Features

- **ECS Architecture**: Clean separation of data (Components), logic (Systems), and entities
- **Ebiten Game Engine**: Modern 2D game engine for Go with WebAssembly support
- **Player Control**: Move with arrow keys/WASD or click to move towards mouse cursor
- **AI Entities**: Autonomous entities that move to random targets
- **Real-time Rendering**: Smooth 60fps gameplay in the browser

## Architecture

### Components
- **Position**: Entity's X,Y coordinates in 2D space
- **Velocity**: Movement speed and direction
- **Sprite**: Visual appearance (color, size)
- **Player**: Marks entity as player-controllable
- **AI**: Computer-controlled behavior with target positions

### Systems
- **InputSystem**: Handles keyboard and mouse input for player entities
- **MovementSystem**: Updates entity positions based on velocity and delta time
- **AISystem**: Controls AI entity behavior and target selection

### ECS Framework
Custom lightweight ECS implementation featuring:
- Component storage using Go's reflection system
- Entity creation and management
- System iteration over entities with specific components
- Type-safe component access

## Controls

- **Arrow Keys** or **WASD**: Move green player entity
- **Mouse Click**: Move player towards cursor position
- **AI Entities** (red squares): Move autonomously to random targets

## Building

```bash
# Build WASM version
GOOS=js GOARCH=wasm go build -o game.wasm

# Copy Go WASM runtime
cp $(go env GOROOT)/misc/wasm/wasm_exec.js .

# Serve with any static web server
python3 -m http.server 8080
```

## Dependencies

- **github.com/hajimehoshi/ebiten/v2**: 2D game engine with WebAssembly support
- **Custom ECS**: Lightweight Entity-Component-System framework

## Testing

The project includes comprehensive tests covering:
- Project structure validation
- WASM build verification  
- ECS architecture validation
- Web integration checks
- Game logic verification
- Performance and quality checks

Run tests: `npm test -- tests/ecs-game.test.js`