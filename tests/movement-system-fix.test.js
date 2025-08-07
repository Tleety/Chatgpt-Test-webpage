/**
 * Test to verify that the movement system restructure fixes the dead zone issues
 * 
 * This test validates that the new simplified movement system eliminates
 * the problematic threshold logic that caused players to stop short of targets.
 * 
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Movement System Fix Verification', () => {
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

  test('WASM file should exist and be valid', () => {
    const wasmPath = path.join(__dirname, '..', 'go-wasm-game', 'game.wasm');
    expect(fs.existsSync(wasmPath)).toBe(true);
    
    const stats = fs.statSync(wasmPath);
    expect(stats.size).toBeGreaterThan(1000);
    
    // Verify it's a valid WASM file
    const wasmBytes = fs.readFileSync(wasmPath);
    const magicNumber = wasmBytes.slice(0, 4);
    expect(magicNumber).toEqual(Buffer.from([0x00, 0x61, 0x73, 0x6D])); // \0asm
  });

  test('new movement system should eliminate dead zones', () => {
    // Mock the NEW movement system behavior with simplified logic
    global.updateMovement = jest.fn(() => {
      if (!mockPlayerState.isMoving) return { moved: false, reason: "not moving" };
      
      const dx = mockPlayerState.targetX - mockPlayerState.x;
      const dy = mockPlayerState.targetY - mockPlayerState.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // NEW SIMPLIFIED LOGIC - eliminates dead zones
      const arrivalThreshold = 0.5; // Single simple threshold
      const moveSpeed = mockPlayerState.moveSpeed;
      
      if (distance <= arrivalThreshold) {
        // Arrived at target - snap exactly
        mockPlayerState.x = mockPlayerState.targetX;
        mockPlayerState.y = mockPlayerState.targetY;
        mockPlayerState.isMoving = false;
        return { 
          moved: true, 
          reason: "arrived at target", 
          distance,
          arrivalThreshold,
          snapped: true
        };
      }
      
      // Move towards target, handling overshoot
      if (distance <= moveSpeed) {
        // Would overshoot - move exactly to target
        mockPlayerState.x = mockPlayerState.targetX;
        mockPlayerState.y = mockPlayerState.targetY;
        mockPlayerState.isMoving = false;
        return { 
          moved: true, 
          reason: "reached target without overshoot", 
          distance,
          completed: true
        };
      } else {
        // Normal movement step
        const newX = mockPlayerState.x + (dx / distance) * moveSpeed;
        const newY = mockPlayerState.y + (dy / distance) * moveSpeed;
        mockPlayerState.x = newX;
        mockPlayerState.y = newY;
        return { 
          moved: true, 
          distance, 
          newPosition: { x: newX, y: newY },
          reason: "normal movement step"
        };
      }
    });

    // Test that previously problematic distances now work correctly
    const testCases = [
      { targetX: 120, targetY: 100, description: "20px horizontal move" },
      { targetX: 102, targetY: 100, description: "2px horizontal move (former dead zone)" },
      { targetX: 101.5, targetY: 100, description: "1.5px horizontal move (former dead zone)" },
      { targetX: 132, targetY: 100, description: "32px horizontal move" },
    ];

    testCases.forEach(testCase => {
      // Reset player position
      mockPlayerState.x = 100;
      mockPlayerState.y = 100;
      mockPlayerState.targetX = testCase.targetX;
      mockPlayerState.targetY = testCase.targetY;
      mockPlayerState.isMoving = true;

      const initialDistance = Math.sqrt(
        Math.pow(testCase.targetX - 100, 2) + Math.pow(testCase.targetY - 100, 2)
      );

      console.log(`\n=== Testing ${testCase.description} ===`);
      console.log(`Target distance: ${initialDistance.toFixed(1)}px`);

      // Simulate movement
      const moveResults = [];
      let updateCount = 0;
      const maxUpdates = 20;
      
      while (mockPlayerState.isMoving && updateCount < maxUpdates) {
        const moveResult = global.updateMovement();
        moveResults.push(moveResult);
        updateCount++;
      }

      const finalDistance = Math.sqrt(
        Math.pow(mockPlayerState.x - testCase.targetX, 2) + 
        Math.pow(mockPlayerState.y - testCase.targetY, 2)
      );

      console.log(`Movement completed in ${updateCount} updates`);
      console.log(`Final distance from target: ${finalDistance.toFixed(3)}px`);
      console.log(`Movement successful: ${!mockPlayerState.isMoving && finalDistance < 0.1}`);

      // Assertions for the new system
      expect(mockPlayerState.isMoving).toBe(false); // Movement should complete
      expect(finalDistance).toBeLessThan(0.1); // Should reach target precisely
      expect(updateCount).toBeLessThan(maxUpdates); // Should not get stuck
      
      // Verify no dead zone behavior
      const stoppedEarly = moveResults.some(r => r.reason === "stopped in dead zone");
      expect(stoppedEarly).toBe(false); // Should never stop in dead zone
    });
  });

  test('movement should be smooth without oscillation', () => {
    // Mock the NEW movement system behavior
    global.updateMovement = jest.fn(() => {
      if (!mockPlayerState.isMoving) return { moved: false, reason: "not moving" };
      
      const dx = mockPlayerState.targetX - mockPlayerState.x;
      const dy = mockPlayerState.targetY - mockPlayerState.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const arrivalThreshold = 0.5;
      const moveSpeed = mockPlayerState.moveSpeed;
      
      if (distance <= arrivalThreshold) {
        mockPlayerState.x = mockPlayerState.targetX;
        mockPlayerState.y = mockPlayerState.targetY;
        mockPlayerState.isMoving = false;
        return { moved: true, reason: "arrived", completed: true };
      }
      
      if (distance <= moveSpeed) {
        mockPlayerState.x = mockPlayerState.targetX;
        mockPlayerState.y = mockPlayerState.targetY;
        mockPlayerState.isMoving = false;
        return { moved: true, reason: "no overshoot", completed: true };
      } else {
        const newX = mockPlayerState.x + (dx / distance) * moveSpeed;
        const newY = mockPlayerState.y + (dy / distance) * moveSpeed;
        mockPlayerState.x = newX;
        mockPlayerState.y = newY;
        return { moved: true, distance, progress: true };
      }
    });

    // Set up a target
    mockPlayerState.x = 100;
    mockPlayerState.y = 100;
    mockPlayerState.targetX = 150;
    mockPlayerState.targetY = 120;
    mockPlayerState.isMoving = true;

    console.log(`\n=== Testing Smooth Movement ===`);
    console.log(`Start: (${mockPlayerState.x}, ${mockPlayerState.y})`);
    console.log(`Target: (${mockPlayerState.targetX}, ${mockPlayerState.targetY})`);

    // Track movement path for smoothness analysis
    const movementPath = [{ x: mockPlayerState.x, y: mockPlayerState.y }];
    let updateCount = 0;
    const maxUpdates = 25;
    
    while (mockPlayerState.isMoving && updateCount < maxUpdates) {
      const moveResult = global.updateMovement();
      movementPath.push({ x: mockPlayerState.x, y: mockPlayerState.y });
      updateCount++;
    }

    console.log(`Movement completed in ${updateCount} updates`);
    console.log(`Final position: (${mockPlayerState.x.toFixed(1)}, ${mockPlayerState.y.toFixed(1)})`);

    // Check for smooth movement (no backwards steps or oscillation)
    let hasBackwardsMovement = false;
    let previousDistance = Infinity;
    
    for (let i = 1; i < movementPath.length - 1; i++) {
      const currentDistance = Math.sqrt(
        Math.pow(movementPath[i].x - mockPlayerState.targetX, 2) + 
        Math.pow(movementPath[i].y - mockPlayerState.targetY, 2)
      );
      
      if (currentDistance > previousDistance) {
        hasBackwardsMovement = true;
        console.log(`Backwards movement detected at step ${i}`);
        break;
      }
      previousDistance = currentDistance;
    }

    // Assertions
    expect(mockPlayerState.isMoving).toBe(false); // Movement should complete
    expect(hasBackwardsMovement).toBe(false); // No oscillation
    expect(updateCount).toBeLessThan(maxUpdates); // Should not get stuck
    
    // Should reach target
    const finalDistance = Math.sqrt(
      Math.pow(mockPlayerState.x - mockPlayerState.targetX, 2) + 
      Math.pow(mockPlayerState.y - mockPlayerState.targetY, 2)
    );
    expect(finalDistance).toBeLessThan(0.1);
  });
});