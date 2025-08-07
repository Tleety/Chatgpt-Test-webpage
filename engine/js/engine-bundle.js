/**
 * Game Engine JavaScript Bundle
 * Contains all engine classes for browser use
 */

// Load all engine modules for browser use
(function(global) {
  'use strict';
  
  // Create namespace
  global.GameEngineECS = global.GameEngineECS || {};
  
  // Component base class
  class Component {
    constructor(type) {
      this.type = type;
      this.entityId = null;
    }
    
    serialize() {
      return {
        type: this.type,
        entityId: this.entityId
      };
    }
    
    static deserialize(data) {
      const component = new Component(data.type);
      component.entityId = data.entityId;
      return component;
    }
    
    clone() {
      const clone = new Component(this.type);
      clone.entityId = this.entityId;
      return clone;
    }
  }
  
  // Entity Manager
  class EntityManager {
    constructor() {
      this.nextEntityId = 1;
      this.entities = new Set();
      this.components = new Map();
      this.componentsByType = new Map();
      this.eventCallbacks = new Map();
    }
    
    createEntity() {
      const entityId = this.nextEntityId++;
      this.entities.add(entityId);
      this.components.set(entityId, new Map());
      this.emit('entityCreated', { entityId });
      return entityId;
    }
    
    destroyEntity(entityId) {
      if (!this.entities.has(entityId)) return false;
      
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
    
    hasEntity(entityId) {
      return this.entities.has(entityId);
    }
    
    getAllEntities() {
      return Array.from(this.entities);
    }
    
    addComponent(entityId, component) {
      if (!this.entities.has(entityId)) {
        throw new Error(`Entity ${entityId} does not exist`);
      }
      
      component.entityId = entityId;
      const componentType = component.type;
      
      this.components.get(entityId).set(componentType, component);
      
      if (!this.componentsByType.has(componentType)) {
        this.componentsByType.set(componentType, new Map());
      }
      this.componentsByType.get(componentType).set(entityId, component);
      
      this.emit('componentAdded', { entityId, componentType, component });
      return this;
    }
    
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
    
    getComponent(entityId, componentType) {
      const entityComponents = this.components.get(entityId);
      return entityComponents ? entityComponents.get(componentType) : null;
    }
    
    hasComponent(entityId, componentType) {
      const entityComponents = this.components.get(entityId);
      return entityComponents ? entityComponents.has(componentType) : false;
    }
    
    getEntityComponents(entityId) {
      const entityComponents = this.components.get(entityId);
      return entityComponents ? Array.from(entityComponents.values()) : [];
    }
    
    getEntitiesWithComponent(componentType) {
      const typeMap = this.componentsByType.get(componentType);
      return typeMap ? Array.from(typeMap.keys()) : [];
    }
    
    getEntitiesWithComponents(...componentTypes) {
      if (componentTypes.length === 0) return [];
      if (componentTypes.length === 1) return this.getEntitiesWithComponent(componentTypes[0]);
      
      const firstType = componentTypes[0];
      const candidates = this.getEntitiesWithComponent(firstType);
      
      return candidates.filter(entityId => {
        return componentTypes.every(type => this.hasComponent(entityId, type));
      });
    }
    
    getComponentsOfType(componentType) {
      const typeMap = this.componentsByType.get(componentType);
      return typeMap ? Array.from(typeMap.values()) : [];
    }
    
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
    
    clear() {
      const entities = Array.from(this.entities);
      entities.forEach(entityId => this.destroyEntity(entityId));
      this.nextEntityId = 1;
    }
  }
  
  // Add to namespace
  global.GameEngineECS.Component = Component;
  global.GameEngineECS.EntityManager = EntityManager;
  
})(typeof window !== 'undefined' ? window : this);