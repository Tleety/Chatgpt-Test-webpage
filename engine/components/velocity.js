/**
 * Velocity Component - Handles movement speed and direction
 */
if (typeof require !== 'undefined') {
  var Component = require('../core/component.js');
}

class Velocity extends Component {
  constructor(vx = 0, vy = 0, maxSpeed = Infinity) {
    super('Velocity');
    this.vx = vx;
    this.vy = vy;
    this.maxSpeed = maxSpeed;
    this.friction = 0; // 0 = no friction, 1 = full friction
  }
  
  /**
   * Set velocity components
   */
  setVelocity(vx, vy) {
    this.vx = vx;
    this.vy = vy;
    this.clampToMaxSpeed();
  }
  
  /**
   * Add to current velocity
   */
  addVelocity(dvx, dvy) {
    this.vx += dvx;
    this.vy += dvy;
    this.clampToMaxSpeed();
  }
  
  /**
   * Set velocity from angle and magnitude
   */
  setFromAngle(angle, magnitude) {
    this.vx = Math.cos(angle) * magnitude;
    this.vy = Math.sin(angle) * magnitude;
    this.clampToMaxSpeed();
  }
  
  /**
   * Get current speed (magnitude of velocity)
   */
  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }
  
  /**
   * Get current angle of movement in radians
   */
  getAngle() {
    return Math.atan2(this.vy, this.vx);
  }
  
  /**
   * Get current angle of movement in degrees
   */
  getAngleDegrees() {
    return this.getAngle() * 180 / Math.PI;
  }
  
  /**
   * Normalize velocity to unit length
   */
  normalize() {
    const speed = this.getSpeed();
    if (speed > 0) {
      this.vx /= speed;
      this.vy /= speed;
    }
  }
  
  /**
   * Scale velocity by a factor
   */
  scale(factor) {
    this.vx *= factor;
    this.vy *= factor;
    this.clampToMaxSpeed();
  }
  
  /**
   * Apply friction to slow down velocity
   */
  applyFriction() {
    if (this.friction > 0) {
      const frictionFactor = 1 - this.friction;
      this.vx *= frictionFactor;
      this.vy *= frictionFactor;
    }
  }
  
  /**
   * Stop all movement
   */
  stop() {
    this.vx = 0;
    this.vy = 0;
  }
  
  /**
   * Check if entity is moving
   */
  isMoving(threshold = 0.001) {
    return this.getSpeed() > threshold;
  }
  
  /**
   * Clamp velocity to maximum speed
   */
  clampToMaxSpeed() {
    if (this.maxSpeed !== Infinity) {
      const speed = this.getSpeed();
      if (speed > this.maxSpeed) {
        const factor = this.maxSpeed / speed;
        this.vx *= factor;
        this.vy *= factor;
      }
    }
  }
  
  /**
   * Serialize velocity data
   */
  serialize() {
    return {
      ...super.serialize(),
      vx: this.vx,
      vy: this.vy,
      maxSpeed: this.maxSpeed,
      friction: this.friction
    };
  }
  
  /**
   * Deserialize velocity data
   */
  static deserialize(data) {
    const velocity = new Velocity(data.vx, data.vy, data.maxSpeed);
    velocity.friction = data.friction;
    velocity.entityId = data.entityId;
    return velocity;
  }
  
  /**
   * Create a copy of this component
   */
  clone() {
    const clone = new Velocity(this.vx, this.vy, this.maxSpeed);
    clone.friction = this.friction;
    clone.entityId = this.entityId;
    return clone;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Velocity;
} else if (typeof window !== 'undefined') {
  window.Velocity = Velocity;
}