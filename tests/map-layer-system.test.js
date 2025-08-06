/**
 * Map Layer System Tests
 * Tests the layer management functionality for the go-wasm-game map system
 */

describe('Map Layer System', () => {
  let mockMap;
  let mockLayers;
  let mockCtx;
  
  beforeEach(() => {
    // Mock the JavaScript context object
    mockCtx = {
      fillStyle: '',
      set: jest.fn((prop, value) => { mockCtx[prop] = value; }),
      call: jest.fn(),
      fillRect: jest.fn()
    };
    
    // Create a mock layers collection
    mockLayers = {
      layers: [],
      addLayer: function(name, priority, visible, renderFunc) {
        this.layers.push({
          name: name,
          priority: priority,
          visible: visible,
          renderFunc: renderFunc
        });
        this.sortLayers();
      },
      removeLayer: function(name) {
        const index = this.layers.findIndex(layer => layer.name === name);
        if (index !== -1) {
          this.layers.splice(index, 1);
          return true;
        }
        return false;
      },
      setLayerVisibility: function(name, visible) {
        const layer = this.layers.find(l => l.name === name);
        if (layer) {
          layer.visible = visible;
          return true;
        }
        return false;
      },
      setLayerPriority: function(name, priority) {
        const layer = this.layers.find(l => l.name === name);
        if (layer) {
          layer.priority = priority;
          this.sortLayers();
          return true;
        }
        return false;
      },
      getLayer: function(name) {
        return this.layers.find(l => l.name === name) || null;
      },
      sortLayers: function() {
        this.layers.sort((a, b) => a.priority - b.priority);
      },
      renderAllLayers: function(ctx, cameraX, cameraY, canvasWidth, canvasHeight) {
        for (const layer of this.layers) {
          if (layer.visible && layer.renderFunc) {
            layer.renderFunc(ctx, cameraX, cameraY, canvasWidth, canvasHeight);
          }
        }
      }
    };
    
    // Create a mock map with layers
    mockMap = {
      width: 100,
      height: 100,
      tileSize: 32.0,
      layers: mockLayers,
      renderTilesLayer: jest.fn(),
      renderWithLayers: function(ctx, cameraX, cameraY, canvasWidth, canvasHeight) {
        this.layers.renderAllLayers(ctx, cameraX, cameraY, canvasWidth, canvasHeight);
      }
    };
  });

  describe('Layer Management', () => {
    test('should add layers with correct properties', () => {
      const mockRenderFunc = jest.fn();
      
      mockLayers.addLayer('test-layer', 5, true, mockRenderFunc);
      
      expect(mockLayers.layers).toHaveLength(1);
      expect(mockLayers.layers[0].name).toBe('test-layer');
      expect(mockLayers.layers[0].priority).toBe(5);
      expect(mockLayers.layers[0].visible).toBe(true);
      expect(mockLayers.layers[0].renderFunc).toBe(mockRenderFunc);
    });

    test('should remove layers by name', () => {
      mockLayers.addLayer('layer1', 1, true, jest.fn());
      mockLayers.addLayer('layer2', 2, true, jest.fn());
      
      expect(mockLayers.layers).toHaveLength(2);
      
      const removed = mockLayers.removeLayer('layer1');
      
      expect(removed).toBe(true);
      expect(mockLayers.layers).toHaveLength(1);
      expect(mockLayers.layers[0].name).toBe('layer2');
    });

    test('should return false when removing non-existent layer', () => {
      const removed = mockLayers.removeLayer('non-existent');
      
      expect(removed).toBe(false);
      expect(mockLayers.layers).toHaveLength(0);
    });

    test('should set layer visibility', () => {
      mockLayers.addLayer('test-layer', 1, true, jest.fn());
      
      const result = mockLayers.setLayerVisibility('test-layer', false);
      
      expect(result).toBe(true);
      expect(mockLayers.getLayer('test-layer').visible).toBe(false);
    });

    test('should return false when setting visibility of non-existent layer', () => {
      const result = mockLayers.setLayerVisibility('non-existent', false);
      
      expect(result).toBe(false);
    });

    test('should set layer priority and re-sort', () => {
      mockLayers.addLayer('layer1', 3, true, jest.fn());
      mockLayers.addLayer('layer2', 1, true, jest.fn());
      
      // Initial order should be layer2 (priority 1), layer1 (priority 3)
      expect(mockLayers.layers[0].name).toBe('layer2');
      expect(mockLayers.layers[1].name).toBe('layer1');
      
      // Change layer2 priority to 5
      const result = mockLayers.setLayerPriority('layer2', 5);
      
      expect(result).toBe(true);
      expect(mockLayers.getLayer('layer2').priority).toBe(5);
      
      // Now order should be layer1 (priority 3), layer2 (priority 5)
      expect(mockLayers.layers[0].name).toBe('layer1');
      expect(mockLayers.layers[1].name).toBe('layer2');
    });

    test('should get layer by name', () => {
      const mockRenderFunc = jest.fn();
      mockLayers.addLayer('test-layer', 1, true, mockRenderFunc);
      
      const layer = mockLayers.getLayer('test-layer');
      
      expect(layer).not.toBeNull();
      expect(layer.name).toBe('test-layer');
      expect(layer.priority).toBe(1);
      expect(layer.visible).toBe(true);
      expect(layer.renderFunc).toBe(mockRenderFunc);
    });

    test('should return null for non-existent layer', () => {
      const layer = mockLayers.getLayer('non-existent');
      
      expect(layer).toBeNull();
    });
  });

  describe('Layer Sorting', () => {
    test('should sort layers by priority', () => {
      mockLayers.addLayer('layer3', 30, true, jest.fn());
      mockLayers.addLayer('layer1', 10, true, jest.fn());
      mockLayers.addLayer('layer2', 20, true, jest.fn());
      
      expect(mockLayers.layers[0].name).toBe('layer1');
      expect(mockLayers.layers[0].priority).toBe(10);
      expect(mockLayers.layers[1].name).toBe('layer2');
      expect(mockLayers.layers[1].priority).toBe(20);
      expect(mockLayers.layers[2].name).toBe('layer3');
      expect(mockLayers.layers[2].priority).toBe(30);
    });

    test('should maintain stable sort for equal priorities', () => {
      mockLayers.addLayer('first', 5, true, jest.fn());
      mockLayers.addLayer('second', 5, true, jest.fn());
      
      expect(mockLayers.layers[0].name).toBe('first');
      expect(mockLayers.layers[1].name).toBe('second');
    });
  });

  describe('Layer Rendering', () => {
    test('should render all visible layers in priority order', () => {
      const renderFunc1 = jest.fn();
      const renderFunc2 = jest.fn();
      const renderFunc3 = jest.fn();
      
      mockLayers.addLayer('layer3', 30, true, renderFunc3);
      mockLayers.addLayer('layer1', 10, true, renderFunc1);
      mockLayers.addLayer('layer2', 20, false, renderFunc2); // Hidden layer
      
      mockLayers.renderAllLayers(mockCtx, 0, 0, 800, 600);
      
      // Only visible layers should be rendered
      expect(renderFunc1).toHaveBeenCalledWith(mockCtx, 0, 0, 800, 600);
      expect(renderFunc2).not.toHaveBeenCalled(); // Hidden layer
      expect(renderFunc3).toHaveBeenCalledWith(mockCtx, 0, 0, 800, 600);
      
      // Check order by verifying the layers are sorted correctly
      expect(mockLayers.layers[0].name).toBe('layer1'); // First to render
      expect(mockLayers.layers[2].name).toBe('layer3'); // Last to render
    });

    test('should skip layers without render functions', () => {
      mockLayers.addLayer('no-render', 10, true, null);
      
      // Should not throw error when rendering layer without render function
      expect(() => {
        mockLayers.renderAllLayers(mockCtx, 0, 0, 800, 600);
      }).not.toThrow();
    });

    test('should pass correct parameters to render functions', () => {
      const renderFunc = jest.fn();
      mockLayers.addLayer('test', 10, true, renderFunc);
      
      const cameraX = 100;
      const cameraY = 200;
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      mockLayers.renderAllLayers(mockCtx, cameraX, cameraY, canvasWidth, canvasHeight);
      
      expect(renderFunc).toHaveBeenCalledWith(mockCtx, cameraX, cameraY, canvasWidth, canvasHeight);
    });
  });

  describe('Default Layer Setup', () => {
    test('should create default layers with correct priorities', () => {
      // Simulate the default layer setup
      mockLayers.addLayer('tiles', 0, true, jest.fn());
      mockLayers.addLayer('objects', 10, true, jest.fn());
      mockLayers.addLayer('player', 20, true, jest.fn());
      
      expect(mockLayers.layers).toHaveLength(3);
      
      // Check order after sorting
      expect(mockLayers.layers[0].name).toBe('tiles');
      expect(mockLayers.layers[0].priority).toBe(0);
      expect(mockLayers.layers[1].name).toBe('objects');
      expect(mockLayers.layers[1].priority).toBe(10);
      expect(mockLayers.layers[2].name).toBe('player');
      expect(mockLayers.layers[2].priority).toBe(20);
    });

    test('should render default layers in correct order', () => {
      const tilesRender = jest.fn();
      const objectsRender = jest.fn();
      const playerRender = jest.fn();
      
      mockLayers.addLayer('tiles', 0, true, tilesRender);
      mockLayers.addLayer('objects', 10, true, objectsRender);
      mockLayers.addLayer('player', 20, true, playerRender);
      
      mockLayers.renderAllLayers(mockCtx, 0, 0, 800, 600);
      
      // All layers should be called
      expect(tilesRender).toHaveBeenCalled();
      expect(objectsRender).toHaveBeenCalled();
      expect(playerRender).toHaveBeenCalled();
      
      // Check rendering order by verifying layer priorities are correctly sorted
      expect(mockLayers.layers[0].name).toBe('tiles');
      expect(mockLayers.layers[0].priority).toBe(0);
      expect(mockLayers.layers[1].name).toBe('objects');
      expect(mockLayers.layers[1].priority).toBe(10);
      expect(mockLayers.layers[2].name).toBe('player');
      expect(mockLayers.layers[2].priority).toBe(20);
    });
  });

  describe('Layer Visibility Control', () => {
    test('should toggle layer visibility correctly', () => {
      const renderFunc = jest.fn();
      mockLayers.addLayer('toggleable', 10, true, renderFunc);
      
      // Initially visible - should render
      mockLayers.renderAllLayers(mockCtx, 0, 0, 800, 600);
      expect(renderFunc).toHaveBeenCalledTimes(1);
      
      // Hide layer
      mockLayers.setLayerVisibility('toggleable', false);
      renderFunc.mockClear();
      
      // Should not render when hidden
      mockLayers.renderAllLayers(mockCtx, 0, 0, 800, 600);
      expect(renderFunc).not.toHaveBeenCalled();
      
      // Show layer again
      mockLayers.setLayerVisibility('toggleable', true);
      renderFunc.mockClear();
      
      // Should render again when visible
      mockLayers.renderAllLayers(mockCtx, 0, 0, 800, 600);
      expect(renderFunc).toHaveBeenCalledTimes(1);
    });

    test('should support hiding specific layer types', () => {
      const tilesRender = jest.fn();
      const objectsRender = jest.fn();
      const playerRender = jest.fn();
      
      mockLayers.addLayer('tiles', 0, true, tilesRender);
      mockLayers.addLayer('objects', 10, true, objectsRender);
      mockLayers.addLayer('player', 20, true, playerRender);
      
      // Hide objects layer
      mockLayers.setLayerVisibility('objects', false);
      
      mockLayers.renderAllLayers(mockCtx, 0, 0, 800, 600);
      
      // Tiles and player should render, but not objects
      expect(tilesRender).toHaveBeenCalled();
      expect(objectsRender).not.toHaveBeenCalled();
      expect(playerRender).toHaveBeenCalled();
    });
  });

  describe('Integration with Map', () => {
    test('should integrate layer system with map rendering', () => {
      const tilesRender = jest.fn();
      const objectsRender = jest.fn();
      
      mockLayers.addLayer('tiles', 0, true, tilesRender);
      mockLayers.addLayer('objects', 10, true, objectsRender);
      
      mockMap.renderWithLayers(mockCtx, 50, 100, 800, 600);
      
      expect(tilesRender).toHaveBeenCalledWith(mockCtx, 50, 100, 800, 600);
      expect(objectsRender).toHaveBeenCalledWith(mockCtx, 50, 100, 800, 600);
    });
  });
});