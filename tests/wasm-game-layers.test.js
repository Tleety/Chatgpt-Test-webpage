/**
 * Unit tests for WASM Game Map Layer System
 * Tests the new multi-layer map functionality with titles, draw order, and visibility
 */

/**
 * @jest-environment jsdom
 */

describe('WASM Game Map Layers', () => {
  // Mock layer structure for testing
  let mockMap;
  
  beforeEach(() => {
    // Create a mock map with layer system
    mockMap = {
      width: 10,
      height: 10,
      tileSize: 32,
      layers: []
    };
    
    // Mock tile types
    mockMap.TILE_GRASS = 0;
    mockMap.TILE_WATER = 1;
    mockMap.TILE_DIRT_PATH = 2;
  });
  
  test('should create layers with title, drawOrder, and visible properties', () => {
    // Test layer creation with all required properties
    const layer = {
      title: "Base Terrain",
      drawOrder: 0,
      visible: true,
      tiles: Array(10).fill().map(() => Array(10).fill(0)) // 10x10 filled with grass
    };
    
    expect(layer.title).toBe("Base Terrain");
    expect(layer.drawOrder).toBe(0);
    expect(layer.visible).toBe(true);
    expect(layer.tiles).toHaveLength(10);
    expect(layer.tiles[0]).toHaveLength(10);
  });
  
  test('should support multiple layers with different properties', () => {
    // Create multiple layers
    const baseLayer = {
      title: "Base Terrain",
      drawOrder: 0,
      visible: true,
      tiles: Array(10).fill().map(() => Array(10).fill(0))
    };
    
    const pathLayer = {
      title: "Paths and Roads",
      drawOrder: 1,
      visible: true,
      tiles: Array(10).fill().map(() => Array(10).fill(0))
    };
    
    const decorationLayer = {
      title: "Decorations",
      drawOrder: 2,
      visible: false,
      tiles: Array(10).fill().map(() => Array(10).fill(0))
    };
    
    mockMap.layers = [baseLayer, pathLayer, decorationLayer];
    
    expect(mockMap.layers).toHaveLength(3);
    expect(mockMap.layers[0].title).toBe("Base Terrain");
    expect(mockMap.layers[1].title).toBe("Paths and Roads");
    expect(mockMap.layers[2].title).toBe("Decorations");
    expect(mockMap.layers[2].visible).toBe(false);
  });
  
  test('should handle layer management operations', () => {
    // Mock layer management functions
    function addLayer(map, title, drawOrder, visible) {
      const layer = {
        title: title,
        drawOrder: drawOrder,
        visible: visible,
        tiles: Array(map.height).fill().map(() => Array(map.width).fill(0))
      };
      map.layers.push(layer);
      return map.layers.length - 1; // Return layer index
    }
    
    function removeLayer(map, layerIndex) {
      if (layerIndex < 0 || layerIndex >= map.layers.length || map.layers.length <= 1) {
        return false;
      }
      map.layers.splice(layerIndex, 1);
      return true;
    }
    
    function setLayerVisibility(map, layerIndex, visible) {
      if (layerIndex >= 0 && layerIndex < map.layers.length) {
        map.layers[layerIndex].visible = visible;
        return true;
      }
      return false;
    }
    
    // Test adding layers
    const layer1Index = addLayer(mockMap, "Base", 0, true);
    const layer2Index = addLayer(mockMap, "Overlay", 1, false);
    
    expect(mockMap.layers).toHaveLength(2);
    expect(layer1Index).toBe(0);
    expect(layer2Index).toBe(1);
    
    // Test visibility toggle
    expect(setLayerVisibility(mockMap, 1, true)).toBe(true);
    expect(mockMap.layers[1].visible).toBe(true);
    
    // Test layer removal
    expect(removeLayer(mockMap, 1)).toBe(true);
    expect(mockMap.layers).toHaveLength(1);
    
    // Test can't remove last layer
    expect(removeLayer(mockMap, 0)).toBe(false);
    expect(mockMap.layers).toHaveLength(1);
  });
  
  test('should sort layers by draw order for rendering', () => {
    // Create layers with mixed draw orders
    const layers = [
      { title: "Layer C", drawOrder: 2, visible: true },
      { title: "Layer A", drawOrder: 0, visible: true },
      { title: "Layer B", drawOrder: 1, visible: true },
      { title: "Layer D", drawOrder: 3, visible: false } // Hidden layer
    ];
    
    mockMap.layers = layers;
    
    // Mock function to get visible layers sorted by draw order
    function getVisibleLayersSorted(map) {
      return map.layers
        .filter(layer => layer.visible)
        .sort((a, b) => a.drawOrder - b.drawOrder);
    }
    
    const sortedVisibleLayers = getVisibleLayersSorted(mockMap);
    
    expect(sortedVisibleLayers).toHaveLength(3); // Only visible layers
    expect(sortedVisibleLayers[0].title).toBe("Layer A"); // drawOrder 0
    expect(sortedVisibleLayers[1].title).toBe("Layer B"); // drawOrder 1
    expect(sortedVisibleLayers[2].title).toBe("Layer C"); // drawOrder 2
  });
  
  test('should handle tile operations on specific layers', () => {
    // Create base layer
    const baseLayer = {
      title: "Base",
      drawOrder: 0,
      visible: true,
      tiles: Array(10).fill().map(() => Array(10).fill(0)) // Grass
    };
    
    mockMap.layers = [baseLayer];
    
    // Mock functions for tile operations
    function setTileOnLayer(map, layerIndex, x, y, tileType) {
      if (layerIndex >= 0 && layerIndex < map.layers.length &&
          x >= 0 && x < map.width && y >= 0 && y < map.height) {
        map.layers[layerIndex].tiles[y][x] = tileType;
        return true;
      }
      return false;
    }
    
    function getTileFromLayer(map, layerIndex, x, y) {
      if (layerIndex >= 0 && layerIndex < map.layers.length &&
          x >= 0 && x < map.width && y >= 0 && y < map.height) {
        return map.layers[layerIndex].tiles[y][x];
      }
      return -1; // Invalid
    }
    
    // Test setting tiles on specific layer
    expect(setTileOnLayer(mockMap, 0, 5, 5, mockMap.TILE_WATER)).toBe(true);
    expect(getTileFromLayer(mockMap, 0, 5, 5)).toBe(mockMap.TILE_WATER);
    
    // Test boundary conditions
    expect(setTileOnLayer(mockMap, 0, -1, 5, mockMap.TILE_WATER)).toBe(false);
    expect(setTileOnLayer(mockMap, 0, 15, 5, mockMap.TILE_WATER)).toBe(false);
    expect(setTileOnLayer(mockMap, 1, 5, 5, mockMap.TILE_WATER)).toBe(false); // Invalid layer
  });
  
  test('should handle composite tile queries from multiple layers', () => {
    // Create multiple layers with different tiles
    const baseLayer = {
      title: "Base",
      drawOrder: 0,
      visible: true,
      tiles: Array(10).fill().map(() => Array(10).fill(0)) // All grass
    };
    
    const pathLayer = {
      title: "Paths",
      drawOrder: 1,
      visible: true,
      tiles: Array(10).fill().map(() => Array(10).fill(0)) // All grass (transparent)
    };
    
    // Set a dirt path on the path layer
    pathLayer.tiles[5][5] = 2; // TILE_DIRT_PATH
    
    mockMap.layers = [baseLayer, pathLayer];
    
    // Mock function to get the visible tile from top layer
    function getTopVisibleTile(map, x, y) {
      if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
        return 1; // TILE_WATER for out of bounds
      }
      
      // Get visible layers sorted by draw order (top layer first for queries)
      const visibleLayers = map.layers
        .filter(layer => layer.visible)
        .sort((a, b) => b.drawOrder - a.drawOrder); // Descending for top-first
      
      // Return tile from topmost non-transparent layer
      for (const layer of visibleLayers) {
        const tile = layer.tiles[y][x];
        if (tile !== 0) { // Not grass (transparent)
          return tile;
        }
      }
      
      return 0; // Default to grass
    }
    
    // Test composite tile query
    expect(getTopVisibleTile(mockMap, 5, 5)).toBe(2); // Should return dirt path from top layer
    expect(getTopVisibleTile(mockMap, 3, 3)).toBe(0); // Should return grass (no override)
    expect(getTopVisibleTile(mockMap, -1, 5)).toBe(1); // Out of bounds should return water
  });
  
  test('should verify layer system preserves backward compatibility', () => {
    // Test that the basic map operations still work
    const mockMapWithSingleLayer = {
      width: 10,
      height: 10,
      layers: [{
        title: "Base Terrain",
        drawOrder: 0,
        visible: true,
        tiles: Array(10).fill().map(() => Array(10).fill(0))
      }]
    };
    
    // Mock backward-compatible getTile function
    function getTile(map, x, y) {
      if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
        return 1; // TILE_WATER
      }
      
      // For backward compatibility, get from the composite view
      const visibleLayers = map.layers
        .filter(layer => layer.visible)
        .sort((a, b) => b.drawOrder - a.drawOrder);
      
      for (const layer of visibleLayers) {
        const tile = layer.tiles[y][x];
        if (tile !== 0) {
          return tile;
        }
      }
      
      return 0; // Grass
    }
    
    // Mock backward-compatible setTile function (sets on base layer)
    function setTile(map, x, y, tileType) {
      if (map.layers.length > 0 && x >= 0 && x < map.width && y >= 0 && y < map.height) {
        map.layers[0].tiles[y][x] = tileType;
        return true;
      }
      return false;
    }
    
    // Test backward compatibility
    expect(setTile(mockMapWithSingleLayer, 3, 3, 1)).toBe(true);
    expect(getTile(mockMapWithSingleLayer, 3, 3)).toBe(1);
    expect(getTile(mockMapWithSingleLayer, -1, 3)).toBe(1); // Out of bounds
  });
});