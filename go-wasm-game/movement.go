package main

import (
	"math"
)

// Movable represents an entity that can move using the unified movement system
type Movable interface {
	GetPosition() (float64, float64)
	SetPosition(x, y float64)
	GetSize() (float64, float64)
	GetMoveSpeed() float64
	SetTarget(x, y float64)
	GetTarget() (float64, float64)
	IsMoving() bool
	SetMoving(moving bool)
	GetPath() Path
	SetPath(path Path)
	GetPathStep() int
	SetPathStep(step int)
}

// MovementSystem handles unified movement logic for both players and units
// Redesigned from scratch to eliminate dead zones and complex threshold logic
type MovementSystem struct {
	gameMap *Map
}

// NewMovementSystem creates a new movement system
func NewMovementSystem(gameMap *Map) *MovementSystem {
	return &MovementSystem{
		gameMap: gameMap,
	}
}

// Update handles movement logic with simplified, robust movement execution
// Redesigned to eliminate dead zones and ensure smooth movement to targets
func (ms *MovementSystem) Update(entity Movable) {
	if !entity.IsMoving() {
		return
	}

	path := entity.GetPath()
	if path == nil {
		entity.SetMoving(false)
		return
	}

	// Check if we've reached the current target
	if ms.hasReachedTarget(entity) {
		// Move to next step in path
		if !ms.advanceToNextPathStep(entity) {
			// Path completed or no more steps
			entity.SetMoving(false)
			entity.SetPath(nil)
			entity.SetPathStep(0)
			return
		}
	}
	
	// Execute movement towards current target
	ms.executeMovement(entity)
}

// hasReachedTarget checks if entity has reached the current target
// Uses a simple, small threshold to avoid any dead zones
func (ms *MovementSystem) hasReachedTarget(entity Movable) bool {
	x, y := entity.GetPosition()
	targetX, targetY := entity.GetTarget()
	dx := targetX - x
	dy := targetY - y
	distance := math.Sqrt(dx*dx + dy*dy)
	
	// Use a very small threshold to determine if we've reached the target
	// This eliminates the dead zone problem entirely
	const arrivalThreshold = 0.5
	return distance <= arrivalThreshold
}

// advanceToNextPathStep moves to the next step in the path
// Returns true if there's a next step, false if path is complete
func (ms *MovementSystem) advanceToNextPathStep(entity Movable) bool {
	path := entity.GetPath()
	currentStep := entity.GetPathStep()
	nextStep := currentStep + 1
	
	if IsPathComplete(path, nextStep) {
		return false // Path completed
	}
	
	// Get next target from path
	stepX, stepY, hasNext := GetNextPathStep(path, nextStep)
	if !hasNext {
		return false // No next step available
	}
	
	// Set new target and advance path step
	worldX, worldY := ms.gameMap.GridToWorld(stepX, stepY)
	width, height := entity.GetSize()
	targetX := worldX - width/2
	targetY := worldY - height/2
	entity.SetTarget(targetX, targetY)
	entity.SetPathStep(nextStep)
	
	return true
}

// executeMovement performs the actual movement towards the target
// Simplified logic that ensures smooth movement without dead zones
func (ms *MovementSystem) executeMovement(entity Movable) {
	x, y := entity.GetPosition()
	targetX, targetY := entity.GetTarget()
	dx := targetX - x
	dy := targetY - y
	distance := math.Sqrt(dx*dx + dy*dy)
	
	// If we're very close to target, snap exactly to it
	if distance < 0.1 {
		entity.SetPosition(targetX, targetY)
		return
	}
	
	// Calculate terrain-adjusted movement speed
	moveSpeed := ms.getTerrainAdjustedSpeed(entity)
	
	// Move towards target, but never overshoot
	if distance <= moveSpeed {
		// If we would overshoot, move exactly to target
		entity.SetPosition(targetX, targetY)
	} else {
		// Normal movement step
		newX := x + (dx / distance) * moveSpeed
		newY := y + (dy / distance) * moveSpeed
		entity.SetPosition(newX, newY)
	}
}

// getTerrainAdjustedSpeed calculates movement speed based on current terrain
func (ms *MovementSystem) getTerrainAdjustedSpeed(entity Movable) float64 {
	x, y := entity.GetPosition()
	width, height := entity.GetSize()
	
	// Get current tile based on entity center
	currentTileX, currentTileY := ms.gameMap.WorldToGrid(x + width/2, y + height/2)
	currentTileType := ms.gameMap.GetTile(currentTileX, currentTileY)
	
	// Get tile definition for speed multiplier
	tileDef, exists := TileDefinitions[currentTileType]
	if !exists {
		// Default to grass if tile definition not found
		tileDef = TileDefinitions[TileGrass]
	}
	
	// Apply terrain speed multiplier to base movement speed
	return entity.GetMoveSpeed() * tileDef.WalkSpeed
}

// MoveToTile initiates pathfinding-based movement to a specific tile
// Uses existing pathfinding but with simplified movement execution
func (ms *MovementSystem) MoveToTile(entity Movable, tileX, tileY int) {
	// Get current entity position in grid coordinates
	x, y := entity.GetPosition()
	width, height := entity.GetSize()
	currentX, currentY := ms.gameMap.WorldToGrid(x + width/2, y + height/2)
	
	// If already at target tile, no need to pathfind
	if currentX == tileX && currentY == tileY {
		entity.SetMoving(false)
		entity.SetPath(nil)
		entity.SetPathStep(0)
		return
	}
	
	// Ensure the destination is walkable - if not, find nearest walkable tile
	endTileType := ms.gameMap.GetTile(tileX, tileY)
	tileDef, exists := TileDefinitions[endTileType]
	if !exists || !tileDef.Walkable {
		// Find nearest walkable tile
		tileX, tileY = FindNearestWalkableTile(tileX, tileY, ms.gameMap)
	}
	
	// Find path from current position to target using existing pathfinding
	path := FindPath(currentX, currentY, tileX, tileY, ms.gameMap)
	
	if path == nil || len(path) == 0 {
		// No path found, don't move
		return
	}
	
	// Set up pathfinding movement with simplified system
	entity.SetPath(path)
	entity.SetPathStep(0)
	entity.SetMoving(true)
	
	// Set initial target (first step in path)
	if len(path) > 0 {
		stepX, stepY, hasNext := GetNextPathStep(path, 0)
		if hasNext {
			worldX, worldY := ms.gameMap.GridToWorld(stepX, stepY)
			targetX := worldX - width/2
			targetY := worldY - height/2
			entity.SetTarget(targetX, targetY)
		}
	}
}

// ClampToMapBounds ensures the entity stays within map boundaries
func (ms *MovementSystem) ClampToMapBounds(entity Movable) {
	mapWorldWidth := float64(ms.gameMap.Width) * ms.gameMap.TileSize
	mapWorldHeight := float64(ms.gameMap.Height) * ms.gameMap.TileSize
	
	x, y := entity.GetPosition()
	targetX, targetY := entity.GetTarget()
	width, height := entity.GetSize()
	
	// Clamp current position
	if x < 0 {
		x = 0
	}
	if y < 0 {
		y = 0
	}
	if x > mapWorldWidth-width {
		x = mapWorldWidth - width
	}
	if y > mapWorldHeight-height {
		y = mapWorldHeight - height
	}
	
	// Clamp target coordinates
	if targetX < 0 {
		targetX = 0
	}
	if targetY < 0 {
		targetY = 0
	}
	if targetX > mapWorldWidth-width {
		targetX = mapWorldWidth - width
	}
	if targetY > mapWorldHeight-height {
		targetY = mapWorldHeight - height
	}
	
	entity.SetPosition(x, y)
	entity.SetTarget(targetX, targetY)
}

// MovableEntity provides a base implementation of the Movable interface
type MovableEntity struct {
	X, Y       float64
	Width      float64
	Height     float64
	TargetX    float64
	TargetY    float64
	IsMovingFlag bool
	MoveSpeed  float64
	Path       Path
	PathStep   int
}

// Implement Movable interface for MovableEntity
func (me *MovableEntity) GetPosition() (float64, float64) { return me.X, me.Y }
func (me *MovableEntity) SetPosition(x, y float64) { me.X, me.Y = x, y }
func (me *MovableEntity) GetSize() (float64, float64) { return me.Width, me.Height }
func (me *MovableEntity) GetMoveSpeed() float64 { return me.MoveSpeed }
func (me *MovableEntity) SetTarget(x, y float64) { me.TargetX, me.TargetY = x, y }
func (me *MovableEntity) GetTarget() (float64, float64) { return me.TargetX, me.TargetY }
func (me *MovableEntity) IsMoving() bool { return me.IsMovingFlag }
func (me *MovableEntity) SetMoving(moving bool) { me.IsMovingFlag = moving }
func (me *MovableEntity) GetPath() Path { return me.Path }
func (me *MovableEntity) SetPath(path Path) { me.Path = path }
func (me *MovableEntity) GetPathStep() int { return me.PathStep }
func (me *MovableEntity) SetPathStep(step int) { me.PathStep = step }