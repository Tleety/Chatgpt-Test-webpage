/**
 * Unit Type Tracker Component
 * 
 * Tracks and manages the type associations for units in the system.
 * Provides fast lookups and statistics about unit type distributions.
 */

class UnitTypeTracker {
    constructor() {
        this.unitTypeMap = new Map(); // unitId -> typeId
        this.typeUnitsMap = new Map(); // typeId -> Set of unitIds
        this.listeners = new Map(); // Event listeners for type changes
    }

    /**
     * Register a unit with its type
     * @param {string} unitId - The unit identifier
     * @param {string} typeId - The unit type identifier
     * @returns {boolean} True if registered successfully
     */
    registerUnit(unitId, typeId) {
        if (!unitId || !typeId) {
            throw new Error('Both unitId and typeId are required');
        }

        // If unit already exists, remove it from old type first
        if (this.unitTypeMap.has(unitId)) {
            this.unregisterUnit(unitId);
        }

        // Add to type mapping
        this.unitTypeMap.set(unitId, typeId);

        // Add to reverse mapping
        if (!this.typeUnitsMap.has(typeId)) {
            this.typeUnitsMap.set(typeId, new Set());
        }
        this.typeUnitsMap.get(typeId).add(unitId);

        // Notify listeners
        this._notifyListeners('unit_registered', { unitId, typeId });

        return true;
    }

    /**
     * Unregister a unit from tracking
     * @param {string} unitId - The unit identifier
     * @returns {boolean} True if unit was unregistered
     */
    unregisterUnit(unitId) {
        const typeId = this.unitTypeMap.get(unitId);
        if (!typeId) {
            return false;
        }

        // Remove from type mapping
        this.unitTypeMap.delete(unitId);

        // Remove from reverse mapping
        const unitSet = this.typeUnitsMap.get(typeId);
        if (unitSet) {
            unitSet.delete(unitId);
            // Clean up empty type sets
            if (unitSet.size === 0) {
                this.typeUnitsMap.delete(typeId);
            }
        }

        // Notify listeners
        this._notifyListeners('unit_unregistered', { unitId, typeId });

        return true;
    }

    /**
     * Get the type of a specific unit
     * @param {string} unitId - The unit identifier
     * @returns {string|null} The unit type ID or null if unit not found
     */
    getUnitType(unitId) {
        return this.unitTypeMap.get(unitId) || null;
    }

    /**
     * Get all units of a specific type
     * @param {string} typeId - The unit type identifier
     * @returns {Array} Array of unit IDs of the specified type
     */
    getUnitsOfType(typeId) {
        const unitSet = this.typeUnitsMap.get(typeId);
        return unitSet ? Array.from(unitSet) : [];
    }

    /**
     * Get all tracked unit types
     * @returns {Array} Array of all type IDs that have units
     */
    getActiveTypes() {
        return Array.from(this.typeUnitsMap.keys());
    }

    /**
     * Get count of units for each type
     * @returns {Object} Object mapping type IDs to unit counts
     */
    getTypeCounts() {
        const counts = {};
        for (const [typeId, unitSet] of this.typeUnitsMap) {
            counts[typeId] = unitSet.size;
        }
        return counts;
    }

    /**
     * Get count of units for a specific type
     * @param {string} typeId - The unit type identifier
     * @returns {number} Number of units of this type
     */
    getTypeCount(typeId) {
        const unitSet = this.typeUnitsMap.get(typeId);
        return unitSet ? unitSet.size : 0;
    }

    /**
     * Get the most common unit type
     * @returns {Object|null} Object with typeId and count, or null if no units
     */
    getMostCommonType() {
        let maxCount = 0;
        let mostCommonType = null;

        for (const [typeId, unitSet] of this.typeUnitsMap) {
            if (unitSet.size > maxCount) {
                maxCount = unitSet.size;
                mostCommonType = typeId;
            }
        }

        return mostCommonType ? { typeId: mostCommonType, count: maxCount } : null;
    }

    /**
     * Get the least common unit type
     * @returns {Object|null} Object with typeId and count, or null if no units
     */
    getLeastCommonType() {
        let minCount = Infinity;
        let leastCommonType = null;

        for (const [typeId, unitSet] of this.typeUnitsMap) {
            if (unitSet.size < minCount) {
                minCount = unitSet.size;
                leastCommonType = typeId;
            }
        }

        return leastCommonType ? { typeId: leastCommonType, count: minCount } : null;
    }

    /**
     * Check if a unit is tracked
     * @param {string} unitId - The unit identifier
     * @returns {boolean} True if unit is tracked
     */
    hasUnit(unitId) {
        return this.unitTypeMap.has(unitId);
    }

    /**
     * Check if any units of a type exist
     * @param {string} typeId - The unit type identifier
     * @returns {boolean} True if type has units
     */
    hasUnitsOfType(typeId) {
        const unitSet = this.typeUnitsMap.get(typeId);
        return unitSet ? unitSet.size > 0 : false;
    }

    /**
     * Get total number of tracked units
     * @returns {number} Total number of units
     */
    getTotalUnitCount() {
        return this.unitTypeMap.size;
    }

    /**
     * Get units by multiple types
     * @param {Array} typeIds - Array of type IDs to search for
     * @returns {Array} Array of unit IDs matching any of the specified types
     */
    getUnitsByTypes(typeIds) {
        const result = new Set();
        for (const typeId of typeIds) {
            const units = this.getUnitsOfType(typeId);
            units.forEach(unitId => result.add(unitId));
        }
        return Array.from(result);
    }

    /**
     * Change a unit's type
     * @param {string} unitId - The unit identifier
     * @param {string} newTypeId - The new unit type identifier
     * @returns {boolean} True if type was changed
     */
    changeUnitType(unitId, newTypeId) {
        if (!this.hasUnit(unitId)) {
            return false;
        }

        const oldTypeId = this.getUnitType(unitId);
        
        // Unregister and re-register with new type
        this.unregisterUnit(unitId);
        this.registerUnit(unitId, newTypeId);

        // Notify listeners of type change
        this._notifyListeners('unit_type_changed', { 
            unitId, 
            oldTypeId, 
            newTypeId 
        });

        return true;
    }

    /**
     * Get statistics about type distribution
     * @returns {Object} Statistics object
     */
    getTypeDistributionStats() {
        const counts = this.getTypeCounts();
        const total = this.getTotalUnitCount();
        
        if (total === 0) {
            return {
                totalUnits: 0,
                uniqueTypes: 0,
                averageUnitsPerType: 0,
                distribution: {},
                percentages: {}
            };
        }

        const distribution = {};
        const percentages = {};
        
        for (const [typeId, count] of Object.entries(counts)) {
            distribution[typeId] = count;
            percentages[typeId] = (count / total * 100).toFixed(2);
        }

        return {
            totalUnits: total,
            uniqueTypes: Object.keys(counts).length,
            averageUnitsPerType: (total / Object.keys(counts).length).toFixed(2),
            distribution,
            percentages
        };
    }

    /**
     * Add event listener for type tracking events
     * @param {string} event - Event name ('unit_registered', 'unit_unregistered', 'unit_type_changed')
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

    /**
     * Clear all tracking data
     */
    clearAll() {
        this.unitTypeMap.clear();
        this.typeUnitsMap.clear();
        this._notifyListeners('all_cleared', {});
    }

    /**
     * Export tracking data
     * @returns {Object} Serializable tracking data
     */
    exportData() {
        const typeUnitsData = {};
        for (const [typeId, unitSet] of this.typeUnitsMap) {
            typeUnitsData[typeId] = Array.from(unitSet);
        }

        return {
            unitTypeMap: Object.fromEntries(this.unitTypeMap),
            typeUnitsMap: typeUnitsData,
            timestamp: Date.now()
        };
    }

    /**
     * Import tracking data
     * @param {Object} data - Data exported from exportData()
     * @returns {boolean} True if import was successful
     */
    importData(data) {
        try {
            this.clearAll();

            // Restore unit type mappings
            if (data.unitTypeMap) {
                for (const [unitId, typeId] of Object.entries(data.unitTypeMap)) {
                    this.registerUnit(unitId, typeId);
                }
            }

            return true;
        } catch (error) {
            console.error('Error importing type tracker data:', error);
            return false;
        }
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnitTypeTracker;
} else {
    window.UnitTypeTracker = UnitTypeTracker;
}