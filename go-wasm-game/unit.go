package main

import (
	"time"
)

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

// GetTypeDef returns the type definition for this unit
func (u *Unit) GetTypeDef() (UnitTypeDef, bool) {
	typeDef, exists := UnitTypeDefinitions[u.TypeID]
	return typeDef, exists
}

// IsHealthy returns true if the unit is at full health
func (u *Unit) IsHealthy() bool {
	return u.CurrentStats.Health >= u.MaxStats.Health
}

// HealthPercentage returns the health as a percentage (0.0 to 1.0)
func (u *Unit) HealthPercentage() float64 {
	if u.MaxStats.Health == 0 {
		return 0.0
	}
	return float64(u.CurrentStats.Health) / float64(u.MaxStats.Health)
}

// GetPosition returns the tile coordinates of the unit
func (u *Unit) GetPosition() (int, int) {
	return u.TileX, u.TileY
}