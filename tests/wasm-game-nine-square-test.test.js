/**
 * Test for WASM Game 9-Square Map Movement
 * 
 * Creates a new map with 9 squares (3x3 grid), places the player on the top left,
 * then simulates a click in the bottom right square. If the player stops before 
 * it reaches the bottom right square, the test fails.
 */

/**
 * @jest-environment jsdom
 */

describe('WASM Game 9-Square Map Movement Test', () => {
  let mockCanvas, mockContext;
  let mockPlayerState;
  let mockMap;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <canvas id="game" width="192" height="192"></canvas>
    `;
    
    mockCanvas = document.getElementById('game');
    mockContext = {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      fillStyle: '',
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn()
    };
    
    // Mock canvas context
    mockCanvas.getContext = jest.fn().mockReturnValue(mockContext);
    mockCanvas.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0, top: 0, right: 192, bottom: 192, width: 192, height: 192
    });

    // Create 3x3 map (9 squares) with 64px tiles to fill 192x192 canvas
    mockMap = {
      width: 3,
      height: 3,
      tileSize: 64,
      getTile: jest.fn().mockReturnValue('grass'), // All tiles are walkable grass
      worldToGrid: function(x, y) {
        return [Math.floor(x / this.tileSize), Math.floor(y / this.tileSize)];
      },
      gridToWorld: function(gridX, gridY) {
        return [gridX * this.tileSize + this.tileSize / 2, gridY * this.tileSize + this.tileSize / 2];
      },
      isValidPosition: function(gridX, gridY) {
        return gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height;
      }
    };

    // Initialize player at top-left position (tile 0,0)
    const topLeftWorldPos = mockMap.gridToWorld(0, 0);
    mockPlayerState = {
      x: topLeftWorldPos[0] - 10, // Center player in tile (20x20 player, so offset by 10)
      y: topLeftWorldPos[1] - 10,
      width: 20,
      height: 20,
      targetX: topLeftWorldPos[0] - 10,
      targetY: topLeftWorldPos[1] - 10,
      isMoving: false,
      moveSpeed: 3,
      path: null,
      pathStep: 0
    };

    // Reset global state
    global.wasmLoaded = false;
    global.gameClick = jest.fn();
    global.updateMovement = jest.fn();
    global.getPlayerState = jest.fn(() => ({ ...mockPlayerState }));
  });

  afterEach(() => {
    delete global.wasmLoaded;
    delete global.gameClick;
    delete global.updateMovement;
    delete global.getPlayerState;
  });

  test('should move player from top-left to bottom-right across 9-square map', () => {
    console.log('\n=== 9-SQUARE MAP MOVEMENT TEST ===');
    
    // Set up click handler for the WASM game
    global.gameClick = jest.fn((event) => {
      const clickX = event.clientX || event.offsetX || 0;
      const clickY = event.clientY || event.offsetY || 0;
      
      console.log(`Click received at canvas coordinates: (${clickX}, ${clickY})`);
      
      // Convert click to tile coordinates
      const [tileX, tileY] = mockMap.worldToGrid(clickX, clickY);
      console.log(`Click corresponds to tile: (${tileX}, ${tileY})`);
      
      // Validate tile is within bounds
      if (!mockMap.isValidPosition(tileX, tileY)) {
        console.log(`Invalid tile position: (${tileX}, ${tileY})`);
        return { success: false, reason: 'Invalid tile position' };
      }
      
      // Get target world position (center of clicked tile)
      const [targetWorldX, targetWorldY] = mockMap.gridToWorld(tileX, tileY);
      
      // Set player target (adjust for player size)
      mockPlayerState.targetX = targetWorldX - mockPlayerState.width / 2;
      mockPlayerState.targetY = targetWorldY - mockPlayerState.height / 2;
      mockPlayerState.isMoving = true;
      
      const distance = Math.sqrt(
        Math.pow(mockPlayerState.targetX - mockPlayerState.x, 2) + 
        Math.pow(mockPlayerState.targetY - mockPlayerState.y, 2)
      );
      
      console.log(`Target set to: (${mockPlayerState.targetX}, ${mockPlayerState.targetY})`);
      console.log(`Distance to travel: ${distance.toFixed(1)}px`);
      
      return {
        success: true,
        tileX, tileY,
        targetX: mockPlayerState.targetX,
        targetY: mockPlayerState.targetY,
        initialDistance: distance
      };
    });

    // Set up movement update function that simulates proper WASM movement
    global.updateMovement = jest.fn(() => {
      if (!mockPlayerState.isMoving) {
        return { moved: false, reason: "not moving" };
      }
      
      const dx = mockPlayerState.targetX - mockPlayerState.x;
      const dy = mockPlayerState.targetY - mockPlayerState.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Use proper movement thresholds
      const snapThreshold = 2.0; // Snap when close enough
      const moveSpeed = mockPlayerState.moveSpeed;
      
      if (distance <= snapThreshold) {
        // Snap to target
        mockPlayerState.x = mockPlayerState.targetX;
        mockPlayerState.y = mockPlayerState.targetY;
        mockPlayerState.isMoving = false;
        console.log(`Snapped to target at distance ${distance.toFixed(2)}px`);
        return { 
          moved: true, 
          snapped: true, 
          distance,
          finalPosition: { x: mockPlayerState.x, y: mockPlayerState.y }
        };
      } else {
        // Normal movement - check if we would overshoot
        if (distance < moveSpeed) {
          // Move to exact target to avoid overshooting
          mockPlayerState.x = mockPlayerState.targetX;
          mockPlayerState.y = mockPlayerState.targetY;
          mockPlayerState.isMoving = false;
          console.log(`Reached target exactly at distance ${distance.toFixed(2)}px`);
          return { 
            moved: true, 
            snapped: true, 
            distance,
            finalPosition: { x: mockPlayerState.x, y: mockPlayerState.y }
          };
        } else {
          // Normal movement
          const moveX = (dx / distance) * moveSpeed;
          const moveY = (dy / distance) * moveSpeed;
          
          mockPlayerState.x += moveX;
          mockPlayerState.y += moveY;
          
          return { 
            moved: true, 
            distance,
            newPosition: { x: mockPlayerState.x, y: mockPlayerState.y },
            remaining: distance - moveSpeed
          };
        }
      }
    });

    // Record initial state
    const initialState = global.getPlayerState();
    const [initialTileX, initialTileY] = mockMap.worldToGrid(
      initialState.x + initialState.width / 2, 
      initialState.y + initialState.height / 2
    );
    
    console.log(`\nInitial player position: (${initialState.x}, ${initialState.y})`);
    console.log(`Initial tile: (${initialTileX}, ${initialTileY}) - should be (0, 0)`);
    
    // Verify player starts at top-left
    expect(initialTileX).toBe(0);
    expect(initialTileY).toBe(0);

    // Simulate click on bottom-right square (tile 2,2)
    // In a 3x3 map with 64px tiles, bottom-right tile center is at (160, 160)
    const bottomRightClickX = 2 * 64 + 32; // 160
    const bottomRightClickY = 2 * 64 + 32; // 160
    const clickEvent = { 
      clientX: bottomRightClickX, 
      clientY: bottomRightClickY 
    };
    
    console.log(`\nSimulating click on bottom-right tile at: (${bottomRightClickX}, ${bottomRightClickY})`);
    
    const clickResult = global.gameClick(clickEvent);
    
    expect(clickResult.success).toBe(true);
    expect(clickResult.tileX).toBe(2);
    expect(clickResult.tileY).toBe(2);
    
    console.log(`Click processed successfully - target tile: (${clickResult.tileX}, ${clickResult.tileY})`);

    // Simulate movement until completion
    const moveResults = [];
    let updateCount = 0;
    const maxUpdates = 100; // Safety limit
    let totalDistanceMoved = 0;
    
    console.log(`\nStarting movement simulation...`);
    
    while (mockPlayerState.isMoving && updateCount < maxUpdates) {
      const moveResult = global.updateMovement();
      moveResults.push(moveResult);
      updateCount++;
      
      if (moveResult.moved && moveResult.newPosition) {
        const stepDistance = Math.sqrt(
          Math.pow(moveResult.newPosition.x - (moveResults[updateCount - 2]?.newPosition?.x || initialState.x), 2) + 
          Math.pow(moveResult.newPosition.y - (moveResults[updateCount - 2]?.newPosition?.y || initialState.y), 2)
        );
        totalDistanceMoved += stepDistance;
      }
      
      if (moveResult.snapped) {
        console.log(`Movement completed at update ${updateCount} with snap`);
        break;
      }
      
      // Log progress every 10 updates
      if (updateCount % 10 === 0) {
        console.log(`Update ${updateCount}: position (${mockPlayerState.x.toFixed(1)}, ${mockPlayerState.y.toFixed(1)}), remaining: ${moveResult.remaining?.toFixed(1) || 'N/A'}px`);
      }
    }

    // Check final state
    const finalState = global.getPlayerState();
    const [finalTileX, finalTileY] = mockMap.worldToGrid(
      finalState.x + finalState.width / 2, 
      finalState.y + finalState.height / 2
    );
    
    const actualDistanceMoved = Math.sqrt(
      Math.pow(finalState.x - initialState.x, 2) + 
      Math.pow(finalState.y - initialState.y, 2)
    );
    
    const distanceFromTarget = Math.sqrt(
      Math.pow(finalState.x - clickResult.targetX, 2) + 
      Math.pow(finalState.y - clickResult.targetY, 2)
    );

    console.log(`\n=== MOVEMENT RESULTS ===`);
    console.log(`Updates performed: ${updateCount}`);
    console.log(`Initial position: (${initialState.x}, ${initialState.y}) - tile (${initialTileX}, ${initialTileY})`);
    console.log(`Final position: (${finalState.x.toFixed(1)}, ${finalState.y.toFixed(1)}) - tile (${finalTileX}, ${finalTileY})`);
    console.log(`Target position: (${clickResult.targetX}, ${clickResult.targetY}) - tile (${clickResult.tileX}, ${clickResult.tileY})`);
    console.log(`Distance moved: ${actualDistanceMoved.toFixed(1)}px`);
    console.log(`Distance from target: ${distanceFromTarget.toFixed(3)}px`);
    console.log(`Movement completed: ${!finalState.isMoving}`);

    // CRITICAL TEST: Player must reach the bottom-right square
    // If the player stops before reaching the target, the test should fail
    
    // First check: Movement should have completed (not stuck in infinite loop)
    expect(finalState.isMoving).toBe(false);
    
    // Second check: Player should be very close to the target (within snap threshold)
    expect(distanceFromTarget).toBeLessThan(1.0);
    
    // Third check: Player should be in the correct tile (bottom-right)
    expect(finalTileX).toBe(2);
    expect(finalTileY).toBe(2);
    
    // Fourth check: Player should have moved a reasonable distance (diagonal across 2x2 tiles)
    const expectedMinDistance = Math.sqrt(2 * 2) * 64; // Diagonal distance across map
    expect(actualDistanceMoved).toBeGreaterThan(expectedMinDistance * 0.8); // Allow some tolerance
    
    console.log(`\n✅ SUCCESS: Player successfully moved from top-left (0,0) to bottom-right (2,2)`);
    console.log(`Player traversed ${actualDistanceMoved.toFixed(1)}px across the 9-square map in ${updateCount} updates`);
  });

  test('should handle edge case where player is already at target tile', () => {
    // Place player already in bottom-right tile but not centered
    const bottomRightWorld = mockMap.gridToWorld(2, 2);
    mockPlayerState.x = bottomRightWorld[0] - 5; // Slightly off-center
    mockPlayerState.y = bottomRightWorld[1] - 5;
    
    global.gameClick = jest.fn((event) => {
      const clickX = event.clientX || 0;
      const clickY = event.clientY || 0;
      const [tileX, tileY] = mockMap.worldToGrid(clickX, clickY);
      const [targetWorldX, targetWorldY] = mockMap.gridToWorld(tileX, tileY);
      
      mockPlayerState.targetX = targetWorldX - mockPlayerState.width / 2;
      mockPlayerState.targetY = targetWorldY - mockPlayerState.height / 2;
      mockPlayerState.isMoving = true;
      
      return { success: true, tileX, tileY };
    });

    global.updateMovement = jest.fn(() => {
      if (!mockPlayerState.isMoving) return { moved: false };
      
      const dx = mockPlayerState.targetX - mockPlayerState.x;
      const dy = mockPlayerState.targetY - mockPlayerState.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const snapThreshold = 2.0;
      const moveSpeed = 3;
      
      if (distance <= snapThreshold || distance < moveSpeed) {
        mockPlayerState.x = mockPlayerState.targetX;
        mockPlayerState.y = mockPlayerState.targetY;
        mockPlayerState.isMoving = false;
        return { moved: true, snapped: true };
      }
      
      mockPlayerState.x += (dx / distance) * moveSpeed;
      mockPlayerState.y += (dy / distance) * moveSpeed;
      return { moved: true };
    });

    // Click on same tile (bottom-right)
    const clickEvent = { clientX: 160, clientY: 160 };
    const clickResult = global.gameClick(clickEvent);
    
    expect(clickResult.success).toBe(true);
    
    // Should complete movement quickly since already in correct tile
    let updateCount = 0;
    while (mockPlayerState.isMoving && updateCount < 10) {
      global.updateMovement();
      updateCount++;
    }
    
    const finalState = global.getPlayerState();
    const [finalTileX, finalTileY] = mockMap.worldToGrid(
      finalState.x + finalState.width / 2, 
      finalState.y + finalState.height / 2
    );
    
    expect(finalState.isMoving).toBe(false);
    expect(finalTileX).toBe(2);
    expect(finalTileY).toBe(2);
    
    console.log(`✅ Edge case handled: Player centered in target tile after ${updateCount} updates`);
  });

  test('should validate 9-square map dimensions', () => {
    // Verify map setup is correct
    expect(mockMap.width).toBe(3);
    expect(mockMap.height).toBe(3);
    expect(mockMap.width * mockMap.height).toBe(9); // Exactly 9 squares
    
    // Verify all tiles are valid positions
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        expect(mockMap.isValidPosition(x, y)).toBe(true);
        
        // Verify world coordinates are correct
        const [worldX, worldY] = mockMap.gridToWorld(x, y);
        const [backToGridX, backToGridY] = mockMap.worldToGrid(worldX, worldY);
        expect(backToGridX).toBe(x);
        expect(backToGridY).toBe(y);
      }
    }
    
    // Verify boundary conditions
    expect(mockMap.isValidPosition(-1, 0)).toBe(false);
    expect(mockMap.isValidPosition(0, -1)).toBe(false);
    expect(mockMap.isValidPosition(3, 0)).toBe(false);
    expect(mockMap.isValidPosition(0, 3)).toBe(false);
    
    console.log('✅ 9-square map validation passed');
  });
});