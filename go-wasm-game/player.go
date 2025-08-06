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

// Update handles player movement logic with tile-based speed adjustment
func (p *Player) Update(gameMap *Map) {
	if p.IsMoving {
		// Calculate direction to target
		dx := p.TargetX - p.X
		dy := p.TargetY - p.Y
		distance := math.Sqrt(dx*dx + dy*dy)
		
		// Get current tile and apply speed multiplier
		currentTileX, currentTileY := gameMap.WorldToGrid(p.X + p.Width/2, p.Y + p.Height/2)
		currentTileType := gameMap.GetTile(currentTileX, currentTileY)
		tileDef, exists := TileDefinitions[currentTileType]
		if !exists {
			// If tile definition not found, assume it's grass
			tileDef = TileDefinitions[TileGrass]
		}
		
		// Apply tile speed multiplier to base movement speed
		adjustedSpeed := p.MoveSpeed * tileDef.WalkSpeed
		
		// If close enough to target, snap to it and stop moving
		if distance < adjustedSpeed {
			p.X = p.TargetX
			p.Y = p.TargetY
			p.IsMoving = false
		} else {
			// Move towards target with tile-adjusted speed
			p.X += (dx / distance) * adjustedSpeed
			p.Y += (dy / distance) * adjustedSpeed
		}
	}
}



// MoveToTile initiates movement to a specific tile with smart collision detection
func (p *Player) MoveToTile(gameMap *Map, tileX, tileY int) {
	// Find the nearest walkable tile if the target is not walkable
	walkableTileX, walkableTileY := FindNearestWalkableTile(tileX, tileY, gameMap)
	
	// Convert tile coordinates to world coordinates (center of tile)
	worldX, worldY := gameMap.GridToWorld(walkableTileX, walkableTileY)
	
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

