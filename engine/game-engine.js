/**
 * Game Engine - Main engine class that coordinates all systems and entities
 */
if (typeof require !== 'undefined') {
  var EntityManager = require('./core/entity-manager.js');
  var SystemManager = require('./core/system-manager.js');
  var MovementSystem = require('./systems/movement-system.js');
  var RenderSystem = require('./systems/render-system.js');
  var Position = require('./components/position.js');
  var Velocity = require('./components/velocity.js');
  var Renderable = require('./components/renderable.js');
}

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    
    // Core managers
    this.entityManager = new EntityManager();
    this.systemManager = new SystemManager(this.entityManager);
    
    // Engine state
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateTime = 0;
    
    // Engine configuration
    this.targetFPS = 60;
    this.maxDeltaTime = 1000 / 30; // Cap at 30 FPS minimum
    
    // Event system
    this.eventCallbacks = new Map();
    
    // Initialize core systems
    this.initializeCoreSystem();
    
    // Bind update loop
    this.update = this.update.bind(this);
  }
  
  /**
   * Initialize core engine systems
   */
  initializeCoreSystem() {
    // Add core systems
    this.systemManager.addSystem(new MovementSystem());
    
    // Always add render system, even if context is null (for testing)
    this.systemManager.addSystem(new RenderSystem(this.canvas, this.ctx));
  }
  
  /**
   * Start the engine
   */
  start() {
    if (this.running) return;
    
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    this.emit('engineStarted');
    requestAnimationFrame(this.update);
  }
  
  /**
   * Stop the engine
   */
  stop() {
    this.running = false;
    this.emit('engineStopped');
  }
  
  /**
   * Pause the engine
   */
  pause() {
    this.paused = true;
    this.emit('enginePaused');
  }
  
  /**
   * Resume the engine
   */
  resume() {
    if (this.paused) {
      this.paused = false;
      this.lastTime = performance.now(); // Reset time to avoid large delta
      this.emit('engineResumed');
    }
  }
  
  /**
   * Main update loop
   */
  update(currentTime) {
    if (!this.running) return;
    
    // Calculate delta time
    const deltaTime = Math.min(currentTime - this.lastTime, this.maxDeltaTime);
    this.lastTime = currentTime;
    
    // Update FPS counter
    this.updateFPS(currentTime);
    
    // Skip update if paused
    if (!this.paused) {
      // Update all systems
      this.systemManager.update(deltaTime);
      
      // Emit update event
      this.emit('update', { deltaTime, currentTime });
    }
    
    // Continue the loop
    requestAnimationFrame(this.update);
  }
  
  /**
   * Update FPS counter
   */
  updateFPS(currentTime) {
    this.frameCount++;
    
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
      this.emit('fpsUpdate', { fps: this.fps });
    }
  }
  
  /**
   * Create a new entity with optional components
   */
  createEntity(components = []) {
    const entityId = this.entityManager.createEntity();
    
    // Add components if provided
    for (const component of components) {
      this.entityManager.addComponent(entityId, component);
    }
    
    this.emit('entityCreated', { entityId, components });
    return entityId;
  }
  
  /**
   * Destroy an entity
   */
  destroyEntity(entityId) {
    const success = this.entityManager.destroyEntity(entityId);
    if (success) {
      this.emit('entityDestroyed', { entityId });
    }
    return success;
  }
  
  /**
   * Create a simple game object with position, velocity, and rendering
   */
  createGameObject(x, y, options = {}) {
    const position = new Position(x, y, options.z || 0);
    const velocity = new Velocity(0, 0, options.maxSpeed || 200);
    const renderable = new Renderable({
      width: options.width || 20,
      height: options.height || 20,
      color: options.color || '#00ff00',
      shape: options.shape || 'rectangle',
      ...options.renderProps
    });
    
    // Set velocity friction if specified
    if (options.friction !== undefined) {
      velocity.friction = options.friction;
    }
    
    return this.createEntity([position, velocity, renderable]);
  }
  
  /**
   * Create a player entity (commonly used pattern)
   */
  createPlayer(x, y, options = {}) {
    return this.createGameObject(x, y, {
      width: 20,
      height: 20,
      color: '#00ff00',
      maxSpeed: 150,
      friction: 0.1,
      ...options
    });
  }
  
  /**
   * Add a system to the engine
   */
  addSystem(system) {
    this.systemManager.addSystem(system);
    this.emit('systemAdded', { systemName: system.name });
    return this;
  }
  
  /**
   * Remove a system from the engine
   */
  removeSystem(systemName) {
    this.systemManager.removeSystem(systemName);
    this.emit('systemRemoved', { systemName });
    return this;
  }
  
  /**
   * Get a system by name
   */
  getSystem(systemName) {
    return this.systemManager.getSystem(systemName);
  }
  
  /**
   * Get the movement system (convenience method)
   */
  getMovementSystem() {
    return this.getSystem('MovementSystem');
  }
  
  /**
   * Get the render system (convenience method)
   */
  getRenderSystem() {
    return this.getSystem('RenderSystem');
  }
  
  /**
   * Set camera position
   */
  setCamera(x, y, zoom = 1) {
    const renderSystem = this.getRenderSystem();
    if (renderSystem) {
      renderSystem.setCamera(x, y, zoom);
    }
  }
  
  /**
   * Get camera position
   */
  getCamera() {
    const renderSystem = this.getRenderSystem();
    return renderSystem ? renderSystem.getCamera() : { x: 0, y: 0, zoom: 1 };
  }
  
  /**
   * Move entity to position over time
   */
  moveEntityTo(entityId, x, y, speed = 100) {
    const movementSystem = this.getMovementSystem();
    if (movementSystem) {
      return movementSystem.moveToPosition(entityId, x, y, speed);
    }
    return false;
  }
  
  /**
   * Set entity velocity
   */
  setEntityVelocity(entityId, vx, vy) {
    const movementSystem = this.getMovementSystem();
    if (movementSystem) {
      movementSystem.setVelocity(entityId, vx, vy);
    }
  }
  
  /**
   * Get entity position
   */
  getEntityPosition(entityId) {
    const movementSystem = this.getMovementSystem();
    return movementSystem ? movementSystem.getPosition(entityId) : null;
  }
  
  /**
   * Set entity position
   */
  setEntityPosition(entityId, x, y, z = 0) {
    const movementSystem = this.getMovementSystem();
    if (movementSystem) {
      movementSystem.setPosition(entityId, x, y, z);
    }
  }
  
  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event).add(callback);
  }
  
  off(event, callback) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
  
  emit(event, data = {}) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      }
    }
  }
  
  /**
   * Get engine statistics
   */
  getStats() {
    return {
      running: this.running,
      paused: this.paused,
      fps: this.fps,
      entityCount: this.entityManager.getAllEntities().length,
      systemCount: this.systemManager.getAllSystems().length,
      systems: this.systemManager.getStats()
    };
  }
  
  /**
   * Resize canvas and update render system
   */
  resize(width, height) {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.emit('canvasResized', { width, height });
    }
  }
  
  /**
   * Serialize entire game state
   */
  serialize() {
    return {
      entities: this.entityManager.serialize(),
      camera: this.getCamera(),
      engineState: {
        running: this.running,
        paused: this.paused,
        targetFPS: this.targetFPS
      }
    };
  }
  
  /**
   * Clear all entities and reset engine
   */
  clear() {
    this.entityManager.clear();
    this.frameCount = 0;
    this.fps = 0;
    this.emit('engineCleared');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
} else if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
}