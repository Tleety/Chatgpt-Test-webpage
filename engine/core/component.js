/**
 * Component Interface - Base class for all game components
 * Components are pure data containers with no logic
 */
class Component {
  constructor(type) {
    this.type = type;
    this.entityId = null;
  }
  
  /**
   * Serialize component data to JSON
   */
  serialize() {
    return {
      type: this.type,
      entityId: this.entityId
    };
  }
  
  /**
   * Deserialize component data from JSON
   */
  static deserialize(data) {
    const component = new Component(data.type);
    component.entityId = data.entityId;
    return component;
  }
  
  /**
   * Create a copy of this component
   */
  clone() {
    const clone = new Component(this.type);
    clone.entityId = this.entityId;
    return clone;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Component;
} else if (typeof window !== 'undefined') {
  window.Component = Component;
}