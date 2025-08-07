package units

import (
	"fmt"
)

// UnitSpatialIndex manages spatial indexing for units
type UnitSpatialIndex struct {
	unitsByTile map[string]map[string]*Unit // "x,y" -> unit map
}

// NewUnitSpatialIndex creates a new spatial index
func NewUnitSpatialIndex() *UnitSpatialIndex {
	return &UnitSpatialIndex{
		unitsByTile: make(map[string]map[string]*Unit),
	}
}

// AddUnit adds a unit to the spatial index
func (si *UnitSpatialIndex) AddUnit(unit *Unit) {
	tileKey := fmt.Sprintf("%d,%d", unit.TileX, unit.TileY)
	
	if si.unitsByTile[tileKey] == nil {
		si.unitsByTile[tileKey] = make(map[string]*Unit)
	}
	
	si.unitsByTile[tileKey][unit.ID] = unit
}

// RemoveUnit removes a unit from the spatial index
func (si *UnitSpatialIndex) RemoveUnit(unit *Unit) {
	tileKey := fmt.Sprintf("%d,%d", unit.TileX, unit.TileY)
	
	if unitsAtTile, exists := si.unitsByTile[tileKey]; exists {
		delete(unitsAtTile, unit.ID)
		
		// Clean up empty tile entries
		if len(unitsAtTile) == 0 {
			delete(si.unitsByTile, tileKey)
		}
	}
}

// GetUnitsAtTile returns all units at the specified tile
func (si *UnitSpatialIndex) GetUnitsAtTile(tileX, tileY int) []*Unit {
	tileKey := fmt.Sprintf("%d,%d", tileX, tileY)
	unitsAtTile, exists := si.unitsByTile[tileKey]
	if !exists {
		return []*Unit{}
	}

	result := make([]*Unit, 0, len(unitsAtTile))
	for _, unit := range unitsAtTile {
		result = append(result, unit)
	}
	return result
}

// IsPositionOccupied checks if a tile position is occupied by any unit
func (si *UnitSpatialIndex) IsPositionOccupied(tileX, tileY int) bool {
	tileKey := fmt.Sprintf("%d,%d", tileX, tileY)
	unitsAtTile, exists := si.unitsByTile[tileKey]
	return exists && len(unitsAtTile) > 0
}

// UpdateUnitPosition updates a unit's position in the spatial index
func (si *UnitSpatialIndex) UpdateUnitPosition(unit *Unit, oldX, oldY, newX, newY int) {
	// Remove from old position
	oldTileKey := fmt.Sprintf("%d,%d", oldX, oldY)
	if unitsAtTile, exists := si.unitsByTile[oldTileKey]; exists {
		delete(unitsAtTile, unit.ID)
		if len(unitsAtTile) == 0 {
			delete(si.unitsByTile, oldTileKey)
		}
	}
	
	// Add to new position
	unit.TileX = newX
	unit.TileY = newY
	si.AddUnit(unit)
}