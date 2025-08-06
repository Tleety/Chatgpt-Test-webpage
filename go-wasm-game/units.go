package main

import (
	"fmt"
	"math"
	"syscall/js"
	"time"
)

// UnitType represents different types of units
type UnitType int

const (
	UnitWarrior UnitType = iota
	UnitArcher
	UnitMage
	UnitScout
)

// UnitStats represents the statistics of a unit
type UnitStats struct {
	Health  int
	Damage  int
	Speed   int
	Defense int
}

// UnitAppearance represents the visual properties of a unit
type UnitAppearance struct {
	Icon  string
	Color string
	Size  float64
}

// UnitTypeDef defines a unit type with its properties
type UnitTypeDef struct {
	Name        string
	Stats       UnitStats
	Appearance  UnitAppearance
	Description string
}

// UnitTypeDefinitions contains all available unit types
var UnitTypeDefinitions = map[UnitType]UnitTypeDef{
	UnitWarrior: {
		Name: "Warrior",
		Stats: UnitStats{
			Health:  100,
			Damage:  25,
			Speed:   2,
			Defense: 15,
		},
		Appearance: UnitAppearance{
			Icon:  "⚔️",
			Color: "#8B4513",
			Size:  24.0,
		},
		Description: "A heavy armored fighter with high health and defense",
	},
	UnitArcher: {
		Name: "Archer",
		Stats: UnitStats{
			Health:  60,
			Damage:  40,
			Speed:   4,
			Defense: 5,
		},
		Appearance: UnitAppearance{
			Icon:  "🏹",
			Color: "#228B22",
			Size:  20.0,
		},
		Description: "A ranged fighter with high damage and speed",
	},
	UnitMage: {
		Name: "Mage",
		Stats: UnitStats{
			Health:  40,
			Damage:  60,
			Speed:   3,
			Defense: 2,
		},
		Appearance: UnitAppearance{
			Icon:  "🔮",
			Color: "#4B0082",
			Size:  20.0,
		},
		Description: "A magic user with devastating spells but low defense",
	},
	UnitScout: {
		Name: "Scout",
		Stats: UnitStats{
			Health:  30,
			Damage:  15,
			Speed:   6,
			Defense: 3,
		},
		Appearance: UnitAppearance{
			Icon:  "👁️",
			Color: "#DAA520",
			Size:  18.0,
		},
		Description: "A fast reconnaissance unit with high mobility",
	},
}

// Unit represents an individual unit instance
type Unit struct {
	ID           string
	TypeID       UnitType
	Name         string
	TileX        int
	TileY        int
	CurrentStats UnitStats
	MaxStats     UnitStats
	Level        int
	Experience   int
	IsAlive      bool
	Status       string
	CreatedAt    time.Time
	LastMoved    time.Time
}

// UnitManager manages all units in the game
type UnitManager struct {
	units        map[string]*Unit
	unitsByTile  map[string]map[string]*Unit // "x,y" -> unit map
	nextUnitID   int
	gameMap      *Map
}

// NewUnitManager creates a new unit manager
func NewUnitManager(gameMap *Map) *UnitManager {
	return &UnitManager{
		units:       make(map[string]*Unit),
		unitsByTile: make(map[string]map[string]*Unit),
		nextUnitID:  1,
		gameMap:     gameMap,
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
	if um.IsPositionOccupied(tileX, tileY) {
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
	um.addToTileIndex(unit)

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
	tileKey := fmt.Sprintf("%d,%d", tileX, tileY)
	unitsAtTile, exists := um.unitsByTile[tileKey]
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
func (um *UnitManager) IsPositionOccupied(tileX, tileY int) bool {
	tileKey := fmt.Sprintf("%d,%d", tileX, tileY)
	unitsAtTile, exists := um.unitsByTile[tileKey]
	return exists && len(unitsAtTile) > 0
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
	if !(unit.TileX == tileX && unit.TileY == tileY) && um.IsPositionOccupied(tileX, tileY) {
		return fmt.Errorf("destination tile already occupied at (%d, %d)", tileX, tileY)
	}

	// Remove from old tile
	um.removeFromTileIndex(unit)

	// Update unit position
	unit.TileX = tileX
	unit.TileY = tileY
	unit.LastMoved = time.Now()

	// Add to new tile
	um.addToTileIndex(unit)

	return nil
}

// RemoveUnit removes a unit from the game
func (um *UnitManager) RemoveUnit(unitID string) error {
	unit := um.units[unitID]
	if unit == nil {
		return fmt.Errorf("unit not found: %s", unitID)
	}

	// Remove from tile index
	um.removeFromTileIndex(unit)

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

	if !unit.IsAlive {
		return fmt.Errorf("unit is already dead: %s", unitID)
	}

	// Apply damage (with defense reduction)
	actualDamage := int(math.Max(1, float64(damage-unit.CurrentStats.Defense)))
	unit.CurrentStats.Health -= actualDamage

	// Check if unit died
	if unit.CurrentStats.Health <= 0 {
		unit.CurrentStats.Health = 0
		unit.IsAlive = false
		unit.Status = "dead"
	}

	return nil
}

// HealUnit restores health to a unit
func (um *UnitManager) HealUnit(unitID string, healAmount int) error {
	unit := um.units[unitID]
	if unit == nil {
		return fmt.Errorf("unit not found: %s", unitID)
	}

	if !unit.IsAlive {
		return fmt.Errorf("cannot heal dead unit: %s", unitID)
	}

	// Apply healing (capped at max health)
	unit.CurrentStats.Health = int(math.Min(float64(unit.CurrentStats.Health+healAmount), float64(unit.MaxStats.Health)))

	return nil
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
	for _, unit := range um.units {
		if !unit.IsAlive {
			continue
		}

		// Convert tile coordinates to world coordinates
		worldX, worldY := um.gameMap.GridToWorld(unit.TileX, unit.TileY)
		
		// Calculate screen position
		screenX := worldX - cameraX
		screenY := worldY - cameraY

		// Get unit type definition
		typeDef, exists := UnitTypeDefinitions[unit.TypeID]
		if !exists {
			continue
		}

		// Only draw if on screen (with some margin)
		margin := 50.0
		if screenX < -margin || screenX > canvasWidth+margin || screenY < -margin || screenY > canvasHeight+margin {
			continue
		}

		// Draw unit as a colored circle with icon
		radius := typeDef.Appearance.Size / 2

		// Draw unit circle
		ctx.Set("fillStyle", typeDef.Appearance.Color)
		ctx.Call("beginPath")
		ctx.Call("arc", screenX, screenY, radius, 0, 2*math.Pi)
		ctx.Call("fill")

		// Draw unit icon (if supported by browser)
		ctx.Set("font", fmt.Sprintf("%dpx Arial", int(typeDef.Appearance.Size)))
		ctx.Set("textAlign", "center")
		ctx.Set("textBaseline", "middle")
		ctx.Set("fillStyle", "white")
		ctx.Call("fillText", typeDef.Appearance.Icon, screenX, screenY)

		// Draw health bar if damaged
		if unit.CurrentStats.Health < unit.MaxStats.Health {
			barWidth := radius * 2
			barHeight := 4.0
			barY := screenY - radius - 8

			// Background (red)
			ctx.Set("fillStyle", "#ff0000")
			ctx.Call("fillRect", screenX-barWidth/2, barY, barWidth, barHeight)

			// Health (green)
			healthPercent := float64(unit.CurrentStats.Health) / float64(unit.MaxStats.Health)
			ctx.Set("fillStyle", "#00ff00")
			ctx.Call("fillRect", screenX-barWidth/2, barY, barWidth*healthPercent, barHeight)
		}
	}
}

// addToTileIndex adds a unit to the tile index
func (um *UnitManager) addToTileIndex(unit *Unit) {
	tileKey := fmt.Sprintf("%d,%d", unit.TileX, unit.TileY)
	
	if um.unitsByTile[tileKey] == nil {
		um.unitsByTile[tileKey] = make(map[string]*Unit)
	}
	
	um.unitsByTile[tileKey][unit.ID] = unit
}

// removeFromTileIndex removes a unit from the tile index
func (um *UnitManager) removeFromTileIndex(unit *Unit) {
	tileKey := fmt.Sprintf("%d,%d", unit.TileX, unit.TileY)
	
	if unitsAtTile, exists := um.unitsByTile[tileKey]; exists {
		delete(unitsAtTile, unit.ID)
		
		// Clean up empty tile entries
		if len(unitsAtTile) == 0 {
			delete(um.unitsByTile, tileKey)
		}
	}
}