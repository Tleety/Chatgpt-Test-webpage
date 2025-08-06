/**
 * @jest-environment jsdom
 */

const UnitTypes = require('../unit-types.js');
const Units = require('../units.js');

describe('Units', () => {
    let unitTypes;
    let units;

    beforeEach(() => {
        unitTypes = new UnitTypes();
        units = new Units(unitTypes);
    });

    describe('Initialization', () => {
        test('should initialize with empty unit collection', () => {
            expect(units.getUnitCount()).toBe(0);
            expect(units.getAllUnits()).toEqual([]);
        });

        test('should throw error if initialized without UnitTypes', () => {
            expect(() => new Units()).toThrow('Units component requires a UnitTypes instance');
            expect(() => new Units(null)).toThrow('Units component requires a UnitTypes instance');
        });
    });

    describe('Unit Creation', () => {
        test('should create a unit with valid type', () => {
            const unitId = units.createUnit('warrior');
            
            expect(unitId).toBeDefined();
            expect(typeof unitId).toBe('string');
            expect(unitId).toMatch(/^unit_\d+$/);
            expect(units.getUnitCount()).toBe(1);
        });

        test('should create unit with correct default stats', () => {
            const unitId = units.createUnit('warrior');
            const unit = units.getUnit(unitId);
            const warriorType = unitTypes.getUnitType('warrior');
            
            expect(unit).toBeDefined();
            expect(unit.typeId).toBe('warrior');
            expect(unit.currentStats).toEqual(warriorType.stats);
            expect(unit.maxStats).toEqual(warriorType.stats);
            expect(unit.state.isAlive).toBe(true);
            expect(unit.state.status).toBe('idle');
        });

        test('should create unit with custom options', () => {
            const options = {
                name: 'Elite Warrior',
                health: 150,
                damage: 35,
                level: 5,
                tags: ['elite', 'veteran']
            };
            
            const unitId = units.createUnit('warrior', options);
            const unit = units.getUnit(unitId);
            
            expect(unit.name).toBe('Elite Warrior');
            expect(unit.currentStats.health).toBe(150);
            expect(unit.currentStats.damage).toBe(35);
            expect(unit.metadata.level).toBe(5);
            expect(unit.metadata.tags).toEqual(['elite', 'veteran']);
        });

        test('should throw error for unknown unit type', () => {
            expect(() => units.createUnit('unknown')).toThrow('Unknown unit type: unknown');
        });

        test('should generate unique unit IDs', () => {
            const unitId1 = units.createUnit('warrior');
            const unitId2 = units.createUnit('archer');
            
            expect(unitId1).not.toBe(unitId2);
        });

        test('should set creation timestamp', () => {
            const beforeCreation = Date.now();
            const unitId = units.createUnit('mage');
            const afterCreation = Date.now();
            const unit = units.getUnit(unitId);
            
            expect(unit.state.createdAt).toBeGreaterThanOrEqual(beforeCreation);
            expect(unit.state.createdAt).toBeLessThanOrEqual(afterCreation);
        });
    });

    describe('Unit Retrieval', () => {
        test('should retrieve unit by ID', () => {
            const unitId = units.createUnit('archer');
            const unit = units.getUnit(unitId);
            
            expect(unit).toBeDefined();
            expect(unit.id).toBe(unitId);
            expect(unit.typeId).toBe('archer');
        });

        test('should return null for non-existent unit', () => {
            const unit = units.getUnit('nonexistent');
            expect(unit).toBeNull();
        });

        test('should get all units', () => {
            units.createUnit('warrior');
            units.createUnit('archer');
            units.createUnit('mage');
            
            const allUnits = units.getAllUnits();
            expect(allUnits.length).toBe(3);
            
            const typeIds = allUnits.map(unit => unit.typeId);
            expect(typeIds).toContain('warrior');
            expect(typeIds).toContain('archer');
            expect(typeIds).toContain('mage');
        });

        test('should get units by type', () => {
            units.createUnit('warrior');
            units.createUnit('warrior');
            units.createUnit('archer');
            
            const warriors = units.getUnitsByType('warrior');
            const archers = units.getUnitsByType('archer');
            
            expect(warriors.length).toBe(2);
            expect(archers.length).toBe(1);
            expect(warriors.every(unit => unit.typeId === 'warrior')).toBe(true);
            expect(archers.every(unit => unit.typeId === 'archer')).toBe(true);
        });

        test('should get units by status', () => {
            const unitId1 = units.createUnit('warrior');
            const unitId2 = units.createUnit('archer');
            const unitId3 = units.createUnit('mage');
            
            units.setUnitStatus(unitId2, 'attacking');
            units.setUnitStatus(unitId3, 'defending');
            
            const idleUnits = units.getUnitsByStatus('idle');
            const attackingUnits = units.getUnitsByStatus('attacking');
            
            expect(idleUnits.length).toBe(1);
            expect(attackingUnits.length).toBe(1);
            expect(idleUnits[0].id).toBe(unitId1);
            expect(attackingUnits[0].id).toBe(unitId2);
        });

        test('should get alive units only', () => {
            const unitId1 = units.createUnit('warrior');
            const unitId2 = units.createUnit('archer');
            
            // Kill one unit
            units.damageUnit(unitId2, 1000);
            
            const aliveUnits = units.getAliveUnits();
            expect(aliveUnits.length).toBe(1);
            expect(aliveUnits[0].id).toBe(unitId1);
        });
    });

    describe('Unit Management', () => {
        test('should remove unit successfully', () => {
            const unitId = units.createUnit('scout');
            expect(units.getUnitCount()).toBe(1);
            
            const removed = units.removeUnit(unitId);
            expect(removed).toBe(true);
            expect(units.getUnitCount()).toBe(0);
            expect(units.getUnit(unitId)).toBeNull();
        });

        test('should return false when removing non-existent unit', () => {
            const removed = units.removeUnit('nonexistent');
            expect(removed).toBe(false);
        });

        test('should clear all units', () => {
            units.createUnit('warrior');
            units.createUnit('archer');
            units.createUnit('mage');
            
            expect(units.getUnitCount()).toBe(3);
            
            units.clearAllUnits();
            
            expect(units.getUnitCount()).toBe(0);
            expect(units.getAllUnits()).toEqual([]);
        });
    });

    describe('Stat Management', () => {
        test('should update unit stats', () => {
            const unitId = units.createUnit('warrior');
            const initialStats = units.getUnit(unitId).currentStats;
            
            const success = units.updateUnitStats(unitId, { health: -10, damage: -5 });
            expect(success).toBe(true);
            
            const updatedUnit = units.getUnit(unitId);
            expect(updatedUnit.currentStats.health).toBe(initialStats.health - 10);
            expect(updatedUnit.currentStats.damage).toBe(initialStats.damage - 5);
        });

        test('should not allow stats to exceed maximum values', () => {
            const unitId = units.createUnit('warrior');
            const unit = units.getUnit(unitId);
            const maxHealth = unit.maxStats.health;
            
            units.updateUnitStats(unitId, { health: 1000 });
            
            const updatedUnit = units.getUnit(unitId);
            expect(updatedUnit.currentStats.health).toBe(maxHealth);
        });

        test('should not allow stats to go below zero', () => {
            const unitId = units.createUnit('warrior');
            
            units.updateUnitStats(unitId, { health: -1000 });
            
            const updatedUnit = units.getUnit(unitId);
            expect(updatedUnit.currentStats.health).toBe(0);
        });

        test('should mark unit as dead when health reaches zero', () => {
            const unitId = units.createUnit('warrior');
            
            units.updateUnitStats(unitId, { health: -1000 });
            
            const unit = units.getUnit(unitId);
            expect(unit.state.isAlive).toBe(false);
            expect(unit.state.status).toBe('dead');
        });

        test('should return false when updating non-existent unit', () => {
            const success = units.updateUnitStats('nonexistent', { health: 10 });
            expect(success).toBe(false);
        });
    });

    describe('Status Management', () => {
        test('should set unit status', () => {
            const unitId = units.createUnit('warrior');
            
            const success = units.setUnitStatus(unitId, 'attacking', 'sword slash');
            expect(success).toBe(true);
            
            const unit = units.getUnit(unitId);
            expect(unit.state.status).toBe('attacking');
            expect(unit.state.lastAction).toBe('sword slash');
        });

        test('should return false when setting status of non-existent unit', () => {
            const success = units.setUnitStatus('nonexistent', 'attacking');
            expect(success).toBe(false);
        });
    });

    describe('Combat Actions', () => {
        test('should heal unit', () => {
            const unitId = units.createUnit('warrior');
            
            // Damage first
            units.damageUnit(unitId, 20);
            const damagedHealth = units.getUnit(unitId).currentStats.health;
            
            // Then heal
            const healed = units.healUnit(unitId, 10);
            expect(healed).toBe(true);
            
            const healedHealth = units.getUnit(unitId).currentStats.health;
            expect(healedHealth).toBe(damagedHealth + 10);
        });

        test('should damage unit', () => {
            const unitId = units.createUnit('warrior');
            const initialHealth = units.getUnit(unitId).currentStats.health;
            
            const damaged = units.damageUnit(unitId, 15);
            expect(damaged).toBe(true);
            
            const finalHealth = units.getUnit(unitId).currentStats.health;
            expect(finalHealth).toBe(initialHealth - 15);
        });

        test('should throw error for negative heal amount', () => {
            const unitId = units.createUnit('warrior');
            expect(() => units.healUnit(unitId, -10)).toThrow('Heal amount must be positive');
        });

        test('should throw error for negative damage amount', () => {
            const unitId = units.createUnit('warrior');
            expect(() => units.damageUnit(unitId, -10)).toThrow('Damage amount must be positive');
        });
    });

    describe('Level Management', () => {
        test('should level up unit with default stat boosts', () => {
            const unitId = units.createUnit('warrior');
            const initialLevel = units.getUnit(unitId).metadata.level;
            const initialStats = { ...units.getUnit(unitId).currentStats };
            
            const leveledUp = units.levelUpUnit(unitId);
            expect(leveledUp).toBe(true);
            
            const unit = units.getUnit(unitId);
            expect(unit.metadata.level).toBe(initialLevel + 1);
            expect(unit.currentStats.health).toBe(initialStats.health + 5);
            expect(unit.currentStats.damage).toBe(initialStats.damage + 2);
            expect(unit.currentStats.speed).toBe(initialStats.speed + 1);
            expect(unit.currentStats.defense).toBe(initialStats.defense + 1);
        });

        test('should level up unit with custom stat boosts', () => {
            const unitId = units.createUnit('mage');
            const initialStats = { ...units.getUnit(unitId).currentStats };
            
            const customBoosts = { health: 3, damage: 8, speed: 2, defense: 1 };
            const leveledUp = units.levelUpUnit(unitId, customBoosts);
            expect(leveledUp).toBe(true);
            
            const unit = units.getUnit(unitId);
            expect(unit.currentStats.health).toBe(initialStats.health + 3);
            expect(unit.currentStats.damage).toBe(initialStats.damage + 8);
        });

        test('should return false when leveling non-existent unit', () => {
            const leveledUp = units.levelUpUnit('nonexistent');
            expect(leveledUp).toBe(false);
        });
    });

    describe('Type Information', () => {
        test('should get unit type information', () => {
            const unitId = units.createUnit('archer');
            const typeInfo = units.getUnitTypeInfo(unitId);
            const expectedTypeInfo = unitTypes.getUnitType('archer');
            
            expect(typeInfo).toEqual(expectedTypeInfo);
        });

        test('should return null for non-existent unit type info', () => {
            const typeInfo = units.getUnitTypeInfo('nonexistent');
            expect(typeInfo).toBeNull();
        });

        test('should get detailed unit information', () => {
            const unitId = units.createUnit('scout');
            const details = units.getUnitDetails(unitId);
            
            expect(details).toBeDefined();
            expect(details.id).toBe(unitId);
            expect(details.typeId).toBe('scout');
            expect(details.typeInfo).toBeDefined();
            expect(details.typeInfo.name).toBe('Scout');
        });
    });

    describe('Tag Management', () => {
        test('should add tag to unit', () => {
            const unitId = units.createUnit('warrior');
            
            const added = units.addUnitTag(unitId, 'veteran');
            expect(added).toBe(true);
            
            const unit = units.getUnit(unitId);
            expect(unit.metadata.tags).toContain('veteran');
        });

        test('should not add duplicate tags', () => {
            const unitId = units.createUnit('warrior');
            
            units.addUnitTag(unitId, 'veteran');
            units.addUnitTag(unitId, 'veteran');
            
            const unit = units.getUnit(unitId);
            const veteranTags = unit.metadata.tags.filter(tag => tag === 'veteran');
            expect(veteranTags.length).toBe(1);
        });

        test('should remove tag from unit', () => {
            const unitId = units.createUnit('warrior');
            units.addUnitTag(unitId, 'veteran');
            units.addUnitTag(unitId, 'elite');
            
            const removed = units.removeUnitTag(unitId, 'veteran');
            expect(removed).toBe(true);
            
            const unit = units.getUnit(unitId);
            expect(unit.metadata.tags).not.toContain('veteran');
            expect(unit.metadata.tags).toContain('elite');
        });

        test('should return false when removing non-existent tag', () => {
            const unitId = units.createUnit('warrior');
            
            const removed = units.removeUnitTag(unitId, 'nonexistent');
            expect(removed).toBe(false);
        });

        test('should get units by tag', () => {
            const unitId1 = units.createUnit('warrior');
            const unitId2 = units.createUnit('archer');
            const unitId3 = units.createUnit('mage');
            
            units.addUnitTag(unitId1, 'veteran');
            units.addUnitTag(unitId2, 'veteran');
            units.addUnitTag(unitId3, 'rookie');
            
            const veterans = units.getUnitsByTag('veteran');
            const rookies = units.getUnitsByTag('rookie');
            
            expect(veterans.length).toBe(2);
            expect(rookies.length).toBe(1);
            expect(veterans.map(u => u.id)).toContain(unitId1);
            expect(veterans.map(u => u.id)).toContain(unitId2);
        });
    });

    describe('Edge Cases', () => {
        test('should handle operations on dead units', () => {
            const unitId = units.createUnit('warrior');
            
            // Kill the unit
            units.damageUnit(unitId, 1000);
            expect(units.getUnit(unitId).state.isAlive).toBe(false);
            
            // Should still be able to perform operations
            expect(units.setUnitStatus(unitId, 'reviving')).toBe(true);
            expect(units.addUnitTag(unitId, 'undead')).toBe(true);
        });

        test('should handle empty stat changes', () => {
            const unitId = units.createUnit('warrior');
            const initialStats = { ...units.getUnit(unitId).currentStats };
            
            const success = units.updateUnitStats(unitId, {});
            expect(success).toBe(true);
            
            const finalStats = units.getUnit(unitId).currentStats;
            expect(finalStats).toEqual(initialStats);
        });

        test('should maintain data integrity when units are modified', () => {
            const unitId = units.createUnit('warrior');
            const unit = units.getUnit(unitId);
            
            // Modify the returned object directly (should not affect internal state)
            unit.name = 'Modified Name';
            unit.currentStats.health = 9999;
            
            // Get fresh copy and verify it wasn't affected
            const freshUnit = units.getUnit(unitId);
            expect(freshUnit.name).not.toBe('Modified Name');
            expect(freshUnit.currentStats.health).not.toBe(9999);
        });
    });
});