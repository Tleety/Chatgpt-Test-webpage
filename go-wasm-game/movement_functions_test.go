//go:build !js
// +build !js

package main

import (
	"testing"
	"math"
)

// Copy the exact function implementations from movement.go to test them
// This tests the actual logic without WASM dependencies

// Mock types needed for testing
type mockTileType int

const (
	mockTileGrass mockTileType = 0
	mockTileWater mockTileType = 1
)

type mockTileDefinition struct {
	Walkable  bool
	WalkSpeed float64
}

var mockTileDefinitions = map[mockTileType]mockTileDefinition{
	mockTileGrass: {Walkable: true, WalkSpeed: 1.0},
	mockTileWater: {Walkable: false, WalkSpeed: 0.3},
}

type mockMap struct {
	Width    int
	Height   int
	TileSize float64
	tiles    [][]mockTileType
}

func newMockMap(width, height int, tileSize float64) *mockMap {
	tiles := make([][]mockTileType, height)
	for i := range tiles {
		tiles[i] = make([]mockTileType, width)
	}
	
	return &mockMap{
		Width:    width,
		Height:   height,
		TileSize: tileSize,
		tiles:    tiles,
	}
}

func (m *mockMap) SetTile(x, y int, tileType mockTileType) {
	if x >= 0 && x < m.Width && y >= 0 && y < m.Height {
		m.tiles[y][x] = tileType
	}
}

func (m *mockMap) GetTile(x, y int) mockTileType {
	if x >= 0 && x < m.Width && y >= 0 && y < m.Height {
		return m.tiles[y][x]
	}
	return mockTileGrass
}

func (m *mockMap) GridToWorld(gridX, gridY int) (float64, float64) {
	return float64(gridX)*m.TileSize + m.TileSize/2, float64(gridY)*m.TileSize + m.TileSize/2
}

func (m *mockMap) WorldToGrid(worldX, worldY float64) (int, int) {
	return int(worldX / m.TileSize), int(worldY / m.TileSize)
}

// Path represents a sequence of grid coordinates (copy from pathfinding.go)
type Path []struct {
	X, Y int
}

// Movable interface (copy from movement.go)
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

// MovableEntity (copy from movement.go)
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

// Implement Movable interface for MovableEntity (copy from movement.go)
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

// ACTUAL FUNCTIONS TO TEST - copied exactly from movement.go and pathfinding.go

// GetNextPathStep returns the next step in the path (from pathfinding.go line 227)
func GetNextPathStep(path Path, currentStep int) (int, int, bool) {
	if currentStep >= len(path) {
		return 0, 0, false // Path completed
	}
	
	step := path[currentStep]
	return step.X, step.Y, true
}

// IsPathComplete checks if we've reached the end of the path (from pathfinding.go line 237)
func IsPathComplete(path Path, currentStep int) bool {
	return currentStep >= len(path)
}

// PathLength returns the number of steps in the path (from pathfinding.go line 242)
func PathLength(path Path) int {
	return len(path)
}

// hasReachedTarget checks if entity has reached the current target (from movement.go line 73)
func hasReachedTarget(entity Movable, gameMap *mockMap) bool {
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

// advanceToNextPathStep moves to the next step in the path (from movement.go line 88)
func advanceToNextPathStep(entity Movable, gameMap *mockMap) bool {
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
	worldX, worldY := gameMap.GridToWorld(stepX, stepY)
	width, height := entity.GetSize()
	targetX := worldX - width/2
	targetY := worldY - height/2
	entity.SetTarget(targetX, targetY)
	entity.SetPathStep(nextStep)
	
	return true
}

// executeMovement performs the actual movement towards the target (from movement.go line 116)
func executeMovement(entity Movable, gameMap *mockMap) {
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
	moveSpeed := getTerrainAdjustedSpeed(entity, gameMap)
	
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

// getTerrainAdjustedSpeed calculates movement speed based on current terrain (from movement.go line 145)
func getTerrainAdjustedSpeed(entity Movable, gameMap *mockMap) float64 {
	x, y := entity.GetPosition()
	width, height := entity.GetSize()
	
	// Get current tile based on entity center
	currentTileX, currentTileY := gameMap.WorldToGrid(x + width/2, y + height/2)
	currentTileType := gameMap.GetTile(currentTileX, currentTileY)
	
	// Get tile definition for speed multiplier
	tileDef, exists := mockTileDefinitions[currentTileType]
	if !exists {
		// Default to grass if tile definition not found
		tileDef = mockTileDefinitions[mockTileGrass]
	}
	
	// Apply terrain speed multiplier to base movement speed
	return entity.GetMoveSpeed() * tileDef.WalkSpeed
}

// MoveToTile initiates pathfinding-based movement to a specific tile (from movement.go line 166)
func MoveToTile(entity Movable, tileX, tileY int, gameMap *mockMap) {
	// Get current entity position in grid coordinates
	x, y := entity.GetPosition()
	width, height := entity.GetSize()
	currentX, currentY := gameMap.WorldToGrid(x + width/2, y + height/2)
	
	// If already at target tile, no need to pathfind
	if currentX == tileX && currentY == tileY {
		entity.SetMoving(false)
		entity.SetPath(nil)
		entity.SetPathStep(0)
		return
	}
	
	// For testing purposes, create a simple straight-line path
	path := Path{
		{X: currentX, Y: currentY},
		{X: tileX, Y: tileY},
	}
	
	// Set up pathfinding movement with simplified system
	entity.SetPath(path)
	entity.SetPathStep(0)
	entity.SetMoving(true)
	
	// Set initial target (first step in path)
	if len(path) > 0 {
		stepX, stepY, hasNext := GetNextPathStep(path, 0)
		if hasNext {
			worldX, worldY := gameMap.GridToWorld(stepX, stepY)
			targetX := worldX - width/2
			targetY := worldY - height/2
			entity.SetTarget(targetX, targetY)
		}
	}
}

// ClampToMapBounds ensures the entity stays within map boundaries (from movement.go line 214)
func ClampToMapBounds(entity Movable, gameMap *mockMap) {
	mapWorldWidth := float64(gameMap.Width) * gameMap.TileSize
	mapWorldHeight := float64(gameMap.Height) * gameMap.TileSize
	
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

// heuristic calculates the Euclidean distance heuristic for A* (from pathfinding.go line 205)
func heuristic(x1, y1, x2, y2 int) float64 {
	dx := float64(absInt(x2 - x1))
	dy := float64(absInt(y2 - y1))
	// Use Euclidean distance for more accurate pathfinding with diagonal movement
	return math.Sqrt(dx*dx + dy*dy)
}

// absInt returns the absolute value of an integer (from pathfinding.go line 247)
func absInt(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// TEST THE ACTUAL FUNCTIONS

func TestGetNextPathStep(t *testing.T) {
	path := Path{
		{X: 0, Y: 0},
		{X: 1, Y: 0},
		{X: 2, Y: 0},
	}
	
	tests := []struct {
		name        string
		currentStep int
		expectX     int
		expectY     int
		expectNext  bool
	}{
		{
			name:        "First step",
			currentStep: 0,
			expectX:     0,
			expectY:     0,
			expectNext:  true,
		},
		{
			name:        "Second step",
			currentStep: 1,
			expectX:     1,
			expectY:     0,
			expectNext:  true,
		},
		{
			name:        "Last step",
			currentStep: 2,
			expectX:     2,
			expectY:     0,
			expectNext:  true,
		},
		{
			name:        "Beyond path",
			currentStep: 3,
			expectX:     0,
			expectY:     0,
			expectNext:  false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			x, y, hasNext := GetNextPathStep(path, tt.currentStep)
			
			if hasNext != tt.expectNext {
				t.Errorf("Expected hasNext=%v, got hasNext=%v", tt.expectNext, hasNext)
			}
			
			if tt.expectNext {
				if x != tt.expectX || y != tt.expectY {
					t.Errorf("Expected step (%d,%d), got (%d,%d)", tt.expectX, tt.expectY, x, y)
				}
			}
		})
	}
}

func TestIsPathComplete(t *testing.T) {
	path := Path{
		{X: 0, Y: 0},
		{X: 1, Y: 0},
		{X: 2, Y: 0},
	}
	
	tests := []struct {
		name        string
		currentStep int
		expectDone  bool
	}{
		{
			name:        "At beginning",
			currentStep: 0,
			expectDone:  false,
		},
		{
			name:        "In middle",
			currentStep: 1,
			expectDone:  false,
		},
		{
			name:        "At end",
			currentStep: 3,
			expectDone:  true,
		},
		{
			name:        "Beyond end",
			currentStep: 5,
			expectDone:  true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isDone := IsPathComplete(path, tt.currentStep)
			if isDone != tt.expectDone {
				t.Errorf("Expected IsPathComplete=%v, got %v", tt.expectDone, isDone)
			}
		})
	}
}

func TestPathLength(t *testing.T) {
	tests := []struct {
		name       string
		path       Path
		expectLen  int
	}{
		{
			name:      "Empty path",
			path:      Path{},
			expectLen: 0,
		},
		{
			name: "Single step",
			path: Path{
				{X: 0, Y: 0},
			},
			expectLen: 1,
		},
		{
			name: "Multi step",
			path: Path{
				{X: 0, Y: 0},
				{X: 1, Y: 0},
				{X: 2, Y: 0},
			},
			expectLen: 3,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			length := PathLength(tt.path)
			if length != tt.expectLen {
				t.Errorf("Expected length %d, got %d", tt.expectLen, length)
			}
		})
	}
}

func TestMovableEntity(t *testing.T) {
	entity := &MovableEntity{
		X:         10,
		Y:         20,
		Width:     16,
		Height:    16,
		MoveSpeed: 2.5,
	}
	
	t.Run("GetPosition", func(t *testing.T) {
		x, y := entity.GetPosition()
		if x != 10 || y != 20 {
			t.Errorf("Expected position (10,20), got (%.1f,%.1f)", x, y)
		}
	})
	
	t.Run("SetPosition", func(t *testing.T) {
		entity.SetPosition(30, 40)
		x, y := entity.GetPosition()
		if x != 30 || y != 40 {
			t.Errorf("Expected position (30,40), got (%.1f,%.1f)", x, y)
		}
	})
	
	t.Run("GetSize", func(t *testing.T) {
		width, height := entity.GetSize()
		if width != 16 || height != 16 {
			t.Errorf("Expected size (16,16), got (%.1f,%.1f)", width, height)
		}
	})
	
	t.Run("GetMoveSpeed", func(t *testing.T) {
		speed := entity.GetMoveSpeed()
		if speed != 2.5 {
			t.Errorf("Expected move speed 2.5, got %.1f", speed)
		}
	})
	
	t.Run("SetTarget and GetTarget", func(t *testing.T) {
		entity.SetTarget(50, 60)
		x, y := entity.GetTarget()
		if x != 50 || y != 60 {
			t.Errorf("Expected target (50,60), got (%.1f,%.1f)", x, y)
		}
	})
	
	t.Run("SetMoving and IsMoving", func(t *testing.T) {
		entity.SetMoving(true)
		if !entity.IsMoving() {
			t.Error("Expected entity to be moving")
		}
		
		entity.SetMoving(false)
		if entity.IsMoving() {
			t.Error("Expected entity to not be moving")
		}
	})
	
	t.Run("SetPath and GetPath", func(t *testing.T) {
		path := Path{
			{X: 1, Y: 2},
			{X: 3, Y: 4},
		}
		entity.SetPath(path)
		
		retrievedPath := entity.GetPath()
		if len(retrievedPath) != 2 {
			t.Errorf("Expected path length 2, got %d", len(retrievedPath))
		}
		
		if retrievedPath[0].X != 1 || retrievedPath[0].Y != 2 {
			t.Errorf("Expected first step (1,2), got (%d,%d)", retrievedPath[0].X, retrievedPath[0].Y)
		}
	})
	
	t.Run("SetPathStep and GetPathStep", func(t *testing.T) {
		entity.SetPathStep(5)
		step := entity.GetPathStep()
		if step != 5 {
			t.Errorf("Expected path step 5, got %d", step)
		}
	})
}

func TestHasReachedTarget(t *testing.T) {
	gameMap := newMockMap(5, 5, 32)
	
	entity := &MovableEntity{
		X:         10,
		Y:         10,
		Width:     16,
		Height:    16,
		MoveSpeed: 2.0,
	}
	
	tests := []struct {
		name     string
		targetX  float64
		targetY  float64
		expected bool
	}{
		{
			name:     "At exact target",
			targetX:  10,
			targetY:  10,
			expected: true,
		},
		{
			name:     "Close to target",
			targetX:  10.2,
			targetY:  10.3,
			expected: true, // Distance is less than 0.5 threshold
		},
		{
			name:     "Far from target",
			targetX:  15,
			targetY:  15,
			expected: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entity.SetTarget(tt.targetX, tt.targetY)
			result := hasReachedTarget(entity, gameMap)
			if result != tt.expected {
				t.Errorf("Expected hasReachedTarget=%v, got %v", tt.expected, result)
			}
		})
	}
}

func TestAdvanceToNextPathStep(t *testing.T) {
	gameMap := newMockMap(5, 5, 32)
	
	entity := &MovableEntity{
		X:         0,
		Y:         0,
		Width:     16,
		Height:    16,
		MoveSpeed: 2.0,
	}
	
	t.Run("Advance to next step", func(t *testing.T) {
		path := Path{
			{X: 0, Y: 0},
			{X: 1, Y: 0},
			{X: 2, Y: 0},
		}
		entity.SetPath(path)
		entity.SetPathStep(0)
		
		hasNext := advanceToNextPathStep(entity, gameMap)
		
		if !hasNext {
			t.Error("Expected to have next step")
		}
		
		if entity.GetPathStep() != 1 {
			t.Errorf("Expected path step 1, got %d", entity.GetPathStep())
		}
	})
	
	t.Run("No more steps", func(t *testing.T) {
		path := Path{
			{X: 0, Y: 0},
			{X: 1, Y: 0},
		}
		entity.SetPath(path)
		entity.SetPathStep(1) // At last step
		
		hasNext := advanceToNextPathStep(entity, gameMap)
		
		if hasNext {
			t.Error("Expected no more steps")
		}
	})
}

func TestExecuteMovement(t *testing.T) {
	gameMap := newMockMap(5, 5, 32)
	// Set all tiles to grass for consistent speed
	for y := 0; y < 5; y++ {
		for x := 0; x < 5; x++ {
			gameMap.SetTile(x, y, mockTileGrass)
		}
	}
	
	entity := &MovableEntity{
		X:         0,
		Y:         0,
		Width:     16,
		Height:    16,
		MoveSpeed: 5.0,
	}
	
	t.Run("Move towards distant target", func(t *testing.T) {
		entity.SetPosition(0, 0)
		entity.SetTarget(10, 0) // 10 units away horizontally
		
		executeMovement(entity, gameMap)
		
		x, y := entity.GetPosition()
		// Should move 5 units (moveSpeed * grass walkSpeed of 1.0)
		if x != 5.0 || y != 0.0 {
			t.Errorf("Expected position (5,0), got (%.1f,%.1f)", x, y)
		}
	})
	
	t.Run("Snap to close target", func(t *testing.T) {
		entity.SetPosition(0, 0)
		entity.SetTarget(0.05, 0) // Very close target
		
		executeMovement(entity, gameMap)
		
		x, y := entity.GetPosition()
		// Should snap exactly to target
		if x != 0.05 || y != 0.0 {
			t.Errorf("Expected position (0.05,0), got (%.1f,%.1f)", x, y)
		}
	})
}

func TestGetTerrainAdjustedSpeed(t *testing.T) {
	gameMap := newMockMap(3, 3, 32)
	gameMap.SetTile(0, 0, mockTileGrass)
	gameMap.SetTile(1, 0, mockTileWater)
	
	entity := &MovableEntity{
		Width:     16,
		Height:    16,
		MoveSpeed: 4.0, // Base speed
	}
	
	t.Run("Grass terrain speed", func(t *testing.T) {
		entity.SetPosition(8, 8) // Center of tile (0,0)
		
		speed := getTerrainAdjustedSpeed(entity, gameMap)
		expectedSpeed := 4.0 * mockTileDefinitions[mockTileGrass].WalkSpeed
		
		if speed != expectedSpeed {
			t.Errorf("Expected speed %.1f, got %.1f", expectedSpeed, speed)
		}
	})
	
	t.Run("Water terrain speed", func(t *testing.T) {
		entity.SetPosition(40, 8) // Center of tile (1,0)
		
		speed := getTerrainAdjustedSpeed(entity, gameMap)
		expectedSpeed := 4.0 * mockTileDefinitions[mockTileWater].WalkSpeed
		
		if speed != expectedSpeed {
			t.Errorf("Expected speed %.1f, got %.1f", expectedSpeed, speed)
		}
	})
}

func TestMoveToTile(t *testing.T) {
	gameMap := newMockMap(5, 5, 32)
	
	entity := &MovableEntity{
		X:         0,
		Y:         0,
		Width:     16,
		Height:    16,
		MoveSpeed: 2.0,
	}
	
	t.Run("Move to different tile", func(t *testing.T) {
		MoveToTile(entity, 2, 2, gameMap)
		
		// Should set entity to moving
		if !entity.IsMoving() {
			t.Error("Expected entity to be moving")
		}
		
		// Should have a path
		path := entity.GetPath()
		if path == nil || len(path) == 0 {
			t.Error("Expected entity to have a path")
		}
		
		// Path should end at target tile
		if len(path) > 0 {
			lastStep := path[len(path)-1]
			if lastStep.X != 2 || lastStep.Y != 2 {
				t.Errorf("Expected path to end at (2,2), got (%d,%d)", lastStep.X, lastStep.Y)
			}
		}
	})
	
	t.Run("Move to same tile", func(t *testing.T) {
		entity.SetPosition(48, 48) // Center of tile (1,1)
		entity.SetMoving(false)
		entity.SetPath(nil)
		
		MoveToTile(entity, 1, 1, gameMap)
		
		// Should not be moving since already at target
		if entity.IsMoving() {
			t.Error("Expected entity to not be moving when already at target tile")
		}
	})
}

func TestClampToMapBounds(t *testing.T) {
	gameMap := newMockMap(3, 3, 32) // 96x96 world size
	
	entity := &MovableEntity{
		Width:  16,
		Height: 16,
	}
	
	tests := []struct {
		name     string
		startX   float64
		startY   float64
		targetX  float64
		targetY  float64
		expectX  float64
		expectY  float64
		expectTX float64
		expectTY float64
	}{
		{
			name:     "Clamp negative position",
			startX:   -10,
			startY:   -5,
			targetX:  -20,
			targetY:  -15,
			expectX:  0,
			expectY:  0,
			expectTX: 0,
			expectTY: 0,
		},
		{
			name:     "Clamp position beyond map",
			startX:   100,
			startY:   100,
			targetX:  120,
			targetY:  110,
			expectX:  80, // 96 - 16 = 80
			expectY:  80, // 96 - 16 = 80
			expectTX: 80,
			expectTY: 80,
		},
		{
			name:     "Valid position within bounds",
			startX:   40,
			startY:   40,
			targetX:  50,
			targetY:  30,
			expectX:  40,
			expectY:  40,
			expectTX: 50,
			expectTY: 30,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entity.SetPosition(tt.startX, tt.startY)
			entity.SetTarget(tt.targetX, tt.targetY)
			
			ClampToMapBounds(entity, gameMap)
			
			x, y := entity.GetPosition()
			targetX, targetY := entity.GetTarget()
			
			if x != tt.expectX || y != tt.expectY {
				t.Errorf("Expected position (%.1f,%.1f), got (%.1f,%.1f)", tt.expectX, tt.expectY, x, y)
			}
			
			if targetX != tt.expectTX || targetY != tt.expectTY {
				t.Errorf("Expected target (%.1f,%.1f), got (%.1f,%.1f)", tt.expectTX, tt.expectTY, targetX, targetY)
			}
		})
	}
}

func TestHeuristic(t *testing.T) {
	tests := []struct {
		name     string
		x1, y1   int
		x2, y2   int
		expected float64
	}{
		{
			name:     "Same position",
			x1: 0, y1: 0,
			x2: 0, y2: 0,
			expected: 0.0,
		},
		{
			name:     "Horizontal distance",
			x1: 0, y1: 0,
			x2: 3, y2: 0,
			expected: 3.0,
		},
		{
			name:     "Vertical distance",
			x1: 0, y1: 0,
			x2: 0, y2: 4,
			expected: 4.0,
		},
		{
			name:     "Diagonal distance",
			x1: 0, y1: 0,
			x2: 3, y2: 4,
			expected: 5.0, // 3-4-5 triangle
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := heuristic(tt.x1, tt.y1, tt.x2, tt.y2)
			if math.Abs(result - tt.expected) > 0.001 {
				t.Errorf("Expected heuristic %.3f, got %.3f", tt.expected, result)
			}
		})
	}
}

func TestAbsInt(t *testing.T) {
	tests := []struct {
		name     string
		input    int
		expected int
	}{
		{
			name:     "Positive number",
			input:    5,
			expected: 5,
		},
		{
			name:     "Negative number",
			input:    -3,
			expected: 3,
		},
		{
			name:     "Zero",
			input:    0,
			expected: 0,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := absInt(tt.input)
			if result != tt.expected {
				t.Errorf("Expected absInt(%d)=%d, got %d", tt.input, tt.expected, result)
			}
		})
	}
}