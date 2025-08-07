# Go WASM Game - Refactored Structure

This directory contains a Go WebAssembly game that has been refactored to follow standard Go project organization patterns.

## Project Structure

The codebase has been organized into logical packages to improve maintainability and follow Go best practices:

```
go-wasm-game/
├── entities/                    # Game entities and types
│   ├── player.go               # Player character definition
│   └── unit_types.go           # Unit types, stats, and definitions
├── world/                      # World and terrain systems
│   └── tiles.go                # Tile types and terrain definitions
├── main.go                     # Main entry point and game loop
├── map.go                      # Map rendering and management
├── movement.go                 # Movement and pathfinding systems
├── pathfinding.go              # A* pathfinding algorithm
├── collision.go                # Collision detection
├── game_events.go              # Input handling and events
├── js_interface.go             # JavaScript API interface
├── environment.go              # Trees, bushes, and environment objects
├── unit*.go                    # Unit management and behavior
└── [other core files]          # Remaining game systems
```

## Package Organization

### `entities/` Package
- **Player**: Player character with movement and rendering
- **UnitType**: Definitions for different unit types (Warrior, Archer, Mage, Scout)
- **UnitStats**: Health, damage, speed, and defense statistics
- **UnitAppearance**: Visual properties (icons, colors, sizes)

### `world/` Package  
- **TileType**: Terrain tile types (Grass, Water, DirtPath)
- **Tile**: Tile properties (walkable, speed modifiers, colors)
- **TileDefinitions**: Complete tile configuration mapping

## Building

```bash
# Build the WebAssembly module
GOOS=js GOARCH=wasm go build -o game.wasm

# Or use the build script
./build.sh
```

## Benefits of Refactoring

1. **Clear Separation of Concerns**: Game entities, world systems, and core logic are properly separated
2. **Improved Maintainability**: Related functionality is grouped together in packages
3. **Better Imports**: Dependencies between systems are now explicit through imports
4. **Go Best Practices**: Follows standard Go project layout conventions
5. **Easier Testing**: Individual packages can be tested in isolation
6. **Reduced Complexity**: Main package is smaller and more focused

## Previous Structure Issues Fixed

- ✅ All code was in a single `package main` with 18+ files
- ✅ No logical grouping of related functionality  
- ✅ Hard to understand dependencies between systems
- ✅ Difficult to maintain and extend
- ✅ Not following Go community standards

The refactored structure makes the codebase much easier to navigate and understand while maintaining full backward compatibility.