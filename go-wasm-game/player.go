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
	Path       Path    // Current pathfinding path
	PathStep   int     // Current step in the path
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
		Path:      nil,
		PathStep:  0,
	}
}

// Update handles player movement logic with pathfinding
func (p *Player) Update(gameMap *Map) {
	if p.IsMoving && p.Path != nil {
		// Check if we need to move to the next step in the path
		if !p.isMovingToTarget() {
			// We've reached the current target, move to next step in path
			p.PathStep++
			
			if IsPathComplete(p.Path, p.PathStep) {
				// Path completed
				p.IsMoving = false
				p.Path = nil
				p.PathStep = 0
				return
			}
			
			// Set next target from path
			stepX, stepY, hasNext := GetNextPathStep(p.Path, p.PathStep)
			if hasNext {
				worldX, worldY := gameMap.GridToWorld(stepX, stepY)
				p.TargetX = worldX - p.Width/2
				p.TargetY = worldY - p.Height/2
			}
		}
		
		// Move towards current target
		p.moveTowardTarget()
	}
}

// isMovingToTarget checks if player is still moving toward the current target
func (p *Player) isMovingToTarget() bool {
	dx := p.TargetX - p.X
	dy := p.TargetY - p.Y
	distance := math.Sqrt(dx*dx + dy*dy)
	return distance >= p.MoveSpeed
}

// moveTowardTarget moves the player toward the current target position
func (p *Player) moveTowardTarget() {
	dx := p.TargetX - p.X
	dy := p.TargetY - p.Y
	distance := math.Sqrt(dx*dx + dy*dy)
	
	if distance < p.MoveSpeed {
		// Snap to target
		p.X = p.TargetX
		p.Y = p.TargetY
	} else {
		// Move towards target
		p.X += (dx / distance) * p.MoveSpeed
		p.Y += (dy / distance) * p.MoveSpeed
	}
}



// MoveToTile initiates pathfinding-based movement to a specific tile
func (p *Player) MoveToTile(gameMap *Map, tileX, tileY int) {
	// Get current player position in grid coordinates
	currentX, currentY := gameMap.WorldToGrid(p.X + p.Width/2, p.Y + p.Height/2)
	
	// Find path from current position to target
	path := FindPath(currentX, currentY, tileX, tileY, gameMap)
	
	if path == nil || len(path) == 0 {
		// No path found, don't move
		return
	}
	
	// Set up pathfinding movement
	p.Path = path
	p.PathStep = 0
	p.IsMoving = true
	
	// Set initial target (first step in path)
	if len(path) > 0 {
		stepX, stepY, hasNext := GetNextPathStep(path, 0)
		if hasNext {
			worldX, worldY := gameMap.GridToWorld(stepX, stepY)
			p.TargetX = worldX - p.Width/2
			p.TargetY = worldY - p.Height/2
		}
	}
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
	p.Path = nil
	p.PathStep = 0
}

