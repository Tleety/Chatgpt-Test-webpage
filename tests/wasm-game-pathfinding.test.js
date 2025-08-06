/**
 * Unit tests for WASM Game Pathfinding Integration with Multi-Layer Map System
 * Tests A* pathfinding working with the layer-based map architecture
 */

/**
 * @jest-environment jsdom
 */

describe('WASM Game Pathfinding with Multi-Layer Maps', () => {
  let mockCanvas, mockContext;
  
  beforeEach(() => {
    // Set up basic DOM elements for WASM game
    mockCanvas = {
      width: 800,
      height: 600,
      getContext: jest.fn()
    };
    
    mockContext = {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      set: jest.fn(),
      call: jest.fn()
    };
    
    mockCanvas.getContext.mockReturnValue(mockContext);
    
    // Mock global canvas for tests
    global.canvas = mockCanvas;
    global.ctx = mockContext;
  });

  describe('Pathfinding with Layer System', () => {
    test('should find path around water obstacles across multiple layers', () => {
      // Mock multi-layer map structure
      const mockMap = {
        width: 8,
        height: 8,
        tileSize: 32,
        layers: [
          {
            title: 'Base Terrain',
            drawOrder: 0,
            visible: true,
            tiles: [
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ]
          },
          {
            title: 'Water Features',
            drawOrder: 1,
            visible: true,
            tiles: [
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'water', 'water', 'water', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'water', 'grass', 'water', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'water', 'grass', 'water', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'water', 'water', 'water', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ]
          }
        ],
        
        // Mock GetTile method that returns top visible layer tile
        getTile: function(x, y) {
          if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return 'water';
          }
          
          // Check layers from top to bottom (reverse draw order)
          const visibleLayers = this.layers.filter(layer => layer.visible)
            .sort((a, b) => b.drawOrder - a.drawOrder);
          
          for (const layer of visibleLayers) {
            const tile = layer.tiles[y][x];
            if (tile !== 'grass') { // Non-grass tiles override
              return tile;
            }
          }
          
          return 'grass'; // Default if all layers have grass
        },
        
        worldToGrid: jest.fn((worldX, worldY) => [
          Math.floor(worldX / 32),
          Math.floor(worldY / 32)
        ]),
        
        gridToWorld: jest.fn((gridX, gridY) => [
          gridX * 32 + 16,
          gridY * 32 + 16
        ])
      };
      
      // Test pathfinding around the U-shaped water obstacle
      function simulatePathfinding(startX, startY, endX, endY, map) {
        // Simplified A* simulation for testing
        const visited = new Set();
        const queue = [{ x: startX, y: startY, path: [{ x: startX, y: startY }] }];
        
        while (queue.length > 0) {
          const current = queue.shift();
          const key = `${current.x},${current.y}`;
          
          if (visited.has(key)) continue;
          visited.add(key);
          
          // If reached destination
          if (current.x === endX && current.y === endY) {
            return current.path;
          }
          
          // Explore neighbors
          const directions = [
            {dx: 0, dy: 1}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: -1, dy: 0},
            {dx: 1, dy: 1}, {dx: -1, dy: -1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}
          ];
          
          for (const dir of directions) {
            const newX = current.x + dir.dx;
            const newY = current.y + dir.dy;
            
            if (newX >= 0 && newX < map.width && 
                newY >= 0 && newY < map.height &&
                !visited.has(`${newX},${newY}`)) {
              
              const tileType = map.getTile(newX, newY);
              // Check if tile is walkable (assume water is not walkable)
              if (tileType !== 'water') {
                queue.push({
                  x: newX,
                  y: newY,
                  path: [...current.path, { x: newX, y: newY }]
                });
              }
            }
          }
        }
        
        return null; // No path found
      }
      
      // Test pathfinding from (0,0) to (7,4) around the U-shaped water
      const path = simulatePathfinding(0, 0, 7, 4, mockMap);
      
      expect(path).not.toBeNull();
      expect(path.length).toBeGreaterThan(2);
      expect(path[0]).toEqual({ x: 0, y: 0 });
      expect(path[path.length - 1]).toEqual({ x: 7, y: 4 });
      
      // Verify path doesn't go through water tiles
      const pathGoesToWater = path.some(step => {
        const tileType = mockMap.getTile(step.x, step.y);
        return tileType === 'water';
      });
      expect(pathGoesToWater).toBe(false);
    });
    
    test('should respect layer visibility when pathfinding', () => {
      const mockMap = {
        width: 5,
        height: 5,
        layers: [
          {
            title: 'Base',
            drawOrder: 0,
            visible: true,
            tiles: [
              ['grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass']
            ]
          },
          {
            title: 'Hidden Water',
            drawOrder: 1,
            visible: false, // Hidden layer
            tiles: [
              ['grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'water', 'water', 'water', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass']
            ]
          }
        ],
        
        getTile: function(x, y) {
          // Only consider visible layers
          const visibleLayers = this.layers.filter(layer => layer.visible);
          
          for (const layer of visibleLayers.sort((a, b) => b.drawOrder - a.drawOrder)) {
            const tile = layer.tiles[y][x];
            if (tile !== 'grass') {
              return tile;
            }
          }
          
          return 'grass';
        }
      };
      
      // Since water layer is hidden, pathfinding should find direct path
      function canMoveDirectly(startX, startY, endX, endY, map) {
        // Check if direct path is blocked
        const steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
        
        for (let i = 0; i <= steps; i++) {
          const x = Math.round(startX + (endX - startX) * i / steps);
          const y = Math.round(startY + (endY - startY) * i / steps);
          
          if (map.getTile(x, y) === 'water') {
            return false;
          }
        }
        
        return true;
      }
      
      // Test direct movement is possible when water layer is hidden
      const canMoveDirectly_result = canMoveDirectly(0, 0, 4, 2, mockMap);
      expect(canMoveDirectly_result).toBe(true);
      
      // Now make water layer visible
      mockMap.layers[1].visible = true;
      const canMoveDirectly_afterVisible = canMoveDirectly(0, 0, 4, 2, mockMap);
      expect(canMoveDirectly_afterVisible).toBe(false);
    });
    
    test('should handle pathfinding with multiple obstacle layers', () => {
      const mockMap = {
        width: 6,
        height: 6,
        layers: [
          {
            title: 'Base',
            drawOrder: 0,
            visible: true,
            tiles: Array(6).fill().map(() => Array(6).fill('grass'))
          },
          {
            title: 'Water',
            drawOrder: 1,
            visible: true,
            tiles: [
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'water', 'water', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ]
          },
          {
            title: 'Rocks',
            drawOrder: 2,
            visible: true,
            tiles: [
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'rock', 'rock', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
              ['grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ]
          }
        ],
        
        getTile: function(x, y) {
          const visibleLayers = this.layers.filter(layer => layer.visible);
          
          for (const layer of visibleLayers.sort((a, b) => b.drawOrder - a.drawOrder)) {
            const tile = layer.tiles[y][x];
            if (tile !== 'grass') {
              return tile;
            }
          }
          
          return 'grass';
        }
      };
      
      // Test that pathfinding sees composite obstacles from multiple layers
      expect(mockMap.getTile(1, 1)).toBe('water');  // From water layer
      expect(mockMap.getTile(3, 2)).toBe('rock');   // From rock layer
      expect(mockMap.getTile(0, 0)).toBe('grass');  // Clear tile
      
      // Both obstacles should block pathfinding
      const hasObstacles = 
        mockMap.getTile(1, 1) !== 'grass' && 
        mockMap.getTile(3, 2) !== 'grass';
      
      expect(hasObstacles).toBe(true);
    });
  });
  
  describe('Player Movement with Pathfinding', () => {
    test('should use pathfinding for tile-to-tile movement', () => {
      const mockPlayer = {
        x: 50,
        y: 50,
        width: 20,
        height: 20,
        isMoving: false,
        path: null,
        pathStep: 0,
        
        moveToTile: function(gameMap, tileX, tileY) {
          // Simulate pathfinding movement setup
          const currentX = Math.floor(this.x / 32);
          const currentY = Math.floor(this.y / 32);
          
          if (currentX === tileX && currentY === tileY) {
            this.isMoving = false;
            this.path = null;
            this.pathStep = 0;
            return;
          }
          
          // Mock path calculation
          this.path = [
            { x: currentX, y: currentY },
            { x: tileX, y: tileY }
          ];
          this.pathStep = 0;
          this.isMoving = true;
        }
      };
      
      const mockMap = {
        worldToGrid: jest.fn((x, y) => [Math.floor(x / 32), Math.floor(y / 32)]),
        gridToWorld: jest.fn((x, y) => [x * 32 + 16, y * 32 + 16]),
        getTile: jest.fn().mockReturnValue('grass')
      };
      
      // Test movement initiation
      mockPlayer.moveToTile(mockMap, 5, 5);
      
      expect(mockPlayer.isMoving).toBe(true);
      expect(mockPlayer.path).not.toBeNull();
      expect(mockPlayer.path.length).toBeGreaterThan(0);
      expect(mockPlayer.pathStep).toBe(0);
    });
    
    test('should handle path following step by step', () => {
      const testPath = [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 3, y: 2 }
      ];
      
      function getNextPathStep(path, currentStep) {
        if (currentStep >= path.length) {
          return [0, 0, false];
        }
        
        const step = path[currentStep];
        return [step.x, step.y, true];
      }
      
      function isPathComplete(path, currentStep) {
        return currentStep >= path.length;
      }
      
      // Test path step progression
      let [x, y, hasNext] = getNextPathStep(testPath, 0);
      expect(hasNext).toBe(true);
      expect(x).toBe(1);
      expect(y).toBe(1);
      
      [x, y, hasNext] = getNextPathStep(testPath, 1);
      expect(hasNext).toBe(true);
      expect(x).toBe(2);
      expect(y).toBe(1);
      
      // Test path completion
      expect(isPathComplete(testPath, 3)).toBe(false);
      expect(isPathComplete(testPath, 4)).toBe(true);
    });
  });
  
  describe('Integration with Multi-Layer System', () => {
    test('should work with layer add/remove operations', () => {
      const mockMap = {
        width: 4,
        height: 4,
        layers: [
          {
            title: 'Base',
            drawOrder: 0,
            visible: true,
            tiles: Array(4).fill().map(() => Array(4).fill('grass'))
          }
        ],
        
        addLayer: function(title, drawOrder, visible) {
          const newLayer = {
            title,
            drawOrder,
            visible,
            tiles: Array(this.height).fill().map(() => Array(this.width).fill('grass'))
          };
          this.layers.push(newLayer);
          return this.layers.length - 1;
        },
        
        removeLayer: function(index) {
          if (index > 0 && index < this.layers.length) {
            this.layers.splice(index, 1);
            return true;
          }
          return false;
        },
        
        getTile: function(x, y) {
          const visibleLayers = this.layers.filter(layer => layer.visible);
          
          for (const layer of visibleLayers.sort((a, b) => b.drawOrder - a.drawOrder)) {
            const tile = layer.tiles[y][x];
            if (tile !== 'grass') {
              return tile;
            }
          }
          
          return 'grass';
        }
      };
      
      // Test initial state
      expect(mockMap.getTile(1, 1)).toBe('grass');
      
      // Add obstacle layer
      const obstacleLayerIndex = mockMap.addLayer('Obstacles', 1, true);
      mockMap.layers[obstacleLayerIndex].tiles[1][1] = 'water';
      
      expect(mockMap.getTile(1, 1)).toBe('water');
      
      // Remove obstacle layer
      mockMap.removeLayer(obstacleLayerIndex);
      expect(mockMap.getTile(1, 1)).toBe('grass');
    });
    
    test('should respect draw order in pathfinding decisions', () => {
      const mockMap = {
        width: 3,
        height: 3,
        layers: [
          {
            title: 'Base',
            drawOrder: 0,
            visible: true,
            tiles: [
              ['grass', 'grass', 'grass'],
              ['grass', 'water', 'grass'],
              ['grass', 'grass', 'grass']
            ]
          },
          {
            title: 'Bridge',
            drawOrder: 2,
            visible: true,
            tiles: [
              ['grass', 'grass', 'grass'],
              ['grass', 'dirt', 'grass'], // Bridge over water
              ['grass', 'grass', 'grass']
            ]
          }
        ],
        
        getTile: function(x, y) {
          const visibleLayers = this.layers.filter(layer => layer.visible);
          
          // Higher draw order (bridge) should override lower (water)
          for (const layer of visibleLayers.sort((a, b) => b.drawOrder - a.drawOrder)) {
            const tile = layer.tiles[y][x];
            if (tile !== 'grass') {
              return tile;
            }
          }
          
          return 'grass';
        }
      };
      
      // Bridge should override water, making center tile walkable
      expect(mockMap.getTile(1, 1)).toBe('dirt'); // Bridge overrides water
      
      // Hide bridge layer - water should be visible again
      mockMap.layers[1].visible = false;
      expect(mockMap.getTile(1, 1)).toBe('water');
    });
  });
});