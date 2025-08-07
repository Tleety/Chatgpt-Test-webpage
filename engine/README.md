# Entity-Component-System (ECS) Game Engine

A modern, scalable game engine built with Entity-Component-System architecture for web-based games.

## 🎮 Features

### Core Architecture
- **Entity Management**: Lightweight entities with unique IDs and component composition
- **Component System**: Data-only components for Position, Velocity, Renderable, and extensible custom components
- **System Processing**: Logic-based systems that operate on entities with specific component combinations
- **Event System**: Decoupled communication between systems and engine components

### Engine Capabilities
- **60 FPS Game Loop**: High-performance frame-based update cycle with delta time calculations
- **Camera System**: World-to-screen coordinate transformation with zoom and pan support
- **Rendering Pipeline**: Hardware-accelerated HTML5 Canvas rendering with culling optimizations
- **Input Handling**: Mouse and keyboard input integration
- **Serialization**: Complete game state save/load functionality
- **Error Handling**: Robust error handling and system isolation

### Performance Features
- **Frustum Culling**: Only render entities visible in camera view
- **Component Queries**: Efficient entity lookup by component combinations  
- **Memory Management**: Automatic cleanup and garbage collection
- **System Prioritization**: Configurable system execution order

## 🚀 Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Game</title>
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    
    <script src="engine/game-engine.js"></script>
    <script>
        // Initialize the engine
        const canvas = document.getElementById('gameCanvas');
        const engine = new GameEngine(canvas);
        
        // Create a player entity
        const playerId = engine.createPlayer(100, 100, {
            color: '#00ff00',
            maxSpeed: 150
        });
        
        // Create some random entities
        for (let i = 0; i < 10; i++) {
            engine.createGameObject(
                Math.random() * 800, 
                Math.random() * 600,
                { color: '#ff0000' }
            );
        }
        
        // Start the engine
        engine.start();
    </script>
</body>
</html>
```

### Creating Custom Components

```javascript
class Health extends Component {
    constructor(maxHealth = 100) {
        super('Health');
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }
    
    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        return this.currentHealth <= 0;
    }
    
    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }
}
```

### Creating Custom Systems

```javascript
class HealthSystem extends System {
    constructor() {
        super('HealthSystem', 50); // Priority 50
        this.requiredComponents = ['Health', 'Renderable'];
    }
    
    process(entities, deltaTime) {
        for (const entityId of entities) {
            const health = this.getComponent(entityId, 'Health');
            const renderable = this.getComponent(entityId, 'Renderable');
            
            // Change color based on health
            if (health.currentHealth < health.maxHealth * 0.3) {
                renderable.setColor('#ff0000'); // Red when low health
            } else if (health.currentHealth < health.maxHealth * 0.6) {
                renderable.setColor('#ffff00'); // Yellow when medium health
            } else {
                renderable.setColor('#00ff00'); // Green when healthy
            }
            
            // Remove entity if health reaches 0
            if (health.currentHealth <= 0) {
                this.entityManager.destroyEntity(entityId);
            }
        }
    }
}

// Add the system to the engine
engine.addSystem(new HealthSystem());
```

## 📚 API Reference

### GameEngine

#### Constructor
```javascript
new GameEngine(canvas)
```

#### Methods
- `start()` - Start the game loop
- `stop()` - Stop the game loop
- `pause()` - Pause the game loop
- `resume()` - Resume the game loop
- `createEntity(components)` - Create entity with components
- `createGameObject(x, y, options)` - Create entity with position, velocity, and renderable
- `createPlayer(x, y, options)` - Create player entity with default settings
- `addSystem(system)` - Add a system to the engine
- `setCamera(x, y, zoom)` - Set camera position and zoom
- `getStats()` - Get engine statistics

### Components

#### Position
```javascript
new Position(x, y, z)
```
- `setPosition(x, y, z)` - Set position
- `translate(dx, dy, dz)` - Move by offset
- `distanceTo(other)` - Calculate distance to another position

#### Velocity
```javascript
new Velocity(vx, vy, maxSpeed)
```
- `setVelocity(vx, vy)` - Set velocity components
- `addVelocity(dvx, dvy)` - Add to current velocity
- `getSpeed()` - Get velocity magnitude
- `stop()` - Stop movement

#### Renderable
```javascript
new Renderable(options)
```
- `setColor(color)` - Set entity color
- `setSize(width, height)` - Set dimensions
- `setVisible(visible)` - Show/hide entity

### Systems

#### MovementSystem
Updates entity positions based on velocity.

#### RenderSystem
Renders entities with Position and Renderable components.

## 🎯 Demo

Try the interactive demo at [simple-engine-demo.html](simple-engine-demo.html):

- **Start Engine**: Begin the game loop
- **Add Entity**: Create random entities
- **Mouse Click**: Click canvas to create entities
- **WASD**: Move camera
- **Mouse Wheel**: Zoom in/out

![ECS Game Engine Demo](https://github.com/user-attachments/assets/4350a0a2-e10b-4b5d-a5cb-d5deaa5f0575)

## 🏗️ Architecture

### Entity-Component-System Pattern

The ECS architecture separates game logic into three main concepts:

1. **Entities**: Unique identifiers that represent game objects
2. **Components**: Data containers that define what an entity *has*
3. **Systems**: Logic processors that define what an entity *does*

This pattern provides:
- **Modularity**: Easy to add/remove features
- **Performance**: Cache-friendly data access patterns
- **Flexibility**: Compose entities from any combination of components
- **Maintainability**: Clear separation of data and logic

### System Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Game Engine   │    │  Entity Manager  │    │ System Manager  │
│                 │◄──►│                  │◄──►│                 │
│ • Game Loop     │    │ • Entity CRUD    │    │ • System Exec   │
│ • Event System  │    │ • Component Map  │    │ • Prioritization│
│ • Input/Render  │    │ • Queries        │    │ • Error Handle  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Components    │◄─────────────┘
                        │                 │
                        │ • Position      │
                        │ • Velocity      │
                        │ • Renderable    │
                        │ • Custom...     │
                        └─────────────────┘
```

## 🧪 Testing

The engine includes comprehensive test coverage:

```bash
npm test -- tests/entity-game-engine.test.js
```

Tests cover:
- Component functionality
- Entity management
- System processing  
- Performance with 1000+ entities
- Error handling and edge cases
- Memory cleanup and serialization

## 🎮 Integration with Existing Games

The engine can be integrated with existing game projects:

### Snake Game Integration
```javascript
// Convert snake segments to ECS entities
for (let segment of snake) {
    const segmentEntity = engine.createGameObject(segment.x, segment.y, {
        color: '#00ff00',
        width: CELL_SIZE,
        height: CELL_SIZE
    });
}
```

### Go WASM Game Integration
```javascript
// Wrap WASM entities in ECS components
const playerEntity = engine.createEntity([
    new Position(wasmPlayer.x, wasmPlayer.y),
    new Velocity(0, 0, wasmPlayer.maxSpeed),
    new Renderable({ color: 'green', width: 20, height: 20 })
]);
```

## 🚀 Extending the Engine

### Add Physics System
```javascript
class PhysicsSystem extends System {
    constructor() {
        super('PhysicsSystem', 5); // Run early
        this.requiredComponents = ['Position', 'Velocity', 'RigidBody'];
    }
    
    process(entities, deltaTime) {
        // Apply gravity, collision detection, etc.
    }
}
```

### Add Audio System
```javascript
class AudioSystem extends System {
    constructor() {
        super('AudioSystem', 90); // Run late
        this.requiredComponents = ['Position', 'AudioSource'];
    }
    
    process(entities, deltaTime) {
        // 3D positional audio, sound effects
    }
}
```

### Add AI System
```javascript
class AISystem extends System {
    constructor() {
        super('AISystem', 30);
        this.requiredComponents = ['Position', 'AI', 'Velocity'];
    }
    
    process(entities, deltaTime) {
        // Pathfinding, behavior trees, state machines
    }
}
```

## 📈 Performance Tips

1. **Component Queries**: Cache frequently used entity lists
2. **System Priority**: Order systems to minimize redundant calculations
3. **Batch Operations**: Group similar operations in systems
4. **Culling**: Skip processing for off-screen entities
5. **Object Pooling**: Reuse entities instead of creating/destroying

## 🔧 Browser Compatibility

- Chrome 60+
- Firefox 55+  
- Safari 12+
- Edge 79+

Requires:
- ES6+ support
- HTML5 Canvas
- requestAnimationFrame

## 📄 License

This game engine is part of the ChatGPT Test Webpage project and follows the same open-source license.