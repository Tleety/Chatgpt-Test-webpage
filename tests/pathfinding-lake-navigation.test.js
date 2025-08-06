/**
 * Unit tests for Pathfinding Lake Navigation Issues
 * Tests specific scenarios where pathfinding around lakes fails or produces suboptimal results
 */

/**
 * @jest-environment jsdom
 */

describe('Pathfinding Lake Navigation Issues', () => {
  // Mock the lake terrain layout from terrain.go
  const lakesLayout = [
    { centerX: 40, centerY: 30, radiusX: 18, radiusY: 12 },   // Top-left lake (oval)
    { centerX: 160, centerY: 45, radiusX: 22, radiusY: 20 },  // Top-right lake (round)
    { centerX: 80, centerY: 120, radiusX: 15, radiusY: 25 },  // Central lake (vertical oval)
    { centerX: 140, centerY: 160, radiusX: 20, radiusY: 15 }, // Bottom-right lake
    { centerX: 25, centerY: 170, radiusX: 12, radiusY: 18 },  // Bottom-left small lake
  ];

  // Mock map dimensions from the Go code
  const MAP_WIDTH = 200;
  const MAP_HEIGHT = 200;

  /**
   * Helper function to check if a tile is water based on the lake layout
   */
  function isWaterTile(x, y) {
    for (const lake of lakesLayout) {
      const dx = x - lake.centerX;
      const dy = y - lake.centerY;
      const distX = dx / lake.radiusX;
      const distY = dy / lake.radiusY;
      const distance = Math.sqrt(distX * distX + distY * distY);
      if (distance < 1.0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Mock map implementation that mimics the Go terrain generation
   */
  function createMockMap() {
    return {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      getTile: jest.fn().mockImplementation((x, y) => {
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
          return 'water'; // Out of bounds is water
        }
        return isWaterTile(x, y) ? 'water' : 'grass';
      }),
      worldToGrid: jest.fn().mockImplementation((worldX, worldY) => [
        Math.floor(worldX / 32), Math.floor(worldY / 32)
      ]),
      gridToWorld: jest.fn().mockImplementation((gridX, gridY) => [
        gridX * 32 + 16, gridY * 32 + 16
      ])
    };
  }

  /**
   * Simplified A* pathfinding implementation for testing
   */
  function findPathAStar(startX, startY, endX, endY, map) {
    // Check bounds
    if (startX < 0 || startX >= map.width || startY < 0 || startY >= map.height ||
        endX < 0 || endX >= map.width || endY < 0 || endY >= map.height) {
      return null;
    }

    // If start or end is water, try to find nearest walkable
    if (map.getTile(startX, startY) === 'water') {
      const nearest = findNearestWalkableTile(startX, startY, map);
      startX = nearest[0];
      startY = nearest[1];
    }
    if (map.getTile(endX, endY) === 'water') {
      const nearest = findNearestWalkableTile(endX, endY, map);
      endX = nearest[0];
      endY = nearest[1];
    }

    // If start and end are the same, return single-point path
    if (startX === endX && startY === endY) {
      return [{ X: endX, Y: endY }];
    }

    // A* implementation
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${startX},${startY}`;
    const endKey = `${endX},${endY}`;
    
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startX, startY, endX, endY));
    openSet.push({ x: startX, y: startY });

    const directions = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: -1, dy: 0 },
      { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
    ];

    let iterations = 0;
    const maxIterations = 10000;

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;
      
      // Find node with lowest fScore
      let current = openSet[0];
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        const currentKey = `${openSet[i].x},${openSet[i].y}`;
        const bestKey = `${current.x},${current.y}`;
        if (fScore.get(currentKey) < fScore.get(bestKey)) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      // Remove current from openSet
      openSet.splice(currentIndex, 1);
      const currentKey = `${current.x},${current.y}`;
      closedSet.add(currentKey);

      // Check if we reached the goal
      if (current.x === endX && current.y === endY) {
        return reconstructPath(cameFrom, current);
      }

      // Explore neighbors
      for (const dir of directions) {
        const neighborX = current.x + dir.dx;
        const neighborY = current.y + dir.dy;
        const neighborKey = `${neighborX},${neighborY}`;

        // Skip if out of bounds
        if (neighborX < 0 || neighborX >= map.width || 
            neighborY < 0 || neighborY >= map.height) {
          continue;
        }

        // Skip if already explored
        if (closedSet.has(neighborKey)) {
          continue;
        }

        // Skip if not walkable
        if (map.getTile(neighborX, neighborY) === 'water') {
          continue;
        }

        // Calculate movement cost
        const moveCost = (dir.dx !== 0 && dir.dy !== 0) ? 1.414 : 1.0;
        const tentativeGScore = gScore.get(currentKey) + moveCost;

        // Check if this is the best path to this neighbor
        if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + heuristic(neighborX, neighborY, endX, endY));

          // Add to openSet if not already there
          if (!openSet.some(node => node.x === neighborX && node.y === neighborY)) {
            openSet.push({ x: neighborX, y: neighborY });
          }
        }
      }
    }

    // No path found - this is the potential issue!
    return null;
  }

  function heuristic(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function reconstructPath(cameFrom, current) {
    const path = [{ X: current.x, Y: current.y }];
    let currentKey = `${current.x},${current.y}`;
    
    while (cameFrom.has(currentKey)) {
      current = cameFrom.get(currentKey);
      path.unshift({ X: current.x, Y: current.y });
      currentKey = `${current.x},${current.y}`;
    }
    
    return path;
  }

  function findNearestWalkableTile(targetX, targetY, map) {
    if (map.getTile(targetX, targetY) !== 'water') {
      return [targetX, targetY];
    }

    const maxSearchRadius = 20;
    // Use improved circular search pattern instead of diamond pattern
    for (let radius = 1; radius <= maxSearchRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Calculate actual distance to prioritize closer tiles
          const actualDistance = Math.sqrt(dx * dx + dy * dy);
          
          // Only check tiles within the current radius
          if (actualDistance > radius) {
            continue;
          }
          
          const checkX = targetX + dx;
          const checkY = targetY + dy;
          
          if (checkX >= 0 && checkX < map.width && 
              checkY >= 0 && checkY < map.height &&
              map.getTile(checkX, checkY) !== 'water') {
            return [checkX, checkY];
          }
        }
      }
    }
    
    return [Math.floor(map.width / 2), Math.floor(map.height / 2)];
  }

  describe('Lake Navigation Pathfinding Issues', () => {
    test('should find path around central lake when going from left to right', () => {
      const mockMap = createMockMap();
      
      // Try to go from left side of central lake to right side
      // Central lake is at (80, 120) with radius 15x25
      const startX = 50;  // Left side of central lake
      const startY = 120; // Same Y as lake center
      const endX = 110;   // Right side of central lake  
      const endY = 120;   // Same Y as lake center

      const path = findPathAStar(startX, startY, endX, endY, mockMap);
      
      // This test should FAIL initially - the pathfinding should struggle here
      expect(path).not.toBeNull();
      expect(path.length).toBeGreaterThan(2); // Should go around, not direct
      
      // Verify path doesn't go through water
      for (const step of path) {
        expect(mockMap.getTile(step.X, step.Y)).not.toBe('water');
      }
      
      // Verify start and end points
      expect(path[0].X).toBe(startX);
      expect(path[0].Y).toBe(startY);
      expect(path[path.length - 1].X).toBe(endX);
      expect(path[path.length - 1].Y).toBe(endY);
    });

    test('should handle pathfinding around irregular lake shapes', () => {
      const mockMap = createMockMap();
      
      // Test pathfinding around the complex top-right lake (160, 45)
      // This lake has a 22x20 radius and might create pathfinding challenges
      const startX = 130; // Left side of top-right lake
      const startY = 45;  // Same Y as lake center
      const endX = 190;   // Right side of top-right lake
      const endY = 45;    // Same Y as lake center

      const path = findPathAStar(startX, startY, endX, endY, mockMap);
      
      // This test might reveal the pathfinding issue
      expect(path).not.toBeNull();
      expect(path.length).toBeGreaterThan(0);
      
      // Check that path avoids water
      for (const step of path) {
        expect(mockMap.getTile(step.X, step.Y)).not.toBe('water');
      }
    });

    test('should find efficient path between lakes without getting stuck', () => {
      const mockMap = createMockMap();
      
      // Test navigation between two lakes that could create a "corridor" issue
      // From bottom-left lake area to bottom-right lake area
      const startX = 10;  // Near bottom-left lake (25, 170)
      const startY = 170;
      const endX = 170;   // Near bottom-right lake (140, 160) 
      const endY = 160;

      const path = findPathAStar(startX, startY, endX, endY, mockMap);
      
      // This scenario might expose pathfinding getting stuck or finding very long paths
      expect(path).not.toBeNull();
      expect(path).toBeDefined();
      expect(path.length).toBeGreaterThan(0);
      
      // Path shouldn't be excessively long (this might be the bug - paths that are too long)
      const directDistance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      expect(path.length).toBeLessThan(directDistance * 3); // Path shouldn't be 3x longer than direct
      
      // Verify no water tiles in path
      for (const step of path) {
        expect(mockMap.getTile(step.X, step.Y)).not.toBe('water');
      }
    });

    test('should handle pathfinding near lake peninsulas and complex shorelines', () => {
      const mockMap = createMockMap();
      
      // Test a scenario that might cause the A* to get trapped in a bay or peninsula
      // Around the central vertical lake (80, 120) which has 15x25 radius
      const startX = 80;  // North of central lake
      const startY = 90;  
      const endX = 80;    // South of central lake
      const endY = 150;   

      const path = findPathAStar(startX, startY, endX, endY, mockMap);
      
      // This is a critical test - pathfinding around elongated lakes
      expect(path).not.toBeNull();
      
      if (path) {
        expect(path.length).toBeGreaterThan(2);
        
        // Verify path goes around the lake, not through it
        for (const step of path) {
          expect(mockMap.getTile(step.X, step.Y)).not.toBe('water');
        }
        
        // The path should successfully connect start to end
        expect(path[0].X).toBe(startX);
        expect(path[0].Y).toBe(startY);
        expect(path[path.length - 1].X).toBe(endX);
        expect(path[path.length - 1].Y).toBe(endY);
      }
    });

    test('should handle target adjustment when pathfinding to water tiles', () => {
      const mockMap = createMockMap();
      
      // Test pathfinding where target is in water - this reveals the core issue
      const startX = 50;
      const startY = 50;
      const endX = 150;   // This might be in water (around top-right lake area)
      const endY = 50;
      
      // Check if target is actually in water
      const isTargetWater = mockMap.getTile(endX, endY) === 'water';
      
      const path = findPathAStar(startX, startY, endX, endY, mockMap);
      
      expect(path).not.toBeNull();
      expect(path).toBeDefined();
      expect(path.length).toBeGreaterThan(0);
      
      if (path) {
        // Verify start is correct
        expect(path[0].X).toBe(startX);
        expect(path[0].Y).toBe(startY);
        
        // If target was in water, the end should be adjusted to nearest walkable
        if (isTargetWater) {
          expect(mockMap.getTile(path[path.length - 1].X, path[path.length - 1].Y)).toBe('grass');
          // The actual end might be different from requested end due to target adjustment
          console.log(`Target adjusted from (${endX}, ${endY}) to (${path[path.length - 1].X}, ${path[path.length - 1].Y})`);
        } else {
          expect(path[path.length - 1].X).toBe(endX);
          expect(path[path.length - 1].Y).toBe(endY);
        }
      }
    });

    test('should find paths that do not get stuck in lake peninsulas', () => {
      const mockMap = createMockMap();
      
      // Test a position that should definitely be walkable
      // Let's use coordinates that are clearly outside any lake
      const startX = 50;  // Should be clear of all lakes
      const startY = 105; // Between top and central lakes
      const endX = 110;   // Should be clear of all lakes  
      const endY = 135;   // Between central and bottom lakes
      
      // Debug: check if start and end positions are actually walkable
      const startWalkable = mockMap.getTile(startX, startY) === 'grass';
      const endWalkable = mockMap.getTile(endX, endY) === 'grass';
      
      console.log(`Start (${startX}, ${startY}) walkable: ${startWalkable}`);
      console.log(`End (${endX}, ${endY}) walkable: ${endWalkable}`);
      
      const path = findPathAStar(startX, startY, endX, endY, mockMap);
      
      expect(path).not.toBeNull();
      
      if (path) {
        expect(path.length).toBeGreaterThan(0);
        
        // If both start and end are walkable, they should not be adjusted
        if (startWalkable) {
          expect(path[0].X).toBe(startX);
          expect(path[0].Y).toBe(startY);
        }
        if (endWalkable) {
          expect(path[path.length - 1].X).toBe(endX);
          expect(path[path.length - 1].Y).toBe(endY);
        }
        
        // Path should avoid water
        for (const step of path) {
          expect(mockMap.getTile(step.X, step.Y)).not.toBe('water');
        }
      }
    });
  });

  describe('Nearest Walkable Tile Finding', () => {
    test('should find walkable tile when clicking in lake center', () => {
      const mockMap = createMockMap();
      
      // Click in the center of the central lake
      const [nearestX, nearestY] = findNearestWalkableTile(80, 120, mockMap);
      
      // Should find a nearby grass tile
      expect(mockMap.getTile(nearestX, nearestY)).toBe('grass');
      
      // Should be reasonably close to the target
      const distance = Math.sqrt((nearestX - 80) ** 2 + (nearestY - 120) ** 2);
      expect(distance).toBeLessThan(30); // Within reasonable distance
    });

    test('should demonstrate diamond search pattern issue', () => {
      const mockMap = createMockMap();
      
      // Test a position that's right next to water but should be walkable
      // This exposes the issue with the diamond search pattern
      const targetX = 65; // Close to central lake edge
      const targetY = 120; // Same Y as lake center
      
      // Check if this position is actually walkable
      const isWalkable = mockMap.getTile(targetX, targetY) === 'grass';
      
      if (isWalkable) {
        // If the tile is walkable, findNearestWalkableTile should return the same position
        const [nearestX, nearestY] = findNearestWalkableTile(targetX, targetY, mockMap);
        expect(nearestX).toBe(targetX);
        expect(nearestY).toBe(targetY);
      } else {
        // If not walkable, it should find a truly nearby tile
        const [nearestX, nearestY] = findNearestWalkableTile(targetX, targetY, mockMap);
        expect(mockMap.getTile(nearestX, nearestY)).toBe('grass');
        
        // Test the issue: diamond search might find a tile that's not the closest
        const distance = Math.sqrt((nearestX - targetX) ** 2 + (nearestY - targetY) ** 2);
        
        // This test should FAIL if the diamond search is suboptimal
        // It might find a tile at distance 2 when there's a closer one at distance 1
        expect(distance).toBeLessThanOrEqual(2); // Should find within 2 tiles
      }
    });

    test('should find the truly closest walkable tile, not just first found', () => {
      const mockMap = createMockMap();
      
      // Create a scenario where diamond search vs circular search would differ
      // Position near a lake shore where multiple walkable tiles exist at different distances
      const targetX = 95; // East edge of central lake
      const targetY = 120;
      
      const [nearestX, nearestY] = findNearestWalkableTile(targetX, targetY, mockMap);
      
      expect(mockMap.getTile(nearestX, nearestY)).toBe('grass');
      
      // Calculate distance to found tile
      const foundDistance = Math.sqrt((nearestX - targetX) ** 2 + (nearestY - targetY) ** 2);
      
      // Check if there's actually a closer walkable tile that was missed
      // This tests whether the diamond pattern is optimal
      let hasCloserTile = false;
      for (let r = 1; r < foundDistance; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            const checkX = targetX + dx;
            const checkY = targetY + dy;
            const checkDistance = Math.sqrt(dx * dx + dy * dy);
            
            if (checkDistance < foundDistance &&
                checkX >= 0 && checkX < mockMap.width &&
                checkY >= 0 && checkY < mockMap.height &&
                mockMap.getTile(checkX, checkY) === 'grass') {
              hasCloserTile = true;
              break;
            }
          }
          if (hasCloserTile) break;
        }
        if (hasCloserTile) break;
      }
      
      // This test exposes the pathfinding issue: the algorithm doesn't find the closest tile
      expect(hasCloserTile).toBe(false); // Should not have missed a closer tile
    });
  });
});