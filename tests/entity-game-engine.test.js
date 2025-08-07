/**
 * Tests for the Entity-Component-System Game Engine
 */

// Mock browser APIs for testing
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="testCanvas" width="800" height="600"></canvas></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;
global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.performance = { now: () => Date.now() };

// Mock canvas getContext method for testing
const originalGetContext = dom.window.HTMLCanvasElement.prototype.getContext;
dom.window.HTMLCanvasElement.prototype.getContext = function(type) {
  if (type === '2d') {
    return {
      save: () => {},
      restore: () => {},
      setTransform: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      clearRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      fillText: () => {},
      set fillStyle(value) {},
      get fillStyle() { return '#000000'; },
      set globalAlpha(value) {},
      get globalAlpha() { return 1; },
      set globalCompositeOperation(value) {},
      get globalCompositeOperation() { return 'source-over'; },
      set font(value) {},
      get font() { return '10px sans-serif'; },
      set textAlign(value) {},
      get textAlign() { return 'start'; }
    };
  }
  return originalGetContext.call(this, type);
};

// Load engine modules
const Component = require('../engine/core/component.js');
const EntityManager = require('../engine/core/entity-manager.js');
const System = require('../engine/core/system.js');
const SystemManager = require('../engine/core/system-manager.js');
const Position = require('../engine/components/position.js');
const Velocity = require('../engine/components/velocity.js');
const Renderable = require('../engine/components/renderable.js');
const MovementSystem = require('../engine/systems/movement-system.js');
const RenderSystem = require('../engine/systems/render-system.js');
const GameEngine = require('../engine/game-engine.js');

describe('Entity-Component-System Game Engine', () => {
  describe('Component System', () => {
    test('Component base class works correctly', () => {
      const component = new Component('TestComponent');
      expect(component.type).toBe('TestComponent');
      expect(component.entityId).toBeNull();
      
      component.entityId = 123;
      const serialized = component.serialize();
      expect(serialized.type).toBe('TestComponent');
      expect(serialized.entityId).toBe(123);
      
      const cloned = component.clone();
      expect(cloned.type).toBe('TestComponent');
      expect(cloned.entityId).toBe(123);
    });
    
    test('Position component functionality', () => {
      const position = new Position(10, 20, 1);
      expect(position.type).toBe('Position');
      expect(position.x).toBe(10);
      expect(position.y).toBe(20);
      expect(position.z).toBe(1);
      
      position.setPosition(30, 40, 2);
      expect(position.x).toBe(30);
      expect(position.y).toBe(40);
      expect(position.z).toBe(2);
      expect(position.lastX).toBe(10);
      expect(position.lastY).toBe(20);
      expect(position.lastZ).toBe(1);
      
      expect(position.hasChanged()).toBe(true);
      
      const delta = position.getDelta();
      expect(delta.dx).toBe(20);
      expect(delta.dy).toBe(20);
      expect(delta.dz).toBe(1);
      
      position.translate(5, 5);
      expect(position.x).toBe(35);
      expect(position.y).toBe(45);
      
      const other = new Position(38, 48);
      expect(position.distanceTo(other)).toBeCloseTo(4.24, 2);
    });
    
    test('Velocity component functionality', () => {
      const velocity = new Velocity(10, 20, 100);
      expect(velocity.type).toBe('Velocity');
      expect(velocity.vx).toBe(10);
      expect(velocity.vy).toBe(20);
      expect(velocity.maxSpeed).toBe(100);
      
      expect(velocity.getSpeed()).toBeCloseTo(22.36, 2);
      expect(velocity.isMoving()).toBe(true);
      
      velocity.setVelocity(150, 0);
      expect(velocity.vx).toBe(100); // Clamped to maxSpeed
      expect(velocity.vy).toBe(0);
      
      velocity.friction = 0.1;
      velocity.applyFriction();
      expect(velocity.vx).toBeCloseTo(90, 1);
      
      velocity.stop();
      expect(velocity.isMoving()).toBe(false);
    });
    
    test('Renderable component functionality', () => {
      const renderable = new Renderable({
        width: 40,
        height: 30,
        color: '#ff0000',
        shape: 'rectangle'
      });
      
      expect(renderable.type).toBe('Renderable');
      expect(renderable.width).toBe(40);
      expect(renderable.height).toBe(30);
      expect(renderable.color).toBe('#ff0000');
      expect(renderable.shape).toBe('rectangle');
      expect(renderable.visible).toBe(true);
      
      renderable.setSize(50, 60);
      expect(renderable.width).toBe(50);
      expect(renderable.height).toBe(60);
      
      renderable.setRotationDegrees(90);
      expect(renderable.rotation).toBeCloseTo(Math.PI / 2, 5);
      
      const bounds = renderable.getRenderBounds(100, 100);
      expect(bounds.x).toBe(75); // 100 - (50 * 0.5)
      expect(bounds.y).toBe(70); // 100 - (60 * 0.5)
      expect(bounds.width).toBe(50);
      expect(bounds.height).toBe(60);
    });
  });
  
  describe('Entity Management', () => {
    let entityManager;
    
    beforeEach(() => {
      entityManager = new EntityManager();
    });
    
    test('Entity creation and destruction', () => {
      const entityId = entityManager.createEntity();
      expect(typeof entityId).toBe('number');
      expect(entityManager.hasEntity(entityId)).toBe(true);
      
      const allEntities = entityManager.getAllEntities();
      expect(allEntities).toContain(entityId);
      
      const destroyed = entityManager.destroyEntity(entityId);
      expect(destroyed).toBe(true);
      expect(entityManager.hasEntity(entityId)).toBe(false);
      
      const destroyedAgain = entityManager.destroyEntity(entityId);
      expect(destroyedAgain).toBe(false);
    });
    
    test('Component management', () => {
      const entityId = entityManager.createEntity();
      const position = new Position(10, 20);
      const velocity = new Velocity(5, 5);
      
      entityManager.addComponent(entityId, position);
      entityManager.addComponent(entityId, velocity);
      
      expect(entityManager.hasComponent(entityId, 'Position')).toBe(true);
      expect(entityManager.hasComponent(entityId, 'Velocity')).toBe(true);
      expect(entityManager.hasComponent(entityId, 'Renderable')).toBe(false);
      
      const retrievedPosition = entityManager.getComponent(entityId, 'Position');
      expect(retrievedPosition).toBe(position);
      expect(retrievedPosition.entityId).toBe(entityId);
      
      const entityComponents = entityManager.getEntityComponents(entityId);
      expect(entityComponents).toHaveLength(2);
      
      const removed = entityManager.removeComponent(entityId, 'Position');
      expect(removed).toBe(true);
      expect(entityManager.hasComponent(entityId, 'Position')).toBe(false);
    });
    
    test('Component queries', () => {
      const entity1 = entityManager.createEntity();
      const entity2 = entityManager.createEntity();
      const entity3 = entityManager.createEntity();
      
      entityManager.addComponent(entity1, new Position(0, 0));
      entityManager.addComponent(entity1, new Velocity(1, 1));
      
      entityManager.addComponent(entity2, new Position(10, 10));
      entityManager.addComponent(entity2, new Renderable());
      
      entityManager.addComponent(entity3, new Position(20, 20));
      entityManager.addComponent(entity3, new Velocity(2, 2));
      entityManager.addComponent(entity3, new Renderable());
      
      const entitiesWithPosition = entityManager.getEntitiesWithComponent('Position');
      expect(entitiesWithPosition).toHaveLength(3);
      expect(entitiesWithPosition).toContain(entity1);
      expect(entitiesWithPosition).toContain(entity2);
      expect(entitiesWithPosition).toContain(entity3);
      
      const entitiesWithPosAndVel = entityManager.getEntitiesWithComponents('Position', 'Velocity');
      expect(entitiesWithPosAndVel).toHaveLength(2);
      expect(entitiesWithPosAndVel).toContain(entity1);
      expect(entitiesWithPosAndVel).toContain(entity3);
      
      const entitiesWithAll = entityManager.getEntitiesWithComponents('Position', 'Velocity', 'Renderable');
      expect(entitiesWithAll).toHaveLength(1);
      expect(entitiesWithAll).toContain(entity3);
    });
    
    test('Event system', () => {
      let createdEventData = null;
      let destroyedEventData = null;
      
      entityManager.on('entityCreated', (data) => {
        createdEventData = data;
      });
      
      entityManager.on('entityDestroyed', (data) => {
        destroyedEventData = data;
      });
      
      const entityId = entityManager.createEntity();
      expect(createdEventData).toEqual({ entityId });
      
      entityManager.destroyEntity(entityId);
      expect(destroyedEventData).toEqual({ entityId });
    });
  });
  
  describe('System Processing', () => {
    let entityManager, systemManager;
    
    beforeEach(() => {
      entityManager = new EntityManager();
      systemManager = new SystemManager(entityManager);
    });
    
    test('System registration and execution order', () => {
      class TestSystemA extends System {
        constructor() {
          super('TestSystemA', 10);
          this.processCount = 0;
        }
        process() {
          this.processCount++;
        }
      }
      
      class TestSystemB extends System {
        constructor() {
          super('TestSystemB', 5); // Higher priority (lower number)
          this.processCount = 0;
        }
        process() {
          this.processCount++;
        }
      }
      
      const systemA = new TestSystemA();
      const systemB = new TestSystemB();
      
      systemManager.addSystem(systemA);
      systemManager.addSystem(systemB);
      
      expect(systemManager.hasSystem('TestSystemA')).toBe(true);
      expect(systemManager.hasSystem('TestSystemB')).toBe(true);
      
      const executionOrder = systemManager.getExecutionOrder();
      expect(executionOrder).toEqual(['TestSystemB', 'TestSystemA']); // B has higher priority
      
      systemManager.update(16);
      expect(systemA.processCount).toBe(1);
      expect(systemB.processCount).toBe(1);
      
      systemManager.disableSystem('TestSystemA');
      systemManager.update(16);
      expect(systemA.processCount).toBe(1); // Still 1, not incremented
      expect(systemB.processCount).toBe(2);
    });
    
    test('MovementSystem functionality', () => {
      const movementSystem = new MovementSystem();
      systemManager.addSystem(movementSystem);
      
      const entityId = entityManager.createEntity();
      entityManager.addComponent(entityId, new Position(0, 0));
      entityManager.addComponent(entityId, new Velocity(60, 80)); // 60 pixels/sec right, 80 pixels/sec down
      
      // Simulate 1 second (1000ms)
      systemManager.update(1000);
      
      const position = entityManager.getComponent(entityId, 'Position');
      expect(position.x).toBeCloseTo(60, 1);
      expect(position.y).toBeCloseTo(80, 1);
      
      // Test movement system methods
      movementSystem.setVelocity(entityId, 0, 0);
      const velocity = entityManager.getComponent(entityId, 'Velocity');
      expect(velocity.vx).toBe(0);
      expect(velocity.vy).toBe(0);
      
      const moved = movementSystem.moveToPosition(entityId, 100, 100, 50);
      expect(moved).toBe(false); // Not there yet
      
      const newVelocity = entityManager.getComponent(entityId, 'Velocity');
      expect(newVelocity.isMoving()).toBe(true);
    });
  });
  
  describe('Game Engine Integration', () => {
    let canvas, engine;
    
    beforeEach(() => {
      canvas = document.getElementById('testCanvas');
      engine = new GameEngine(canvas);
    });
    
    afterEach(() => {
      if (engine.running) {
        engine.stop();
      }
    });
    
    test('Engine initialization', () => {
      expect(engine.canvas).toBe(canvas);
      expect(engine.entityManager).toBeDefined();
      expect(engine.systemManager).toBeDefined();
      expect(engine.running).toBe(false);
      expect(engine.paused).toBe(false);
      
      const stats = engine.getStats();
      expect(stats.entityCount).toBe(0);
      expect(stats.systemCount).toBe(2); // MovementSystem and RenderSystem
    });
    
    test('Entity creation convenience methods', () => {
      const entityId = engine.createGameObject(100, 200, {
        width: 30,
        height: 40,
        color: '#ff0000',
        maxSpeed: 150
      });
      
      expect(typeof entityId).toBe('number');
      
      const position = engine.entityManager.getComponent(entityId, 'Position');
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
      
      const velocity = engine.entityManager.getComponent(entityId, 'Velocity');
      expect(velocity.maxSpeed).toBe(150);
      
      const renderable = engine.entityManager.getComponent(entityId, 'Renderable');
      expect(renderable.width).toBe(30);
      expect(renderable.height).toBe(40);
      expect(renderable.color).toBe('#ff0000');
      
      const playerId = engine.createPlayer(50, 50);
      expect(typeof playerId).toBe('number');
      
      const playerPosition = engine.entityManager.getComponent(playerId, 'Position');
      expect(playerPosition.x).toBe(50);
      expect(playerPosition.y).toBe(50);
    });
    
    test('Engine state management', () => {
      let startedEventFired = false;
      let stoppedEventFired = false;
      
      engine.on('engineStarted', () => {
        startedEventFired = true;
      });
      
      engine.on('engineStopped', () => {
        stoppedEventFired = true;
      });
      
      engine.start();
      expect(engine.running).toBe(true);
      expect(startedEventFired).toBe(true);
      
      engine.stop();
      expect(engine.running).toBe(false);
      expect(stoppedEventFired).toBe(true);
    });
    
    test('Camera system', () => {
      engine.setCamera(100, 200, 1.5);
      const camera = engine.getCamera();
      expect(camera.x).toBe(100);
      expect(camera.y).toBe(200);
      expect(camera.zoom).toBe(1.5);
      
      const renderSystem = engine.getRenderSystem();
      expect(renderSystem).toBeDefined();
      expect(renderSystem.camera.x).toBe(100);
      expect(renderSystem.camera.y).toBe(200);
      expect(renderSystem.camera.zoom).toBe(1.5);
    });
    
    test('Entity manipulation methods', () => {
      const entityId = engine.createGameObject(0, 0);
      
      engine.setEntityVelocity(entityId, 10, 20);
      const velocity = engine.entityManager.getComponent(entityId, 'Velocity');
      expect(velocity.vx).toBe(10);
      expect(velocity.vy).toBe(20);
      
      engine.setEntityPosition(entityId, 50, 60);
      const position = engine.getEntityPosition(entityId);
      expect(position.x).toBe(50);
      expect(position.y).toBe(60);
      
      const moved = engine.moveEntityTo(entityId, 100, 100, 50);
      expect(moved).toBe(false); // Not there yet
      
      const newVelocity = engine.entityManager.getComponent(entityId, 'Velocity');
      expect(newVelocity.isMoving()).toBe(true);
    });
    
    test('Serialization support', () => {
      engine.createGameObject(10, 20);
      engine.createGameObject(30, 40);
      engine.setCamera(50, 60, 1.2);
      
      const serialized = engine.serialize();
      expect(serialized.entities).toBeDefined();
      expect(serialized.entities.entities).toHaveLength(2);
      expect(serialized.camera.x).toBe(50);
      expect(serialized.camera.y).toBe(60);
      expect(serialized.camera.zoom).toBe(1.2);
      expect(serialized.engineState.running).toBe(false);
    });
    
    test('Clear functionality', () => {
      engine.createGameObject(10, 20);
      engine.createGameObject(30, 40);
      
      let stats = engine.getStats();
      expect(stats.entityCount).toBe(2);
      
      engine.clear();
      
      stats = engine.getStats();
      expect(stats.entityCount).toBe(0);
    });
  });
  
  describe('Performance and Edge Cases', () => {
    test('Large number of entities', () => {
      const entityManager = new EntityManager();
      const systemManager = new SystemManager(entityManager);
      systemManager.addSystem(new MovementSystem());
      
      // Create 1000 entities
      const entities = [];
      for (let i = 0; i < 1000; i++) {
        const entityId = entityManager.createEntity();
        entityManager.addComponent(entityId, new Position(i, i));
        entityManager.addComponent(entityId, new Velocity(1, 1));
        entities.push(entityId);
      }
      
      expect(entityManager.getAllEntities()).toHaveLength(1000);
      
      // Measure update performance
      const startTime = performance.now();
      systemManager.update(16);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      
      // Verify all entities moved
      for (const entityId of entities) {
        const position = entityManager.getComponent(entityId, 'Position');
        expect(position.x).toBeGreaterThan(0);
        expect(position.y).toBeGreaterThan(0);
      }
    });
    
    test('System error handling', () => {
      const entityManager = new EntityManager();
      const systemManager = new SystemManager(entityManager);
      
      class FaultySystem extends System {
        constructor() {
          super('FaultySystem', 10);
          this.requiredComponents = ['Position'];
        }
        
        process() {
          throw new Error('System error');
        }
      }
      
      systemManager.addSystem(new FaultySystem());
      const entityId = entityManager.createEntity();
      entityManager.addComponent(entityId, new Position(0, 0));
      
      // System update should not crash the entire engine
      expect(() => {
        systemManager.update(16);
      }).not.toThrow();
    });
    
    test('Memory cleanup', () => {
      const entityManager = new EntityManager();
      
      // Create and destroy entities
      const entityIds = [];
      for (let i = 0; i < 100; i++) {
        const entityId = entityManager.createEntity();
        entityManager.addComponent(entityId, new Position(i, i));
        entityIds.push(entityId);
      }
      
      // Destroy half
      for (let i = 0; i < 50; i++) {
        entityManager.destroyEntity(entityIds[i]);
      }
      
      expect(entityManager.getAllEntities()).toHaveLength(50);
      expect(entityManager.getEntitiesWithComponent('Position')).toHaveLength(50);
      
      // Clear all
      entityManager.clear();
      expect(entityManager.getAllEntities()).toHaveLength(0);
      expect(entityManager.getEntitiesWithComponent('Position')).toHaveLength(0);
    });
  });
});