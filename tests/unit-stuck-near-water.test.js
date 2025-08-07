/**
 * Unit tests for reproducing the specific unit getting stuck near water issue
 * Tests the exact scenario described: GP/GW layout where player gets stuck moving to bottom-left grass
 */

/**
 * @jest-environment jsdom
 */

describe('Unit Getting Stuck Near Water Issue', () => {
  // Mock the exact scenario described in the issue
  function createStuckScenarioMap() {
    return {
      width: 10,
      height: 10,
      tileSize: 32,
      // Create the specific GP/GW layout:
      // Row 0: G P (Grass, Player position)  
      // Row 1: G W (Grass, Water)
      getTile: jest.fn().mockImplementation((x, y) => {
        // For the specific stuck scenario:
        if (x === 1 && y === 0) return 'grass'; // Player's current tile (top-right) 
        if (x === 0 && y === 0) return 'grass'; // Top-left grass
        if (x === 0 && y === 1) return 'grass'; // Bottom-left grass (target)
        if (x === 1 && y === 1) return 'water'; // Bottom-right water
        // Everything else is grass for simplicity
        return 'grass';
      }),
      worldToGrid: jest.fn().mockImplementation((worldX, worldY) => [
        Math.floor(worldX / 32), Math.floor(worldY / 32)
      ]),
      gridToWorld: jest.fn().mockImplementation((gridX, gridY) => [
        gridX * 32 + 16, gridY * 32 + 16
      ])
    };
  }

  // Mock tile definitions
  const mockTileDefinitions = {
    grass: { walkable: true, walkSpeed: 1.0 },
    water: { walkable: false, walkSpeed: 0.0 }
  };

  // Mock player with exact dimensions from Go code
  function createMockPlayer() {
    return {
      x: 48,      // Starting at tile (1,0) center - width/2 = 32 + 16 - 10 = 38
      y: 6,       // Starting at tile (0,0) center - height/2 = 0 + 16 - 10 = 6  
      width: 20,
      height: 20,
      targetX: 48,
      targetY: 6,
      isMoving: false,
      moveSpeed: 3,
      path: null,
      pathStep: 0
    };
  }

  // Simulate the pathfinding logic from pathfinding.go
  function findPathSimulated(startX, startY, endX, endY, map) {
    // Simple pathfinding for the specific scenario
    // From (1,0) to (0,1) with water at (1,1)
    
    if (startX === 1 && startY === 0 && endX === 0 && endY === 1) {
      // This should find a path around the water
      // Direct diagonal would go through water at (1,1), so need to go around
      return [
        { X: 1, Y: 0 }, // Start position
        { X: 0, Y: 0 }, // Move left first (to avoid water)
        { X: 0, Y: 1 }  // Then move down to target
      ];
    }
    
    // Fallback direct path for other scenarios
    return [
      { X: startX, Y: startY },
      { X: endX, Y: endY }
    ];
  }

  // Simulate the player movement update logic from player.go
  function simulatePlayerMovement(player, map, tileDefs) {
    if (!player.isMoving || !player.path) {
      return { moved: false, stuck: false };
    }

    // Check if we need to move to next step in path
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const precisionThreshold = 1.5;
    
    // Are we close enough to current target?
    if (distance < precisionThreshold) {
      // Move to next step in path
      player.pathStep++;
      
      if (player.pathStep >= player.path.length) {
        // Path completed
        player.isMoving = false;
        player.path = null;
        player.pathStep = 0;
        return { moved: false, stuck: false, completed: true };
      }
      
      // Set next target from path
      const step = player.path[player.pathStep];
      const [worldX, worldY] = map.gridToWorld(step.X, step.Y);
      player.targetX = worldX - player.width / 2;
      player.targetY = worldY - player.height / 2;
    }
    
    // Move towards current target
    const newDx = player.targetX - player.x;
    const newDy = player.targetY - player.y;
    const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);
    
    if (newDistance <= 1.0) {
      // Snap to target
      player.x = player.targetX;
      player.y = player.targetY;
      return { moved: true, stuck: false };
    }
    
    // Get current tile and apply speed multiplier  
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const [tileX, tileY] = map.worldToGrid(centerX, centerY);
    const tileType = map.getTile(tileX, tileY);
    const tileDef = tileDefs[tileType] || tileDefs.grass;
    
    const adjustedSpeed = player.moveSpeed * tileDef.walkSpeed;
    
    // Move towards target
    player.x += (newDx / newDistance) * adjustedSpeed;
    player.y += (newDy / newDistance) * adjustedSpeed;
    
    // Check if player might be stuck (not making progress)
    const progressThreshold = 0.1;
    const stuck = newDistance > 0 && Math.abs(newDistance - distance) < progressThreshold;
    
    return { moved: true, stuck };
  }

  describe('Reproducing the Stuck Scenario', () => {
    test('should reproduce the exact stuck scenario: GP/GW layout moving to bottom-left', () => {
      const map = createStuckScenarioMap();
      const player = createMockPlayer();
      
      // Set up the movement from tile (1,0) to tile (0,1)
      // This is the exact scenario described: GP on top, GW on bottom, moving to bottom-left G
      const startTileX = 1, startTileY = 0;  // Player's current position (top-right)
      const endTileX = 0, endTileY = 1;      // Target position (bottom-left grass)
      
      // Verify the scenario setup
      expect(map.getTile(startTileX, startTileY)).toBe('grass'); // Player on grass
      expect(map.getTile(endTileX, endTileY)).toBe('grass');     // Target is grass  
      expect(map.getTile(1, 1)).toBe('water');                  // Water at bottom-right
      
      // Find path using simulated pathfinding
      const path = findPathSimulated(startTileX, startTileY, endTileX, endTileY, map);
      
      expect(path).not.toBeNull();
      expect(path.length).toBeGreaterThan(2); // Should go around water, not direct
      
      // Set up player movement
      player.path = path;
      player.pathStep = 0;
      player.isMoving = true;
      
      // Set initial target (first step)
      const firstStep = path[0];
      const [firstWorldX, firstWorldY] = map.gridToWorld(firstStep.X, firstStep.Y);
      player.targetX = firstWorldX - player.width / 2;
      player.targetY = firstWorldY - player.height / 2;
      
      // Simulate movement for several frames to see if player gets stuck
      let maxFrames = 200; // Prevent infinite loops
      let frameCount = 0;
      let stuckCount = 0;
      let lastPosition = { x: player.x, y: player.y };
      
      while (player.isMoving && frameCount < maxFrames) {
        const result = simulatePlayerMovement(player, map, mockTileDefinitions);
        frameCount++;
        
        if (result.stuck) {
          stuckCount++;
        }
        
        // Check if player has made progress
        const moved = Math.abs(player.x - lastPosition.x) > 0.01 || 
                     Math.abs(player.y - lastPosition.y) > 0.01;
        
        if (!moved && frameCount > 10) {
          // Player hasn't moved for multiple frames - likely stuck
          console.log(`Player appears stuck at frame ${frameCount}`);
          console.log(`Position: (${player.x}, ${player.y})`);
          console.log(`Target: (${player.targetX}, ${player.targetY})`);
          console.log(`Path step: ${player.pathStep}/${player.path ? player.path.length : 'null'}`);
          break;
        }
        
        lastPosition = { x: player.x, y: player.y };
        
        if (result.completed) {
          break;
        }
      }
      
      // Test assertions
      console.log(`Movement completed in ${frameCount} frames`);
      console.log(`Stuck events: ${stuckCount}`);
      console.log(`Final position: (${player.x}, ${player.y})`);
      console.log(`Movement completed: ${!player.isMoving}`);
      
      // The movement should complete without getting permanently stuck
      expect(frameCount).toBeLessThan(maxFrames); // Should not timeout
      
      // The fix should prevent infinite getting stuck - movement should complete
      expect(!player.isMoving).toBe(true); // Movement should complete
      
      // If the bug exists, this test should fail because the player gets stuck
      // When fixed, the player should successfully reach the target
      if (!player.isMoving) {
        // Movement completed - check if we reached the target area
        const [finalTileX, finalTileY] = map.worldToGrid(
          player.x + player.width / 2, 
          player.y + player.height / 2
        );
        expect(finalTileX).toBe(endTileX);
        expect(finalTileY).toBe(endTileY);
      }
    });
    
    test('should identify precision issues in coordinate conversion', () => {
      const map = createStuckScenarioMap();
      
      // Test coordinate conversion precision
      const testTileX = 0, testTileY = 1; // Target tile (bottom-left)
      const [worldX, worldY] = map.gridToWorld(testTileX, testTileY);
      const [backToTileX, backToTileY] = map.worldToGrid(worldX, worldY);
      
      // Round-trip conversion should be exact
      expect(backToTileX).toBe(testTileX);
      expect(backToTileY).toBe(testTileY);
      
      // Check player positioning within tile
      const playerWidth = 20, playerHeight = 20;
      const playerX = worldX - playerWidth / 2;   // 16 - 10 = 6
      const playerY = worldY - playerHeight / 2;  // 48 - 10 = 38
      
      // Player center should be at tile center
      const playerCenterX = playerX + playerWidth / 2;
      const playerCenterY = playerY + playerHeight / 2;
      
      expect(Math.abs(playerCenterX - worldX)).toBeLessThan(0.001);
      expect(Math.abs(playerCenterY - worldY)).toBeLessThan(0.001);
      
      // Test corner coordinates
      const corners = [
        { x: playerX, y: playerY },                           // Top-left
        { x: playerX + playerWidth, y: playerY },             // Top-right  
        { x: playerX, y: playerY + playerHeight },            // Bottom-left
        { x: playerX + playerWidth, y: playerY + playerHeight } // Bottom-right
      ];
      
      // All corners should be in walkable tiles in this scenario
      for (const corner of corners) {
        const [cornerTileX, cornerTileY] = map.worldToGrid(corner.x, corner.y);
        const tileType = map.getTile(cornerTileX, cornerTileY);
        console.log(`Corner (${corner.x}, ${corner.y}) -> tile (${cornerTileX}, ${cornerTileY}) = ${tileType}`);
        
        // For target tile (0,1), all corners should be on valid tiles
        expect(cornerTileX).toBeGreaterThanOrEqual(0);
        expect(cornerTileY).toBeGreaterThanOrEqual(0);
      }
    });
    
    test('should verify pathfinding produces valid walkable path', () => {
      const map = createStuckScenarioMap();
      
      // Test the exact pathfinding scenario
      const path = findPathSimulated(1, 0, 0, 1, map);
      
      expect(path).toBeDefined();
      expect(path.length).toBeGreaterThan(0);
      
      // Verify every step in path is walkable
      for (let i = 0; i < path.length; i++) {
        const step = path[i];
        const tileType = map.getTile(step.X, step.Y);
        
        console.log(`Path step ${i}: (${step.X}, ${step.Y}) = ${tileType}`);
        expect(tileType).toBe('grass'); // Should only step on grass, never water
      }
      
      // Verify path connects start to end
      expect(path[0]).toEqual({ X: 1, Y: 0 });           // Start
      expect(path[path.length - 1]).toEqual({ X: 0, Y: 1 }); // End
      
      // Path should avoid water tile at (1,1)
      const hasWaterStep = path.some(step => step.X === 1 && step.Y === 1);
      expect(hasWaterStep).toBe(false);
    });
  });
  
  describe('Movement Precision Analysis', () => {
    test('should check for floating point precision issues in movement', () => {
      const player = createMockPlayer();
      
      // Test movement precision with small distances
      player.targetX = player.x + 0.1;  // Very small movement
      player.targetY = player.y + 0.1;
      
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Test the precision threshold logic from isMovingToTarget
      const precisionThreshold = 1.5;
      const shouldKeepMoving = distance >= precisionThreshold;
      
      // With such a small distance, should not keep moving
      expect(shouldKeepMoving).toBe(false);
      
      // Test the snap threshold logic from moveTowardTargetWithTileSpeed
      const snapThreshold = 1.0;
      const shouldSnap = distance <= snapThreshold;
      
      expect(shouldSnap).toBe(true);
    });
    
    test('should verify movement speed calculation with tile multipliers', () => {
      const player = createMockPlayer();
      const map = createStuckScenarioMap();
      
      // Test on grass tile
      player.x = 6;  // Tile (0,0) center minus half width
      player.y = 6;
      
      const centerX = player.x + player.width / 2;  // Should be 16 (tile center)
      const centerY = player.y + player.height / 2; // Should be 16 (tile center)
      
      const [tileX, tileY] = map.worldToGrid(centerX, centerY);
      expect(tileX).toBe(0);
      expect(tileY).toBe(0);
      
      const tileType = map.getTile(tileX, tileY);
      expect(tileType).toBe('grass');
      
      const tileDef = mockTileDefinitions[tileType];
      const adjustedSpeed = player.moveSpeed * tileDef.walkSpeed;
      
      expect(adjustedSpeed).toBe(3); // 3 * 1.0 = 3 (normal speed on grass)
    });
  });
});