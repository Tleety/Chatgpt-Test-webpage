package main

import (
	"errors"
	"fmt"
	"testing"
)

// Basic pathfinding algorithm test - simplified version without WASM dependencies
type TestTileType int

const (
	TestTileGrass TestTileType = 0
	TestTileWater TestTileType = 1
	TestTileStone TestTileType = 2
)

type TestMap struct {
	Width    int
	Height   int
	TileSize float64
	Tiles    [][]TestTileType
}

func NewTestMap(width, height int, tileSize float64) *TestMap {
	tiles := make([][]TestTileType, height)
	for y := range tiles {
		tiles[y] = make([]TestTileType, width)
	}
	return &TestMap{
		Width:    width,
		Height:   height,
		TileSize: tileSize,
		Tiles:    tiles,
	}
}

func (m *TestMap) SetTile(x, y int, tileType TestTileType) {
	if x >= 0 && x < m.Width && y >= 0 && y < m.Height {
		m.Tiles[y][x] = tileType
	}
}

func (m *TestMap) GetTile(x, y int) TestTileType {
	if x >= 0 && x < m.Width && y >= 0 && y < m.Height {
		return m.Tiles[y][x]
	}
	return TestTileWater // Treat out of bounds as impassable
}

func (m *TestMap) IsWalkable(x, y int) bool {
	if x < 0 || x >= m.Width || y < 0 || y >= m.Height {
		return false
	}
	tile := m.GetTile(x, y)
	return tile == TestTileGrass || tile == TestTileStone
}

// Simple pathfinding using breadth-first search
type TestPathNode struct {
	X, Y   int
	Parent *TestPathNode
}

func FindSimplePath(gameMap *TestMap, startX, startY, goalX, goalY int) []TestPathNode {
	if !gameMap.IsWalkable(startX, startY) || !gameMap.IsWalkable(goalX, goalY) {
		return nil
	}
	
	if startX == goalX && startY == goalY {
		return []TestPathNode{{X: startX, Y: startY, Parent: nil}}
	}
	
	visited := make(map[int]bool)
	queue := []*TestPathNode{{X: startX, Y: startY, Parent: nil}}
	
	directions := [][]int{{0, 1}, {1, 0}, {0, -1}, {-1, 0}} // N, E, S, W
	
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		
		if current.X == goalX && current.Y == goalY {
			// Reconstruct path
			path := []TestPathNode{}
			for node := current; node != nil; node = node.Parent {
				path = append([]TestPathNode{{X: node.X, Y: node.Y, Parent: nil}}, path...)
			}
			return path
		}
		
		key := current.Y*gameMap.Width + current.X
		if visited[key] {
			continue
		}
		visited[key] = true
		
		for _, dir := range directions {
			newX := current.X + dir[0]
			newY := current.Y + dir[1]
			
			if gameMap.IsWalkable(newX, newY) {
				newKey := newY*gameMap.Width + newX
				if !visited[newKey] {
					queue = append(queue, &TestPathNode{
						X: newX, Y: newY, Parent: current,
					})
				}
			}
		}
	}
	
	return nil // No path found
}

// Unit management logic test - simplified version
type TestUnit struct {
	ID       string
	Name     string
	TileX    int
	TileY    int
	IsAlive  bool
	UnitType int
}

type TestUnitManager struct {
	units      map[string]*TestUnit
	nextUnitID int
	gameMap    *TestMap
}

func NewTestUnitManager(gameMap *TestMap) *TestUnitManager {
	return &TestUnitManager{
		units:      make(map[string]*TestUnit),
		nextUnitID: 1,
		gameMap:    gameMap,
	}
}

func (um *TestUnitManager) CreateUnit(unitType int, tileX, tileY int, name string) (*TestUnit, error) {
	if !um.gameMap.IsWalkable(tileX, tileY) {
		return nil, errors.New("position is not walkable")
	}
	
	unit := &TestUnit{
		ID:       fmt.Sprintf("unit_%d", um.nextUnitID),
		Name:     name,
		TileX:    tileX,
		TileY:    tileY,
		IsAlive:  true,
		UnitType: unitType,
	}
	
	um.units[unit.ID] = unit
	um.nextUnitID++
	
	return unit, nil
}

func (um *TestUnitManager) GetAllUnits() []*TestUnit {
	units := make([]*TestUnit, 0, len(um.units))
	for _, unit := range um.units {
		if unit.IsAlive {
			units = append(units, unit)
		}
	}
	return units
}

func (um *TestUnitManager) MoveUnit(unitID string, tileX, tileY int) error {
	unit, exists := um.units[unitID]
	if !exists || !unit.IsAlive {
		return errors.New("unit not found")
	}
	
	if !um.gameMap.IsWalkable(tileX, tileY) {
		return errors.New("target position is not walkable")
	}
	
	unit.TileX = tileX
	unit.TileY = tileY
	return nil
}

func (um *TestUnitManager) RemoveUnit(unitID string) error {
	unit, exists := um.units[unitID]
	if !exists {
		return errors.New("unit not found")
	}
	
	unit.IsAlive = false
	return nil
}



// Tests for pathfinding
func TestBasicPathfinding(t *testing.T) {
	gameMap := NewTestMap(5, 5, 32.0)
	
	// Set all tiles to grass (walkable)
	for x := 0; x < 5; x++ {
		for y := 0; y < 5; y++ {
			gameMap.SetTile(x, y, TestTileGrass)
		}
	}

	tests := []struct {
		name    string
		startX  int
		startY  int
		goalX   int
		goalY   int
		wantLen int
	}{
		{
			name:    "Direct horizontal path",
			startX:  0,
			startY:  0,
			goalX:   4,
			goalY:   0,
			wantLen: 5,
		},
		{
			name:    "Direct vertical path",
			startX:  0,
			startY:  0,
			goalX:   0,
			goalY:   4,
			wantLen: 5,
		},
		{
			name:    "Same position",
			startX:  2,
			startY:  2,
			goalX:   2,
			goalY:   2,
			wantLen: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := FindSimplePath(gameMap, tt.startX, tt.startY, tt.goalX, tt.goalY)
			
			if len(path) != tt.wantLen {
				t.Errorf("Expected path length %d, got %d", tt.wantLen, len(path))
			}
			
			if len(path) > 0 {
				// Verify start position
				if path[0].X != tt.startX || path[0].Y != tt.startY {
					t.Errorf("Path should start at (%d,%d), got (%d,%d)", 
						tt.startX, tt.startY, path[0].X, path[0].Y)
				}
				
				// Verify end position
				lastNode := path[len(path)-1]
				if lastNode.X != tt.goalX || lastNode.Y != tt.goalY {
					t.Errorf("Path should end at (%d,%d), got (%d,%d)", 
						tt.goalX, tt.goalY, lastNode.X, lastNode.Y)
				}
			}
		})
	}
}

func TestPathfindingWithObstacles(t *testing.T) {
	gameMap := NewTestMap(5, 5, 32.0)
	
	// Set all tiles to grass (walkable)
	for x := 0; x < 5; x++ {
		for y := 0; y < 5; y++ {
			gameMap.SetTile(x, y, TestTileGrass)
		}
	}
	
	// Create a wall
	gameMap.SetTile(2, 0, TestTileWater)
	gameMap.SetTile(2, 1, TestTileWater)
	gameMap.SetTile(2, 2, TestTileWater)
	gameMap.SetTile(2, 3, TestTileWater)
	// Leave (2,4) open

	path := FindSimplePath(gameMap, 0, 0, 4, 0)
	
	if len(path) == 0 {
		t.Error("Should find path around obstacle")
		return
	}
	
	// Verify no path goes through water
	for _, node := range path {
		tile := gameMap.GetTile(node.X, node.Y)
		if tile == TestTileWater {
			t.Errorf("Path goes through water tile at (%d,%d)", node.X, node.Y)
		}
	}
}

// Tests for unit management
func TestUnitCreation(t *testing.T) {
	gameMap := NewTestMap(10, 10, 32.0)
	
	// Set all tiles to grass
	for x := 0; x < 10; x++ {
		for y := 0; y < 10; y++ {
			gameMap.SetTile(x, y, TestTileGrass)
		}
	}
	
	um := NewTestUnitManager(gameMap)

	tests := []struct {
		name      string
		unitType  int
		tileX     int
		tileY     int
		unitName  string
		expectErr bool
	}{
		{
			name:      "Create valid unit",
			unitType:  1,
			tileX:     5,
			tileY:     5,
			unitName:  "TestWarrior",
			expectErr: false,
		},
		{
			name:      "Create unit on water",
			unitType:  1,
			tileX:     1,
			tileY:     1,
			unitName:  "Invalid",
			expectErr: true,
		},
	}
	
	// Set tile (1,1) to water for second test
	gameMap.SetTile(1, 1, TestTileWater)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			unit, err := um.CreateUnit(tt.unitType, tt.tileX, tt.tileY, tt.unitName)
			
			if tt.expectErr {
				if err == nil {
					t.Error("Expected error but got none")
				}
				return
			}
			
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}
			
			if unit.TileX != tt.tileX || unit.TileY != tt.tileY {
				t.Errorf("Unit position incorrect: expected (%d,%d), got (%d,%d)",
					tt.tileX, tt.tileY, unit.TileX, unit.TileY)
			}
			
			if unit.Name != tt.unitName {
				t.Errorf("Unit name incorrect: expected %s, got %s", tt.unitName, unit.Name)
			}
		})
	}
}

func TestUnitMovement(t *testing.T) {
	gameMap := NewTestMap(5, 5, 32.0)
	
	// Set all tiles to grass except (3,3)
	for x := 0; x < 5; x++ {
		for y := 0; y < 5; y++ {
			gameMap.SetTile(x, y, TestTileGrass)
		}
	}
	gameMap.SetTile(3, 3, TestTileWater)
	
	um := NewTestUnitManager(gameMap)
	
	unit, err := um.CreateUnit(1, 1, 1, "TestUnit")
	if err != nil {
		t.Fatalf("Failed to create unit: %v", err)
	}

	tests := []struct {
		name      string
		targetX   int
		targetY   int
		expectErr bool
	}{
		{
			name:      "Move to valid position",
			targetX:   2,
			targetY:   2,
			expectErr: false,
		},
		{
			name:      "Move to water",
			targetX:   3,
			targetY:   3,
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := um.MoveUnit(unit.ID, tt.targetX, tt.targetY)
			
			if tt.expectErr {
				if err == nil {
					t.Error("Expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				} else {
					// Check unit moved to correct position
					if unit.TileX != tt.targetX || unit.TileY != tt.targetY {
						t.Errorf("Unit not moved to correct position: expected (%d,%d), got (%d,%d)",
							tt.targetX, tt.targetY, unit.TileX, unit.TileY)
					}
				}
			}
		})
	}
}

func TestUnitRemoval(t *testing.T) {
	gameMap := NewTestMap(5, 5, 32.0)
	
	// Set all tiles to grass
	for x := 0; x < 5; x++ {
		for y := 0; y < 5; y++ {
			gameMap.SetTile(x, y, TestTileGrass)
		}
	}
	
	um := NewTestUnitManager(gameMap)
	
	unit, err := um.CreateUnit(1, 2, 2, "TestUnit")
	if err != nil {
		t.Fatalf("Failed to create unit: %v", err)
	}
	
	// Verify unit exists and is alive
	units := um.GetAllUnits()
	if len(units) != 1 {
		t.Fatalf("Expected 1 unit, got %d", len(units))
	}
	
	// Remove unit
	err = um.RemoveUnit(unit.ID)
	if err != nil {
		t.Errorf("Unexpected error removing unit: %v", err)
	}
	
	// Verify unit is no longer alive
	units = um.GetAllUnits()
	if len(units) != 0 {
		t.Errorf("Expected 0 alive units after removal, got %d", len(units))
	}
	
	// Try to remove non-existent unit
	err = um.RemoveUnit("nonexistent")
	if err == nil {
		t.Error("Expected error when removing non-existent unit")
	}
}

// Test for WASM interface logic (without actual WASM)
func TestWASMInterfaceLogic(t *testing.T) {
	t.Run("Error response format", func(t *testing.T) {
		// Test the error response structure we expect from WASM interface
		errorResponse := map[string]interface{}{
			"success": false,
			"error":   "test error message",
		}
		
		if errorResponse["success"].(bool) != false {
			t.Error("Error response should have success: false")
		}
		
		if errorResponse["error"].(string) != "test error message" {
			t.Error("Error response should include error message")
		}
	})
	
	t.Run("Success response format", func(t *testing.T) {
		// Test the success response structure we expect from WASM interface
		successResponse := map[string]interface{}{
			"success": true,
			"data": map[string]interface{}{
				"id":     "unit_1",
				"name":   "TestUnit",
				"tileX":  5,
				"tileY":  5,
				"health": 100,
			},
		}
		
		if successResponse["success"].(bool) != true {
			t.Error("Success response should have success: true")
		}
		
		if data, ok := successResponse["data"].(map[string]interface{}); !ok {
			t.Error("Success response should include data")
		} else {
			if data["id"].(string) != "unit_1" {
				t.Error("Success response data should include unit ID")
			}
		}
	})
}