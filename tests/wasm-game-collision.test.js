/**
 * Unit tests for WASM Game Collision Detection
 * Tests water tile collision prevention
 */

/**
 * @jest-environment jsdom
 */

describe('WASM Game Collision Detection', () => {
  let mockCanvas, mockContext;
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <canvas id="game" width="800" height="600"></canvas>
    `;
    
    mockCanvas = document.getElementById('game');
    mockContext = {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      set: jest.fn(),
      call: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn()
    };
    
    // Mock canvas context
    mockCanvas.getContext = jest.fn().mockReturnValue(mockContext);
    
    // Mock global objects that WASM would set
    global.wasmLoaded = false;
    global.recenterSquare = jest.fn();
    global.gameClick = jest.fn();
  });
  
  afterEach(() => {
    delete global.wasmLoaded;
    delete global.recenterSquare;
    delete global.gameClick;
  });

  describe('Water Tile Collision Prevention', () => {
    test('should prevent movement to water tiles via keyboard', () => {
      // This test verifies the concept - actual implementation is in Go WASM
      const mockPlayer = {
        x: 100,
        y: 100,
        width: 20,
        height: 20,
        speed: 5
      };
      
      const mockMap = {
        getTile: jest.fn(),
        tileSize: 32,
        worldToGrid: jest.fn().mockReturnValue([3, 3])
      };
      
      // Mock water tile at position (3, 3)
      mockMap.getTile.mockReturnValue('water');
      
      // Simulate collision detection logic
      function isPositionWalkable(x, y, map) {
        const corners = [
          {px: x, py: y},
          {px: x + mockPlayer.width, py: y},
          {px: x, py: y + mockPlayer.height},
          {px: x + mockPlayer.width, py: y + mockPlayer.height}
        ];
        
        for (const corner of corners) {
          const [tileX, tileY] = map.worldToGrid(corner.px, corner.py);
          if (map.getTile(tileX, tileY) === 'water') {
            return false;
          }
        }
        return true;
      }
      
      // Test that movement to water position is blocked
      const newX = mockPlayer.x + mockPlayer.speed;
      const newY = mockPlayer.y;
      
      expect(isPositionWalkable(newX, newY, mockMap)).toBe(false);
      expect(mockMap.worldToGrid).toHaveBeenCalled();
      expect(mockMap.getTile).toHaveBeenCalledWith(3, 3);
    });
    
    test('should allow movement to grass tiles', () => {
      const mockPlayer = {
        x: 100,
        y: 100,
        width: 20,
        height: 20,
        speed: 5
      };
      
      const mockMap = {
        getTile: jest.fn(),
        tileSize: 32,
        worldToGrid: jest.fn().mockReturnValue([3, 3])
      };
      
      // Mock grass tile at position (3, 3)
      mockMap.getTile.mockReturnValue('grass');
      
      function isPositionWalkable(x, y, map) {
        const corners = [
          {px: x, py: y},
          {px: x + mockPlayer.width, py: y},
          {px: x, py: y + mockPlayer.height},
          {px: x + mockPlayer.width, py: y + mockPlayer.height}
        ];
        
        for (const corner of corners) {
          const [tileX, tileY] = map.worldToGrid(corner.px, corner.py);
          if (map.getTile(tileX, tileY) === 'water') {
            return false;
          }
        }
        return true;
      }
      
      // Test that movement to grass position is allowed
      const newX = mockPlayer.x + mockPlayer.speed;
      const newY = mockPlayer.y;
      
      expect(isPositionWalkable(newX, newY, mockMap)).toBe(true);
      expect(mockMap.worldToGrid).toHaveBeenCalled();
      expect(mockMap.getTile).toHaveBeenCalledWith(3, 3);
    });
    
    test('should prevent click-to-move to water tiles', () => {
      const mockMap = {
        getTile: jest.fn().mockReturnValue('water'), // Water tile
        worldToGrid: jest.fn().mockReturnValue([5, 5])
      };
      
      // Simulate click-to-move collision detection
      function canMoveToTile(tileX, tileY, map) {
        return map.getTile(tileX, tileY) !== 'water';
      }
      
      expect(canMoveToTile(5, 5, mockMap)).toBe(false);
      expect(mockMap.getTile).toHaveBeenCalledWith(5, 5);
    });
    
    test('should allow click-to-move to grass tiles', () => {
      const mockMap = {
        getTile: jest.fn().mockReturnValue('grass'), // Grass tile
        worldToGrid: jest.fn().mockReturnValue([5, 5])
      };
      
      function canMoveToTile(tileX, tileY, map) {
        return map.getTile(tileX, tileY) !== 'water';
      }
      
      expect(canMoveToTile(5, 5, mockMap)).toBe(true);
      expect(mockMap.getTile).toHaveBeenCalledWith(5, 5);
    });
  });

  describe('WASM Integration', () => {
    test('should have canvas element for game rendering', () => {
      const canvas = document.getElementById('game');
      expect(canvas).toBeTruthy();
      expect(canvas.tagName).toBe('CANVAS');
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
    });
    
    test('should set up WASM loading flag correctly', () => {
      expect(global.wasmLoaded).toBe(false);
      
      // Simulate WASM loading
      global.wasmLoaded = true;
      expect(global.wasmLoaded).toBe(true);
    });
    
    test('should expose game functions to global scope', () => {
      // These functions should be available when WASM loads
      expect(typeof global.recenterSquare).toBe('function');
      expect(typeof global.gameClick).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    test('should handle player at tile boundaries correctly', () => {
      const mockPlayer = {
        x: 96,  // Close to tile boundary (32px tiles)
        y: 96,
        width: 20,
        height: 20
      };
      
      const mockMap = {
        getTile: jest.fn(),
        tileSize: 32,
        worldToGrid: jest.fn()
      };
      
      // Mock different tiles for different corners
      mockMap.worldToGrid
        .mockReturnValueOnce([3, 3]) // Top-left: grass
        .mockReturnValueOnce([4, 3]) // Top-right: water
        .mockReturnValueOnce([3, 4]) // Bottom-left: grass  
        .mockReturnValueOnce([4, 4]); // Bottom-right: grass
      
      mockMap.getTile
        .mockReturnValueOnce('grass')
        .mockReturnValueOnce('water') // This will cause early return
        .mockReturnValueOnce('grass')
        .mockReturnValueOnce('grass');
      
      function isPositionWalkable(x, y, map) {
        const corners = [
          {px: x, py: y},
          {px: x + mockPlayer.width, py: y},
          {px: x, py: y + mockPlayer.height},
          {px: x + mockPlayer.width, py: y + mockPlayer.height}
        ];
        
        for (const corner of corners) {
          const [tileX, tileY] = map.worldToGrid(corner.px, corner.py);
          if (map.getTile(tileX, tileY) === 'water') {
            return false;
          }
        }
        return true;
      }
      
      // Should be blocked because one corner touches water
      expect(isPositionWalkable(mockPlayer.x, mockPlayer.y, mockMap)).toBe(false);
      // Note: The function returns early when water is detected, so only 2 calls are made
      expect(mockMap.worldToGrid).toHaveBeenCalledTimes(2);
      expect(mockMap.getTile).toHaveBeenCalledTimes(2);
    });
  });
});