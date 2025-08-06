package main

import (
	"fmt"
	"syscall/js"
	"time"
)

// UnitManager manages all units in the game
type UnitManager struct {
	units        map[string]*Unit
	nextUnitID   int
	gameMap      *Map
	spatialIndex *UnitSpatialIndex
	combatSystem *UnitCombatSystem
	renderer     *UnitRenderer
}

// NewUnitManager creates a new unit manager
func NewUnitManager(gameMap *Map) *UnitManager {
	return &UnitManager{
		units:        make(map[string]*Unit),
		nextUnitID:   1,
		gameMap:      gameMap,
		spatialIndex: NewUnitSpatialIndex(),
		combatSystem: NewUnitCombatSystem(),
		renderer:     NewUnitRenderer(gameMap),
	}
}

// CreateUnit creates a new unit at the specified tile coordinates
func (um *UnitManager) CreateUnit(unitType UnitType, tileX, tileY int, name string) (*Unit, error) {
	// Validate tile coordinates
	if tileX < 0 || tileX >= um.gameMap.Width || tileY < 0 || tileY >= um.gameMap.Height {
		return nil, fmt.Errorf("tile coordinates out of bounds: (%d, %d)", tileX, tileY)
	}

	// Check if tile is walkable
	tileType := um.gameMap.GetTile(tileX, tileY)
	tileDef, exists := TileDefinitions[tileType]
	if !exists || !tileDef.Walkable {
		return nil, fmt.Errorf("cannot place unit on non-walkable tile at (%d, %d)", tileX, tileY)
	}

	// Check if tile is already occupied
	if um.spatialIndex.IsPositionOccupied(tileX, tileY) {
		return nil, fmt.Errorf("tile already occupied at (%d, %d)", tileX, tileY)
	}

	// Get unit type definition
	typeDef, exists := UnitTypeDefinitions[unitType]
	if !exists {
		return nil, fmt.Errorf("unknown unit type: %v", unitType)
	}

	// Generate unit ID and name
	unitID := fmt.Sprintf("unit_%d", um.nextUnitID)
	um.nextUnitID++

	if name == "" {
		name = fmt.Sprintf("%s #%d", typeDef.Name, um.nextUnitID-1)
	}

	// Create unit instance
	unit := &Unit{
		ID:           unitID,
		TypeID:       unitType,
		Name:         name,
		TileX:        tileX,
		TileY:        tileY,
		CurrentStats: typeDef.Stats,
		MaxStats:     typeDef.Stats,
		Level:        1,
		Experience:   0,
		IsAlive:      true,
		Status:       "idle",
		CreatedAt:    time.Now(),
		LastMoved:    time.Now(),
	}

	// Add unit to collections
	um.units[unitID] = unit
	um.spatialIndex.AddUnit(unit)

	return unit, nil
}

// GetUnit retrieves a unit by ID
func (um *UnitManager) GetUnit(unitID string) *Unit {
	return um.units[unitID]
}

// GetAllUnits returns all units
func (um *UnitManager) GetAllUnits() map[string]*Unit {
	result := make(map[string]*Unit)
	for id, unit := range um.units {
		result[id] = unit
	}
	return result
}

// GetUnitsAtTile returns all units at the specified tile
func (um *UnitManager) GetUnitsAtTile(tileX, tileY int) []*Unit {
	return um.spatialIndex.GetUnitsAtTile(tileX, tileY)
}

// IsPositionOccupied checks if a tile position is occupied by any unit
func (um *UnitManager) IsPositionOccupied(tileX, tileY int) bool {
	return um.spatialIndex.IsPositionOccupied(tileX, tileY)
}

// MoveUnit moves a unit to a new tile position
func (um *UnitManager) MoveUnit(unitID string, tileX, tileY int) error {
	unit := um.units[unitID]
	if unit == nil {
		return fmt.Errorf("unit not found: %s", unitID)
	}

	if !unit.IsAlive {
		return fmt.Errorf("cannot move dead unit: %s", unitID)
	}

	// Validate new tile coordinates
	if tileX < 0 || tileX >= um.gameMap.Width || tileY < 0 || tileY >= um.gameMap.Height {
		return fmt.Errorf("tile coordinates out of bounds: (%d, %d)", tileX, tileY)
	}

	// Check if new tile is walkable
	tileType := um.gameMap.GetTile(tileX, tileY)
	tileDef, exists := TileDefinitions[tileType]
	if !exists || !tileDef.Walkable {
		return fmt.Errorf("cannot move unit to non-walkable tile at (%d, %d)", tileX, tileY)
	}

	// Check if new tile is already occupied (unless it's the same position)
	if !(unit.TileX == tileX && unit.TileY == tileY) && um.spatialIndex.IsPositionOccupied(tileX, tileY) {
		return fmt.Errorf("destination tile already occupied at (%d, %d)", tileX, tileY)
	}

	// Update position in spatial index
	oldX, oldY := unit.TileX, unit.TileY
	um.spatialIndex.UpdateUnitPosition(unit, oldX, oldY, tileX, tileY)
	unit.LastMoved = time.Now()

	return nil
}

// RemoveUnit removes a unit from the game
func (um *UnitManager) RemoveUnit(unitID string) error {
	unit := um.units[unitID]
	if unit == nil {
		return fmt.Errorf("unit not found: %s", unitID)
	}

	// Remove from spatial index
	um.spatialIndex.RemoveUnit(unit)

	// Remove from units map
	delete(um.units, unitID)

	return nil
}

// DamageUnit applies damage to a unit
func (um *UnitManager) DamageUnit(unitID string, damage int) error {
	unit := um.units[unitID]
	if unit == nil {
		return fmt.Errorf("unit not found: %s", unitID)
	}

	return um.combatSystem.DamageUnit(unit, damage)
}

// HealUnit restores health to a unit
func (um *UnitManager) HealUnit(unitID string, healAmount int) error {
	unit := um.units[unitID]
	if unit == nil {
		return fmt.Errorf("unit not found: %s", unitID)
	}

	return um.combatSystem.HealUnit(unit, healAmount)
}

// GetUnitTypeCounts returns the count of each unit type
func (um *UnitManager) GetUnitTypeCounts() map[UnitType]int {
	counts := make(map[UnitType]int)
	
	for _, unit := range um.units {
		if unit.IsAlive {
			counts[unit.TypeID]++
		}
	}
	
	return counts
}

// GetTotalUnitCount returns the total number of alive units
func (um *UnitManager) GetTotalUnitCount() int {
	count := 0
	for _, unit := range um.units {
		if unit.IsAlive {
			count++
		}
	}
	return count
}

// RenderUnits draws all units on the screen
func (um *UnitManager) RenderUnits(ctx js.Value, cameraX, cameraY float64) {
	um.renderer.RenderUnits(ctx, um.units, cameraX, cameraY)
}