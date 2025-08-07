/**
 * System Interface - Base class for all game systems
 * Systems contain logic and operate on entities with specific components
 */
class System {
  constructor(name, priority = 0) {
    this.name = name;
    this.priority = priority; // Lower numbers execute first
    this.enabled = true;
    this.entityManager = null;
    this.requiredComponents = []; // Override in subclasses
  }
  
  /**
   * Initialize the system with entity manager
   */
  init(entityManager) {
    this.entityManager = entityManager;
    this.onInit();
  }
  
  /**
   * Override in subclasses for custom initialization
   */
  onInit() {
    // Default implementation does nothing
  }
  
  /**
   * Update the system - called every frame
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime) {
    if (!this.enabled || !this.entityManager) return;
    
    const entities = this.getEntities();
    this.process(entities, deltaTime);
  }
  
  /**
   * Get entities that have all required components for this system
   */
  getEntities() {
    if (!this.entityManager || this.requiredComponents.length === 0) {
      return [];
    }
    
    return this.entityManager.getEntitiesWithComponents(...this.requiredComponents);
  }
  
  /**
   * Process entities - override in subclasses
   * @param {Array} entities - Array of entity IDs that match required components
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   */
  process(entities, deltaTime) {
    // Override in subclasses
  }
  
  /**
   * Enable the system
   */
  enable() {
    this.enabled = true;
  }
  
  /**
   * Disable the system
   */
  disable() {
    this.enabled = false;
  }
  
  /**
   * Cleanup system resources - called when system is removed
   */
  cleanup() {
    this.enabled = false;
    this.entityManager = null;
  }
  
  /**
   * Helper method to get a component from an entity
   */
  getComponent(entityId, componentType) {
    return this.entityManager.getComponent(entityId, componentType);
  }
  
  /**
   * Helper method to check if entity has component
   */
  hasComponent(entityId, componentType) {
    return this.entityManager.hasComponent(entityId, componentType);
  }
  
  /**
   * Helper method to add component to entity
   */
  addComponent(entityId, component) {
    return this.entityManager.addComponent(entityId, component);
  }
  
  /**
   * Helper method to remove component from entity
   */
  removeComponent(entityId, componentType) {
    return this.entityManager.removeComponent(entityId, componentType);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = System;
} else if (typeof window !== 'undefined') {
  window.System = System;
}