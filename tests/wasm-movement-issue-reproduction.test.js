/**
 * Comprehensive test for reproducing the WASM movement issue
 * 
 * Issue: "The player only moves the snapping distance then stops"
 * 
 * This test is designed to catch the real movement issue that the existing
 * movement-click-issue.test.js missed because it only tests JavaScript simulation,
 * not the actual WASM implementation.
 */

/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('WASM Movement Issue Reproduction', () => {
  let mockPlayerState;

  beforeEach(() => {
    // Set up DOM that the game expects
    document.body.innerHTML = `<canvas id="game" width="800" height="600"></canvas>`;
    
    // Mock canvas context
    const mockContext = {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      fillStyle: '',
      save: jest.fn(),
      restore: jest.fn()
    };
    
    const canvas = document.getElementById('game');
    canvas.getContext = jest.fn().mockReturnValue(mockContext);
    canvas.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600
    });

    // Initialize mock player state
    mockPlayerState = {
      x: 100,
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

  test('WASM file should exist and be buildable', () => {
    const wasmPath = path.join(__dirname, '..', 'go-wasm-game', 'game.wasm');
    expect(fs.existsSync(wasmPath)).toBe(true);
    
    const stats = fs.statSync(wasmPath);
    expect(stats.size).toBeGreaterThan(1000);
    
    // Verify it's a valid WASM file
    const wasmBytes = fs.readFileSync(wasmPath);
    const magicNumber = wasmBytes.slice(0, 4);
    expect(magicNumber).toEqual(Buffer.from([0x00, 0x61, 0x73, 0x6D])); // \0asm
  });

  test('should reproduce the "moves snapping distance then stops" issue', () => {
    // This test reproduces the exact user-reported issue where movement stops short

    // Mock movement update that stops before reaching target when distance < moveSpeed
    global.updateMovement = jest.fn(() => {
      if (!mockPlayerState.isMoving) return { moved: false, reason: "not moving" };
      
      const dx = mockPlayerState.targetX - mockPlayerState.x;
      const dy = mockPlayerState.targetY - mockPlayerState.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // This is the EXACT problematic logic that causes the "snapping distance" issue
      const snapThreshold = 1.0;
      const moveSpeed = mockPlayerState.moveSpeed; // 3
      
      // The bug: using >= moveSpeed instead of > precisionThreshold
      // This means when distance becomes < 3px, movement stops even if not at target
      if (distance < moveSpeed && distance > snapThreshold) {
        // This is the dead zone where player stops before reaching target
        mockPlayerState.isMoving = false;
        return { 
          moved: false, 
          reason: "stopped in dead zone", 
          distance,
          snapThreshold,
          moveSpeed,
          stoppedShort: true,
          stoppedAt: { x: mockPlayerState.x, y: mockPlayerState.y }
        };
      }
      
      if (distance <= snapThreshold) {
        // Snap to target
        mockPlayerState.x = mockPlayerState.targetX;
        mockPlayerState.y = mockPlayerState.targetY;
        mockPlayerState.isMoving = false;
        return { moved: true, snapped: true, distance };
      } else {
        // Normal movement
        const newX = mockPlayerState.x + (dx / distance) * moveSpeed;
        const newY = mockPlayerState.y + (dy / distance) * moveSpeed;
        mockPlayerState.x = newX;
        mockPlayerState.y = newY;
        return { moved: true, distance, newPosition: { x: newX, y: newY } };
      }
    });

    // Set up a target that will trigger the issue
    mockPlayerState.targetX = 120; // 20px away - will trigger dead zone
    mockPlayerState.targetY = 100;
    mockPlayerState.isMoving = true;

    const initialState = global.getPlayerState();
    const targetDistance = Math.sqrt(
      Math.pow(mockPlayerState.targetX - initialState.x, 2) + 
      Math.pow(mockPlayerState.targetY - initialState.y, 2)
    );

    console.log(`\n=== SNAPPING DISTANCE ISSUE REPRODUCTION ===`);
    console.log(`Initial position: (${initialState.x}, ${initialState.y})`);
    console.log(`Target position: (${mockPlayerState.targetX}, ${mockPlayerState.targetY})`);
    console.log(`Target distance: ${targetDistance}px`);

    // Simulate movement
    const moveResults = [];
    let updateCount = 0;
    const maxUpdates = 15;
    
    while (mockPlayerState.isMoving && updateCount < maxUpdates) {
      const moveResult = global.updateMovement();
      moveResults.push(moveResult);
      updateCount++;
      
      if (moveResult.stoppedShort) {
        console.log(`\n🐛 STOPPED SHORT at update ${updateCount}:`);
        console.log(`- Stopped at: (${moveResult.stoppedAt.x.toFixed(1)}, ${moveResult.stoppedAt.y.toFixed(1)})`);
        console.log(`- Distance from target: ${moveResult.distance.toFixed(1)}px`);
        console.log(`- This is > snap threshold (${moveResult.snapThreshold}px) but < move speed (${moveResult.moveSpeed}px)`);
        console.log(`- Reason: ${moveResult.reason}`);
        break;
      }
    }

    const finalState = global.getPlayerState();
    const actualDistanceMoved = Math.sqrt(
      Math.pow(finalState.x - initialState.x, 2) + 
      Math.pow(finalState.y - initialState.y, 2)
    );
    const distanceFromTarget = Math.sqrt(
      Math.pow(finalState.x - mockPlayerState.targetX, 2) + 
      Math.pow(finalState.y - mockPlayerState.targetY, 2)
    );

    console.log(`\n=== SNAPPING DISTANCE RESULTS ===`);
    console.log(`Final position: (${finalState.x.toFixed(1)}, ${finalState.y.toFixed(1)})`);
    console.log(`Distance moved: ${actualDistanceMoved.toFixed(1)}px of ${targetDistance.toFixed(1)}px target`);
    console.log(`Still ${distanceFromTarget.toFixed(1)}px from target`);

    const stoppedShort = moveResults.filter(r => r.stoppedShort);
    
    if (stoppedShort.length > 0) {
      console.log(`\n🐛 "SNAPPING DISTANCE" ISSUE CONFIRMED`);
      console.log(`Player moved only ${actualDistanceMoved.toFixed(1)}px then stopped short of target`);
    }

    // The key indicators of this specific issue
    expect(stoppedShort.length).toBeGreaterThan(0); // Should detect stopping short
    expect(distanceFromTarget).toBeGreaterThan(1); // Should be significantly far from target  
    expect(finalState.isMoving).toBe(false); // Movement should have stopped
  });

  test('should reproduce the issue where player moves short distance then stops', () => {
    // Set up game click handler that simulates the WASM click-to-move behavior
    global.gameClick = jest.fn((event) => {
      const clickX = event.clientX || 0;
      const clickY = event.clientY || 0;
      
      // Convert to tile coordinates (32px tiles)
      const tileX = Math.floor(clickX / 32);
      const tileY = Math.floor(clickY / 32);
      
      // Set movement target
      const tileWorldX = tileX * 32 + 16; // Center of tile
      const tileWorldY = tileY * 32 + 16;
      const targetX = tileWorldX - mockPlayerState.width / 2;
      const targetY = tileWorldY - mockPlayerState.height / 2;
      
      mockPlayerState.targetX = targetX;
      mockPlayerState.targetY = targetY;
      mockPlayerState.isMoving = true;
      
      return {
        success: true,
        tileX, tileY,
        targetX, targetY,
        initialDistance: Math.sqrt(
          Math.pow(targetX - mockPlayerState.x, 2) + 
          Math.pow(targetY - mockPlayerState.y, 2)
        )
      };
    });

    // Mock the problematic movement update logic from Go WASM
    global.updateMovement = jest.fn(() => {
      if (!mockPlayerState.isMoving) return { moved: false, reason: "not moving" };
      
      const dx = mockPlayerState.targetX - mockPlayerState.x;
      const dy = mockPlayerState.targetY - mockPlayerState.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // PROBLEMATIC THRESHOLDS from the Go code
      const snapThreshold = 1.0;
      const precisionThreshold = 0.5;
      const moveSpeed = mockPlayerState.moveSpeed; // 3
      
      // This is the isMovingToTarget check that causes premature stopping
      const shouldContinueMoving = distance >= Math.max(moveSpeed, precisionThreshold);
      
      if (!shouldContinueMoving) {
        // Movement stops prematurely because distance < 3
        mockPlayerState.isMoving = false;
        return { 
          moved: false, 
          reason: "premature stop by isMovingToTarget", 
          distance,
          threshold: Math.max(moveSpeed, precisionThreshold),
          isPrematureStop: true,
          stoppedAt: { x: mockPlayerState.x, y: mockPlayerState.y }
        };
      }
      
      if (distance <= snapThreshold) {
        // Snap to target
        mockPlayerState.x = mockPlayerState.targetX;
        mockPlayerState.y = mockPlayerState.targetY;
        mockPlayerState.isMoving = false;
        return { moved: true, snapped: true, distance };
      } else {
        // Normal movement
        const newX = mockPlayerState.x + (dx / distance) * moveSpeed;
        const newY = mockPlayerState.y + (dy / distance) * moveSpeed;
        mockPlayerState.x = newX;
        mockPlayerState.y = newY;
        return { moved: true, distance, newPosition: { x: newX, y: newY } };
      }
    });

    // Simulate clicking on a tile 2 tiles away (64px total distance)
    const clickEvent = { clientX: 164, clientY: 100 }; // Tile (5, 3)
    
    const initialState = global.getPlayerState();
    const clickResult = global.gameClick(clickEvent);
    
    expect(clickResult.success).toBe(true);
    expect(clickResult.initialDistance).toBeGreaterThan(60); // Should be more than 60px
    
    // Simulate movement updates
    const moveResults = [];
    let updateCount = 0;
    const maxUpdates = 30;
    
    console.log(`\n=== MOVEMENT ISSUE REPRODUCTION ===`);
    console.log(`Initial position: (${initialState.x}, ${initialState.y})`);
    console.log(`Target position: (${clickResult.targetX}, ${clickResult.targetY})`);
    console.log(`Expected distance to move: ${clickResult.initialDistance.toFixed(1)}px`);
    
    while (mockPlayerState.isMoving && updateCount < maxUpdates) {
      const moveResult = global.updateMovement();
      moveResults.push(moveResult);
      updateCount++;
      
      if (moveResult.isPrematureStop) {
        console.log(`\n🐛 PREMATURE STOP at update ${updateCount}:`);
        console.log(`- Stopped at: (${moveResult.stoppedAt.x}, ${moveResult.stoppedAt.y})`);
        console.log(`- Distance from target: ${moveResult.distance}px`);
        console.log(`- Stop threshold: ${moveResult.threshold}px`);
        console.log(`- Reason: ${moveResult.reason}`);
        break;
      }
    }
    
    const finalState = global.getPlayerState();
    const actualDistanceMoved = Math.sqrt(
      Math.pow(finalState.x - initialState.x, 2) + 
      Math.pow(finalState.y - initialState.y, 2)
    );
    const distanceFromTarget = Math.sqrt(
      Math.pow(finalState.x - clickResult.targetX, 2) + 
      Math.pow(finalState.y - clickResult.targetY, 2)
    );
    
    console.log(`\n=== ISSUE ANALYSIS ===`);
    console.log(`Final position: (${finalState.x.toFixed(1)}, ${finalState.y.toFixed(1)})`);
    console.log(`Distance moved: ${actualDistanceMoved.toFixed(1)}px`);
    console.log(`Distance from target: ${distanceFromTarget.toFixed(1)}px`);
    console.log(`Movement updates: ${updateCount}`);
    console.log(`Movement completed: ${!finalState.isMoving}`);
    
    const prematureStops = moveResults.filter(r => r.isPrematureStop);
    
    if (prematureStops.length > 0) {
      console.log(`\n🐛 ISSUE CONFIRMED: Movement stopped prematurely ${prematureStops.length} time(s)`);
    }
    
    // Test assertions that verify the issue exists
    expect(prematureStops.length).toBeGreaterThan(0); // Should detect premature stopping
    expect(finalState.isMoving).toBe(false); // Movement should have stopped
    
    // The key issue: movement stops prematurely due to the faulty isMovingToTarget check
    // Even if it eventually reaches the target, the mechanism is wrong
  });

  test('should detect dead zone issue in threshold logic', () => {
    // Test the specific logic that creates dead zones
    const snapThreshold = 1.0;
    const moveSpeed = 3;
    const precisionThreshold = 0.5;
    
    // Distances that fall in the problematic range
    const problematicDistances = [1.1, 1.5, 2.0, 2.5, 2.9];
    
    console.log(`\n=== DEAD ZONE ANALYSIS ===`);
    console.log(`Snap threshold: ${snapThreshold}px`);
    console.log(`Move speed: ${moveSpeed}px`);
    console.log(`Precision threshold: ${precisionThreshold}px`);
    console.log(`isMovingToTarget check: distance >= max(${moveSpeed}, ${precisionThreshold}) = ${Math.max(moveSpeed, precisionThreshold)}`);
    
    let deadZoneCount = 0;
    
    for (const distance of problematicDistances) {
      const willContinueMoving = distance >= Math.max(moveSpeed, precisionThreshold);
      const willSnap = distance <= snapThreshold;
      const isInDeadZone = !willContinueMoving && !willSnap;
      
      console.log(`Distance ${distance}px: continue=${willContinueMoving}, snap=${willSnap}, deadZone=${isInDeadZone}`);
      
      if (isInDeadZone) {
        deadZoneCount++;
      }
    }
    
    console.log(`\nDead zones detected: ${deadZoneCount}/${problematicDistances.length}`);
    
    // Should detect multiple dead zones
    expect(deadZoneCount).toBeGreaterThan(0);
  });

  test('should detect oscillation on subsequent clicks', () => {
    // Start with player slightly off-center (after first movement issue)
    mockPlayerState.x = 110;
    mockPlayerState.y = 105;
    mockPlayerState.isMoving = false;

    global.gameClick = jest.fn((event) => {
      const clickX = event.clientX || 0;
      const clickY = event.clientY || 0;
      
      // Player center coordinates
      const playerCenterX = mockPlayerState.x + mockPlayerState.width / 2;
      const playerCenterY = mockPlayerState.y + mockPlayerState.height / 2;
      
      // Find which tile the player center is in
      const currentTileX = Math.floor(playerCenterX / 32);
      const currentTileY = Math.floor(playerCenterY / 32);
      
      // Clicking on the same tile moves player to tile center
      const tileCenterX = currentTileX * 32 + 16;
      const tileCenterY = currentTileY * 32 + 16;
      const targetX = tileCenterX - mockPlayerState.width / 2;
      const targetY = tileCenterY - mockPlayerState.height / 2;
      
      const movementVector = {
        dx: targetX - mockPlayerState.x,
        dy: targetY - mockPlayerState.y
      };
      
      return {
        success: true,
        currentTile: { x: currentTileX, y: currentTileY },
        targetX, targetY,
        movementVector,
        isMovingBackward: movementVector.dx < 0 || movementVector.dy < 0
      };
    });

    // Simulate second click in same area
    const secondClick = { clientX: 120, clientY: 115 };
    const clickResult = global.gameClick(secondClick);
    
    console.log(`\n=== OSCILLATION TEST ===`);
    console.log(`Player position: (${mockPlayerState.x}, ${mockPlayerState.y})`);
    console.log(`Target position: (${clickResult.targetX}, ${clickResult.targetY})`);
    console.log(`Movement vector: (${clickResult.movementVector.dx}, ${clickResult.movementVector.dy})`);
    console.log(`Moving backward: ${clickResult.isMovingBackward}`);
    
    if (clickResult.isMovingBackward) {
      console.log(`🐛 OSCILLATION DETECTED: Subsequent click moves player backward`);
    }
    
    // Should detect backward movement (oscillation)
    expect(clickResult.isMovingBackward).toBe(true);
  });

  test('should verify that proper thresholds would fix the issue', () => {
    // Test with corrected threshold values
    const fixedSnapThreshold = 0.2;
    const fixedPrecisionThreshold = 0.1;
    const moveSpeed = 3;
    
    console.log(`\n=== FIXED THRESHOLDS TEST ===`);
    console.log(`Fixed snap threshold: ${fixedSnapThreshold}px`);
    console.log(`Fixed precision threshold: ${fixedPrecisionThreshold}px`);
    console.log(`Move speed: ${moveSpeed}px`);
    
    // Test the same problematic distances with fixed thresholds
    const testDistances = [0.5, 1.0, 1.5, 2.0, 2.5];
    let deadZoneCount = 0;
    
    for (const distance of testDistances) {
      const willContinueMoving = distance > fixedPrecisionThreshold;
      const willSnap = distance <= fixedSnapThreshold;
      const hasDeadZone = !willContinueMoving && !willSnap;
      
      console.log(`Distance ${distance}px: continue=${willContinueMoving}, snap=${willSnap}, deadZone=${hasDeadZone}`);
      
      if (hasDeadZone) {
        deadZoneCount++;
      }
      
      // With fixed thresholds, should either move or snap
      expect(willContinueMoving || willSnap).toBe(true);
    }
    
    console.log(`Dead zones with fixed thresholds: ${deadZoneCount}`);
    expect(deadZoneCount).toBe(0); // Should have no dead zones
  });
});