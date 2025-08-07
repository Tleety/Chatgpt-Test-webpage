//go:build !js
// +build !js

// Package systems_test provides comprehensive unit tests for the movement system
// Tests the actual movement.go functions using the exported pure functions
// that don't require WebAssembly dependencies.
package systems_test

import (
	"math"
	"testing"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/systems"
)

// Test the actual HasReachedTargetPure function from movement.go
func TestHasReachedTargetPure(t *testing.T) {
	tests := []struct {
		name        string
		currentPos  [2]float64
		targetPos   [2]float64
		expected    bool
	}{
		{
			name: "Same position",
			currentPos: [2]float64{100, 100},
			targetPos: [2]float64{100, 100},
			expected: true,
		},
		{
			name: "Very close (within threshold)",
			currentPos: [2]float64{100, 100},
			targetPos: [2]float64{100.3, 100.3},
			expected: true,
		},
		{
			name: "Exactly at threshold",
			currentPos: [2]float64{100, 100},
			targetPos: [2]float64{100.5, 100},
			expected: true,
		},
		{
			name: "Just outside threshold",
			currentPos: [2]float64{100, 100},
			targetPos: [2]float64{101, 100},
			expected: false,
		},
		{
			name: "Far away",
			currentPos: [2]float64{100, 100},
			targetPos: [2]float64{150, 150},
			expected: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := systems.HasReachedTargetPure(tt.currentPos, tt.targetPos)
			if result != tt.expected {
				t.Errorf("HasReachedTargetPure() = %v, want %v", result, tt.expected)
			}
		})
	}
}

// Test the actual ExecuteMovementPure function from movement.go
func TestExecuteMovementPure(t *testing.T) {
	tests := []struct {
		name            string
		currentPos      [2]float64
		targetPos       [2]float64
		moveSpeed       float64
		expectedX       float64
		expectedY       float64
		tolerance       float64
	}{
		{
			name: "Move right",
			currentPos: [2]float64{100, 100},
			targetPos: [2]float64{110, 100},
			moveSpeed: 3.0,
			expectedX: 103.0, expectedY: 100.0,
			tolerance: 0.01,
		},
		{
			name: "Move diagonally",
			currentPos: [2]float64{100, 100},
			targetPos: [2]float64{110, 110},
			moveSpeed: 3.0,
			expectedX: 100 + 3.0*math.Cos(math.Pi/4), 
			expectedY: 100 + 3.0*math.Sin(math.Pi/4),
			tolerance: 0.01,
		},
		{
			name: "Snap to close target",
			currentPos: [2]float64{100, 100},
			targetPos: [2]float64{100.05, 100.05},
			moveSpeed: 3.0,
			expectedX: 100.05, expectedY: 100.05,
			tolerance: 0.01,
		},
		{
			name: "Overshoot prevention",
			currentPos: [2]float64{100, 100},
			targetPos: [2]float64{102, 100},
			moveSpeed: 3.0,
			expectedX: 102, expectedY: 100,
			tolerance: 0.01,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			x, y := systems.ExecuteMovementPure(tt.currentPos, tt.targetPos, tt.moveSpeed)
			
			if math.Abs(x-tt.expectedX) > tt.tolerance {
				t.Errorf("ExecuteMovementPure() x = %v, want %v (±%v)", x, tt.expectedX, tt.tolerance)
			}
			if math.Abs(y-tt.expectedY) > tt.tolerance {
				t.Errorf("ExecuteMovementPure() y = %v, want %v (±%v)", y, tt.expectedY, tt.tolerance)
			}
		})
	}
}

// Test the actual ClampToMapBoundsPure function from movement.go
func TestClampToMapBoundsPure(t *testing.T) {
	tests := []struct {
		name                    string
		pos                     [2]float64
		target                  [2]float64
		size                    [2]float64
		mapSize                 [2]float64
		expectedX, expectedY    float64
		expectedTargetX, expectedTargetY float64
	}{
		{
			name: "No clamping needed",
			pos: [2]float64{100, 100},
			target: [2]float64{150, 150},
			size: [2]float64{20, 20},
			mapSize: [2]float64{320, 320},
			expectedX: 100, expectedY: 100,
			expectedTargetX: 150, expectedTargetY: 150,
		},
		{
			name: "Clamp negative position",
			pos: [2]float64{-10, -5},
			target: [2]float64{100, 100},
			size: [2]float64{20, 20},
			mapSize: [2]float64{320, 320},
			expectedX: 0, expectedY: 0,
			expectedTargetX: 100, expectedTargetY: 100,
		},
		{
			name: "Clamp position beyond map",
			pos: [2]float64{350, 350},
			target: [2]float64{100, 100},
			size: [2]float64{20, 20},
			mapSize: [2]float64{320, 320},
			expectedX: 300, expectedY: 300, // 320 - 20
			expectedTargetX: 100, expectedTargetY: 100,
		},
		{
			name: "Clamp target beyond map",
			pos: [2]float64{100, 100},
			target: [2]float64{350, -10},
			size: [2]float64{20, 20},
			mapSize: [2]float64{320, 320},
			expectedX: 100, expectedY: 100,
			expectedTargetX: 300, expectedTargetY: 0, // 320 - 20, 0
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			x, y, targetX, targetY := systems.ClampToMapBoundsPure(tt.pos, tt.target, tt.size, tt.mapSize)
			
			if x != tt.expectedX || y != tt.expectedY {
				t.Errorf("ClampToMapBoundsPure() position = (%v, %v), want (%v, %v)", 
					x, y, tt.expectedX, tt.expectedY)
			}
			if targetX != tt.expectedTargetX || targetY != tt.expectedTargetY {
				t.Errorf("ClampToMapBoundsPure() target = (%v, %v), want (%v, %v)", 
					targetX, targetY, tt.expectedTargetX, tt.expectedTargetY)
			}
		})
	}
}

// Test path helper functions (these are already pure)
func TestPathHelperFunctions(t *testing.T) {
	t.Run("GetNextPathStep", func(t *testing.T) {
		path := systems.Path{{X: 1, Y: 2}, {X: 3, Y: 4}, {X: 5, Y: 6}}
		
		// Valid step
		x, y, hasNext := systems.GetNextPathStep(path, 1)
		if !hasNext || x != 3 || y != 4 {
			t.Errorf("GetNextPathStep(path, 1) = (%v, %v, %v), want (3, 4, true)", x, y, hasNext)
		}
		
		// Out of bounds
		x, y, hasNext = systems.GetNextPathStep(path, 5)
		if hasNext {
			t.Errorf("GetNextPathStep(path, 5) should return hasNext=false")
		}
	})
	
	t.Run("IsPathComplete", func(t *testing.T) {
		path := systems.Path{{X: 1, Y: 2}, {X: 3, Y: 4}}
		
		if systems.IsPathComplete(path, 0) {
			t.Error("IsPathComplete(path, 0) should return false")
		}
		
		if systems.IsPathComplete(path, 1) {
			t.Error("IsPathComplete(path, 1) should return false")
		}
		
		if !systems.IsPathComplete(path, 2) {
			t.Error("IsPathComplete(path, 2) should return true")
		}
		
		if !systems.IsPathComplete(path, 10) {
			t.Error("IsPathComplete(path, 10) should return true")
		}
	})
}

// Test MovableEntity interface using actual systems.MovableEntity
func TestMovableEntityInterface(t *testing.T) {
	entity := &systems.MovableEntity{
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
	testPath := systems.Path{{X: 1, Y: 2}, {X: 3, Y: 4}}
	entity.SetPath(testPath)
	retrievedPath := entity.GetPath()
	if len(retrievedPath) != 2 || retrievedPath[0].X != 1 || retrievedPath[0].Y != 2 {
		t.Errorf("Path operations failed, got %v", retrievedPath)
	}
}