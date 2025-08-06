/**
 * @jest-environment jsdom
 */

const UnitTypes = require('../unit-types.js');

describe('UnitTypes', () => {
    let unitTypes;

    beforeEach(() => {
        unitTypes = new UnitTypes();
    });

    describe('Initialization', () => {
        test('should initialize with default unit types', () => {
            expect(unitTypes.getTypeCount()).toBeGreaterThan(0);
            expect(unitTypes.hasUnitType('warrior')).toBe(true);
            expect(unitTypes.hasUnitType('archer')).toBe(true);
            expect(unitTypes.hasUnitType('mage')).toBe(true);
            expect(unitTypes.hasUnitType('scout')).toBe(true);
        });

        test('should have properly structured default types', () => {
            const warrior = unitTypes.getUnitType('warrior');
            expect(warrior).toBeDefined();
            expect(warrior.name).toBe('Warrior');
            expect(warrior.stats).toHaveProperty('health');
            expect(warrior.stats).toHaveProperty('damage');
            expect(warrior.stats).toHaveProperty('speed');
            expect(warrior.stats).toHaveProperty('defense');
            expect(warrior.appearance).toHaveProperty('icon');
            expect(warrior.appearance).toHaveProperty('color');
        });
    });

    describe('Unit Type Registration', () => {
        test('should register a new unit type successfully', () => {
            const typeData = {
                name: 'Healer',
                stats: { health: 50, damage: 10, speed: 3, defense: 8 },
                appearance: { icon: '💚', color: '#00FF00', size: 'medium' },
                description: 'A support unit that heals allies'
            };

            const result = unitTypes.registerUnitType('healer', typeData);
            expect(result).toBe(true);
            expect(unitTypes.hasUnitType('healer')).toBe(true);
            expect(unitTypes.getUnitType('healer').name).toBe('Healer');
        });

        test('should throw error for invalid type ID', () => {
            const typeData = {
                name: 'Test',
                stats: { health: 50, damage: 10, speed: 3, defense: 8 },
                appearance: { icon: '🔥', color: '#FF0000' }
            };

            expect(() => unitTypes.registerUnitType('', typeData)).toThrow('Unit type ID must be a non-empty string');
            expect(() => unitTypes.registerUnitType(null, typeData)).toThrow('Unit type ID must be a non-empty string');
            expect(() => unitTypes.registerUnitType(123, typeData)).toThrow('Unit type ID must be a non-empty string');
        });

        test('should throw error for invalid type data', () => {
            expect(() => unitTypes.registerUnitType('test', null)).toThrow('Unit type data must be an object');
            expect(() => unitTypes.registerUnitType('test', 'invalid')).toThrow('Unit type data must be an object');
        });

        test('should throw error for missing required fields', () => {
            expect(() => unitTypes.registerUnitType('test', {})).toThrow('Unit type must have name, stats, and appearance properties');
            expect(() => unitTypes.registerUnitType('test', { name: 'Test' })).toThrow('Unit type must have name, stats, and appearance properties');
        });

        test('should throw error for invalid stats', () => {
            const baseData = {
                name: 'Test',
                stats: { health: 50, damage: 10, speed: 3, defense: 8 },
                appearance: { icon: '🔥', color: '#FF0000' }
            };

            // Test missing stats
            expect(() => unitTypes.registerUnitType('test', {
                ...baseData,
                stats: { health: 50, damage: 10, speed: 3 } // missing defense
            })).toThrow('Unit type stats.defense must be a non-negative number');

            // Test negative stats
            expect(() => unitTypes.registerUnitType('test', {
                ...baseData,
                stats: { health: -10, damage: 10, speed: 3, defense: 8 }
            })).toThrow('Unit type stats.health must be a non-negative number');

            // Test non-numeric stats
            expect(() => unitTypes.registerUnitType('test', {
                ...baseData,
                stats: { health: 'invalid', damage: 10, speed: 3, defense: 8 }
            })).toThrow('Unit type stats.health must be a non-negative number');
        });

        test('should throw error for invalid appearance', () => {
            const baseData = {
                name: 'Test',
                stats: { health: 50, damage: 10, speed: 3, defense: 8 },
                appearance: { icon: '🔥', color: '#FF0000' }
            };

            expect(() => unitTypes.registerUnitType('test', {
                ...baseData,
                appearance: { color: '#FF0000' } // missing icon
            })).toThrow('Unit type appearance must have icon and color properties');

            expect(() => unitTypes.registerUnitType('test', {
                ...baseData,
                appearance: { icon: '🔥' } // missing color
            })).toThrow('Unit type appearance must have icon and color properties');
        });
    });

    describe('Unit Type Retrieval', () => {
        test('should retrieve existing unit type', () => {
            const warrior = unitTypes.getUnitType('warrior');
            expect(warrior).toBeDefined();
            expect(warrior.name).toBe('Warrior');
        });

        test('should return null for non-existent unit type', () => {
            const result = unitTypes.getUnitType('nonexistent');
            expect(result).toBeNull();
        });

        test('should get all unit types', () => {
            const allTypes = unitTypes.getAllUnitTypes();
            expect(Array.isArray(allTypes)).toBe(true);
            expect(allTypes.length).toBeGreaterThan(0);
            
            const typeIds = allTypes.map(type => type.id);
            expect(typeIds).toContain('warrior');
            expect(typeIds).toContain('archer');
            expect(typeIds).toContain('mage');
            expect(typeIds).toContain('scout');
        });
    });

    describe('Unit Type Management', () => {
        test('should check if unit type exists', () => {
            expect(unitTypes.hasUnitType('warrior')).toBe(true);
            expect(unitTypes.hasUnitType('nonexistent')).toBe(false);
        });

        test('should remove unit type', () => {
            expect(unitTypes.hasUnitType('scout')).toBe(true);
            const result = unitTypes.removeUnitType('scout');
            expect(result).toBe(true);
            expect(unitTypes.hasUnitType('scout')).toBe(false);
        });

        test('should return false when removing non-existent type', () => {
            const result = unitTypes.removeUnitType('nonexistent');
            expect(result).toBe(false);
        });

        test('should get correct type count', () => {
            const initialCount = unitTypes.getTypeCount();
            expect(initialCount).toBe(4); // warrior, archer, mage, scout

            unitTypes.registerUnitType('healer', {
                name: 'Healer',
                stats: { health: 50, damage: 10, speed: 3, defense: 8 },
                appearance: { icon: '💚', color: '#00FF00' }
            });

            expect(unitTypes.getTypeCount()).toBe(initialCount + 1);
        });
    });

    describe('Stat-based Filtering', () => {
        test('should filter units by stat range', () => {
            // Find units with high health (80+)
            const highHealthUnits = unitTypes.getUnitTypesByStat('health', 80);
            expect(highHealthUnits.length).toBeGreaterThan(0);
            
            for (const unit of highHealthUnits) {
                expect(unit.stats.health).toBeGreaterThanOrEqual(80);
            }
        });

        test('should filter units by stat range with max value', () => {
            // Find units with moderate speed (2-4)
            const moderateSpeedUnits = unitTypes.getUnitTypesByStat('speed', 2, 4);
            expect(moderateSpeedUnits.length).toBeGreaterThan(0);
            
            for (const unit of moderateSpeedUnits) {
                expect(unit.stats.speed).toBeGreaterThanOrEqual(2);
                expect(unit.stats.speed).toBeLessThanOrEqual(4);
            }
        });

        test('should return empty array for impossible stat range', () => {
            const impossibleUnits = unitTypes.getUnitTypesByStat('health', 1000);
            expect(impossibleUnits).toEqual([]);
        });
    });

    describe('Variant Creation', () => {
        test('should create variant with stat modifications', () => {
            const variant = unitTypes.createVariant('warrior', { health: 20, damage: -5 });
            
            expect(variant).toBeDefined();
            expect(variant.name).toBe('Warrior');
            expect(variant.stats.health).toBe(120); // 100 + 20
            expect(variant.stats.damage).toBe(20);  // 25 - 5
            expect(variant.stats.speed).toBe(2);    // unchanged
        });

        test('should prevent negative stats in variants', () => {
            const variant = unitTypes.createVariant('scout', { health: -50 });
            
            expect(variant).toBeDefined();
            expect(variant.stats.health).toBe(0); // clamped to 0
        });

        test('should return null for non-existent base type', () => {
            const variant = unitTypes.createVariant('nonexistent', { health: 10 });
            expect(variant).toBeNull();
        });

        test('should not modify original type when creating variant', () => {
            const originalWarrior = unitTypes.getUnitType('warrior');
            const originalHealth = originalWarrior.stats.health;
            
            const variant = unitTypes.createVariant('warrior', { health: 50 });
            
            const warriorAfter = unitTypes.getUnitType('warrior');
            expect(warriorAfter.stats.health).toBe(originalHealth);
            expect(variant.stats.health).toBe(originalHealth + 50);
        });
    });

    describe('Edge Cases', () => {
        test('should handle overwriting existing unit type', () => {
            const originalWarrior = unitTypes.getUnitType('warrior');
            
            const newWarriorData = {
                name: 'Super Warrior',
                stats: { health: 200, damage: 50, speed: 1, defense: 30 },
                appearance: { icon: '⚡', color: '#FFD700' }
            };
            
            unitTypes.registerUnitType('warrior', newWarriorData);
            
            const updatedWarrior = unitTypes.getUnitType('warrior');
            expect(updatedWarrior.name).toBe('Super Warrior');
            expect(updatedWarrior.stats.health).toBe(200);
        });

        test('should handle empty stat modifiers in variant creation', () => {
            const variant = unitTypes.createVariant('archer', {});
            const original = unitTypes.getUnitType('archer');
            
            expect(variant.stats).toEqual(original.stats);
        });

        test('should handle invalid stat names in variant creation', () => {
            const variant = unitTypes.createVariant('mage', { invalidStat: 100, health: 10 });
            const original = unitTypes.getUnitType('mage');
            
            expect(variant.stats.health).toBe(original.stats.health + 10);
            expect(variant.stats.invalidStat).toBeUndefined();
        });
    });
});