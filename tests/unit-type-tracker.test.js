/**
 * @jest-environment jsdom
 */

const UnitTypeTracker = require('../unit-type-tracker.js');

describe('UnitTypeTracker', () => {
    let tracker;

    beforeEach(() => {
        tracker = new UnitTypeTracker();
    });

    describe('Initialization', () => {
        test('should initialize with empty tracker', () => {
            expect(tracker.getTotalUnitCount()).toBe(0);
            expect(tracker.getActiveTypes()).toEqual([]);
            expect(tracker.getTypeCounts()).toEqual({});
        });
    });

    describe('Unit Registration', () => {
        test('should register unit with type successfully', () => {
            const success = tracker.registerUnit('unit1', 'warrior');
            
            expect(success).toBe(true);
            expect(tracker.hasUnit('unit1')).toBe(true);
            expect(tracker.getUnitType('unit1')).toBe('warrior');
            expect(tracker.getTotalUnitCount()).toBe(1);
        });

        test('should track multiple units of same type', () => {
            tracker.registerUnit('unit1', 'warrior');
            tracker.registerUnit('unit2', 'warrior');
            tracker.registerUnit('unit3', 'archer');
            
            const warriors = tracker.getUnitsOfType('warrior');
            const archers = tracker.getUnitsOfType('archer');
            
            expect(warriors).toEqual(['unit1', 'unit2']);
            expect(archers).toEqual(['unit3']);
            expect(tracker.getTypeCount('warrior')).toBe(2);
            expect(tracker.getTypeCount('archer')).toBe(1);
        });

        test('should throw error for missing parameters', () => {
            expect(() => tracker.registerUnit('', 'warrior')).toThrow('Both unitId and typeId are required');
            expect(() => tracker.registerUnit('unit1', '')).toThrow('Both unitId and typeId are required');
            expect(() => tracker.registerUnit(null, 'warrior')).toThrow('Both unitId and typeId are required');
            expect(() => tracker.registerUnit('unit1', null)).toThrow('Both unitId and typeId are required');
        });

        test('should re-register unit with different type', () => {
            tracker.registerUnit('unit1', 'warrior');
            expect(tracker.getUnitType('unit1')).toBe('warrior');
            expect(tracker.getTypeCount('warrior')).toBe(1);
            
            // Re-register with different type
            tracker.registerUnit('unit1', 'archer');
            expect(tracker.getUnitType('unit1')).toBe('archer');
            expect(tracker.getTypeCount('warrior')).toBe(0);
            expect(tracker.getTypeCount('archer')).toBe(1);
        });
    });

    describe('Unit Unregistration', () => {
        test('should unregister unit successfully', () => {
            tracker.registerUnit('unit1', 'warrior');
            tracker.registerUnit('unit2', 'warrior');
            
            const success = tracker.unregisterUnit('unit1');
            
            expect(success).toBe(true);
            expect(tracker.hasUnit('unit1')).toBe(false);
            expect(tracker.getTypeCount('warrior')).toBe(1);
            expect(tracker.getUnitsOfType('warrior')).toEqual(['unit2']);
        });

        test('should return false when unregistering non-existent unit', () => {
            const success = tracker.unregisterUnit('nonexistent');
            expect(success).toBe(false);
        });

        test('should clean up empty type sets', () => {
            tracker.registerUnit('unit1', 'warrior');
            expect(tracker.hasUnitsOfType('warrior')).toBe(true);
            
            tracker.unregisterUnit('unit1');
            expect(tracker.hasUnitsOfType('warrior')).toBe(false);
            expect(tracker.getActiveTypes()).not.toContain('warrior');
        });
    });

    describe('Type Queries', () => {
        beforeEach(() => {
            tracker.registerUnit('unit1', 'warrior');
            tracker.registerUnit('unit2', 'warrior');
            tracker.registerUnit('unit3', 'archer');
            tracker.registerUnit('unit4', 'mage');
            tracker.registerUnit('unit5', 'mage');
            tracker.registerUnit('unit6', 'mage');
        });

        test('should get unit type correctly', () => {
            expect(tracker.getUnitType('unit1')).toBe('warrior');
            expect(tracker.getUnitType('unit3')).toBe('archer');
            expect(tracker.getUnitType('nonexistent')).toBeNull();
        });

        test('should get units of specific type', () => {
            const warriors = tracker.getUnitsOfType('warrior');
            const mages = tracker.getUnitsOfType('mage');
            const scouts = tracker.getUnitsOfType('scout');
            
            expect(warriors).toEqual(['unit1', 'unit2']);
            expect(mages).toEqual(['unit4', 'unit5', 'unit6']);
            expect(scouts).toEqual([]);
        });

        test('should get active types', () => {
            const activeTypes = tracker.getActiveTypes();
            expect(activeTypes).toEqual(expect.arrayContaining(['warrior', 'archer', 'mage']));
            expect(activeTypes.length).toBe(3);
        });

        test('should get type counts', () => {
            const counts = tracker.getTypeCounts();
            expect(counts).toEqual({
                warrior: 2,
                archer: 1,
                mage: 3
            });
        });

        test('should get individual type count', () => {
            expect(tracker.getTypeCount('warrior')).toBe(2);
            expect(tracker.getTypeCount('archer')).toBe(1);
            expect(tracker.getTypeCount('mage')).toBe(3);
            expect(tracker.getTypeCount('scout')).toBe(0);
        });

        test('should check if unit exists', () => {
            expect(tracker.hasUnit('unit1')).toBe(true);
            expect(tracker.hasUnit('unit5')).toBe(true);
            expect(tracker.hasUnit('nonexistent')).toBe(false);
        });

        test('should check if type has units', () => {
            expect(tracker.hasUnitsOfType('warrior')).toBe(true);
            expect(tracker.hasUnitsOfType('mage')).toBe(true);
            expect(tracker.hasUnitsOfType('scout')).toBe(false);
        });

        test('should get total unit count', () => {
            expect(tracker.getTotalUnitCount()).toBe(6);
        });
    });

    describe('Statistical Queries', () => {
        beforeEach(() => {
            tracker.registerUnit('unit1', 'warrior');
            tracker.registerUnit('unit2', 'warrior');
            tracker.registerUnit('unit3', 'warrior');
            tracker.registerUnit('unit4', 'archer');
            tracker.registerUnit('unit5', 'mage');
        });

        test('should get most common type', () => {
            const mostCommon = tracker.getMostCommonType();
            expect(mostCommon).toEqual({ typeId: 'warrior', count: 3 });
        });

        test('should get least common type', () => {
            const leastCommon = tracker.getLeastCommonType();
            expect(leastCommon.count).toBe(1);
            expect(['archer', 'mage']).toContain(leastCommon.typeId);
        });

        test('should return null for most/least common when no units', () => {
            const emptyTracker = new UnitTypeTracker();
            expect(emptyTracker.getMostCommonType()).toBeNull();
            expect(emptyTracker.getLeastCommonType()).toBeNull();
        });

        test('should get type distribution statistics', () => {
            const stats = tracker.getTypeDistributionStats();
            
            expect(stats.totalUnits).toBe(5);
            expect(stats.uniqueTypes).toBe(3);
            expect(stats.averageUnitsPerType).toBe('1.67');
            expect(stats.distribution).toEqual({
                warrior: 3,
                archer: 1,
                mage: 1
            });
            expect(stats.percentages.warrior).toBe('60.00');
            expect(stats.percentages.archer).toBe('20.00');
            expect(stats.percentages.mage).toBe('20.00');
        });

        test('should handle empty distribution statistics', () => {
            const emptyTracker = new UnitTypeTracker();
            const stats = emptyTracker.getTypeDistributionStats();
            
            expect(stats.totalUnits).toBe(0);
            expect(stats.uniqueTypes).toBe(0);
            expect(stats.averageUnitsPerType).toBe(0);
            expect(stats.distribution).toEqual({});
            expect(stats.percentages).toEqual({});
        });
    });

    describe('Multi-Type Queries', () => {
        beforeEach(() => {
            tracker.registerUnit('unit1', 'warrior');
            tracker.registerUnit('unit2', 'archer');
            tracker.registerUnit('unit3', 'mage');
            tracker.registerUnit('unit4', 'warrior');
            tracker.registerUnit('unit5', 'scout');
        });

        test('should get units by multiple types', () => {
            const combatUnits = tracker.getUnitsByTypes(['warrior', 'archer']);
            const magicalUnits = tracker.getUnitsByTypes(['mage', 'scout']);
            
            expect(combatUnits).toEqual(expect.arrayContaining(['unit1', 'unit2', 'unit4']));
            expect(combatUnits.length).toBe(3);
            expect(magicalUnits).toEqual(expect.arrayContaining(['unit3', 'unit5']));
            expect(magicalUnits.length).toBe(2);
        });

        test('should handle empty type array', () => {
            const units = tracker.getUnitsByTypes([]);
            expect(units).toEqual([]);
        });

        test('should handle non-existent types in array', () => {
            const units = tracker.getUnitsByTypes(['warrior', 'nonexistent', 'archer']);
            expect(units).toEqual(expect.arrayContaining(['unit1', 'unit2', 'unit4']));
            expect(units.length).toBe(3);
        });
    });

    describe('Type Changes', () => {
        test('should change unit type successfully', () => {
            tracker.registerUnit('unit1', 'warrior');
            expect(tracker.getUnitType('unit1')).toBe('warrior');
            expect(tracker.getTypeCount('warrior')).toBe(1);
            expect(tracker.getTypeCount('archer')).toBe(0);
            
            const changed = tracker.changeUnitType('unit1', 'archer');
            
            expect(changed).toBe(true);
            expect(tracker.getUnitType('unit1')).toBe('archer');
            expect(tracker.getTypeCount('warrior')).toBe(0);
            expect(tracker.getTypeCount('archer')).toBe(1);
        });

        test('should return false when changing type of non-existent unit', () => {
            const changed = tracker.changeUnitType('nonexistent', 'warrior');
            expect(changed).toBe(false);
        });
    });

    describe('Event System', () => {
        test('should notify listeners on unit registration', () => {
            const listener = jest.fn();
            const listenerId = tracker.addEventListener('unit_registered', listener);
            
            tracker.registerUnit('unit1', 'warrior');
            
            expect(listener).toHaveBeenCalledWith({
                unitId: 'unit1',
                typeId: 'warrior'
            });
            expect(typeof listenerId).toBe('string');
        });

        test('should notify listeners on unit unregistration', () => {
            const listener = jest.fn();
            tracker.addEventListener('unit_unregistered', listener);
            
            tracker.registerUnit('unit1', 'warrior');
            tracker.unregisterUnit('unit1');
            
            expect(listener).toHaveBeenCalledWith({
                unitId: 'unit1',
                typeId: 'warrior'
            });
        });

        test('should notify listeners on type change', () => {
            const listener = jest.fn();
            tracker.addEventListener('unit_type_changed', listener);
            
            tracker.registerUnit('unit1', 'warrior');
            tracker.changeUnitType('unit1', 'archer');
            
            expect(listener).toHaveBeenCalledWith({
                unitId: 'unit1',
                oldTypeId: 'warrior',
                newTypeId: 'archer'
            });
        });

        test('should remove event listeners', () => {
            const listener = jest.fn();
            const listenerId = tracker.addEventListener('unit_registered', listener);
            
            const removed = tracker.removeEventListener('unit_registered', listenerId);
            expect(removed).toBe(true);
            
            tracker.registerUnit('unit1', 'warrior');
            expect(listener).not.toHaveBeenCalled();
        });

        test('should return false when removing non-existent listener', () => {
            const removed = tracker.removeEventListener('unit_registered', 'nonexistent');
            expect(removed).toBe(false);
        });

        test('should handle listener errors gracefully', () => {
            const errorListener = jest.fn(() => {
                throw new Error('Listener error');
            });
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            tracker.addEventListener('unit_registered', errorListener);
            
            // Should not throw
            expect(() => tracker.registerUnit('unit1', 'warrior')).not.toThrow();
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Data Management', () => {
        beforeEach(() => {
            tracker.registerUnit('unit1', 'warrior');
            tracker.registerUnit('unit2', 'archer');
            tracker.registerUnit('unit3', 'mage');
        });

        test('should clear all tracking data', () => {
            expect(tracker.getTotalUnitCount()).toBe(3);
            
            tracker.clearAll();
            
            expect(tracker.getTotalUnitCount()).toBe(0);
            expect(tracker.getActiveTypes()).toEqual([]);
            expect(tracker.getTypeCounts()).toEqual({});
        });

        test('should export tracking data', () => {
            const data = tracker.exportData();
            
            expect(data).toBeDefined();
            expect(data.unitTypeMap).toEqual({
                unit1: 'warrior',
                unit2: 'archer',
                unit3: 'mage'
            });
            expect(data.typeUnitsMap).toEqual({
                warrior: ['unit1'],
                archer: ['unit2'],
                mage: ['unit3']
            });
            expect(typeof data.timestamp).toBe('number');
        });

        test('should import tracking data', () => {
            const exportedData = tracker.exportData();
            const newTracker = new UnitTypeTracker();
            
            expect(newTracker.getTotalUnitCount()).toBe(0);
            
            const imported = newTracker.importData(exportedData);
            
            expect(imported).toBe(true);
            expect(newTracker.getTotalUnitCount()).toBe(3);
            expect(newTracker.getUnitType('unit1')).toBe('warrior');
            expect(newTracker.getUnitType('unit2')).toBe('archer');
            expect(newTracker.getUnitType('unit3')).toBe('mage');
        });

        test('should handle import errors gracefully', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            const imported = tracker.importData({ invalid: 'data' });
            
            expect(imported).toBe(true); // Should still return true but with empty data
            expect(consoleErrorSpy).not.toHaveBeenCalled(); // No error for this simple case
            
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Edge Cases', () => {
        test('should handle rapid registrations and unregistrations', () => {
            // Rapidly register and unregister units
            for (let i = 0; i < 100; i++) {
                tracker.registerUnit(`unit${i}`, 'warrior');
                if (i % 2 === 0) {
                    tracker.unregisterUnit(`unit${i}`);
                }
            }
            
            expect(tracker.getTypeCount('warrior')).toBe(50);
            expect(tracker.getTotalUnitCount()).toBe(50);
        });

        test('should maintain consistency with complex operations', () => {
            // Perform complex sequence of operations
            tracker.registerUnit('unit1', 'warrior');
            tracker.registerUnit('unit2', 'archer');
            tracker.changeUnitType('unit1', 'mage');
            tracker.registerUnit('unit3', 'warrior');
            tracker.unregisterUnit('unit2');
            tracker.changeUnitType('unit3', 'archer');
            
            // Verify final state
            expect(tracker.getUnitType('unit1')).toBe('mage');
            expect(tracker.getUnitType('unit3')).toBe('archer');
            expect(tracker.hasUnit('unit2')).toBe(false);
            expect(tracker.getTypeCount('warrior')).toBe(0);
            expect(tracker.getTypeCount('archer')).toBe(1);
            expect(tracker.getTypeCount('mage')).toBe(1);
        });

        test('should handle units with special characters in IDs', () => {
            const specialIds = ['unit-1', 'unit_2', 'unit@3', 'unit.4'];
            
            for (const id of specialIds) {
                tracker.registerUnit(id, 'warrior');
                expect(tracker.hasUnit(id)).toBe(true);
                expect(tracker.getUnitType(id)).toBe('warrior');
            }
            
            expect(tracker.getTypeCount('warrior')).toBe(specialIds.length);
        });
    });
});