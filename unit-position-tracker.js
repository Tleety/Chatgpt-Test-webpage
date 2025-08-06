/**
 * Unit Position Tracker Component
 * 
 * Tracks and manages the positions of units in 2D space.
 * Provides spatial queries, collision detection, and movement tracking.
 */

class UnitPositionTracker {
    constructor(worldWidth = 1000, worldHeight = 1000) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.unitPositions = new Map(); // unitId -> {x, y, facing, lastMoved}
        this.positionGrid = new Map(); // "x,y" -> Set of unitIds (for fast spatial queries)
        this.gridSize = 50; // Size of each grid cell for spatial partitioning
        this.listeners = new Map(); // Event listeners for position changes
    }

    /**
     * Set the position of a unit
     * @param {string} unitId - The unit identifier
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} facing - Optional facing direction in degrees (0-359)
     * @returns {boolean} True if position was set successfully
     */
    setPosition(unitId, x, y, facing = 0) {
        if (!unitId) {
            throw new Error('Unit ID is required');
        }

        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Position coordinates must be numbers');
        }

        // Clamp coordinates to world bounds
        x = Math.max(0, Math.min(x, this.worldWidth));
        y = Math.max(0, Math.min(y, this.worldHeight));
        facing = ((facing % 360) + 360) % 360; // Normalize to 0-359

        // Remove unit from old grid position if it exists
        if (this.unitPositions.has(unitId)) {
            this._removeFromGrid(unitId);
        }

        const oldPosition = this.unitPositions.get(unitId);
        const newPosition = {
            x,
            y,
            facing,
            lastMoved: Date.now()
        };

        // Update position
        this.unitPositions.set(unitId, newPosition);

        // Add to spatial grid
        this._addToGrid(unitId, x, y);

        // Notify listeners
        this._notifyListeners('position_changed', {
            unitId,
            oldPosition,
            newPosition
        });

        return true;
    }

    /**
     * Get the position of a unit
     * @param {string} unitId - The unit identifier
     * @returns {Object|null} Position object {x, y, facing, lastMoved} or null if unit not found
     */
    getPosition(unitId) {
        return this.unitPositions.get(unitId) || null;
    }

    /**
     * Move a unit by a relative offset
     * @param {string} unitId - The unit identifier
     * @param {number} dx - Change in X coordinate
     * @param {number} dy - Change in Y coordinate
     * @param {number} newFacing - Optional new facing direction
     * @returns {boolean} True if unit was moved
     */
    moveUnit(unitId, dx, dy, newFacing = null) {
        const currentPos = this.getPosition(unitId);
        if (!currentPos) {
            return false;
        }

        const newX = currentPos.x + dx;
        const newY = currentPos.y + dy;
        const facing = newFacing !== null ? newFacing : currentPos.facing;

        return this.setPosition(unitId, newX, newY, facing);
    }

    /**
     * Remove a unit from position tracking
     * @param {string} unitId - The unit identifier
     * @returns {boolean} True if unit was removed
     */
    removeUnit(unitId) {
        if (!this.unitPositions.has(unitId)) {
            return false;
        }

        const position = this.unitPositions.get(unitId);
        
        // Remove from grid and position map
        this._removeFromGrid(unitId);
        this.unitPositions.delete(unitId);

        // Notify listeners
        this._notifyListeners('unit_removed', {
            unitId,
            lastPosition: position
        });

        return true;
    }

    /**
     * Get all units within a rectangular area
     * @param {number} x - Left edge of rectangle
     * @param {number} y - Top edge of rectangle
     * @param {number} width - Width of rectangle
     * @param {number} height - Height of rectangle
     * @returns {Array} Array of unit IDs within the area
     */
    getUnitsInArea(x, y, width, height) {
        const result = new Set();
        
        // Calculate grid range to check
        const startGridX = Math.floor(x / this.gridSize);
        const endGridX = Math.floor((x + width) / this.gridSize);
        const startGridY = Math.floor(y / this.gridSize);
        const endGridY = Math.floor((y + height) / this.gridSize);

        // Check all relevant grid cells
        for (let gx = startGridX; gx <= endGridX; gx++) {
            for (let gy = startGridY; gy <= endGridY; gy++) {
                const gridKey = `${gx},${gy}`;
                const unitsInCell = this.positionGrid.get(gridKey);
                
                if (unitsInCell) {
                    for (const unitId of unitsInCell) {
                        const pos = this.getPosition(unitId);
                        if (pos && pos.x >= x && pos.x < x + width && 
                            pos.y >= y && pos.y < y + height) {
                            result.add(unitId);
                        }
                    }
                }
            }
        }

        return Array.from(result);
    }

    /**
     * Get all units within a circular area
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Radius of the circle
     * @returns {Array} Array of unit IDs within the circle
     */
    getUnitsInRadius(centerX, centerY, radius) {
        const result = [];
        const radiusSquared = radius * radius;

        // Get units in bounding square first (optimization)
        const unitsInSquare = this.getUnitsInArea(
            centerX - radius,
            centerY - radius,
            radius * 2,
            radius * 2
        );

        // Filter to only units actually within the circle
        for (const unitId of unitsInSquare) {
            const pos = this.getPosition(unitId);
            if (pos) {
                const distanceSquared = 
                    (pos.x - centerX) ** 2 + (pos.y - centerY) ** 2;
                if (distanceSquared <= radiusSquared) {
                    result.push(unitId);
                }
            }
        }

        return result;
    }

    /**
     * Get the nearest units to a position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} maxCount - Maximum number of units to return
     * @param {number} maxDistance - Maximum distance to search (optional)
     * @returns {Array} Array of {unitId, distance} objects sorted by distance
     */
    getNearestUnits(x, y, maxCount = 5, maxDistance = Infinity) {
        const distances = [];

        for (const [unitId, pos] of this.unitPositions) {
            const distance = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
            if (distance <= maxDistance) {
                distances.push({ unitId, distance });
            }
        }

        // Sort by distance and return top results
        distances.sort((a, b) => a.distance - b.distance);
        return distances.slice(0, maxCount);
    }

    /**
     * Calculate distance between two units
     * @param {string} unitId1 - First unit identifier
     * @param {string} unitId2 - Second unit identifier
     * @returns {number|null} Distance between units or null if either unit not found
     */
    getDistanceBetweenUnits(unitId1, unitId2) {
        const pos1 = this.getPosition(unitId1);
        const pos2 = this.getPosition(unitId2);
        
        if (!pos1 || !pos2) {
            return null;
        }

        return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
    }

    /**
     * Check if two units are within a certain distance of each other
     * @param {string} unitId1 - First unit identifier
     * @param {string} unitId2 - Second unit identifier
     * @param {number} maxDistance - Maximum distance
     * @returns {boolean} True if units are within distance
     */
    areUnitsNear(unitId1, unitId2, maxDistance) {
        const distance = this.getDistanceBetweenUnits(unitId1, unitId2);
        return distance !== null && distance <= maxDistance;
    }

    /**
     * Get all tracked unit positions
     * @returns {Array} Array of {unitId, x, y, facing, lastMoved} objects
     */
    getAllPositions() {
        return Array.from(this.unitPositions.entries()).map(([unitId, pos]) => ({
            unitId,
            ...pos
        }));
    }

    /**
     * Check if a position is occupied by any unit
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} tolerance - Position tolerance (default 1)
     * @returns {Array} Array of unit IDs at this position
     */
    getUnitsAtPosition(x, y, tolerance = 1) {
        return this.getUnitsInArea(x - tolerance, y - tolerance, tolerance * 2, tolerance * 2);
    }

    /**
     * Find a free position near a target position
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @param {number} searchRadius - Radius to search for free position
     * @param {number} unitSize - Size of unit needing position (default 1)
     * @returns {Object|null} Free position {x, y} or null if none found
     */
    findFreePositionNear(targetX, targetY, searchRadius = 50, unitSize = 1) {
        const step = unitSize * 2; // Minimum spacing between units
        
        for (let radius = 0; radius <= searchRadius; radius += step) {
            // Try positions in a circle around the target
            const numPositions = Math.max(8, Math.floor(2 * Math.PI * radius / step));
            
            for (let i = 0; i < numPositions; i++) {
                const angle = (2 * Math.PI * i) / numPositions;
                const x = targetX + Math.cos(angle) * radius;
                const y = targetY + Math.sin(angle) * radius;
                
                // Check if position is within world bounds
                if (x >= 0 && x <= this.worldWidth && y >= 0 && y <= this.worldHeight) {
                    // Check if position is free
                    const unitsNearby = this.getUnitsAtPosition(x, y, unitSize);
                    if (unitsNearby.length === 0) {
                        return { x, y };
                    }
                }
            }
        }
        
        return null; // No free position found
    }

    /**
     * Get units moving towards a direction
     * @param {number} direction - Direction in degrees (0-359)
     * @param {number} tolerance - Tolerance in degrees (default 45)
     * @returns {Array} Array of unit IDs facing the direction
     */
    getUnitsFacingDirection(direction, tolerance = 45) {
        const result = [];
        const normalizedDirection = ((direction % 360) + 360) % 360;
        
        for (const [unitId, pos] of this.unitPositions) {
            const facingDiff = Math.abs(pos.facing - normalizedDirection);
            const wrappedDiff = Math.min(facingDiff, 360 - facingDiff);
            
            if (wrappedDiff <= tolerance) {
                result.push(unitId);
            }
        }
        
        return result;
    }

    /**
     * Set world boundaries
     * @param {number} width - World width
     * @param {number} height - World height
     */
    setWorldBounds(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
        
        // Clamp existing positions to new bounds
        for (const [unitId, pos] of this.unitPositions) {
            const clampedX = Math.max(0, Math.min(pos.x, width));
            const clampedY = Math.max(0, Math.min(pos.y, height));
            
            if (clampedX !== pos.x || clampedY !== pos.y) {
                this.setPosition(unitId, clampedX, clampedY, pos.facing);
            }
        }
    }

    /**
     * Add event listener for position tracking events
     * @param {string} event - Event name ('position_changed', 'unit_removed')
     * @param {Function} callback - Callback function
     * @returns {string} Listener ID for removal
     */
    addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Map());
        }
        
        const listenerId = `listener_${Date.now()}_${Math.random()}`;
        this.listeners.get(event).set(listenerId, callback);
        
        return listenerId;
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {string} listenerId - Listener ID returned from addEventListener
     * @returns {boolean} True if listener was removed
     */
    removeEventListener(event, listenerId) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            return eventListeners.delete(listenerId);
        }
        return false;
    }

    /**
     * Get position tracking statistics
     * @returns {Object} Statistics about tracked positions
     */
    getStats() {
        const positions = this.getAllPositions();
        
        if (positions.length === 0) {
            return {
                totalUnits: 0,
                averageX: 0,
                averageY: 0,
                bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 }
            };
        }

        const bounds = {
            minX: Math.min(...positions.map(p => p.x)),
            maxX: Math.max(...positions.map(p => p.x)),
            minY: Math.min(...positions.map(p => p.y)),
            maxY: Math.max(...positions.map(p => p.y))
        };

        const averageX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
        const averageY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

        return {
            totalUnits: positions.length,
            averageX: averageX.toFixed(2),
            averageY: averageY.toFixed(2),
            bounds
        };
    }

    /**
     * Clear all position data
     */
    clearAll() {
        this.unitPositions.clear();
        this.positionGrid.clear();
        this._notifyListeners('all_cleared', {});
    }

    /**
     * Add unit to spatial grid
     * @private
     */
    _addToGrid(unitId, x, y) {
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        const gridKey = `${gridX},${gridY}`;
        
        if (!this.positionGrid.has(gridKey)) {
            this.positionGrid.set(gridKey, new Set());
        }
        
        this.positionGrid.get(gridKey).add(unitId);
    }

    /**
     * Remove unit from spatial grid
     * @private
     */
    _removeFromGrid(unitId) {
        const pos = this.getPosition(unitId);
        if (pos) {
            const gridX = Math.floor(pos.x / this.gridSize);
            const gridY = Math.floor(pos.y / this.gridSize);
            const gridKey = `${gridX},${gridY}`;
            
            const gridCell = this.positionGrid.get(gridKey);
            if (gridCell) {
                gridCell.delete(unitId);
                if (gridCell.size === 0) {
                    this.positionGrid.delete(gridKey);
                }
            }
        }
    }

    /**
     * Notify event listeners
     * @private
     */
    _notifyListeners(event, data) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            for (const callback of eventListeners.values()) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            }
        }
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnitPositionTracker;
} else {
    window.UnitPositionTracker = UnitPositionTracker;
}