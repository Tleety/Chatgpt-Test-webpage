package main

import (
	"syscall/js"
)

// Player represents the player character
type Player struct {
	MovableEntity         // Embed the unified movement system
	Speed         float64 // Legacy field, now uses MoveSpeed from MovableEntity
	movementSystem *MovementSystem
}

// NewPlayer creates a new player with default settings
func NewPlayer(startX, startY float64, gameMap *Map) *Player {
	player := &Player{
		MovableEntity: MovableEntity{
			X:         startX,
			Y:         startY,
			Width:     20,
			Height:    20,
			TargetX:   startX,
			TargetY:   startY,
			IsMovingFlag: false,
			MoveSpeed: 3, // Speed for tile-to-tile movement
			Path:      nil,
			PathStep:  0,
		},
		Speed: 5, // Legacy field for compatibility
		movementSystem: NewMovementSystem(gameMap),
	}
	return player
}

// Update handles player movement logic using the unified movement system
func (p *Player) Update(gameMap *Map) {
	p.movementSystem.Update(p)
}

// MoveToTile initiates pathfinding-based movement to a specific tile using the unified movement system
func (p *Player) MoveToTile(gameMap *Map, tileX, tileY int) {
	p.movementSystem.MoveToTile(p, tileX, tileY)
}

// ClampToMapBounds ensures the player stays within map boundaries using the unified movement system
func (p *Player) ClampToMapBounds(gameMap *Map) {
	p.movementSystem.ClampToMapBounds(p)
}

// Draw renders the player on the screen
func (p *Player) Draw(ctx js.Value, cameraX, cameraY float64) {
	playerScreenX := p.X - cameraX
	playerScreenY := p.Y - cameraY
	ctx.Set("fillStyle", "green")
	ctx.Call("fillRect", playerScreenX, playerScreenY, p.Width, p.Height)
}

// GetPosition returns the current player position (legacy compatibility)
func (p *Player) GetPosition() (float64, float64) {
	return p.X, p.Y
}

// SetPosition sets the player position and stops any ongoing movement (legacy compatibility)
func (p *Player) SetPosition(x, y float64) {
	p.X = x
	p.Y = y
	p.TargetX = x
	p.TargetY = y
	p.IsMovingFlag = false
	p.Path = nil
	p.PathStep = 0
}

