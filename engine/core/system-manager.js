/**
 * System Manager - Manages system registration, ordering, and execution
 */
class SystemManager {
  constructor(entityManager) {
    this.entityManager = entityManager;
    this.systems = new Map(); // name -> system
    this.systemOrder = []; // Array of system names in execution order
    this.enabled = true;
  }
  
  /**
   * Register a system
   */
  addSystem(system) {
    if (this.systems.has(system.name)) {
      throw new Error(`System ${system.name} is already registered`);
    }
    
    system.init(this.entityManager);
    this.systems.set(system.name, system);
    
    // Insert system in order based on priority
    this.insertSystemInOrder(system.name, system.priority);
    
    return this;
  }
  
  /**
   * Remove a system
   */
  removeSystem(systemName) {
    const system = this.systems.get(systemName);
    if (system) {
      system.cleanup();
      this.systems.delete(systemName);
      
      // Remove from execution order
      const index = this.systemOrder.indexOf(systemName);
      if (index >= 0) {
        this.systemOrder.splice(index, 1);
      }
    }
    
    return this;
  }
  
  /**
   * Get a system by name
   */
  getSystem(systemName) {
    return this.systems.get(systemName);
  }
  
  /**
   * Check if a system is registered
   */
  hasSystem(systemName) {
    return this.systems.has(systemName);
  }
  
  /**
   * Get all registered systems
   */
  getAllSystems() {
    return Array.from(this.systems.values());
  }
  
  /**
   * Enable a specific system
   */
  enableSystem(systemName) {
    const system = this.systems.get(systemName);
    if (system) {
      system.enable();
    }
    return this;
  }
  
  /**
   * Disable a specific system
   */
  disableSystem(systemName) {
    const system = this.systems.get(systemName);
    if (system) {
      system.disable();
    }
    return this;
  }
  
  /**
   * Enable all systems
   */
  enableAll() {
    this.enabled = true;
    for (const system of this.systems.values()) {
      system.enable();
    }
    return this;
  }
  
  /**
   * Disable all systems
   */
  disableAll() {
    this.enabled = false;
    for (const system of this.systems.values()) {
      system.disable();
    }
    return this;
  }
  
  /**
   * Update all systems in priority order
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime) {
    if (!this.enabled) return;
    
    for (const systemName of this.systemOrder) {
      const system = this.systems.get(systemName);
      if (system && system.enabled) {
        try {
          system.update(deltaTime);
        } catch (error) {
          console.error(`Error in system ${systemName}:`, error);
          // Continue processing other systems
        }
      }
    }
  }
  
  /**
   * Insert system in execution order based on priority
   */
  insertSystemInOrder(systemName, priority) {
    // Find insertion point
    let insertIndex = 0;
    for (let i = 0; i < this.systemOrder.length; i++) {
      const existingSystemName = this.systemOrder[i];
      const existingSystem = this.systems.get(existingSystemName);
      
      if (existingSystem && existingSystem.priority > priority) {
        break;
      }
      insertIndex = i + 1;
    }
    
    this.systemOrder.splice(insertIndex, 0, systemName);
  }
  
  /**
   * Get system execution order
   */
  getExecutionOrder() {
    return [...this.systemOrder];
  }
  
  /**
   * Clear all systems
   */
  clear() {
    for (const system of this.systems.values()) {
      system.cleanup();
    }
    this.systems.clear();
    this.systemOrder = [];
  }
  
  /**
   * Get system statistics
   */
  getStats() {
    return {
      totalSystems: this.systems.size,
      enabledSystems: Array.from(this.systems.values()).filter(s => s.enabled).length,
      executionOrder: this.systemOrder
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SystemManager;
} else if (typeof window !== 'undefined') {
  window.SystemManager = SystemManager;
}