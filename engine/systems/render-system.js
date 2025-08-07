/**
 * Render System - Handles rendering of entities with Renderable and Position components
 */
if (typeof require !== 'undefined') {
  var System = require('../core/system.js');
}

class RenderSystem extends System {
  constructor(canvas, context) {
    super('RenderSystem', 100); // Higher priority = runs later (after movement, physics)
    this.requiredComponents = ['Position', 'Renderable'];
    this.canvas = canvas;
    this.ctx = context;
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.clearColor = '#000000';
    this.backgroundColor = null;
  }
  
  /**
   * Set camera position and zoom
   */
  setCamera(x, y, zoom = 1) {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.zoom = zoom;
  }
  
  /**
   * Get camera position
   */
  getCamera() {
    return { ...this.camera };
  }
  
  /**
   * Set background color
   */
  setBackgroundColor(color) {
    this.backgroundColor = color;
  }
  
  /**
   * Set clear color (color used to clear canvas)
   */
  setClearColor(color) {
    this.clearColor = color;
  }
  
  /**
   * Transform world coordinates to screen coordinates
   */
  worldToScreen(x, y) {
    return {
      x: (x - this.camera.x) * this.camera.zoom,
      y: (y - this.camera.y) * this.camera.zoom
    };
  }
  
  /**
   * Transform screen coordinates to world coordinates
   */
  screenToWorld(x, y) {
    return {
      x: x / this.camera.zoom + this.camera.x,
      y: y / this.camera.zoom + this.camera.y
    };
  }
  
  /**
   * Check if entity is visible in camera view
   */
  isInView(position, renderable) {
    const bounds = renderable.getRenderBounds(position.x, position.y);
    const screenBounds = {
      x: (bounds.x - this.camera.x) * this.camera.zoom,
      y: (bounds.y - this.camera.y) * this.camera.zoom,
      width: bounds.width * this.camera.zoom,
      height: bounds.height * this.camera.zoom
    };
    
    // Check if entity is within canvas bounds (with some margin)
    const margin = 50;
    return !(screenBounds.x + screenBounds.width < -margin ||
             screenBounds.x > this.canvas.width + margin ||
             screenBounds.y + screenBounds.height < -margin ||
             screenBounds.y > this.canvas.height + margin);
  }
  
  /**
   * Process rendering for all visible entities
   */
  process(entities, deltaTime) {
    if (!this.ctx || !this.canvas) return; // Skip rendering if no context (testing)
    
    // Clear canvas
    this.clearCanvas();
    
    // Collect and sort entities by render order
    const renderList = [];
    
    for (const entityId of entities) {
      const position = this.getComponent(entityId, 'Position');
      const renderable = this.getComponent(entityId, 'Renderable');
      
      if (!position || !renderable || !renderable.visible) continue;
      
      // Update animations
      renderable.updateAnimation(deltaTime);
      
      // Skip if not in view (basic frustum culling)
      if (!this.isInView(position, renderable)) continue;
      
      renderList.push({ entityId, position, renderable });
    }
    
    // Sort by layer and z-index
    renderList.sort((a, b) => {
      if (a.renderable.layer !== b.renderable.layer) {
        return a.renderable.layer - b.renderable.layer;
      }
      return a.renderable.zIndex - b.renderable.zIndex;
    });
    
    // Render entities
    for (const { entityId, position, renderable } of renderList) {
      this.renderEntity(position, renderable);
    }
  }
  
  /**
   * Clear the canvas
   */
  clearCanvas() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    if (this.backgroundColor) {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    this.ctx.restore();
  }
  
  /**
   * Render a single entity
   */
  renderEntity(position, renderable) {
    this.ctx.save();
    
    // Transform to screen space
    const screenPos = this.worldToScreen(position.x, position.y);
    
    // Apply transformations
    this.ctx.translate(screenPos.x, screenPos.y);
    this.ctx.scale(this.camera.zoom * renderable.scaleX, this.camera.zoom * renderable.scaleY);
    this.ctx.rotate(renderable.rotation);
    this.ctx.globalAlpha = renderable.opacity;
    
    // Apply blend mode
    this.ctx.globalCompositeOperation = renderable.blend;
    
    // Render based on shape type
    switch (renderable.shape) {
      case 'rectangle':
        this.renderRectangle(renderable);
        break;
      case 'circle':
        this.renderCircle(renderable);
        break;
      case 'sprite':
        this.renderSprite(renderable);
        break;
      default:
        this.renderRectangle(renderable); // Fallback
        break;
    }
    
    this.ctx.restore();
  }
  
  /**
   * Render a rectangle
   */
  renderRectangle(renderable) {
    const x = -renderable.width * renderable.anchor.x;
    const y = -renderable.height * renderable.anchor.y;
    
    this.ctx.fillStyle = renderable.tint || renderable.color;
    this.ctx.fillRect(x, y, renderable.width, renderable.height);
  }
  
  /**
   * Render a circle
   */
  renderCircle(renderable) {
    const radius = Math.min(renderable.width, renderable.height) / 2;
    
    this.ctx.fillStyle = renderable.tint || renderable.color;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * Render a sprite (placeholder - would need actual image loading)
   */
  renderSprite(renderable) {
    // For now, render as rectangle with different color
    const x = -renderable.width * renderable.anchor.x;
    const y = -renderable.height * renderable.anchor.y;
    
    this.ctx.fillStyle = renderable.tint || '#ffff00'; // Yellow for sprites
    this.ctx.fillRect(x, y, renderable.width, renderable.height);
    
    // Add sprite indicator
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('S', x + renderable.width/2, y + renderable.height/2 + 4);
  }
  
  /**
   * Render debug information
   */
  renderDebug(entities) {
    if (!this.ctx) return;
    
    this.ctx.save();
    this.ctx.fillStyle = 'white';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Entities: ${entities.length}`, 10, 20);
    this.ctx.fillText(`Camera: (${this.camera.x.toFixed(1)}, ${this.camera.y.toFixed(1)})`, 10, 40);
    this.ctx.fillText(`Zoom: ${this.camera.zoom.toFixed(2)}`, 10, 60);
    this.ctx.restore();
  }
  
  /**
   * Get render statistics
   */
  getStats() {
    return {
      camera: this.getCamera(),
      canvasSize: { width: this.canvas.width, height: this.canvas.height }
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RenderSystem;
} else if (typeof window !== 'undefined') {
  window.RenderSystem = RenderSystem;
}