/**
 * Movement System - Handles entity movement based on velocity and position
 */
if (typeof require !== 'undefined') {
  var System = require('../core/system.js');
}

class MovementSystem extends System {
  constructor() {
    super('MovementSystem', 10); // Lower priority = runs earlier
    this.requiredComponents = ['Position', 'Velocity'];
  }
  
  /**
   * Process entities with Position and Velocity components
   */
  process(entities, deltaTime) {
    const deltaSeconds = deltaTime / 1000; // Convert to seconds
    
    for (const entityId of entities) {
      const position = this.getComponent(entityId, 'Position');
      const velocity = this.getComponent(entityId, 'Velocity');
      
      if (!position || !velocity) continue;
      
      // Apply friction first
      velocity.applyFriction();
      
      // Only move if there's actual velocity
      if (velocity.isMoving()) {
        // Calculate movement delta
        const dx = velocity.vx * deltaSeconds;
        const dy = velocity.vy * deltaSeconds;
        
        // Update position
        position.translate(dx, dy);
      }
    }
  }
  
  /**
   * Set entity velocity
   */
  setVelocity(entityId, vx, vy) {
    const velocity = this.getComponent(entityId, 'Velocity');
    if (velocity) {
      velocity.setVelocity(vx, vy);
    }
  }
  
  /**
   * Add impulse to entity
   */
  addImpulse(entityId, impulseX, impulseY) {
    const velocity = this.getComponent(entityId, 'Velocity');
    if (velocity) {
      velocity.addVelocity(impulseX, impulseY);
    }
  }
  
  /**
   * Stop entity movement
   */
  stop(entityId) {
    const velocity = this.getComponent(entityId, 'Velocity');
    if (velocity) {
      velocity.stop();
    }
  }
  
  /**
   * Move entity to specific position over time
   */
  moveToPosition(entityId, targetX, targetY, speed) {
    const position = this.getComponent(entityId, 'Position');
    const velocity = this.getComponent(entityId, 'Velocity');
    
    if (!position || !velocity) return false;
    
    // Calculate direction to target
    const dx = targetX - position.x;
    const dy = targetY - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 1) {
      // Close enough, stop movement
      velocity.stop();
      position.setPosition(targetX, targetY);
      return true;
    }
    
    // Set velocity towards target
    const directionX = dx / distance;
    const directionY = dy / distance;
    velocity.setVelocity(directionX * speed, directionY * speed);
    
    return false; // Not there yet
  }
  
  /**
   * Get entity speed
   */
  getSpeed(entityId) {
    const velocity = this.getComponent(entityId, 'Velocity');
    return velocity ? velocity.getSpeed() : 0;
  }
  
  /**
   * Get entity position
   */
  getPosition(entityId) {
    const position = this.getComponent(entityId, 'Position');
    return position ? { x: position.x, y: position.y, z: position.z } : null;
  }
  
  /**
   * Set entity position
   */
  setPosition(entityId, x, y, z) {
    const position = this.getComponent(entityId, 'Position');
    if (position) {
      position.setPosition(x, y, z);
    }
  }
  
  /**
   * Check if entity is moving
   */
  isMoving(entityId) {
    const velocity = this.getComponent(entityId, 'Velocity');
    return velocity ? velocity.isMoving() : false;
  }
  
  /**
   * Get distance between two entities
   */
  getDistanceBetween(entityId1, entityId2) {
    const pos1 = this.getComponent(entityId1, 'Position');
    const pos2 = this.getComponent(entityId2, 'Position');
    
    if (!pos1 || !pos2) return Infinity;
    
    return pos1.distanceTo(pos2);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MovementSystem;
} else if (typeof window !== 'undefined') {
  window.MovementSystem = MovementSystem;
}