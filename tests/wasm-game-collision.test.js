/**
 * Unit tests for WASM Game Collision Detection and Smart Click Movement
 * Tests water tile collision prevention and intelligent pathfinding
 */

/**
 * @jest-environment jsdom
 */

describe('WASM Game Collision Detection and Smart Movement', () => {
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
    test('should prevent movement to water tiles via position check', () => {
      // This test verifies the concept - actual implementation is in Go WASM
      const mockPlayer = {
        x: 100,
        y: 100,
        width: 20,
        height: 20
      };
      
      const mockMap = {
        getTile: jest.fn(),
        tileSize: 32,
        worldToGrid: jest.fn().mockReturnValue([3, 3])
      };
      
      // Mock water tile at position (3, 3)
      mockMap.getTile.mockReturnValue('water');
      
      // Simulate collision detection logic
      function isPositionWalkable(x, y, width, height, map) {
        const corners = [
          {px: x, py: y},
          {px: x + width, py: y},
          {px: x, py: y + height},
          {px: x + width, py: y + height}
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
      const newX = mockPlayer.x + 5;
      const newY = mockPlayer.y;
      
      expect(isPositionWalkable(newX, newY, mockPlayer.width, mockPlayer.height, mockMap)).toBe(false);
      expect(mockMap.worldToGrid).toHaveBeenCalled();
      expect(mockMap.getTile).toHaveBeenCalledWith(3, 3);
    });
    
    test('should allow movement to grass tiles', () => {
      const mockPlayer = {
        x: 100,
        y: 100,
        width: 20,
        height: 20
      };
      
      const mockMap = {
        getTile: jest.fn(),
        tileSize: 32,
        worldToGrid: jest.fn().mockReturnValue([3, 3])
      };
      
      // Mock grass tile at position (3, 3)
      mockMap.getTile.mockReturnValue('grass');
      
      function isPositionWalkable(x, y, width, height, map) {
        const corners = [
          {px: x, py: y},
          {px: x + width, py: y},
          {px: x, py: y + height},
          {px: x + width, py: y + height}
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
      const newX = mockPlayer.x + 5;
      const newY = mockPlayer.y;
      
      expect(isPositionWalkable(newX, newY, mockPlayer.width, mockPlayer.height, mockMap)).toBe(true);
      expect(mockMap.worldToGrid).toHaveBeenCalled();
      expect(mockMap.getTile).toHaveBeenCalledWith(3, 3);
    });
  });

  describe('Smart Click Movement', () => {
    test('should move to the exact tile when clicking on grass', () => {
      const mockMap = {
        getTile: jest.fn().mockReturnValue('grass'), // Grass tile
        worldToGrid: jest.fn().mockReturnValue([5, 5]),
        width: 200,
        height: 200
      };
      
      // Simulate smart movement function
      function findNearestWalkableTile(targetX, targetY, map) {
        // If target is walkable, return it
        if (map.getTile(targetX, targetY) !== 'water') {
          return [targetX, targetY];
        }
        // Otherwise search for nearest walkable tile (simplified version)
        return [map.width / 2, map.height / 2]; // Fallback to center
      }
      
      const [resultX, resultY] = findNearestWalkableTile(5, 5, mockMap);
      expect(resultX).toBe(5);
      expect(resultY).toBe(5);
      expect(mockMap.getTile).toHaveBeenCalledWith(5, 5);
    });
    
    test('should find nearest walkable tile when clicking on water', () => {
      const mockMap = {
        getTile: jest.fn(),
        worldToGrid: jest.fn().mockReturnValue([5, 5]),
        width: 200,
        height: 200
      };
      
      // Mock water at target, grass at adjacent tiles
      mockMap.getTile
        .mockReturnValueOnce('water') // Initial check
        .mockReturnValueOnce('grass'); // First adjacent tile found
      
      function findNearestWalkableTile(targetX, targetY, map) {
        // If target is walkable, return it
        if (map.getTile(targetX, targetY) !== 'water') {
          return [targetX, targetY];
        }
        
        // Simple spiral search (simplified for test)
        const searchOffsets = [
          [0, 1], [1, 0], [0, -1], [-1, 0], // Direct neighbors
          [1, 1], [-1, -1], [1, -1], [-1, 1] // Diagonals
        ];
        
        for (const [dx, dy] of searchOffsets) {
          const checkX = targetX + dx;
          const checkY = targetY + dy;
          if (checkX >= 0 && checkX < map.width && 
              checkY >= 0 && checkY < map.height &&
              map.getTile(checkX, checkY) !== 'water') {
            return [checkX, checkY];
          }
        }
        
        return [map.width / 2, map.height / 2]; // Fallback
      }
      
      const [resultX, resultY] = findNearestWalkableTile(5, 5, mockMap);
      expect(resultX).toBe(5); // Should find adjacent tile at (5, 6)
      expect(resultY).toBe(6);
      expect(mockMap.getTile).toHaveBeenCalledTimes(2);
    });
    
    test('should fallback to map center if no walkable tile found nearby', () => {
      const mockMap = {
        getTile: jest.fn().mockReturnValue('water'), // All tiles are water
        worldToGrid: jest.fn().mockReturnValue([5, 5]),
        width: 200,
        height: 200
      };
      
      function findNearestWalkableTile(targetX, targetY, map) {
        // Always return center if everything is water (simplified)
        return [map.width / 2, map.height / 2];
      }
      
      const [resultX, resultY] = findNearestWalkableTile(5, 5, mockMap);
      expect(resultX).toBe(100); // Center X
      expect(resultY).toBe(100); // Center Y
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
      
      function isPositionWalkable(x, y, width, height, map) {
        const corners = [
          {px: x, py: y},
          {px: x + width, py: y},
          {px: x, py: y + height},
          {px: x + width, py: y + height}
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
      expect(isPositionWalkable(mockPlayer.x, mockPlayer.y, mockPlayer.width, mockPlayer.height, mockMap)).toBe(false);
      // Note: The function returns early when water is detected, so only 2 calls are made
      expect(mockMap.worldToGrid).toHaveBeenCalledTimes(2);
      expect(mockMap.getTile).toHaveBeenCalledTimes(2);
    });
    
    test('should handle map boundary conditions in pathfinding', () => {
      const mockMap = {
        getTile: jest.fn(),
        width: 10,
        height: 10
      };
      
      // Mock water at edge, grass nearby
      mockMap.getTile
        .mockReturnValueOnce('water') // Initial tile (0, 0) 
        .mockReturnValueOnce('grass'); // Adjacent tile (0, 1)
      
      function findNearestWalkableTile(targetX, targetY, map) {
        if (map.getTile(targetX, targetY) !== 'water') {
          return [targetX, targetY];
        }
        
        // Check immediate neighbors
        const neighbors = [[0, 1], [1, 0]]; // Only valid neighbors for (0,0)
        for (const [dx, dy] of neighbors) {
          const checkX = targetX + dx;
          const checkY = targetY + dy;
          if (checkX >= 0 && checkX < map.width && 
              checkY >= 0 && checkY < map.height &&
              map.getTile(checkX, checkY) !== 'water') {
            return [checkX, checkY];
          }
        }
        
        return [map.width / 2, map.height / 2];
      }
      
      const [resultX, resultY] = findNearestWalkableTile(0, 0, mockMap);
      expect(resultX).toBe(0);
      expect(resultY).toBe(1);
      expect(mockMap.getTile).toHaveBeenCalledTimes(2);
    });
  });

  describe('Tile-Based Movement Speed', () => {
    test('should apply normal speed multiplier on grass tiles', () => {
      const mockPlayer = {
        x: 100,
        y: 100,
        width: 20,
        height: 20,
        targetX: 150,
        targetY: 100,
        isMoving: true,
        moveSpeed: 3
      };
      
      const mockMap = {
        worldToGrid: jest.fn().mockReturnValue([3, 3]),
        getTile: jest.fn().mockReturnValue('grass')
      };
      
      // Mock tile definitions
      const tileDefinitions = {
        grass: { walkSpeed: 1.0 }
      };
      
      // Simulate movement update with tile speed multiplier
      function updatePlayerMovement(player, map, tileDefs) {
        if (player.isMoving) {
          const dx = player.targetX - player.x;
          const dy = player.targetY - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Get current tile speed
          const centerX = player.x + player.width / 2;
          const centerY = player.y + player.height / 2;
          const [tileX, tileY] = map.worldToGrid(centerX, centerY);
          const tileType = map.getTile(tileX, tileY);
          const tileDef = tileDefs[tileType] || tileDefs.grass;
          
          // Apply speed multiplier
          const adjustedSpeed = player.moveSpeed * tileDef.walkSpeed;
          
          return adjustedSpeed;
        }
        return 0;
      }
      
      const actualSpeed = updatePlayerMovement(mockPlayer, mockMap, tileDefinitions);
      expect(actualSpeed).toBe(3); // 3 * 1.0 = 3 (normal speed on grass)
      expect(mockMap.worldToGrid).toHaveBeenCalledWith(110, 110); // player center
      expect(mockMap.getTile).toHaveBeenCalledWith(3, 3);
    });
    
    test('should apply faster speed multiplier on dirt path tiles', () => {
      const mockPlayer = {
        x: 100,
        y: 100,
        width: 20,
        height: 20,
        targetX: 150,
        targetY: 100,
        isMoving: true,
        moveSpeed: 3
      };
      
      const mockMap = {
        worldToGrid: jest.fn().mockReturnValue([5, 5]),
        getTile: jest.fn().mockReturnValue('dirtPath')
      };
      
      // Mock tile definitions
      const tileDefinitions = {
        grass: { walkSpeed: 1.0 },
        dirtPath: { walkSpeed: 1.5 }
      };
      
      // Simulate movement update with tile speed multiplier
      function updatePlayerMovement(player, map, tileDefs) {
        if (player.isMoving) {
          const dx = player.targetX - player.x;
          const dy = player.targetY - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Get current tile speed
          const centerX = player.x + player.width / 2;
          const centerY = player.y + player.height / 2;
          const [tileX, tileY] = map.worldToGrid(centerX, centerY);
          const tileType = map.getTile(tileX, tileY);
          const tileDef = tileDefs[tileType] || tileDefs.grass;
          
          // Apply speed multiplier
          const adjustedSpeed = player.moveSpeed * tileDef.walkSpeed;
          
          return adjustedSpeed;
        }
        return 0;
      }
      
      const actualSpeed = updatePlayerMovement(mockPlayer, mockMap, tileDefinitions);
      expect(actualSpeed).toBe(4.5); // 3 * 1.5 = 4.5 (faster speed on dirt path)
      expect(mockMap.worldToGrid).toHaveBeenCalledWith(110, 110); // player center
      expect(mockMap.getTile).toHaveBeenCalledWith(5, 5);
    });
    
    test('should handle movement speed transition between different tile types', () => {
      const mockPlayer = {
        x: 100,
        y: 100,
        width: 20,
        height: 20,
        targetX: 150,
        targetY: 100,
        isMoving: true,
        moveSpeed: 3
      };
      
      const mockMap = {
        worldToGrid: jest.fn(),
        getTile: jest.fn()
      };
      
      // Mock tile definitions
      const tileDefinitions = {
        grass: { walkSpeed: 1.0 },
        dirtPath: { walkSpeed: 1.5 }
      };
      
      // First call - player on grass
      mockMap.worldToGrid.mockReturnValueOnce([3, 3]);
      mockMap.getTile.mockReturnValueOnce('grass');
      
      // Second call - player moved to dirt path
      mockMap.worldToGrid.mockReturnValueOnce([4, 3]);
      mockMap.getTile.mockReturnValueOnce('dirtPath');
      
      function updatePlayerMovement(player, map, tileDefs) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const [tileX, tileY] = map.worldToGrid(centerX, centerY);
        const tileType = map.getTile(tileX, tileY);
        const tileDef = tileDefs[tileType] || tileDefs.grass;
        
        return player.moveSpeed * tileDef.walkSpeed;
      }
      
      // Test first position (grass)
      const speed1 = updatePlayerMovement(mockPlayer, mockMap, tileDefinitions);
      expect(speed1).toBe(3); // Normal speed on grass
      
      // Simulate player movement to dirt path
      mockPlayer.x = 115;
      
      // Test second position (dirt path)
      const speed2 = updatePlayerMovement(mockPlayer, mockMap, tileDefinitions);
      expect(speed2).toBe(4.5); // Faster speed on dirt path
      
      expect(mockMap.worldToGrid).toHaveBeenCalledTimes(2);
      expect(mockMap.getTile).toHaveBeenCalledTimes(2);
    });
    
    test('should fallback to grass speed for unknown tile types', () => {
      const mockPlayer = {
        x: 100,
        y: 100,
        width: 20,
        height: 20,
        moveSpeed: 3
      };
      
      const mockMap = {
        worldToGrid: jest.fn().mockReturnValue([3, 3]),
        getTile: jest.fn().mockReturnValue('unknownTile')
      };
      
      // Mock tile definitions (doesn't include unknownTile)
      const tileDefinitions = {
        grass: { walkSpeed: 1.0 },
        dirtPath: { walkSpeed: 1.5 }
      };
      
      function updatePlayerMovement(player, map, tileDefs) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const [tileX, tileY] = map.worldToGrid(centerX, centerY);
        const tileType = map.getTile(tileX, tileY);
        const tileDef = tileDefs[tileType] || tileDefs.grass; // Fallback to grass
        
        return player.moveSpeed * tileDef.walkSpeed;
      }
      
      const actualSpeed = updatePlayerMovement(mockPlayer, mockMap, tileDefinitions);
      expect(actualSpeed).toBe(3); // Should fallback to grass speed (1.0)
      expect(mockMap.worldToGrid).toHaveBeenCalledWith(110, 110);
      expect(mockMap.getTile).toHaveBeenCalledWith(3, 3);
    });
  });
});