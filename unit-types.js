/**
 * Unit Types Management Component
 * 
 * Manages different unit types with their stats and visual appearance.
 * Provides a centralized registry for all available unit types in the system.
 */

class UnitTypes {
    constructor() {
        this.unitTypes = new Map();
        this.initializeDefaultTypes();
    }

    /**
     * Initialize default unit types with their base stats and appearance
     */
    initializeDefaultTypes() {
        // Warrior - High health, moderate damage, slow speed
        this.registerUnitType('warrior', {
            name: 'Warrior',
            stats: {
                health: 100,
                damage: 25,
                speed: 2,
                defense: 15
            },
            appearance: {
                icon: '⚔️',
                color: '#8B4513',
                size: 'large'
            },
            description: 'A heavy armored fighter with high health and defense'
        });

        // Archer - Moderate health, high damage, fast speed
        this.registerUnitType('archer', {
            name: 'Archer',
            stats: {
                health: 60,
                damage: 40,
                speed: 4,
                defense: 5
            },
            appearance: {
                icon: '🏹',
                color: '#228B22',
                size: 'medium'
            },
            description: 'A ranged fighter with high damage and speed'
        });

        // Mage - Low health, very high damage, moderate speed
        this.registerUnitType('mage', {
            name: 'Mage',
            stats: {
                health: 40,
                damage: 60,
                speed: 3,
                defense: 2
            },
            appearance: {
                icon: '🔮',
                color: '#4B0082',
                size: 'medium'
            },
            description: 'A magical caster with devastating spells but low defense'
        });

        // Scout - Low health, low damage, very high speed
        this.registerUnitType('scout', {
            name: 'Scout',
            stats: {
                health: 30,
                damage: 15,
                speed: 6,
                defense: 3
            },
            appearance: {
                icon: '👁️',
                color: '#DAA520',
                size: 'small'
            },
            description: 'A fast reconnaissance unit with high mobility'
        });
    }

    /**
     * Register a new unit type
     * @param {string} typeId - Unique identifier for the unit type
     * @param {Object} typeData - Unit type configuration
     * @returns {boolean} True if registered successfully
     */
    registerUnitType(typeId, typeData) {
        if (!typeId || typeof typeId !== 'string') {
            throw new Error('Unit type ID must be a non-empty string');
        }

        if (!typeData || typeof typeData !== 'object') {
            throw new Error('Unit type data must be an object');
        }

        // Validate required fields
        if (!typeData.name || !typeData.stats || !typeData.appearance) {
            throw new Error('Unit type must have name, stats, and appearance properties');
        }

        // Validate stats object
        const requiredStats = ['health', 'damage', 'speed', 'defense'];
        for (const stat of requiredStats) {
            if (typeof typeData.stats[stat] !== 'number' || typeData.stats[stat] < 0) {
                throw new Error(`Unit type stats.${stat} must be a non-negative number`);
            }
        }

        // Validate appearance object
        if (!typeData.appearance.icon || !typeData.appearance.color) {
            throw new Error('Unit type appearance must have icon and color properties');
        }

        this.unitTypes.set(typeId, { ...typeData });
        return true;
    }

    /**
     * Get unit type by ID
     * @param {string} typeId - Unit type identifier
     * @returns {Object|null} Unit type data or null if not found
     */
    getUnitType(typeId) {
        return this.unitTypes.get(typeId) || null;
    }

    /**
     * Get all registered unit types
     * @returns {Array} Array of {id, data} objects
     */
    getAllUnitTypes() {
        return Array.from(this.unitTypes.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    /**
     * Check if a unit type exists
     * @param {string} typeId - Unit type identifier
     * @returns {boolean} True if unit type exists
     */
    hasUnitType(typeId) {
        return this.unitTypes.has(typeId);
    }

    /**
     * Remove a unit type
     * @param {string} typeId - Unit type identifier
     * @returns {boolean} True if unit type was removed
     */
    removeUnitType(typeId) {
        return this.unitTypes.delete(typeId);
    }

    /**
     * Get unit types by stat criteria
     * @param {string} statName - Name of the stat to filter by
     * @param {number} minValue - Minimum value for the stat
     * @param {number} maxValue - Maximum value for the stat (optional)
     * @returns {Array} Array of matching unit types
     */
    getUnitTypesByStat(statName, minValue, maxValue = Infinity) {
        return this.getAllUnitTypes().filter(unitType => {
            const statValue = unitType.stats[statName];
            return statValue >= minValue && statValue <= maxValue;
        });
    }

    /**
     * Get the total number of registered unit types
     * @returns {number} Number of unit types
     */
    getTypeCount() {
        return this.unitTypes.size;
    }

    /**
     * Create a copy of a unit type with modified stats
     * @param {string} typeId - Base unit type ID
     * @param {Object} statModifiers - Object with stat modifications
     * @returns {Object|null} Modified unit type or null if base type not found
     */
    createVariant(typeId, statModifiers) {
        const baseType = this.getUnitType(typeId);
        if (!baseType) {
            return null;
        }

        const variant = JSON.parse(JSON.stringify(baseType)); // Deep copy
        
        // Apply stat modifications
        if (statModifiers && typeof statModifiers === 'object') {
            for (const [stat, modifier] of Object.entries(statModifiers)) {
                if (variant.stats.hasOwnProperty(stat) && typeof modifier === 'number') {
                    variant.stats[stat] = Math.max(0, variant.stats[stat] + modifier);
                }
            }
        }

        return variant;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnitTypes;
} else {
    window.UnitTypes = UnitTypes;
}