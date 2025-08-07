/**
 * Renderable Component - Handles visual representation and rendering properties
 */
if (typeof require !== 'undefined') {
  var Component = require('../core/component.js');
}

class Renderable extends Component {
  constructor(options = {}) {
    super('Renderable');
    
    // Basic rendering properties
    this.visible = options.visible !== undefined ? options.visible : true;
    this.width = options.width || 20;
    this.height = options.height || 20;
    this.color = options.color || '#00ff00';
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    
    // Shape type (rectangle, circle, sprite, etc.)
    this.shape = options.shape || 'rectangle';
    
    // Sprite properties (if applicable)
    this.sprite = options.sprite || null;
    this.spriteFrame = options.spriteFrame || 0;
    this.spriteSheet = options.spriteSheet || null;
    
    // Transform properties
    this.rotation = options.rotation || 0; // in radians
    this.scaleX = options.scaleX || 1;
    this.scaleY = options.scaleY || 1;
    this.anchor = options.anchor || { x: 0.5, y: 0.5 }; // anchor point (0-1)
    
    // Layer/depth for rendering order
    this.layer = options.layer || 0;
    this.zIndex = options.zIndex || 0;
    
    // Animation properties
    this.animation = options.animation || null;
    this.animationFrame = 0;
    this.animationSpeed = options.animationSpeed || 1;
    this.animationTime = 0;
    
    // Effect properties
    this.tint = options.tint || null;
    this.blend = options.blend || 'normal';
    this.filter = options.filter || null;
  }
  
  /**
   * Set visibility
   */
  setVisible(visible) {
    this.visible = visible;
  }
  
  /**
   * Set size
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }
  
  /**
   * Set color
   */
  setColor(color) {
    this.color = color;
  }
  
  /**
   * Set opacity
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }
  
  /**
   * Set rotation in radians
   */
  setRotation(rotation) {
    this.rotation = rotation;
  }
  
  /**
   * Set rotation in degrees
   */
  setRotationDegrees(degrees) {
    this.rotation = degrees * Math.PI / 180;
  }
  
  /**
   * Set scale
   */
  setScale(scaleX, scaleY = scaleX) {
    this.scaleX = scaleX;
    this.scaleY = scaleY;
  }
  
  /**
   * Set sprite image
   */
  setSprite(sprite, frame = 0) {
    this.sprite = sprite;
    this.spriteFrame = frame;
    this.shape = 'sprite';
  }
  
  /**
   * Set animation
   */
  setAnimation(animation) {
    this.animation = animation;
    this.animationFrame = 0;
    this.animationTime = 0;
  }
  
  /**
   * Update animation (called by rendering system)
   */
  updateAnimation(deltaTime) {
    if (this.animation && this.animation.frames) {
      this.animationTime += deltaTime * this.animationSpeed;
      
      const frameTime = this.animation.frameTime || 100; // milliseconds per frame
      const totalFrames = this.animation.frames.length;
      
      if (this.animationTime >= frameTime) {
        this.animationFrame = (this.animationFrame + 1) % totalFrames;
        this.animationTime = 0;
        
        // Update sprite frame if using sprite animation
        if (this.shape === 'sprite') {
          this.spriteFrame = this.animation.frames[this.animationFrame];
        }
      }
    }
  }
  
  /**
   * Get current animation frame
   */
  getCurrentFrame() {
    if (this.animation && this.animation.frames) {
      return this.animation.frames[this.animationFrame];
    }
    return this.spriteFrame;
  }
  
  /**
   * Get render bounds (considering scale and anchor)
   */
  getRenderBounds(x, y) {
    const width = this.width * this.scaleX;
    const height = this.height * this.scaleY;
    const anchorX = width * this.anchor.x;
    const anchorY = height * this.anchor.y;
    
    return {
      x: x - anchorX,
      y: y - anchorY,
      width: width,
      height: height
    };
  }
  
  /**
   * Check if point is inside renderable bounds
   */
  containsPoint(x, y, entityX, entityY) {
    const bounds = this.getRenderBounds(entityX, entityY);
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }
  
  /**
   * Serialize renderable data
   */
  serialize() {
    return {
      ...super.serialize(),
      visible: this.visible,
      width: this.width,
      height: this.height,
      color: this.color,
      opacity: this.opacity,
      shape: this.shape,
      sprite: this.sprite,
      spriteFrame: this.spriteFrame,
      spriteSheet: this.spriteSheet,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      anchor: this.anchor,
      layer: this.layer,
      zIndex: this.zIndex,
      animation: this.animation,
      animationFrame: this.animationFrame,
      animationSpeed: this.animationSpeed,
      animationTime: this.animationTime,
      tint: this.tint,
      blend: this.blend,
      filter: this.filter
    };
  }
  
  /**
   * Deserialize renderable data
   */
  static deserialize(data) {
    const renderable = new Renderable({
      visible: data.visible,
      width: data.width,
      height: data.height,
      color: data.color,
      opacity: data.opacity,
      shape: data.shape,
      sprite: data.sprite,
      spriteFrame: data.spriteFrame,
      spriteSheet: data.spriteSheet,
      rotation: data.rotation,
      scaleX: data.scaleX,
      scaleY: data.scaleY,
      anchor: data.anchor,
      layer: data.layer,
      zIndex: data.zIndex,
      animation: data.animation,
      animationSpeed: data.animationSpeed,
      tint: data.tint,
      blend: data.blend,
      filter: data.filter
    });
    
    renderable.animationFrame = data.animationFrame;
    renderable.animationTime = data.animationTime;
    renderable.entityId = data.entityId;
    return renderable;
  }
  
  /**
   * Create a copy of this component
   */
  clone() {
    const clone = new Renderable(this.serialize());
    clone.entityId = this.entityId;
    return clone;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderable;
} else if (typeof window !== 'undefined') {
  window.Renderable = Renderable;
}