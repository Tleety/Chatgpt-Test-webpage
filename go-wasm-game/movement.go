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
type MovementSystem struct {
	gameMap *Map
}

// NewMovementSystem creates a new movement system
func NewMovementSystem(gameMap *Map) *MovementSystem {
	return &MovementSystem{
		gameMap: gameMap,
	}
}

// Update handles movement logic with pathfinding and tile-based speed adjustment
func (ms *MovementSystem) Update(entity Movable) {
	if !entity.IsMoving() {
		return
	}

	path := entity.GetPath()
	if path == nil {
		entity.SetMoving(false)
		return
	}

	// Check if we need to move to the next step in the path
	if !ms.isMovingToTarget(entity) {
		// We've reached the current target, move to next step in path
		currentStep := entity.GetPathStep()
		nextStep := currentStep + 1
		entity.SetPathStep(nextStep)
		
		if IsPathComplete(path, nextStep) {
			// Path completed
			entity.SetMoving(false)
			entity.SetPath(nil)
			entity.SetPathStep(0)
			return
		}
		
		// Set next target from path
		stepX, stepY, hasNext := GetNextPathStep(path, nextStep)
		if hasNext {
			worldX, worldY := ms.gameMap.GridToWorld(stepX, stepY)
			width, height := entity.GetSize()
			targetX := worldX - width/2
			targetY := worldY - height/2
			entity.SetTarget(targetX, targetY)
		} else {
			// No next step available, stop movement to prevent getting stuck
			entity.SetMoving(false)
			entity.SetPath(nil)
			entity.SetPathStep(0)
			return
		}
	}
	
	// Move towards current target with tile-based speed adjustment
	ms.moveTowardTargetWithTileSpeed(entity)
}

// isMovingToTarget checks if entity is still moving toward the current target
func (ms *MovementSystem) isMovingToTarget(entity Movable) bool {
	x, y := entity.GetPosition()
	targetX, targetY := entity.GetTarget()
	dx := targetX - x
	dy := targetY - y
	distance := math.Sqrt(dx*dx + dy*dy)
	// Use a small threshold to prevent floating point precision issues
	const precisionThreshold = 0.5
	return distance >= precisionThreshold
}

// moveTowardTargetWithTileSpeed moves the entity toward the current target position with tile-based speed
func (ms *MovementSystem) moveTowardTargetWithTileSpeed(entity Movable) {
	x, y := entity.GetPosition()
	targetX, targetY := entity.GetTarget()
	dx := targetX - x
	dy := targetY - y
	distance := math.Sqrt(dx*dx + dy*dy)
	
	// If we're very close to the target, snap to it to prevent floating point issues
	const snapThreshold = 1.0
	if distance <= snapThreshold {
		entity.SetPosition(targetX, targetY)
		return
	}
	
	// Get current tile and apply speed multiplier
	width, height := entity.GetSize()
	currentTileX, currentTileY := ms.gameMap.WorldToGrid(x + width/2, y + height/2)
	currentTileType := ms.gameMap.GetTile(currentTileX, currentTileY)
	tileDef, exists := TileDefinitions[currentTileType]
	if !exists {
		// If tile definition not found, assume it's grass
		tileDef = TileDefinitions[TileGrass]
	}
	
	// Apply tile speed multiplier to base movement speed
	adjustedSpeed := entity.GetMoveSpeed() * tileDef.WalkSpeed
	
	if distance < adjustedSpeed {
		// Snap to target
		entity.SetPosition(targetX, targetY)
	} else {
		// Move towards target with tile-adjusted speed
		newX := x + (dx / distance) * adjustedSpeed
		newY := y + (dy / distance) * adjustedSpeed
		entity.SetPosition(newX, newY)
	}
}

// MoveToTile initiates pathfinding-based movement to a specific tile
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
	
	// Find path from current position to target
	path := FindPath(currentX, currentY, tileX, tileY, ms.gameMap)
	
	if path == nil || len(path) == 0 {
		// No path found, don't move
		return
	}
	
	// Ensure the destination is walkable - if not, find nearest walkable tile
	endTileType := ms.gameMap.GetTile(tileX, tileY)
	tileDef, exists := TileDefinitions[endTileType]
	if !exists || !tileDef.Walkable {
		// Find nearest walkable tile
		adjustedX, adjustedY := FindNearestWalkableTile(tileX, tileY, ms.gameMap)
		if adjustedX != tileX || adjustedY != tileY {
			// Recalculate path to the adjusted destination
			path = FindPath(currentX, currentY, adjustedX, adjustedY, ms.gameMap)
			if path == nil || len(path) == 0 {
				return
			}
		}
	}
	
	// Set up pathfinding movement
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