/**
 * Position Component - Handles 2D position and spatial properties
 */
if (typeof require !== 'undefined') {
  var Component = require('../core/component.js');
}

class Position extends Component {
  constructor(x = 0, y = 0, z = 0) {
    super('Position');
    this.x = x;
    this.y = y;
    this.z = z; // For layering/depth
    this.lastX = x;
    this.lastY = y;
    this.lastZ = z;
  }
  
  /**
   * Update the position
   */
  setPosition(x, y, z = this.z) {
    this.lastX = this.x;
    this.lastY = this.y;
    this.lastZ = this.z;
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  /**
   * Translate the position by offset
   */
  translate(dx, dy, dz = 0) {
    this.setPosition(this.x + dx, this.y + dy, this.z + dz);
  }
  
  /**
   * Get distance to another position
   */
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Get squared distance (faster for comparisons)
   */
  distanceSquaredTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy;
  }
  
  /**
   * Check if position has changed since last frame
   */
  hasChanged() {
    return this.x !== this.lastX || this.y !== this.lastY || this.z !== this.lastZ;
  }
  
  /**
   * Get the movement delta since last frame
   */
  getDelta() {
    return {
      dx: this.x - this.lastX,
      dy: this.y - this.lastY,
      dz: this.z - this.lastZ
    };
  }
  
  /**
   * Serialize position data
   */
  serialize() {
    return {
      ...super.serialize(),
      x: this.x,
      y: this.y,
      z: this.z,
      lastX: this.lastX,
      lastY: this.lastY,
      lastZ: this.lastZ
    };
  }
  
  /**
   * Deserialize position data
   */
  static deserialize(data) {
    const position = new Position(data.x, data.y, data.z);
    position.lastX = data.lastX;
    position.lastY = data.lastY;
    position.lastZ = data.lastZ;
    position.entityId = data.entityId;
    return position;
  }
  
  /**
   * Create a copy of this component
   */
  clone() {
    const clone = new Position(this.x, this.y, this.z);
    clone.lastX = this.lastX;
    clone.lastY = this.lastY;
    clone.lastZ = this.lastZ;
    clone.entityId = this.entityId;
    return clone;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Position;
} else if (typeof window !== 'undefined') {
  window.Position = Position;
}