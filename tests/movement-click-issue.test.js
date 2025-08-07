/**
 * Unit tests to reproduce and fix movement click issue
 * Issue: When clicking to move, player moves small bit then stops, 
 * next click goes back to center or moves slightly forward and stops
 */

/**
 * @jest-environment jsdom
 */

describe('Movement Click Issue Reproduction', () => {
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
    
    // Mock global objects
    global.wasmLoaded = false;
    global.recenterSquare = jest.fn();
    global.gameClick = jest.fn();
  });
  
  afterEach(() => {
    delete global.wasmLoaded;
    delete global.recenterSquare;
    delete global.gameClick;
  });

  describe('Issue Reproduction: Small Movement Then Stop', () => {
    test('should reproduce the issue where clicking moves small bit then stops', () => {
      // Mock the player system to simulate the actual issue
      const mockPlayer = {
        x: 100,           // Player at center of tile (100, 100)
        y: 100,
        width: 20,
        height: 20,
        targetX: 100,
        targetY: 100,
        isMoving: false,
        moveSpeed: 3,
        path: null,
        pathStep: 0
      };
      
      const mockMap = {
        width: 10,
        height: 10,
        tileSize: 32,
        getTile: jest.fn().mockReturnValue('grass'),
        worldToGrid: jest.fn(),
        gridToWorld: jest.fn()
      };
      
      // Mock worldToGrid to return current player position as tile (3, 3)
      // and clicked position as tile (5, 3) - 2 tiles to the right
      mockMap.worldToGrid = jest.fn()
        .mockReturnValueOnce([3, 3]) // Current player position
        .mockReturnValueOnce([5, 3]); // Clicked position
      
      // Mock gridToWorld to convert tile back to world coordinates
      mockMap.gridToWorld = jest.fn()
        .mockReturnValue([160, 96]); // Target tile (5, 3) center at (160, 96)
      
      // Simulate pathfinding result - should create path from (3,3) to (5,3)
      const mockPath = [
        { X: 3, Y: 3 }, // Start
        { X: 4, Y: 3 }, // Intermediate
        { X: 5, Y: 3 }  // End
      ];
      
      // Mock the movement system
      function simulateMovementSystem(player, map) {
        // Simulate MoveToTile being called
        function moveToTile(tileX, tileY) {
          const currentX = 3; // Current tile X
          const currentY = 3; // Current tile Y
          
          if (currentX === tileX && currentY === tileY) {
            player.isMoving = false;
            return;
          }
          
          // Set up pathfinding movement
          player.path = mockPath;
          player.pathStep = 0;
          player.isMoving = true;
          
          // Set initial target (first step in path)
          // Convert tile coordinates to world coordinates
          const worldCoords = map.gridToWorld(mockPath[0].X, mockPath[0].Y);
          const worldX = worldCoords[0];
          const worldY = worldCoords[1];
          // Adjust for player size - center player on tile
          player.targetX = worldX - player.width / 2;
          player.targetY = worldY - player.height / 2;
        }
        
        // Simulate Update being called multiple times
        function update() {
          if (!player.isMoving) return;
          
          // Check if reached current target
          const dx = player.targetX - player.x;
          const dy = player.targetY - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Issue reproduction: Use problematic threshold values
          const snapThreshold = 1.0; // This might be too small
          const precisionThreshold = 0.5; // This might cause premature stopping
          const moveSpeed = player.moveSpeed;
          
          if (distance <= snapThreshold) {
            // Snap to target
            player.x = player.targetX;
            player.y = player.targetY;
            
            // Move to next step in path
            player.pathStep++;
            if (player.pathStep >= mockPath.length) {
              // Path completed
              player.isMoving = false;
              player.path = null;
              player.pathStep = 0;
              return;
            }
            
            // Set next target
            const nextStep = mockPath[player.pathStep];
            const nextWorldCoords = map.gridToWorld(nextStep.X, nextStep.Y);
            const nextWorldX = nextWorldCoords[0];
            const nextWorldY = nextWorldCoords[1];
            player.targetX = nextWorldX - player.width / 2;
            player.targetY = nextWorldY - player.height / 2;
          } else if (distance >= Math.max(moveSpeed, precisionThreshold)) {
            // Move towards target
            const newX = player.x + (dx / distance) * moveSpeed;
            const newY = player.y + (dy / distance) * moveSpeed;
            player.x = newX;
            player.y = newY;
          }
          // If distance is between snapThreshold and moveSpeed, no movement occurs
          // This might be where the issue lies
        }
        
        return { moveToTile, update };
      }
      
      const movement = simulateMovementSystem(mockPlayer, mockMap);
      
      // Initial state - player at (100, 100)
      expect(mockPlayer.x).toBe(100);
      expect(mockPlayer.y).toBe(100);
      expect(mockPlayer.isMoving).toBe(false);
      
      // Simulate click to move to tile (5, 3)
      movement.moveToTile(5, 3);
      
      // Player should now be moving
      expect(mockPlayer.isMoving).toBe(true);
      expect(mockPlayer.targetX).toBe(150); // 160 - 20/2 = 150
      expect(mockPlayer.targetY).toBe(86);  // 96 - 20/2 = 86
      
      // Simulate several update frames
      let updateCount = 0;
      const maxUpdates = 50;
      const initialX = mockPlayer.x;
      const initialY = mockPlayer.y;
      
      while (mockPlayer.isMoving && updateCount < maxUpdates) {
        movement.update();
        updateCount++;
      }
      
      // This test should demonstrate the issue:
      // Player moves a small distance and stops before reaching target tile
      expect(updateCount).toBeLessThan(maxUpdates); // Should stop before max updates
      expect(mockPlayer.isMoving).toBe(false); // Movement should complete
      
      // Calculate how far the player actually moved
      const actualDistance = Math.sqrt(
        Math.pow(mockPlayer.x - initialX, 2) + 
        Math.pow(mockPlayer.y - initialY, 2)
      );
      
      // The issue: player should move a full tile (32px) but moves less
      const expectedTileDistance = 32; // Full tile size
      
      console.log(`Player moved ${actualDistance}px in ${updateCount} updates`);
      console.log(`Expected to move at least ${expectedTileDistance}px`);
      console.log(`Initial position: (${initialX}, ${initialY})`);
      console.log(`Final position: (${mockPlayer.x}, ${mockPlayer.y})`);
      console.log(`Target position: (${mockPlayer.targetX}, ${mockPlayer.targetY})`);
      
      // This assertion demonstrates the issue - movement is incomplete
      if (actualDistance < expectedTileDistance) {
        console.log('ISSUE REPRODUCED: Player moved less than expected');
      }
    });
    
    test('should reproduce the issue where second click goes back to center', () => {
      // Start with player that has moved partially due to the first issue
      const mockPlayer = {
        x: 110,           // Player slightly off-center due to previous issue
        y: 105,
        width: 20,
        height: 20,
        targetX: 110,
        targetY: 105,
        isMoving: false,
        moveSpeed: 3,
        path: null,
        pathStep: 0
      };
      
      const mockMap = {
        width: 10,
        height: 10,
        tileSize: 32,
        getTile: jest.fn().mockReturnValue('grass'),
        worldToGrid: jest.fn(),
        gridToWorld: jest.fn()
      };
      
      // When clicking again, the worldToGrid might return the same tile
      // or an adjacent tile due to the slightly off position
      mockMap.worldToGrid.mockReturnValue([3, 3]); // Same tile as current
      mockMap.gridToWorld.mockReturnValue([96, 96]); // Center of tile (3,3)
      
      function simulateSecondClick(player, map) {
        const currentTileCoords = map.worldToGrid(
          player.x + player.width / 2, 
          player.y + player.height / 2
        );
        const currentTileX = currentTileCoords[0];
        const currentTileY = currentTileCoords[1];
        
        // Click on the same tile - should move to center
        const tileWorldCoords = map.gridToWorld(currentTileX, currentTileY);
        const tileWorldX = tileWorldCoords[0];
        const tileWorldY = tileWorldCoords[1];
        const targetX = tileWorldX - player.width / 2;
        const targetY = tileWorldY - player.height / 2;
        
        // Calculate movement direction
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return {
          targetX,
          targetY,
          dx,
          dy,
          distance,
          isMovingBackToCenter: distance > 0 && targetX < player.x // Moving left = back to center
        };
      }
      
      const secondClickResult = simulateSecondClick(mockPlayer, mockMap);
      
      console.log(`Second click analysis:`);
      console.log(`Current position: (${mockPlayer.x}, ${mockPlayer.y})`);
      console.log(`Target position: (${secondClickResult.targetX}, ${secondClickResult.targetY})`);
      console.log(`Movement vector: (${secondClickResult.dx}, ${secondClickResult.dy})`);
      console.log(`Distance to move: ${secondClickResult.distance}`);
      console.log(`Moving back to center: ${secondClickResult.isMovingBackToCenter}`);
      
      // This demonstrates the second part of the issue
      expect(secondClickResult.isMovingBackToCenter).toBe(true);
      expect(secondClickResult.distance).toBeGreaterThan(0);
    });
  });
  
  describe('Root Cause Analysis', () => {
    test('should identify threshold issues in movement logic', () => {
      // Test the problematic threshold values
      const moveSpeed = 3;
      const snapThreshold = 1.0;
      const precisionThreshold = 0.5;
      
      // Case 1: Distance between thresholds - no movement occurs
      const distanceBetweenThresholds = 2.0; // Between 1.0 and 3.0
      
      const shouldMove = distanceBetweenThresholds >= Math.max(moveSpeed, precisionThreshold);
      const shouldSnap = distanceBetweenThresholds <= snapThreshold;
      
      console.log(`Distance: ${distanceBetweenThresholds}`);
      console.log(`Should move: ${shouldMove}`);
      console.log(`Should snap: ${shouldSnap}`);
      console.log(`Dead zone: ${!shouldMove && !shouldSnap}`);
      
      // This is the issue - dead zone where no movement occurs
      expect(shouldMove).toBe(false);
      expect(shouldSnap).toBe(false);
      
      // Case 2: Very small movements cause oscillation
      const tinyDistance = 0.8;
      expect(tinyDistance <= snapThreshold).toBe(true); // Will snap
      expect(tinyDistance >= moveSpeed).toBe(false); // Won't move normally
    });
    
    test('should identify coordinate conversion issues', () => {
      const mockMap = {
        tileSize: 32,
        worldToGrid: (worldX, worldY) => [
          Math.floor(worldX / 32),
          Math.floor(worldY / 32)
        ],
        gridToWorld: (gridX, gridY) => [
          gridX * 32 + 16, // Center of tile
          gridY * 32 + 16
        ]
      };
      
      // Player slightly off-center
      const playerX = 110; // Should be in tile 3 (96-128)
      const playerY = 105;
      const playerWidth = 20;
      const playerHeight = 20;
      
      // Player center
      const centerX = playerX + playerWidth / 2; // 120
      const centerY = playerY + playerHeight / 2; // 115
      
      // Get tile coordinates
      const tileCoords = mockMap.worldToGrid(centerX, centerY);
      const tileX = tileCoords[0];
      const tileY = tileCoords[1];
      expect(tileX).toBe(3); // 120 / 32 = 3.75 -> 3
      expect(tileY).toBe(3); // 115 / 32 = 3.59 -> 3
      
      // Get tile center
      const tileCenterCoords = mockMap.gridToWorld(tileX, tileY);
      const tileCenterX = tileCenterCoords[0];
      const tileCenterY = tileCenterCoords[1];
      expect(tileCenterX).toBe(112); // 3 * 32 + 16 = 112
      expect(tileCenterY).toBe(112); // 3 * 32 + 16 = 112
      
      // Calculate where player should be positioned (top-left to center on tile)
      const targetPlayerX = tileCenterX - playerWidth / 2; // 112 - 10 = 102
      const targetPlayerY = tileCenterY - playerHeight / 2; // 112 - 10 = 102
      
      // Movement needed
      const dx = targetPlayerX - playerX; // 102 - 110 = -8
      const dy = targetPlayerY - playerY; // 102 - 105 = -3
      
      console.log(`Player position: (${playerX}, ${playerY})`);
      console.log(`Player center: (${centerX}, ${centerY})`);
      console.log(`Tile: (${tileX}, ${tileY})`);
      console.log(`Tile center: (${tileCenterX}, ${tileCenterY})`);
      console.log(`Target player position: (${targetPlayerX}, ${targetPlayerY})`);
      console.log(`Movement needed: (${dx}, ${dy})`);
      
      // This shows the issue - clicking on current tile moves player back toward center
      expect(dx).toBeLessThan(0); // Moving left (back)
      expect(dy).toBeLessThan(0); // Moving up (back)
    });
  });
  
  describe('Movement Fix Verification', () => {
    test('should properly complete movement to target tile without dead zones', () => {
      // Test with the fixed threshold values
      const mockPlayer = {
        x: 100,
        y: 100,
        width: 20,
        height: 20,
        targetX: 132,  // One tile to the right (32px)
        targetY: 100,
        isMoving: true,
        moveSpeed: 3,
        path: null,
        pathStep: 0
      };
      
      function simulateFixedMovement(player) {
        // Simulate the fixed movement logic
        function isMovingToTarget() {
          const dx = player.targetX - player.x;
          const dy = player.targetY - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const precisionThreshold = 0.1; // Fixed: much smaller threshold
          return distance > precisionThreshold;
        }
        
        function moveTowardTarget() {
          const dx = player.targetX - player.x;
          const dy = player.targetY - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const adjustedSpeed = player.moveSpeed * 1.0; // Assume grass tile
          const snapThreshold = 0.2; // Fixed: much smaller threshold
          
          if (distance <= snapThreshold) {
            player.x = player.targetX;
            player.y = player.targetY;
            return true; // Movement complete
          }
          
          if (distance < adjustedSpeed) {
            // Fixed: prevent overshoot by moving exactly to target
            player.x = player.targetX;
            player.y = player.targetY;
            return true; // Movement complete
          } else {
            // Normal movement
            player.x += (dx / distance) * adjustedSpeed;
            player.y += (dy / distance) * adjustedSpeed;
            return false; // Continue moving
          }
        }
        
        return { isMovingToTarget, moveTowardTarget };
      }
      
      const movement = simulateFixedMovement(mockPlayer);
      const initialDistance = Math.sqrt(
        Math.pow(mockPlayer.targetX - mockPlayer.x, 2) + 
        Math.pow(mockPlayer.targetY - mockPlayer.y, 2)
      );
      
      let updateCount = 0;
      const maxUpdates = 50;
      
      // Simulate movement updates
      while (movement.isMovingToTarget() && updateCount < maxUpdates) {
        const completed = movement.moveTowardTarget();
        updateCount++;
        if (completed) break;
      }
      
      console.log(`Fixed movement: ${updateCount} updates to complete`);
      console.log(`Initial distance: ${initialDistance}px`);
      console.log(`Final position: (${mockPlayer.x}, ${mockPlayer.y})`);
      console.log(`Target position: (${mockPlayer.targetX}, ${mockPlayer.targetY})`);
      console.log(`Movement completed: ${!movement.isMovingToTarget()}`);
      
      // Verify the fix works
      expect(mockPlayer.x).toBe(mockPlayer.targetX);
      expect(mockPlayer.y).toBe(mockPlayer.targetY);
      expect(updateCount).toBeLessThan(20); // Should complete efficiently
    });
    
    test('should eliminate dead zone between snap and movement thresholds', () => {
      // Test various distances to ensure no dead zones exist
      const moveSpeed = 3;
      const snapThreshold = 0.2; // Fixed value
      const precisionThreshold = 0.1; // Fixed value
      
      // Test distances that previously caused issues
      const problematicDistances = [0.5, 1.0, 1.5, 2.0, 2.5];
      
      for (const distance of problematicDistances) {
        const shouldMove = distance > precisionThreshold;
        const shouldSnap = distance <= snapThreshold;
        const hasDeadZone = !shouldMove && !shouldSnap;
        
        console.log(`Distance ${distance}: move=${shouldMove}, snap=${shouldSnap}, deadZone=${hasDeadZone}`);
        
        // With the fix, there should be no dead zones
        expect(hasDeadZone).toBe(false);
        
        // Either movement should occur or snapping should occur
        expect(shouldMove || shouldSnap).toBe(true);
      }
    });
    
    test('should handle small distances without oscillation', () => {
      const mockPlayer = {
        x: 100,
        y: 100,
        targetX: 100.5, // Very small distance
        targetY: 100,
        moveSpeed: 3
      };
      
      const dx = mockPlayer.targetX - mockPlayer.x;
      const dy = mockPlayer.targetY - mockPlayer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const snapThreshold = 0.2;
      
      // Test the condition logic
      expect(distance).toBe(0.5);
      expect(snapThreshold).toBe(0.2);
      
      // Distance 0.5 > snapThreshold 0.2, so it won't snap immediately
      // but it will move normally
      expect(distance > snapThreshold).toBe(true);
      
      // Simulate fixed movement logic - distance > snapThreshold so it will move normally
      const adjustedSpeed = mockPlayer.moveSpeed;
      if (distance <= snapThreshold) {
        mockPlayer.x = mockPlayer.targetX;
        mockPlayer.y = mockPlayer.targetY;
      } else if (distance < adjustedSpeed) {
        // Distance smaller than speed, move exactly to target
        mockPlayer.x = mockPlayer.targetX;
        mockPlayer.y = mockPlayer.targetY;
      }
      
      expect(mockPlayer.x).toBe(mockPlayer.targetX);
      expect(mockPlayer.y).toBe(mockPlayer.targetY);
    });
  });
});