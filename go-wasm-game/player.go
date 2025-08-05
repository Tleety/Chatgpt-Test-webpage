package main

import (
	"math"
	"syscall/js"
)

// Player represents the player character
type Player struct {
	X, Y       float64
	Width      float64
	Height     float64
	Speed      float64
	TargetX    float64
	TargetY    float64
	IsMoving   bool
	MoveSpeed  float64
}

// NewPlayer creates a new player with default settings
func NewPlayer(startX, startY float64) *Player {
	return &Player{
		X:         startX,
		Y:         startY,
		Width:     20,
		Height:    20,
		Speed:     5,
		TargetX:   startX,
		TargetY:   startY,
		IsMoving:  false,
		MoveSpeed: 3, // Speed for tile-to-tile movement
	}
}

// Update handles player movement logic
func (p *Player) Update() {
	if p.IsMoving {
		// Calculate direction to target
		dx := p.TargetX - p.X
		dy := p.TargetY - p.Y
		distance := math.Sqrt(dx*dx + dy*dy)
		
		// If close enough to target, snap to it and stop moving
		if distance < p.MoveSpeed {
			p.X = p.TargetX
			p.Y = p.TargetY
			p.IsMoving = false
		} else {
			// Move towards target
			p.X += (dx / distance) * p.MoveSpeed
			p.Y += (dy / distance) * p.MoveSpeed
		}
	}
}

// MoveByKeyboard handles keyboard-based movement
func (p *Player) MoveByKeyboard(key string) {
	// Stop any ongoing tile movement when using keyboard
	p.IsMoving = false
	
	switch key {
	case "ArrowUp", "w", "W":
		p.Y -= p.Speed
		p.TargetY = p.Y
	case "ArrowDown", "s", "S":
		p.Y += p.Speed
		p.TargetY = p.Y
	case "ArrowLeft", "a", "A":
		p.X -= p.Speed
		p.TargetX = p.X
	case "ArrowRight", "d", "D":
		p.X += p.Speed
		p.TargetX = p.X
	}
}

// MoveToTile initiates movement to a specific tile
func (p *Player) MoveToTile(gameMap *Map, tileX, tileY int) {
	// Convert tile coordinates to world coordinates (center of tile)
	worldX, worldY := gameMap.GridToWorld(tileX, tileY)
	
	// Offset to center the player square in the tile
	p.TargetX = worldX - p.Width/2
	p.TargetY = worldY - p.Height/2
	p.IsMoving = true
}

// ClampToMapBounds ensures the player stays within map boundaries
func (p *Player) ClampToMapBounds(gameMap *Map) {
	mapWorldWidth := float64(gameMap.Width) * gameMap.TileSize
	mapWorldHeight := float64(gameMap.Height) * gameMap.TileSize
	
	if p.X < 0 {
		p.X = 0
	}
	if p.Y < 0 {
		p.Y = 0
	}
	if p.X > mapWorldWidth-p.Width {
		p.X = mapWorldWidth - p.Width
	}
	if p.Y > mapWorldHeight-p.Height {
		p.Y = mapWorldHeight - p.Height
	}
	
	// Also clamp target coordinates
	if p.TargetX < 0 {
		p.TargetX = 0
	}
	if p.TargetY < 0 {
		p.TargetY = 0
	}
	if p.TargetX > mapWorldWidth-p.Width {
		p.TargetX = mapWorldWidth - p.Width
	}
	if p.TargetY > mapWorldHeight-p.Height {
		p.TargetY = mapWorldHeight - p.Height
	}
}

// Draw renders the player on the screen
func (p *Player) Draw(ctx js.Value, cameraX, cameraY float64) {
	playerScreenX := p.X - cameraX
	playerScreenY := p.Y - cameraY
	ctx.Set("fillStyle", "green")
	ctx.Call("fillRect", playerScreenX, playerScreenY, p.Width, p.Height)
}

// GetPosition returns the current player position
func (p *Player) GetPosition() (float64, float64) {
	return p.X, p.Y
}

// SetPosition sets the player position and stops any ongoing movement
func (p *Player) SetPosition(x, y float64) {
	p.X = x
	p.Y = y
	p.TargetX = x
	p.TargetY = y
	p.IsMoving = false
}