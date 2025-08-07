//go:build !js
// +build !js

// Package systems_test provides comprehensive unit tests for the movement system
// This package avoids the syscall/js dependency by providing test implementations
// that mirror the behavior of the actual world package without WebAssembly dependencies.
//
// Test Coverage:
// - hasReachedTarget: Tests target detection with various distances and thresholds
// - executeMovement: Tests movement calculations, overshoot prevention, and terrain adjustment
// - getTerrainAdjustedSpeed: Tests speed calculations based on different terrain types
// - clampToMapBounds: Tests boundary enforcement for positions and targets
// - advanceToNextPathStep: Tests path navigation and step progression
// - Update: Tests the main movement system update loop with various scenarios
// - Path helper functions: Tests path utility functions
// - Coordinate conversions: Tests world-to-grid and grid-to-world transformations
// - Edge cases: Tests error conditions, zero values, and boundary conditions
// - Movable interface: Tests the complete entity interface implementation
package systems_test

import (
	"math"
	"testing"
)

// Path represents a sequence of grid coordinates (duplicated from systems package)
type Path []struct {
	X, Y int
}

// Test-specific tile types and definitions to avoid syscall/js dependencies
type TestTileType int

const (
	TestTileGrass TestTileType = iota
	TestTileWater
	TestTileDirtPath
)

type TestTile struct {
	Walkable  bool
	WalkSpeed float64
}

var TestTileDefinitions = map[TestTileType]TestTile{
	TestTileGrass: {
		Walkable:  true,
		WalkSpeed: 1.0,
	},
	TestTileWater: {
		Walkable:  false,
		WalkSpeed: 0.0,
	},
	TestTileDirtPath: {
		Walkable:  true,
		WalkSpeed: 1.5,
	},
}

// Movable represents an entity that can move (duplicated from systems package)
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

// MockMap implements the map interface needed for testing without syscall/js
type MockMap struct {
	Width    int
	Height   int
	TileSize float64
	Tiles    [][]TestTileType
}

func NewMockMap(width, height int, tileSize float64) *MockMap {
	m := &MockMap{
		Width:    width,
		Height:   height,
		TileSize: tileSize,
		Tiles:    make([][]TestTileType, height),
	}
	
	// Initialize the 2D slice
	for i := range m.Tiles {
		m.Tiles[i] = make([]TestTileType, width)
		// Fill with grass by default
		for j := range m.Tiles[i] {
			m.Tiles[i][j] = TestTileGrass
		}
	}
	
	return m
}

func (m *MockMap) GetTile(x, y int) TestTileType {
	if x < 0 || x >= m.Width || y < 0 || y >= m.Height {
		return TestTileWater // Out of bounds is water
	}
	return m.Tiles[y][x]
}

func (m *MockMap) SetTile(x, y int, tileType TestTileType) {
	if x >= 0 && x < m.Width && y >= 0 && y < m.Height {
		m.Tiles[y][x] = tileType
	}
}

func (m *MockMap) WorldToGrid(worldX, worldY float64) (int, int) {
	gridX := int(math.Floor(worldX / m.TileSize))
	gridY := int(math.Floor(worldY / m.TileSize))
	return gridX, gridY
}

func (m *MockMap) GridToWorld(gridX, gridY int) (float64, float64) {
	worldX := float64(gridX)*m.TileSize + m.TileSize/2
	worldY := float64(gridY)*m.TileSize + m.TileSize/2
	return worldX, worldY
}

// TestMovementSystem contains the movement logic for testing
type TestMovementSystem struct {
	mockMap *MockMap
}

func NewTestMovementSystem(mockMap *MockMap) *TestMovementSystem {
	return &TestMovementSystem{
		mockMap: mockMap,
	}
}

// TestMovableEntity implements Movable interface for testing
type TestMovableEntity struct {
	X, Y         float64
	Width        float64
	Height       float64
	TargetX      float64
	TargetY      float64
	IsMovingFlag bool
	MoveSpeed    float64
	Path         Path
	PathStep     int
}

func (e *TestMovableEntity) GetPosition() (float64, float64) { return e.X, e.Y }
func (e *TestMovableEntity) SetPosition(x, y float64)       { e.X, e.Y = x, y }
func (e *TestMovableEntity) GetSize() (float64, float64)    { return e.Width, e.Height }
func (e *TestMovableEntity) GetMoveSpeed() float64          { return e.MoveSpeed }
func (e *TestMovableEntity) SetTarget(x, y float64)         { e.TargetX, e.TargetY = x, y }
func (e *TestMovableEntity) GetTarget() (float64, float64)  { return e.TargetX, e.TargetY }
func (e *TestMovableEntity) IsMoving() bool                 { return e.IsMovingFlag }
func (e *TestMovableEntity) SetMoving(moving bool)          { e.IsMovingFlag = moving }
func (e *TestMovableEntity) GetPath() Path                  { return e.Path }
func (e *TestMovableEntity) SetPath(path Path)              { e.Path = path }
func (e *TestMovableEntity) GetPathStep() int               { return e.PathStep }
func (e *TestMovableEntity) SetPathStep(step int)           { e.PathStep = step }

// Movement logic methods (copied from movement.go and adapted for testing)

// hasReachedTarget checks if entity has reached the current target
func (tms *TestMovementSystem) hasReachedTarget(entity Movable) bool {
	x, y := entity.GetPosition()
	targetX, targetY := entity.GetTarget()
	dx := targetX - x
	dy := targetY - y
	distance := math.Sqrt(dx*dx + dy*dy)
	
	// Use a very small threshold to determine if we've reached the target
	const arrivalThreshold = 0.5
	return distance <= arrivalThreshold
}

// executeMovement performs the actual movement towards the target
func (tms *TestMovementSystem) executeMovement(entity Movable) {
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
	moveSpeed := tms.getTerrainAdjustedSpeed(entity)
	
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
func (tms *TestMovementSystem) getTerrainAdjustedSpeed(entity Movable) float64 {
	x, y := entity.GetPosition()
	width, height := entity.GetSize()
	
	// Get current tile based on entity center
	currentTileX, currentTileY := tms.mockMap.WorldToGrid(x + width/2, y + height/2)
	currentTileType := tms.mockMap.GetTile(currentTileX, currentTileY)
	
	// Get tile definition for speed multiplier
	tileDef, exists := TestTileDefinitions[currentTileType]
	if !exists {
		// Default to grass if tile definition not found
		tileDef = TestTileDefinitions[TestTileGrass]
	}
	
	// Apply terrain speed multiplier to base movement speed
	return entity.GetMoveSpeed() * tileDef.WalkSpeed
}

// clampToMapBounds ensures the entity stays within map boundaries
func (tms *TestMovementSystem) clampToMapBounds(entity Movable) {
	mapWorldWidth := float64(tms.mockMap.Width) * tms.mockMap.TileSize
	mapWorldHeight := float64(tms.mockMap.Height) * tms.mockMap.TileSize
	
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

// advanceToNextPathStep moves to the next step in the path
func (tms *TestMovementSystem) advanceToNextPathStep(entity Movable) bool {
	path := entity.GetPath()
	currentStep := entity.GetPathStep()
	nextStep := currentStep + 1
	
	if isPathComplete(path, nextStep) {
		return false // Path completed
	}
	
	// Get next target from path
	stepX, stepY, hasNext := getNextPathStep(path, nextStep)
	if !hasNext {
		return false // No next step available
	}
	
	// Set new target and advance path step
	worldX, worldY := tms.mockMap.GridToWorld(stepX, stepY)
	width, height := entity.GetSize()
	targetX := worldX - width/2
	targetY := worldY - height/2
	entity.SetTarget(targetX, targetY)
	entity.SetPathStep(nextStep)
	
	return true
}

// Update handles movement logic with simplified, robust movement execution
func (tms *TestMovementSystem) Update(entity Movable) {
	if !entity.IsMoving() {
		return
	}

	path := entity.GetPath()
	if path == nil {
		entity.SetMoving(false)
		return
	}

	// Check if we've reached the current target
	if tms.hasReachedTarget(entity) {
		// Move to next step in path
		if !tms.advanceToNextPathStep(entity) {
			// Path completed or no more steps
			entity.SetMoving(false)
			entity.SetPath(nil)
			entity.SetPathStep(0)
			return
		}
	}
	
	// Execute movement towards current target
	tms.executeMovement(entity)
}

// Helper functions for path handling (copied from pathfinding.go)

// getNextPathStep returns the next step in the path, or current position if no path
func getNextPathStep(path Path, currentStep int) (int, int, bool) {
	if currentStep >= len(path) {
		return 0, 0, false // Path completed
	}
	
	step := path[currentStep]
	return step.X, step.Y, true
}

// isPathComplete checks if we've reached the end of the path
func isPathComplete(path Path, currentStep int) bool {
	return currentStep >= len(path)
}

// Test functions

func TestHasReachedTarget(t *testing.T) {
	mockMap := NewMockMap(10, 10, 32.0)
	system := NewTestMovementSystem(mockMap)
	
	entity := &TestMovableEntity{
		X: 100, Y: 100,
		TargetX: 100, TargetY: 100,
		Width: 20, Height: 20,
		MoveSpeed: 3.0,
	}
	
	tests := []struct {
		name     string
		x, y     float64
		targetX  float64
		targetY  float64
		expected bool
	}{
		{"Same position", 100, 100, 100, 100, true},
		{"Very close (within threshold)", 100, 100, 100.3, 100.3, true},
		{"Exactly at threshold", 100, 100, 100.5, 100, true},
		{"Just outside threshold", 100, 100, 101, 100, false},
		{"Far away", 100, 100, 150, 150, false},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entity.SetPosition(tt.x, tt.y)
			entity.SetTarget(tt.targetX, tt.targetY)
			
			result := system.hasReachedTarget(entity)
			if result != tt.expected {
				t.Errorf("hasReachedTarget() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestExecuteMovement(t *testing.T) {
	mockMap := NewMockMap(10, 10, 32.0)
	system := NewTestMovementSystem(mockMap)
	
	tests := []struct {
		name            string
		startX, startY  float64
		targetX, targetY float64
		moveSpeed       float64
		expectedX       float64
		expectedY       float64
		tolerance       float64
	}{
		{
			name: "Move right",
			startX: 100, startY: 100,
			targetX: 110, targetY: 100,
			moveSpeed: 3.0,
			expectedX: 103.0, expectedY: 100.0,
			tolerance: 0.01,
		},
		{
			name: "Move diagonally",
			startX: 100, startY: 100,
			targetX: 110, targetY: 110,
			moveSpeed: 3.0,
			expectedX: 100 + 3.0*math.Cos(math.Pi/4), 
			expectedY: 100 + 3.0*math.Sin(math.Pi/4),
			tolerance: 0.01,
		},
		{
			name: "Snap to close target",
			startX: 100, startY: 100,
			targetX: 100.05, targetY: 100.05,
			moveSpeed: 3.0,
			expectedX: 100.05, expectedY: 100.05,
			tolerance: 0.01,
		},
		{
			name: "Overshoot prevention",
			startX: 100, startY: 100,
			targetX: 102, targetY: 100,
			moveSpeed: 3.0,
			expectedX: 102, expectedY: 100,
			tolerance: 0.01,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entity := &TestMovableEntity{
				X: tt.startX, Y: tt.startY,
				TargetX: tt.targetX, TargetY: tt.targetY,
				Width: 20, Height: 20,
				MoveSpeed: tt.moveSpeed,
			}
			
			system.executeMovement(entity)
			
			x, y := entity.GetPosition()
			if math.Abs(x-tt.expectedX) > tt.tolerance {
				t.Errorf("executeMovement() x = %v, want %v (±%v)", x, tt.expectedX, tt.tolerance)
			}
			if math.Abs(y-tt.expectedY) > tt.tolerance {
				t.Errorf("executeMovement() y = %v, want %v (±%v)", y, tt.expectedY, tt.tolerance)
			}
		})
	}
}

func TestGetTerrainAdjustedSpeed(t *testing.T) {
	mockMap := NewMockMap(10, 10, 32.0)
	
	// Set up different terrain types
	mockMap.SetTile(0, 0, TestTileGrass)    // Speed 1.0
	mockMap.SetTile(1, 0, TestTileDirtPath) // Speed 1.5
	mockMap.SetTile(2, 0, TestTileWater)    // Speed 0.0 (but shouldn't be walkable)
	
	system := NewTestMovementSystem(mockMap)
	
	tests := []struct {
		name           string
		entityX        float64
		entityY        float64
		baseMoveSpeed  float64
		expectedSpeed  float64
		tolerance      float64
	}{
		{
			name: "On grass tile",
			entityX: 10, entityY: 10, // Center of tile (0,0) in world coords
			baseMoveSpeed: 3.0,
			expectedSpeed: 3.0, // 3.0 * 1.0
			tolerance: 0.01,
		},
		{
			name: "On dirt path tile",
			entityX: 42, entityY: 10, // Center of tile (1,0) in world coords  
			baseMoveSpeed: 3.0,
			expectedSpeed: 4.5, // 3.0 * 1.5
			tolerance: 0.01,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entity := &TestMovableEntity{
				X: tt.entityX, Y: tt.entityY,
				Width: 20, Height: 20,
				MoveSpeed: tt.baseMoveSpeed,
			}
			
			speed := system.getTerrainAdjustedSpeed(entity)
			
			if math.Abs(speed-tt.expectedSpeed) > tt.tolerance {
				t.Errorf("getTerrainAdjustedSpeed() = %v, want %v (±%v)", speed, tt.expectedSpeed, tt.tolerance)
			}
		})
	}
}

func TestClampToMapBounds(t *testing.T) {
	mockMap := NewMockMap(10, 10, 32.0) // 320x320 world size
	system := NewTestMovementSystem(mockMap)
	
	tests := []struct {
		name                    string
		startX, startY          float64
		targetX, targetY        float64
		width, height           float64
		expectedX, expectedY    float64
		expectedTargetX, expectedTargetY float64
	}{
		{
			name: "No clamping needed",
			startX: 100, startY: 100,
			targetX: 150, targetY: 150,
			width: 20, height: 20,
			expectedX: 100, expectedY: 100,
			expectedTargetX: 150, expectedTargetY: 150,
		},
		{
			name: "Clamp negative position",
			startX: -10, startY: -5,
			targetX: 100, targetY: 100,
			width: 20, height: 20,
			expectedX: 0, expectedY: 0,
			expectedTargetX: 100, expectedTargetY: 100,
		},
		{
			name: "Clamp position beyond map",
			startX: 350, startY: 350,
			targetX: 100, targetY: 100,
			width: 20, height: 20,
			expectedX: 300, expectedY: 300, // 320 - 20
			expectedTargetX: 100, expectedTargetY: 100,
		},
		{
			name: "Clamp target beyond map",
			startX: 100, startY: 100,
			targetX: 350, targetY: -10,
			width: 20, height: 20,
			expectedX: 100, expectedY: 100,
			expectedTargetX: 300, expectedTargetY: 0, // 320 - 20, 0
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entity := &TestMovableEntity{
				X: tt.startX, Y: tt.startY,
				TargetX: tt.targetX, TargetY: tt.targetY,
				Width: tt.width, Height: tt.height,
				MoveSpeed: 3.0,
			}
			
			system.clampToMapBounds(entity)
			
			x, y := entity.GetPosition()
			targetX, targetY := entity.GetTarget()
			
			if x != tt.expectedX || y != tt.expectedY {
				t.Errorf("clampToMapBounds() position = (%v, %v), want (%v, %v)", 
					x, y, tt.expectedX, tt.expectedY)
			}
			if targetX != tt.expectedTargetX || targetY != tt.expectedTargetY {
				t.Errorf("clampToMapBounds() target = (%v, %v), want (%v, %v)", 
					targetX, targetY, tt.expectedTargetX, tt.expectedTargetY)
			}
		})
	}
}

func TestMovableEntityInterface(t *testing.T) {
	entity := &TestMovableEntity{
		X: 100, Y: 150,
		Width: 20, Height: 25,
		TargetX: 200, TargetY: 250,
		IsMovingFlag: true,
		MoveSpeed: 3.5,
		PathStep: 2,
	}
	
	// Test all getter methods
	x, y := entity.GetPosition()
	if x != 100 || y != 150 {
		t.Errorf("GetPosition() = (%v, %v), want (100, 150)", x, y)
	}
	
	width, height := entity.GetSize()
	if width != 20 || height != 25 {
		t.Errorf("GetSize() = (%v, %v), want (20, 25)", width, height)
	}
	
	targetX, targetY := entity.GetTarget()
	if targetX != 200 || targetY != 250 {
		t.Errorf("GetTarget() = (%v, %v), want (200, 250)", targetX, targetY)
	}
	
	if !entity.IsMoving() {
		t.Error("IsMoving() = false, want true")
	}
	
	if entity.GetMoveSpeed() != 3.5 {
		t.Errorf("GetMoveSpeed() = %v, want 3.5", entity.GetMoveSpeed())
	}
	
	if entity.GetPathStep() != 2 {
		t.Errorf("GetPathStep() = %v, want 2", entity.GetPathStep())
	}
	
	// Test setter methods
	entity.SetPosition(300, 400)
	x, y = entity.GetPosition()
	if x != 300 || y != 400 {
		t.Errorf("After SetPosition(300, 400), GetPosition() = (%v, %v), want (300, 400)", x, y)
	}
	
	entity.SetTarget(500, 600)
	targetX, targetY = entity.GetTarget()
	if targetX != 500 || targetY != 600 {
		t.Errorf("After SetTarget(500, 600), GetTarget() = (%v, %v), want (500, 600)", targetX, targetY)
	}
	
	entity.SetMoving(false)
	if entity.IsMoving() {
		t.Error("After SetMoving(false), IsMoving() = true, want false")
	}
	
	entity.SetPathStep(5)
	if entity.GetPathStep() != 5 {
		t.Errorf("After SetPathStep(5), GetPathStep() = %v, want 5", entity.GetPathStep())
	}
	
	// Test path operations
	testPath := Path{{X: 1, Y: 2}, {X: 3, Y: 4}}
	entity.SetPath(testPath)
	retrievedPath := entity.GetPath()
	if len(retrievedPath) != 2 || retrievedPath[0].X != 1 || retrievedPath[0].Y != 2 {
		t.Errorf("Path operations failed, got %v", retrievedPath)
	}
}

func TestWorldToGridConversion(t *testing.T) {
	mockMap := NewMockMap(10, 10, 32.0)
	
	tests := []struct {
		name           string
		worldX, worldY float64
		expectedX      int
		expectedY      int
	}{
		{"Origin", 0, 0, 0, 0},
		{"First tile", 16, 16, 0, 0},
		{"Second tile", 40, 40, 1, 1},
		{"Exact boundary", 32, 32, 1, 1},
		{"Just before boundary", 31.9, 31.9, 0, 0},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			x, y := mockMap.WorldToGrid(tt.worldX, tt.worldY)
			if x != tt.expectedX || y != tt.expectedY {
				t.Errorf("WorldToGrid(%v, %v) = (%v, %v), want (%v, %v)", 
					tt.worldX, tt.worldY, x, y, tt.expectedX, tt.expectedY)
			}
		})
	}
}

func TestGridToWorldConversion(t *testing.T) {
	mockMap := NewMockMap(10, 10, 32.0)
	
	tests := []struct {
		name           string
		gridX, gridY   int
		expectedX      float64
		expectedY      float64
	}{
		{"Origin", 0, 0, 16, 16}, // Center of first tile
		{"Second tile", 1, 1, 48, 48}, // Center of second tile  
		{"Third tile", 2, 3, 80, 112},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			x, y := mockMap.GridToWorld(tt.gridX, tt.gridY)
			if x != tt.expectedX || y != tt.expectedY {
				t.Errorf("GridToWorld(%v, %v) = (%v, %v), want (%v, %v)", 
					tt.gridX, tt.gridY, x, y, tt.expectedX, tt.expectedY)
			}
		})
	}
}

func TestAdvanceToNextPathStep(t *testing.T) {
	mockMap := NewMockMap(10, 10, 32.0)
	system := NewTestMovementSystem(mockMap)
	
	tests := []struct {
		name            string
		path            Path
		currentStep     int
		expectedResult  bool
		expectedTargetX float64
		expectedTargetY float64
		expectedStep    int
	}{
		{
			name: "Advance to next step",
			path: Path{{X: 0, Y: 0}, {X: 1, Y: 0}, {X: 2, Y: 0}},
			currentStep: 0,
			expectedResult: true,
			expectedTargetX: 38, // 48 - 10 (center of tile 1,0 minus half width)
			expectedTargetY: 6,  // 16 - 10 (center of tile 0,0 minus half height)
			expectedStep: 1,
		},
		{
			name: "Path completed",
			path: Path{{X: 0, Y: 0}, {X: 1, Y: 0}},
			currentStep: 1,
			expectedResult: false,
			expectedStep: 1, // Should not change
		},
		{
			name: "Empty path",
			path: Path{},
			currentStep: 0,
			expectedResult: false,
			expectedStep: 0,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entity := &TestMovableEntity{
				X: 100, Y: 100,
				Width: 20, Height: 20,
				MoveSpeed: 3.0,
				Path: tt.path,
				PathStep: tt.currentStep,
			}
			
			result := system.advanceToNextPathStep(entity)
			
			if result != tt.expectedResult {
				t.Errorf("advanceToNextPathStep() = %v, want %v", result, tt.expectedResult)
			}
			
			if result {
				targetX, targetY := entity.GetTarget()
				if targetX != tt.expectedTargetX || targetY != tt.expectedTargetY {
					t.Errorf("target = (%v, %v), want (%v, %v)", 
						targetX, targetY, tt.expectedTargetX, tt.expectedTargetY)
				}
			}
			
			if entity.GetPathStep() != tt.expectedStep {
				t.Errorf("pathStep = %v, want %v", entity.GetPathStep(), tt.expectedStep)
			}
		})
	}
}

func TestUpdate(t *testing.T) {
	mockMap := NewMockMap(10, 10, 32.0)
	system := NewTestMovementSystem(mockMap)
	
	t.Run("Not moving entity", func(t *testing.T) {
		entity := &TestMovableEntity{
			X: 100, Y: 100,
			IsMovingFlag: false,
		}
		
		initialX, initialY := entity.GetPosition()
		system.Update(entity)
		x, y := entity.GetPosition()
		
		if x != initialX || y != initialY {
			t.Error("Update() should not move entity when IsMoving is false")
		}
	})
	
	t.Run("Entity with no path", func(t *testing.T) {
		entity := &TestMovableEntity{
			X: 100, Y: 100,
			IsMovingFlag: true,
			Path: nil,
		}
		
		system.Update(entity)
		
		if entity.IsMoving() {
			t.Error("Update() should stop moving when path is nil")
		}
	})
	
	t.Run("Entity reaches target and advances path", func(t *testing.T) {
		path := Path{{X: 3, Y: 3}, {X: 4, Y: 3}}
		entity := &TestMovableEntity{
			X: 100, Y: 100,
			Width: 20, Height: 20,
			TargetX: 100, TargetY: 100, // Already at target
			IsMovingFlag: true,
			MoveSpeed: 3.0,
			Path: path,
			PathStep: 0,
		}
		
		system.Update(entity)
		
		// Should advance to next step
		if entity.GetPathStep() != 1 {
			t.Errorf("pathStep = %v, want 1", entity.GetPathStep())
		}
		
		// Should have new target
		targetX, targetY := entity.GetTarget()
		expectedTargetX := 144.0 - 10 // Center of tile (4,3) minus half width
		expectedTargetY := 112.0 - 10 // Center of tile (4,3) minus half height
		
		if targetX != expectedTargetX || targetY != expectedTargetY {
			t.Errorf("new target = (%v, %v), want (%v, %v)", 
				targetX, targetY, expectedTargetX, expectedTargetY)
		}
	})
	
	t.Run("Entity completes path", func(t *testing.T) {
		path := Path{{X: 3, Y: 3}}
		entity := &TestMovableEntity{
			X: 100, Y: 100,
			TargetX: 100, TargetY: 100, // Already at target
			IsMovingFlag: true,
			MoveSpeed: 3.0,
			Path: path,
			PathStep: 0,
		}
		
		system.Update(entity)
		
		// Should stop moving and clear path
		if entity.IsMoving() {
			t.Error("Entity should stop moving when path is completed")
		}
		if entity.GetPath() != nil {
			t.Error("Path should be cleared when completed")
		}
		if entity.GetPathStep() != 0 {
			t.Error("PathStep should be reset to 0 when path is completed")
		}
	})
	
	t.Run("Entity moves towards target", func(t *testing.T) {
		entity := &TestMovableEntity{
			X: 100, Y: 100,
			Width: 20, Height: 20,
			TargetX: 110, TargetY: 100, // Target to the right
			IsMovingFlag: true,
			MoveSpeed: 3.0,
			Path: Path{{X: 5, Y: 5}}, // Non-empty path
			PathStep: 0,
		}
		
		initialX, _ := entity.GetPosition()
		system.Update(entity)
		newX, _ := entity.GetPosition()
		
		// Should have moved towards target
		if newX <= initialX {
			t.Error("Entity should move towards target")
		}
		
		// Should not have reached target yet (distance > move speed)
		if newX >= 110 {
			t.Error("Entity should not overshoot target")
		}
	})
}

func TestPathHelperFunctions(t *testing.T) {
	t.Run("getNextPathStep", func(t *testing.T) {
		path := Path{{X: 1, Y: 2}, {X: 3, Y: 4}, {X: 5, Y: 6}}
		
		// Valid step
		x, y, hasNext := getNextPathStep(path, 1)
		if !hasNext || x != 3 || y != 4 {
			t.Errorf("getNextPathStep(path, 1) = (%v, %v, %v), want (3, 4, true)", x, y, hasNext)
		}
		
		// Out of bounds
		x, y, hasNext = getNextPathStep(path, 5)
		if hasNext {
			t.Errorf("getNextPathStep(path, 5) should return hasNext=false")
		}
	})
	
	t.Run("isPathComplete", func(t *testing.T) {
		path := Path{{X: 1, Y: 2}, {X: 3, Y: 4}}
		
		if isPathComplete(path, 0) {
			t.Error("isPathComplete(path, 0) should return false")
		}
		
		if isPathComplete(path, 1) {
			t.Error("isPathComplete(path, 1) should return false")
		}
		
		if !isPathComplete(path, 2) {
			t.Error("isPathComplete(path, 2) should return true")
		}
		
		if !isPathComplete(path, 10) {
			t.Error("isPathComplete(path, 10) should return true")
		}
	})
}

func TestTerrainSpeedWithDifferentTiles(t *testing.T) {
	mockMap := NewMockMap(5, 5, 32.0)
	
	// Set up a map with different terrain types
	mockMap.SetTile(0, 0, TestTileGrass)    // Normal speed
	mockMap.SetTile(1, 0, TestTileDirtPath) // Faster
	mockMap.SetTile(2, 0, TestTileWater)    // Shouldn't be walkable, but test speed calc
	
	system := NewTestMovementSystem(mockMap)
	
	tests := []struct {
		name         string
		tileX, tileY int
		tileType     TestTileType
		baseSpeed    float64
		expectedMult float64
	}{
		{"Grass tile", 0, 0, TestTileGrass, 5.0, 1.0},
		{"Dirt path tile", 1, 0, TestTileDirtPath, 5.0, 1.5},
		{"Water tile", 2, 0, TestTileWater, 5.0, 0.0},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Position entity in the center of the specified tile
			worldX, worldY := mockMap.GridToWorld(tt.tileX, tt.tileY)
			entity := &TestMovableEntity{
				X: worldX - 10, // Center entity in tile
				Y: worldY - 10,
				Width: 20, Height: 20,
				MoveSpeed: tt.baseSpeed,
			}
			
			speed := system.getTerrainAdjustedSpeed(entity)
			expectedSpeed := tt.baseSpeed * tt.expectedMult
			
			if speed != expectedSpeed {
				t.Errorf("getTerrainAdjustedSpeed() = %v, want %v", speed, expectedSpeed)
			}
		})
	}
}

func TestEdgeCasesAndErrorConditions(t *testing.T) {
	mockMap := NewMockMap(3, 3, 32.0)
	system := NewTestMovementSystem(mockMap)
	
	t.Run("Entity with zero move speed", func(t *testing.T) {
		entity := &TestMovableEntity{
			X: 50, Y: 50,
			TargetX: 100, TargetY: 50,
			Width: 20, Height: 20,
			MoveSpeed: 0.0,
		}
		
		initialX, _ := entity.GetPosition()
		system.executeMovement(entity)
		newX, _ := entity.GetPosition()
		
		if newX != initialX {
			t.Error("Entity with zero move speed should not move")
		}
	})
	
	t.Run("Entity outside map bounds for terrain calculation", func(t *testing.T) {
		entity := &TestMovableEntity{
			X: -50, Y: -50, // Way outside map
			Width: 20, Height: 20,
			MoveSpeed: 3.0,
		}
		
		// Should return water speed (0.0) since out-of-bounds returns water tile
		speed := system.getTerrainAdjustedSpeed(entity)
		expectedSpeed := 3.0 * 0.0 // Base speed * water multiplier
		
		if speed != expectedSpeed {
			t.Errorf("getTerrainAdjustedSpeed() with out-of-bounds entity = %v, want %v", speed, expectedSpeed)
		}
	})
	
	t.Run("Clamp entity with zero size", func(t *testing.T) {
		entity := &TestMovableEntity{
			X: -10, Y: -10,
			TargetX: 1000, TargetY: 1000,
			Width: 0, Height: 0,
			MoveSpeed: 3.0,
		}
		
		system.clampToMapBounds(entity)
		
		x, y := entity.GetPosition()
		targetX, targetY := entity.GetTarget()
		mapWidth := float64(mockMap.Width) * mockMap.TileSize
		mapHeight := float64(mockMap.Height) * mockMap.TileSize
		
		// Position should be clamped to [0, mapSize]
		if x != 0 || y != 0 {
			t.Errorf("position after clamping = (%v, %v), want (0, 0)", x, y)
		}
		
		// Target should be clamped to map bounds
		if targetX != mapWidth || targetY != mapHeight {
			t.Errorf("target after clamping = (%v, %v), want (%v, %v)", 
				targetX, targetY, mapWidth, mapHeight)
		}
	})
}