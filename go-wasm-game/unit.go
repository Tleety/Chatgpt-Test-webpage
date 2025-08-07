package main

import (
	"time"
)

// Unit represents an individual unit instance
type Unit struct {
	ID             string
	TypeID         UnitType
	Name           string
	TileX          int
	TileY          int
	CurrentStats   UnitStats
	MaxStats       UnitStats
	Level          int
	Experience     int
	IsAlive        bool
	Status         string
	CreatedAt      time.Time
	LastMoved      time.Time
	MovableEntity         // Embed the unified movement system
	movementSystem *MovementSystem
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

// GetPosition returns the world coordinates of the unit (implementing Movable interface)
func (u *Unit) GetPosition() (float64, float64) {
	return u.MovableEntity.GetPosition()
}

// GetTilePosition returns the tile coordinates of the unit (legacy compatibility)
func (u *Unit) GetTilePosition() (int, int) {
	return u.TileX, u.TileY
}

// SetPosition sets the world coordinates and updates tile position (implementing Movable interface)
func (u *Unit) SetPosition(x, y float64) {
	u.MovableEntity.SetPosition(x, y)
	// Update tile position based on world position
	if u.movementSystem != nil {
		tileX, tileY := u.movementSystem.gameMap.WorldToGrid(x + u.Width/2, y + u.Height/2)
		u.TileX = tileX
		u.TileY = tileY
	}
}
// Update handles unit movement using the unified movement system
func (u *Unit) Update() {
	if u.movementSystem != nil {
		u.movementSystem.Update(u)
		// Sync tile position with world position
		x, y := u.MovableEntity.GetPosition()
		tileX, tileY := u.movementSystem.gameMap.WorldToGrid(x + u.Width/2, y + u.Height/2)
		u.TileX = tileX
		u.TileY = tileY
	}
}

// MoveToTile initiates pathfinding-based movement to a specific tile
func (u *Unit) MoveToTile(tileX, tileY int) {
	if u.movementSystem != nil {
		u.movementSystem.MoveToTile(u, tileX, tileY)
	}
}