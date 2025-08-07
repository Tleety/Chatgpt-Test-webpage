package entities

import (
	"syscall/js"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/systems"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/world"
)

// Player represents the player character
type Player struct {
	systems.MovableEntity         // Embed the unified movement system
	Speed        float64          // Legacy field for compatibility
	movementSystem *systems.MovementSystem
}

// NewPlayer creates a new player with default settings
func NewPlayer(startX, startY float64, gameMap *world.Map) *Player {
	player := &Player{
		MovableEntity: systems.MovableEntity{
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
		movementSystem: systems.NewMovementSystem(gameMap),
	}
	return player
}

// Update handles player movement logic using the unified movement system
func (p *Player) Update() {
	if p.movementSystem != nil {
		p.movementSystem.Update(p)
	}
}

// MoveToTile initiates pathfinding-based movement to a specific tile using the unified movement system
func (p *Player) MoveToTile(tileX, tileY int) {
	if p.movementSystem != nil {
		p.movementSystem.MoveToTile(p, tileX, tileY)
	}
}

// ClampToMapBounds ensures the player stays within map boundaries using the movement system
func (p *Player) ClampToMapBounds(mapWidth, mapHeight, tileSize float64) {
	if p.movementSystem != nil {
		p.movementSystem.ClampToMapBounds(p)
	}
}

// Draw renders the player on the screen
func (p *Player) Draw(ctx js.Value, cameraX, cameraY float64) {
	x, y := p.MovableEntity.GetPosition()
	playerScreenX := x - cameraX
	playerScreenY := y - cameraY
	ctx.Set("fillStyle", "green")
	ctx.Call("fillRect", playerScreenX, playerScreenY, p.MovableEntity.Width, p.MovableEntity.Height)
}

// GetPosition returns the current player position (delegates to MovableEntity)
func (p *Player) GetPosition() (float64, float64) {
	return p.MovableEntity.GetPosition()
}

// SetPosition sets the player position and stops any ongoing movement (delegates to MovableEntity and clears movement state)
func (p *Player) SetPosition(x, y float64) {
	p.MovableEntity.SetPosition(x, y)
	p.MovableEntity.SetTarget(x, y)
	p.MovableEntity.SetMoving(false)
	p.MovableEntity.SetPath(nil)
	p.MovableEntity.SetPathStep(0)
}