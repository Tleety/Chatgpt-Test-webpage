package entities

import (
	"math"
	"syscall/js"
)

// Player represents the player character
type Player struct {
	X            float64
	Y            float64
	Width        float64
	Height       float64
	TargetX      float64
	TargetY      float64
	IsMovingFlag bool
	MoveSpeed    float64
	Path         [][]int
	PathStep     int
	Speed        float64 // Legacy field
}

// NewPlayer creates a new player with default settings
func NewPlayer(startX, startY float64) *Player {
	player := &Player{
		X:            startX,
		Y:            startY,
		Width:        20,
		Height:       20,
		TargetX:      startX,
		TargetY:      startY,
		IsMovingFlag: false,
		MoveSpeed:    3, // Speed for tile-to-tile movement
		Path:         nil,
		PathStep:     0,
		Speed:        5, // Legacy field for compatibility
	}
	return player
}

// Update handles player movement logic
func (p *Player) Update() {
	if !p.IsMovingFlag {
		return
	}
	
	// Calculate distance to target
	dx := p.TargetX - p.X
	dy := p.TargetY - p.Y
	distance := math.Sqrt(dx*dx + dy*dy)
	
	// Fixed thresholds to prevent dead zones
	const snapThreshold = 0.2  // Much smaller than before to prevent premature stopping
	const precisionThreshold = 0.1  // Even smaller to ensure movement continues
	
	// Check if we've reached the target
	if distance <= snapThreshold {
		// Snap to target and stop moving
		p.X = p.TargetX
		p.Y = p.TargetY
		p.IsMovingFlag = false
		return
	}
	
	// Move toward target if distance is significant
	if distance > precisionThreshold {
		// Prevent overshoot by checking if we would overshoot with full speed
		if distance < p.MoveSpeed {
			// Move exactly to target to prevent overshoot
			p.X = p.TargetX
			p.Y = p.TargetY
			p.IsMovingFlag = false
		} else {
			// Normal movement
			p.X += (dx / distance) * p.MoveSpeed
			p.Y += (dy / distance) * p.MoveSpeed
		}
	}
	// Note: No dead zone - if distance is between precisionThreshold and snapThreshold,
	// we still continue moving until we reach snapThreshold
}

// MoveToTile initiates movement to a specific tile
func (p *Player) MoveToTile(tileX, tileY int) {
	// For now, implement direct movement to tile center
	// Later this could be enhanced with pathfinding for complex maps
	
	// Convert tile coordinates to world coordinates (tile center)
	const tileSize = 32.0
	tileCenterX := float64(tileX)*tileSize + tileSize/2
	tileCenterY := float64(tileY)*tileSize + tileSize/2
	
	// Calculate where to position the player so they're centered on the tile
	p.TargetX = tileCenterX - p.Width/2
	p.TargetY = tileCenterY - p.Height/2
	
	// Only start moving if we're not already at the target
	dx := p.TargetX - p.X
	dy := p.TargetY - p.Y
	distance := math.Sqrt(dx*dx + dy*dy)
	
	if distance > 0.1 { // Small threshold to avoid unnecessary movement
		p.IsMovingFlag = true
	}
}

// ClampToMapBounds ensures the player stays within map boundaries
func (p *Player) ClampToMapBounds(mapWidth, mapHeight, tileSize float64) {
	mapWorldWidth := mapWidth * tileSize
	mapWorldHeight := mapHeight * tileSize
	
	if p.X < 0 {
		p.X = 0
	}
	if p.Y < 0 {
		p.Y = 0
	}
	if p.X + p.Width > mapWorldWidth {
		p.X = mapWorldWidth - p.Width
	}
	if p.Y + p.Height > mapWorldHeight {
		p.Y = mapWorldHeight - p.Height
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
	p.IsMovingFlag = false
	p.Path = nil
	p.PathStep = 0
}