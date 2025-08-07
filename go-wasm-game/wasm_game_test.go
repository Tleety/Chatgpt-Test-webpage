//go:build !js
// +build !js

package main

import (
	"testing"
	"math"
)

// Copy the exact types and functions we want to test from systems package
// This allows us to test the core logic without WASM dependencies

// Path represents a sequence of grid coordinates
type Path []struct {
	X, Y int
}

// GetNextPathStep returns the next step in the path, or current position if no path
func GetNextPathStep(path Path, currentStep int) (int, int, bool) {
	if currentStep >= len(path) {
		return 0, 0, false // Path completed
	}
	
	step := path[currentStep]
	return step.X, step.Y, true
}

// IsPathComplete checks if we've reached the end of the path
func IsPathComplete(path Path, currentStep int) bool {
	return currentStep >= len(path)
}

// PathLength returns the number of steps in the path
func PathLength(path Path) int {
	return len(path)
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

// hasReachedTarget checks if entity has reached the current target
func hasReachedTarget(entity *MovableEntity) bool {
	x, y := entity.GetPosition()
	targetX, targetY := entity.GetTarget()
	dx := targetX - x
	dy := targetY - y
	distance := math.Sqrt(dx*dx + dy*dy)
	
	const arrivalThreshold = 0.5
	return distance <= arrivalThreshold
}

// executeMovement performs the actual movement towards the target
func executeMovement(entity *MovableEntity) {
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
	
	moveSpeed := entity.GetMoveSpeed()
	
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

// heuristic calculates the Euclidean distance heuristic for A*
func heuristic(x1, y1, x2, y2 int) float64 {
	dx := float64(absInt(x2 - x1))
	dy := float64(absInt(y2 - y1))
	return math.Sqrt(dx*dx + dy*dy)
}

// absInt returns the absolute value of an integer
func absInt(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// Tests for pathfinding core functions
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

// Tests for MovableEntity
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

// Tests for movement logic functions
func TestHasReachedTarget(t *testing.T) {
	entity := &MovableEntity{
		X: 10,
		Y: 10,
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
			result := hasReachedTarget(entity)
			if result != tt.expected {
				t.Errorf("Expected hasReachedTarget=%v, got %v", tt.expected, result)
			}
		})
	}
}

func TestExecuteMovement(t *testing.T) {
	entity := &MovableEntity{
		X:         0,
		Y:         0,
		MoveSpeed: 5.0,
	}
	
	t.Run("Move towards distant target", func(t *testing.T) {
		entity.SetPosition(0, 0)
		entity.SetTarget(10, 0) // 10 units away horizontally
		
		executeMovement(entity)
		
		x, y := entity.GetPosition()
		// Should move 5 units (moveSpeed) towards target
		if x != 5.0 || y != 0.0 {
			t.Errorf("Expected position (5,0), got (%.1f,%.1f)", x, y)
		}
	})
	
	t.Run("Snap to close target", func(t *testing.T) {
		entity.SetPosition(0, 0)
		entity.SetTarget(0.05, 0) // Very close target
		
		executeMovement(entity)
		
		x, y := entity.GetPosition()
		// Should snap exactly to target
		if x != 0.05 || y != 0.0 {
			t.Errorf("Expected position (0.05,0), got (%.1f,%.1f)", x, y)
		}
	})
	
	t.Run("Move to target within move speed", func(t *testing.T) {
		entity.SetPosition(0, 0)
		entity.SetTarget(3, 0) // 3 units away, less than moveSpeed of 5
		
		executeMovement(entity)
		
		x, y := entity.GetPosition()
		// Should move exactly to target, not overshoot
		if x != 3.0 || y != 0.0 {
			t.Errorf("Expected position (3,0), got (%.1f,%.1f)", x, y)
		}
	})
	
	t.Run("Move diagonally", func(t *testing.T) {
		entity.SetPosition(0, 0)
		entity.SetTarget(6, 8) // 10 units away diagonally (6-8-10 triangle)
		
		executeMovement(entity)
		
		x, y := entity.GetPosition()
		// Should move 5 units towards target, maintaining direction
		// Direction vector: (6,8)/10 = (0.6, 0.8)
		// New position: (0,0) + 5 * (0.6, 0.8) = (3, 4)
		if math.Abs(x - 3.0) > 0.001 || math.Abs(y - 4.0) > 0.001 {
			t.Errorf("Expected position (3,4), got (%.1f,%.1f)", x, y)
		}
	})
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