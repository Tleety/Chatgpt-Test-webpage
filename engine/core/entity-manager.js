/**
 * Entity Manager - Manages entity lifecycle and component assignment
 * Entities are just unique IDs that have components attached to them
 */
class EntityManager {
  constructor() {
    this.nextEntityId = 1;
    this.entities = new Set();
    this.components = new Map(); // entityId -> Map<componentType, component>
    this.componentsByType = new Map(); // componentType -> Map<entityId, component>
    this.eventCallbacks = new Map(); // event -> Set<callback>
  }
  
  /**
   * Create a new entity and return its ID
   */
  createEntity() {
    const entityId = this.nextEntityId++;
    this.entities.add(entityId);
    this.components.set(entityId, new Map());
    this.emit('entityCreated', { entityId });
    return entityId;
  }
  
  /**
   * Destroy an entity and all its components
   */
  destroyEntity(entityId) {
    if (!this.entities.has(entityId)) return false;
    
    // Remove all components for this entity
    const entityComponents = this.components.get(entityId);
    if (entityComponents) {
      for (const [componentType, component] of entityComponents) {
        this.removeComponent(entityId, componentType);
      }
    }
    
    this.entities.delete(entityId);
    this.components.delete(entityId);
    this.emit('entityDestroyed', { entityId });
    return true;
  }
  
  /**
   * Check if an entity exists
   */
  hasEntity(entityId) {
    return this.entities.has(entityId);
  }
  
  /**
   * Get all entity IDs
   */
  getAllEntities() {
    return Array.from(this.entities);
  }
  
  /**
   * Add a component to an entity
   */
  addComponent(entityId, component) {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }
    
    component.entityId = entityId;
    const componentType = component.type;
    
    // Add to entity's component map
    this.components.get(entityId).set(componentType, component);
    
    // Add to type-based lookup
    if (!this.componentsByType.has(componentType)) {
      this.componentsByType.set(componentType, new Map());
    }
    this.componentsByType.get(componentType).set(entityId, component);
    
    this.emit('componentAdded', { entityId, componentType, component });
    return this;
  }
  
  /**
   * Remove a component from an entity
   */
  removeComponent(entityId, componentType) {
    if (!this.entities.has(entityId)) return false;
    
    const entityComponents = this.components.get(entityId);
    const component = entityComponents.get(componentType);
    
    if (component) {
      entityComponents.delete(componentType);
      
      const typeMap = this.componentsByType.get(componentType);
      if (typeMap) {
        typeMap.delete(entityId);
        if (typeMap.size === 0) {
          this.componentsByType.delete(componentType);
        }
      }
      
      this.emit('componentRemoved', { entityId, componentType, component });
      return true;
    }
    
    return false;
  }
  
  /**
   * Get a specific component from an entity
   */
  getComponent(entityId, componentType) {
    const entityComponents = this.components.get(entityId);
    return entityComponents ? entityComponents.get(componentType) : null;
  }
  
  /**
   * Check if an entity has a specific component
   */
  hasComponent(entityId, componentType) {
    const entityComponents = this.components.get(entityId);
    return entityComponents ? entityComponents.has(componentType) : false;
  }
  
  /**
   * Get all components for an entity
   */
  getEntityComponents(entityId) {
    const entityComponents = this.components.get(entityId);
    return entityComponents ? Array.from(entityComponents.values()) : [];
  }
  
  /**
   * Get all entities that have a specific component type
   */
  getEntitiesWithComponent(componentType) {
    const typeMap = this.componentsByType.get(componentType);
    return typeMap ? Array.from(typeMap.keys()) : [];
  }
  
  /**
   * Get all entities that have ALL of the specified component types
   */
  getEntitiesWithComponents(...componentTypes) {
    if (componentTypes.length === 0) return [];
    if (componentTypes.length === 1) return this.getEntitiesWithComponent(componentTypes[0]);
    
    const firstType = componentTypes[0];
    const candidates = this.getEntitiesWithComponent(firstType);
    
    return candidates.filter(entityId => {
      return componentTypes.every(type => this.hasComponent(entityId, type));
    });
  }
  
  /**
   * Query for components by type
   */
  getComponentsOfType(componentType) {
    const typeMap = this.componentsByType.get(componentType);
    return typeMap ? Array.from(typeMap.values()) : [];
  }
  
  /**
   * Event system for entity/component changes
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
  
  emit(event, data) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }
  
  /**
   * Serialize all entities and components
   */
  serialize() {
    const entities = Array.from(this.entities);
    const componentsData = {};
    
    for (const entityId of entities) {
      const entityComponents = this.components.get(entityId);
      componentsData[entityId] = {};
      
      for (const [componentType, component] of entityComponents) {
        componentsData[entityId][componentType] = component.serialize();
      }
    }
    
    return {
      nextEntityId: this.nextEntityId,
      entities,
      components: componentsData
    };
  }
  
  /**
   * Clear all entities and components
   */
  clear() {
    const entities = Array.from(this.entities);
    entities.forEach(entityId => this.destroyEntity(entityId));
    this.nextEntityId = 1;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityManager;
} else if (typeof window !== 'undefined') {
  window.EntityManager = EntityManager;
}