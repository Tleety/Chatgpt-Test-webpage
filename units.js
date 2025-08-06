/**
 * Units Component
 * 
 * Main unit component using a data-driven approach where units are represented by IDs.
 * This component manages the creation, retrieval, and lifecycle of individual units.
 */

class Units {
    constructor(unitTypes) {
        if (!unitTypes) {
            throw new Error('Units component requires a UnitTypes instance');
        }
        this.unitTypes = unitTypes;
        this.units = new Map();
        this.nextUnitId = 1;
    }

    /**
     * Create a new unit instance
     * @param {string} typeId - The unit type identifier
     * @param {Object} options - Optional configuration for the unit
     * @returns {string|null} The unique unit ID or null if creation failed
     */
    createUnit(typeId, options = {}) {
        // Validate that the unit type exists
        if (!this.unitTypes.hasUnitType(typeId)) {
            throw new Error(`Unknown unit type: ${typeId}`);
        }

        const unitType = this.unitTypes.getUnitType(typeId);
        const unitId = `unit_${this.nextUnitId++}`;

        // Create unit instance with default values from type
        const unit = {
            id: unitId,
            typeId: typeId,
            name: options.name || `${unitType.name} #${this.nextUnitId - 1}`,
            currentStats: {
                health: options.health || unitType.stats.health,
                damage: options.damage || unitType.stats.damage,
                speed: options.speed || unitType.stats.speed,
                defense: options.defense || unitType.stats.defense
            },
            maxStats: { ...unitType.stats }, // Store original max values
            state: {
                isAlive: true,
                status: 'idle', // idle, moving, attacking, defending, dead
                lastAction: null,
                createdAt: Date.now()
            },
            metadata: {
                level: options.level || 1,
                experience: options.experience || 0,
                tags: options.tags || [],
                customData: options.customData || {}
            }
        };

        this.units.set(unitId, unit);
        return unitId;
    }

    /**
     * Get unit by ID
     * @param {string} unitId - The unit identifier
     * @returns {Object|null} Unit data or null if not found
     */
    getUnit(unitId) {
        const unit = this.units.get(unitId);
        return unit ? JSON.parse(JSON.stringify(unit)) : null;
    }

    /**
     * Get internal unit reference (for internal operations only)
     * @private
     * @param {string} unitId - The unit identifier
     * @returns {Object|null} Internal unit object or null if not found
     */
    _getUnitInternal(unitId) {
        return this.units.get(unitId) || null;
    }

    /**
     * Get all units
     * @returns {Array} Array of all unit objects
     */
    getAllUnits() {
        return Array.from(this.units.values()).map(unit => 
            JSON.parse(JSON.stringify(unit))
        );
    }

    /**
     * Get all units of a specific type
     * @param {string} typeId - The unit type identifier
     * @returns {Array} Array of units of the specified type
     */
    getUnitsByType(typeId) {
        return this.getAllUnits().filter(unit => unit.typeId === typeId);
    }

    /**
     * Get units by status
     * @param {string} status - The status to filter by
     * @returns {Array} Array of units with the specified status
     */
    getUnitsByStatus(status) {
        return this.getAllUnits().filter(unit => unit.state.status === status);
    }

    /**
     * Get alive units only
     * @returns {Array} Array of living units
     */
    getAliveUnits() {
        return this.getAllUnits().filter(unit => unit.state.isAlive);
    }

    /**
     * Remove a unit
     * @param {string} unitId - The unit identifier
     * @returns {boolean} True if unit was removed
     */
    removeUnit(unitId) {
        return this.units.delete(unitId);
    }

    /**
     * Update unit stats
     * @param {string} unitId - The unit identifier
     * @param {Object} statChanges - Object with stat changes
     * @returns {boolean} True if unit was updated
     */
    updateUnitStats(unitId, statChanges) {
        const unit = this._getUnitInternal(unitId);
        if (!unit) {
            return false;
        }

        // Apply stat changes, ensuring they don't exceed max values or go below 0
        for (const [stat, change] of Object.entries(statChanges)) {
            if (unit.currentStats.hasOwnProperty(stat)) {
                const newValue = unit.currentStats[stat] + change;
                unit.currentStats[stat] = Math.max(0, Math.min(newValue, unit.maxStats[stat]));
            }
        }

        // Update alive status based on health
        if (unit.currentStats.health <= 0) {
            unit.state.isAlive = false;
            unit.state.status = 'dead';
        }

        return true;
    }

    /**
     * Set unit status
     * @param {string} unitId - The unit identifier
     * @param {string} status - New status
     * @param {string} action - Optional action description
     * @returns {boolean} True if status was updated
     */
    setUnitStatus(unitId, status, action = null) {
        const unit = this._getUnitInternal(unitId);
        if (!unit) {
            return false;
        }

        unit.state.status = status;
        if (action) {
            unit.state.lastAction = action;
        }

        return true;
    }

    /**
     * Heal a unit
     * @param {string} unitId - The unit identifier
     * @param {number} amount - Amount to heal
     * @returns {boolean} True if unit was healed
     */
    healUnit(unitId, amount) {
        if (amount < 0) {
            throw new Error('Heal amount must be positive');
        }
        return this.updateUnitStats(unitId, { health: amount });
    }

    /**
     * Damage a unit
     * @param {string} unitId - The unit identifier
     * @param {number} amount - Amount of damage
     * @returns {boolean} True if unit was damaged
     */
    damageUnit(unitId, amount) {
        if (amount < 0) {
            throw new Error('Damage amount must be positive');
        }
        return this.updateUnitStats(unitId, { health: -amount });
    }

    /**
     * Level up a unit
     * @param {string} unitId - The unit identifier
     * @param {Object} statBoosts - Stat increases for leveling up
     * @returns {boolean} True if unit was leveled up
     */
    levelUpUnit(unitId, statBoosts = {}) {
        const unit = this._getUnitInternal(unitId);
        if (!unit) {
            return false;
        }

        unit.metadata.level++;
        
        // Apply stat boosts to max stats and current stats
        const defaultBoosts = { health: 5, damage: 2, speed: 1, defense: 1 };
        const boosts = { ...defaultBoosts, ...statBoosts };

        for (const [stat, boost] of Object.entries(boosts)) {
            if (unit.maxStats.hasOwnProperty(stat)) {
                unit.maxStats[stat] += boost;
                unit.currentStats[stat] += boost;
            }
        }

        return true;
    }

    /**
     * Get unit type information for a unit
     * @param {string} unitId - The unit identifier
     * @returns {Object|null} Unit type data or null if unit not found
     */
    getUnitTypeInfo(unitId) {
        const unit = this._getUnitInternal(unitId);
        if (!unit) {
            return null;
        }
        return this.unitTypes.getUnitType(unit.typeId);
    }

    /**
     * Get detailed unit information including type data
     * @param {string} unitId - The unit identifier
     * @returns {Object|null} Combined unit and type data or null if unit not found
     */
    getUnitDetails(unitId) {
        const unit = this.getUnit(unitId);
        if (!unit) {
            return null;
        }

        const typeInfo = this.getUnitTypeInfo(unitId);
        return {
            ...unit,
            typeInfo
        };
    }

    /**
     * Get total number of units
     * @returns {number} Number of units
     */
    getUnitCount() {
        return this.units.size;
    }

    /**
     * Get units by tag
     * @param {string} tag - Tag to search for
     * @returns {Array} Array of units with the specified tag
     */
    getUnitsByTag(tag) {
        return this.getAllUnits().filter(unit => 
            unit.metadata.tags.includes(tag)
        );
    }

    /**
     * Add tag to unit
     * @param {string} unitId - The unit identifier
     * @param {string} tag - Tag to add
     * @returns {boolean} True if tag was added
     */
    addUnitTag(unitId, tag) {
        const unit = this._getUnitInternal(unitId);
        if (!unit) {
            return false;
        }

        if (!unit.metadata.tags.includes(tag)) {
            unit.metadata.tags.push(tag);
        }
        return true;
    }

    /**
     * Remove tag from unit
     * @param {string} unitId - The unit identifier
     * @param {string} tag - Tag to remove
     * @returns {boolean} True if tag was removed
     */
    removeUnitTag(unitId, tag) {
        const unit = this._getUnitInternal(unitId);
        if (!unit) {
            return false;
        }

        const index = unit.metadata.tags.indexOf(tag);
        if (index > -1) {
            unit.metadata.tags.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Clear all units
     */
    clearAllUnits() {
        this.units.clear();
        this.nextUnitId = 1;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Units;
} else {
    window.Units = Units;
}