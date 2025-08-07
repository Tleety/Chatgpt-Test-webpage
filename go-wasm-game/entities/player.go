package entities

import (
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

// Update handles player movement logic (placeholder for now)
func (p *Player) Update() {
	// Movement logic to be implemented
}

// MoveToTile initiates pathfinding-based movement to a specific tile
func (p *Player) MoveToTile(tileX, tileY int) {
	// Pathfinding logic to be implemented
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