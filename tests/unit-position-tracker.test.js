/**
 * @jest-environment jsdom
 */

const UnitPositionTracker = require('../unit-position-tracker.js');

describe('UnitPositionTracker', () => {
    let tracker;

    beforeEach(() => {
        tracker = new UnitPositionTracker(1000, 800);
    });

    describe('Initialization', () => {
        test('should initialize with default world bounds', () => {
            const defaultTracker = new UnitPositionTracker();
            expect(defaultTracker.worldWidth).toBe(1000);
            expect(defaultTracker.worldHeight).toBe(1000);
        });

        test('should initialize with custom world bounds', () => {
            expect(tracker.worldWidth).toBe(1000);
            expect(tracker.worldHeight).toBe(800);
        });

        test('should start with no units', () => {
            expect(tracker.getAllPositions()).toEqual([]);
            expect(tracker.getStats().totalUnits).toBe(0);
        });
    });

    describe('Position Setting', () => {
        test('should set unit position successfully', () => {
            const success = tracker.setPosition('unit1', 100, 200, 90);
            
            expect(success).toBe(true);
            const position = tracker.getPosition('unit1');
            expect(position).toEqual({
                x: 100,
                y: 200,
                facing: 90,
                lastMoved: expect.any(Number)
            });
        });

        test('should set position with default facing', () => {
            tracker.setPosition('unit1', 50, 75);
            const position = tracker.getPosition('unit1');
            
            expect(position.x).toBe(50);
            expect(position.y).toBe(75);
            expect(position.facing).toBe(0);
        });

        test('should clamp coordinates to world bounds', () => {
            tracker.setPosition('unit1', -10, 50);
            tracker.setPosition('unit2', 1100, 50);
            tracker.setPosition('unit3', 50, -10);
            tracker.setPosition('unit4', 50, 900);
            
            expect(tracker.getPosition('unit1').x).toBe(0);
            expect(tracker.getPosition('unit2').x).toBe(1000);
            expect(tracker.getPosition('unit3').y).toBe(0);
            expect(tracker.getPosition('unit4').y).toBe(800);
        });

        test('should normalize facing direction', () => {
            tracker.setPosition('unit1', 100, 100, 370); // Should become 10
            tracker.setPosition('unit2', 100, 100, -30); // Should become 330
            
            expect(tracker.getPosition('unit1').facing).toBe(10);
            expect(tracker.getPosition('unit2').facing).toBe(330);
        });

        test('should throw error for invalid parameters', () => {
            expect(() => tracker.setPosition('', 100, 100)).toThrow('Unit ID is required');
            expect(() => tracker.setPosition(null, 100, 100)).toThrow('Unit ID is required');
            expect(() => tracker.setPosition('unit1', 'invalid', 100)).toThrow('Position coordinates must be numbers');
            expect(() => tracker.setPosition('unit1', 100, 'invalid')).toThrow('Position coordinates must be numbers');
        });

        test('should update existing unit position', () => {
            tracker.setPosition('unit1', 100, 100, 45);
            tracker.setPosition('unit1', 200, 300, 180);
            
            const position = tracker.getPosition('unit1');
            expect(position.x).toBe(200);
            expect(position.y).toBe(300);
            expect(position.facing).toBe(180);
        });

        test('should set lastMoved timestamp', () => {
            const beforeTime = Date.now();
            tracker.setPosition('unit1', 100, 100);
            const afterTime = Date.now();
            
            const position = tracker.getPosition('unit1');
            expect(position.lastMoved).toBeGreaterThanOrEqual(beforeTime);
            expect(position.lastMoved).toBeLessThanOrEqual(afterTime);
        });
    });

    describe('Position Retrieval', () => {
        test('should get unit position', () => {
            tracker.setPosition('unit1', 150, 250, 135);
            const position = tracker.getPosition('unit1');
            
            expect(position).toBeDefined();
            expect(position.x).toBe(150);
            expect(position.y).toBe(250);
            expect(position.facing).toBe(135);
        });

        test('should return null for non-existent unit', () => {
            const position = tracker.getPosition('nonexistent');
            expect(position).toBeNull();
        });

        test('should get all positions', () => {
            tracker.setPosition('unit1', 100, 100);
            tracker.setPosition('unit2', 200, 200);
            tracker.setPosition('unit3', 300, 300);
            
            const allPositions = tracker.getAllPositions();
            expect(allPositions.length).toBe(3);
            
            const unitIds = allPositions.map(pos => pos.unitId);
            expect(unitIds).toContain('unit1');
            expect(unitIds).toContain('unit2');
            expect(unitIds).toContain('unit3');
        });
    });

    describe('Unit Movement', () => {
        test('should move unit by relative offset', () => {
            tracker.setPosition('unit1', 100, 100, 45);
            
            const success = tracker.moveUnit('unit1', 50, -25);
            expect(success).toBe(true);
            
            const position = tracker.getPosition('unit1');
            expect(position.x).toBe(150);
            expect(position.y).toBe(75);
            expect(position.facing).toBe(45); // Should remain unchanged
        });

        test('should move unit with new facing direction', () => {
            tracker.setPosition('unit1', 100, 100, 0);
            
            tracker.moveUnit('unit1', 25, 25, 90);
            
            const position = tracker.getPosition('unit1');
            expect(position.x).toBe(125);
            expect(position.y).toBe(125);
            expect(position.facing).toBe(90);
        });

        test('should return false when moving non-existent unit', () => {
            const success = tracker.moveUnit('nonexistent', 10, 10);
            expect(success).toBe(false);
        });

        test('should clamp movement to world bounds', () => {
            tracker.setPosition('unit1', 10, 10);
            
            tracker.moveUnit('unit1', -50, -50); // Should clamp to 0,0
            
            const position = tracker.getPosition('unit1');
            expect(position.x).toBe(0);
            expect(position.y).toBe(0);
        });
    });

    describe('Unit Removal', () => {
        test('should remove unit successfully', () => {
            tracker.setPosition('unit1', 100, 100);
            expect(tracker.getPosition('unit1')).toBeDefined();
            
            const success = tracker.removeUnit('unit1');
            expect(success).toBe(true);
            expect(tracker.getPosition('unit1')).toBeNull();
        });

        test('should return false when removing non-existent unit', () => {
            const success = tracker.removeUnit('nonexistent');
            expect(success).toBe(false);
        });
    });

    describe('Spatial Queries', () => {
        beforeEach(() => {
            // Set up a grid of units for testing
            tracker.setPosition('unit1', 100, 100); // Top-left
            tracker.setPosition('unit2', 200, 100); // Top-right
            tracker.setPosition('unit3', 100, 200); // Bottom-left
            tracker.setPosition('unit4', 200, 200); // Bottom-right
            tracker.setPosition('unit5', 300, 300); // Far away
        });

        test('should get units in rectangular area', () => {
            // Query top-left quadrant
            const units = tracker.getUnitsInArea(50, 50, 100, 100);
            expect(units).toContain('unit1');
            expect(units.length).toBe(1);
            
            // Query larger area covering multiple units
            const moreUnits = tracker.getUnitsInArea(90, 90, 120, 120);
            expect(moreUnits).toContain('unit1');
            expect(moreUnits).toContain('unit2');
            expect(moreUnits).toContain('unit3');
            expect(moreUnits).toContain('unit4');
            expect(moreUnits.length).toBe(4);
        });

        test('should get units in circular area', () => {
            // Small radius around unit1
            const nearUnits = tracker.getUnitsInRadius(100, 100, 50);
            expect(nearUnits).toContain('unit1');
            expect(nearUnits.length).toBe(1);
            
            // Larger radius covering multiple units
            const moreUnits = tracker.getUnitsInRadius(150, 150, 100);
            expect(moreUnits).toContain('unit1');
            expect(moreUnits).toContain('unit2');
            expect(moreUnits).toContain('unit3');
            expect(moreUnits).toContain('unit4');
            expect(moreUnits).not.toContain('unit5');
        });

        test('should get nearest units', () => {
            const nearest = tracker.getNearestUnits(150, 150, 3);
            
            expect(nearest.length).toBe(3);
            expect(nearest[0].unitId).toMatch(/unit[1-4]/); // One of the close units
            
            // All four units at (100,100), (200,100), (100,200), (200,200) are equidistant from (150,150)
            // So we check that distances are sorted, allowing for equal distances
            for (let i = 1; i < nearest.length; i++) {
                expect(nearest[i].distance).toBeGreaterThanOrEqual(nearest[i-1].distance);
            }
        });

        test('should get nearest units with distance limit', () => {
            const nearestWithLimit = tracker.getNearestUnits(100, 100, 5, 50);
            
            // Should only include units within distance 50
            expect(nearestWithLimit.length).toBe(1);
            expect(nearestWithLimit[0].unitId).toBe('unit1');
        });

        test('should get units at specific position', () => {
            const unitsAtPosition = tracker.getUnitsAtPosition(100, 100, 5);
            expect(unitsAtPosition).toContain('unit1');
            
            const noUnits = tracker.getUnitsAtPosition(500, 500, 5);
            expect(noUnits.length).toBe(0);
        });
    });

    describe('Distance Calculations', () => {
        beforeEach(() => {
            tracker.setPosition('unit1', 0, 0);
            tracker.setPosition('unit2', 3, 4); // Distance should be 5
            tracker.setPosition('unit3', 100, 100);
        });

        test('should calculate distance between units', () => {
            const distance = tracker.getDistanceBetweenUnits('unit1', 'unit2');
            expect(distance).toBeCloseTo(5, 2);
            
            const longerDistance = tracker.getDistanceBetweenUnits('unit1', 'unit3');
            expect(longerDistance).toBeCloseTo(141.42, 2);
        });

        test('should return null for non-existent units', () => {
            expect(tracker.getDistanceBetweenUnits('nonexistent', 'unit1')).toBeNull();
            expect(tracker.getDistanceBetweenUnits('unit1', 'nonexistent')).toBeNull();
        });

        test('should check if units are near each other', () => {
            expect(tracker.areUnitsNear('unit1', 'unit2', 10)).toBe(true);
            expect(tracker.areUnitsNear('unit1', 'unit2', 3)).toBe(false);
            expect(tracker.areUnitsNear('unit1', 'unit3', 50)).toBe(false);
        });
    });

    describe('Directional Queries', () => {
        beforeEach(() => {
            tracker.setPosition('unit1', 100, 100, 0);   // North
            tracker.setPosition('unit2', 200, 200, 90);  // East
            tracker.setPosition('unit3', 300, 300, 180); // South
            tracker.setPosition('unit4', 400, 400, 270); // West
            tracker.setPosition('unit5', 500, 500, 45);  // Northeast
        });

        test('should get units facing specific direction', () => {
            const northFacing = tracker.getUnitsFacingDirection(0, 10);
            expect(northFacing).toContain('unit1');
            expect(northFacing.length).toBe(1);
            
            const eastFacing = tracker.getUnitsFacingDirection(90, 10);
            expect(eastFacing).toContain('unit2');
            expect(eastFacing.length).toBe(1);
        });

        test('should get units facing direction with tolerance', () => {
            const northishFacing = tracker.getUnitsFacingDirection(0, 50);
            expect(northishFacing).toContain('unit1');
            expect(northishFacing).toContain('unit5'); // 45 degrees is within 50 degree tolerance
            expect(northishFacing.length).toBe(2);
        });

        test('should handle wrapping around 360 degrees', () => {
            tracker.setPosition('unit6', 600, 600, 350); // 10 degrees from north
            
            const nearNorthFacing = tracker.getUnitsFacingDirection(0, 20);
            expect(nearNorthFacing).toContain('unit1');
            expect(nearNorthFacing).toContain('unit6');
        });
    });

    describe('Free Position Finding', () => {
        beforeEach(() => {
            // Place units in a grid pattern
            tracker.setPosition('unit1', 100, 100);
            tracker.setPosition('unit2', 120, 100);
            tracker.setPosition('unit3', 100, 120);
        });

        test('should find free position near target', () => {
            const freePos = tracker.findFreePositionNear(110, 110, 50, 5);
            
            expect(freePos).toBeDefined();
            expect(freePos.x).toBeGreaterThanOrEqual(0);
            expect(freePos.y).toBeGreaterThanOrEqual(0);
            expect(freePos.x).toBeLessThanOrEqual(tracker.worldWidth);
            expect(freePos.y).toBeLessThanOrEqual(tracker.worldHeight);
            
            // Verify position is actually free
            const unitsNearby = tracker.getUnitsAtPosition(freePos.x, freePos.y, 5);
            expect(unitsNearby.length).toBe(0);
        });

        test('should return null when no free position available', () => {
            // Fill a small area densely
            for (let x = 90; x <= 130; x += 2) {
                for (let y = 90; y <= 130; y += 2) {
                    tracker.setPosition(`dense_${x}_${y}`, x, y);
                }
            }
            
            const freePos = tracker.findFreePositionNear(110, 110, 10, 1);
            expect(freePos).toBeNull();
        });

        test('should respect world boundaries when finding positions', () => {
            const freePos = tracker.findFreePositionNear(10, 10, 50, 5);
            
            if (freePos) {
                expect(freePos.x).toBeGreaterThanOrEqual(0);
                expect(freePos.y).toBeGreaterThanOrEqual(0);
                expect(freePos.x).toBeLessThanOrEqual(tracker.worldWidth);
                expect(freePos.y).toBeLessThanOrEqual(tracker.worldHeight);
            }
        });
    });

    describe('World Boundaries', () => {
        test('should set new world bounds', () => {
            tracker.setWorldBounds(500, 400);
            
            expect(tracker.worldWidth).toBe(500);
            expect(tracker.worldHeight).toBe(400);
        });

        test('should clamp existing units to new bounds', () => {
            tracker.setPosition('unit1', 800, 600);
            tracker.setPosition('unit2', 200, 200);
            
            tracker.setWorldBounds(500, 400);
            
            const unit1Pos = tracker.getPosition('unit1');
            const unit2Pos = tracker.getPosition('unit2');
            
            expect(unit1Pos.x).toBe(500); // Clamped from 800
            expect(unit1Pos.y).toBe(400); // Clamped from 600
            expect(unit2Pos.x).toBe(200); // Unchanged
            expect(unit2Pos.y).toBe(200); // Unchanged
        });
    });

    describe('Statistics', () => {
        test('should get position statistics', () => {
            tracker.setPosition('unit1', 100, 200);
            tracker.setPosition('unit2', 300, 400);
            tracker.setPosition('unit3', 200, 100);
            
            const stats = tracker.getStats();
            
            expect(stats.totalUnits).toBe(3);
            expect(parseFloat(stats.averageX)).toBeCloseTo(200, 1);
            expect(parseFloat(stats.averageY)).toBeCloseTo(233.33, 1);
            expect(stats.bounds).toEqual({
                minX: 100,
                maxX: 300,
                minY: 100,
                maxY: 400
            });
        });

        test('should handle empty statistics', () => {
            const stats = tracker.getStats();
            
            expect(stats.totalUnits).toBe(0);
            expect(stats.averageX).toBe(0);
            expect(stats.averageY).toBe(0);
            expect(stats.bounds).toEqual({
                minX: 0,
                maxX: 0,
                minY: 0,
                maxY: 0
            });
        });
    });

    describe('Event System', () => {
        test('should notify listeners on position change', () => {
            const listener = jest.fn();
            const listenerId = tracker.addEventListener('position_changed', listener);
            
            tracker.setPosition('unit1', 100, 100, 45);
            
            expect(listener).toHaveBeenCalledWith({
                unitId: 'unit1',
                oldPosition: undefined,
                newPosition: {
                    x: 100,
                    y: 100,
                    facing: 45,
                    lastMoved: expect.any(Number)
                }
            });
            expect(typeof listenerId).toBe('string');
        });

        test('should notify listeners with old position on update', () => {
            const listener = jest.fn();
            tracker.addEventListener('position_changed', listener);
            
            tracker.setPosition('unit1', 100, 100, 0);
            tracker.setPosition('unit1', 200, 200, 90);
            
            expect(listener).toHaveBeenCalledTimes(2);
            const secondCall = listener.mock.calls[1][0];
            expect(secondCall.oldPosition).toEqual({
                x: 100,
                y: 100,
                facing: 0,
                lastMoved: expect.any(Number)
            });
        });

        test('should notify listeners on unit removal', () => {
            const listener = jest.fn();
            tracker.addEventListener('unit_removed', listener);
            
            tracker.setPosition('unit1', 100, 100);
            tracker.removeUnit('unit1');
            
            expect(listener).toHaveBeenCalledWith({
                unitId: 'unit1',
                lastPosition: {
                    x: 100,
                    y: 100,
                    facing: 0,
                    lastMoved: expect.any(Number)
                }
            });
        });

        test('should remove event listeners', () => {
            const listener = jest.fn();
            const listenerId = tracker.addEventListener('position_changed', listener);
            
            const removed = tracker.removeEventListener('position_changed', listenerId);
            expect(removed).toBe(true);
            
            tracker.setPosition('unit1', 100, 100);
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('Data Management', () => {
        beforeEach(() => {
            tracker.setPosition('unit1', 100, 100, 45);
            tracker.setPosition('unit2', 200, 200, 90);
        });

        test('should clear all position data', () => {
            expect(tracker.getAllPositions().length).toBe(2);
            
            tracker.clearAll();
            
            expect(tracker.getAllPositions().length).toBe(0);
            expect(tracker.getStats().totalUnits).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        test('should handle very large coordinates', () => {
            const largeTracker = new UnitPositionTracker(1000000, 1000000);
            largeTracker.setPosition('unit1', 999999, 999999);
            
            const position = largeTracker.getPosition('unit1');
            expect(position.x).toBe(999999);
            expect(position.y).toBe(999999);
        });

        test('should handle rapid position updates', () => {
            for (let i = 0; i < 1000; i++) {
                tracker.setPosition('unit1', i % 1000, (i * 2) % 800);
            }
            
            const finalPosition = tracker.getPosition('unit1');
            expect(finalPosition.x).toBe(999);
            expect(finalPosition.y).toBe(398); // (999 * 2) % 800 = 1998 % 800 = 398
        });

        test('should handle units with same positions', () => {
            tracker.setPosition('unit1', 100, 100);
            tracker.setPosition('unit2', 100, 100);
            tracker.setPosition('unit3', 100, 100);
            
            const unitsAtPosition = tracker.getUnitsAtPosition(100, 100, 1);
            expect(unitsAtPosition.length).toBe(3);
            expect(unitsAtPosition).toContain('unit1');
            expect(unitsAtPosition).toContain('unit2');
            expect(unitsAtPosition).toContain('unit3');
        });

        test('should handle floating point coordinates', () => {
            tracker.setPosition('unit1', 100.5, 200.7, 45.3);
            
            const position = tracker.getPosition('unit1');
            expect(position.x).toBeCloseTo(100.5, 1);
            expect(position.y).toBeCloseTo(200.7, 1);
            expect(position.facing).toBeCloseTo(45.3, 1);
        });
    });
});