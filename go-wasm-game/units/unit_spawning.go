package units

import (
	"fmt"
	"math/rand"
	"time"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/entities"
)

// SpawnRandomUnit spawns a random unit at a random valid location
func (um *UnitManager) SpawnRandomUnit() error {
	if um.GetTotalUnitCount() >= 10 {
		return fmt.Errorf("maximum unit count reached")
	}
	
	// Random unit type
	unitTypes := []entities.UnitType{entities.UnitWarrior, entities.UnitArcher, entities.UnitMage}
	unitType := unitTypes[rand.Intn(len(unitTypes))]
	
	// Try to find a valid spawn location (max 50 attempts)
	for attempts := 0; attempts < 50; attempts++ {
		x := rand.Intn(um.gameMap.Width)
		y := rand.Intn(um.gameMap.Height)
		
		if err := um.validatePosition(x, y); err == nil {
			// Generate unique name with timestamp
			name := fmt.Sprintf("Unit_%d", time.Now().UnixNano()%10000)
			_, err := um.CreateUnit(unitType, x, y, name)
			return err
		}
	}
	
	return fmt.Errorf("no valid spawn location found")
}

// RemoveNewestUnit removes the most recently created unit
func (um *UnitManager) RemoveNewestUnit() error {
	if um.GetTotalUnitCount() <= 1 {
		return fmt.Errorf("cannot remove unit: minimum of 1 unit required")
	}
	
	var newestUnit *Unit
	var newestTime time.Time
	var newestID string
	
	for id, unit := range um.units {
		if unit.CreatedAt.After(newestTime) {
			newestTime = unit.CreatedAt
			newestUnit = unit
			newestID = id
		}
	}
	
	if newestUnit != nil {
		return um.RemoveUnit(newestID)
	}
	
	return fmt.Errorf("no unit found to remove")
}