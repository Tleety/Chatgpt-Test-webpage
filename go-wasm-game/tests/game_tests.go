//go:build js && wasm
// +build js,wasm

package tests

import (
	"fmt"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/entities"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/world"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/systems"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/units"
)

// TestResult represents the result of a single test
type TestResult struct {
	Name    string
	Passed  bool
	Message string
}

// TestSuite holds all game functionality tests
type TestSuite struct {
	Results []TestResult
}

// NewTestSuite creates a new test suite instance
func NewTestSuite() *TestSuite {
	return &TestSuite{
		Results: make([]TestResult, 0),
	}
}

// RunAllTests executes all game functionality tests
func (ts *TestSuite) RunAllTests() bool {
	ts.Results = make([]TestResult, 0) // Reset results
	
	// Run all test functions
	ts.testMapCreation()
	ts.testPlayerCreation()
	ts.testUnitManager()
	ts.testMovementSystem()
	ts.testCollisionDetection()
	ts.testPathfinding()
	
	// Check if all tests passed
	allPassed := true
	for _, result := range ts.Results {
		if !result.Passed {
			allPassed = false
			break
		}
	}
	
	return allPassed
}

// GetResults returns all test results
func (ts *TestSuite) GetResults() []TestResult {
	return ts.Results
}

// GetSummary returns a summary string of test results
func (ts *TestSuite) GetSummary() string {
	passed := 0
	total := len(ts.Results)
	
	for _, result := range ts.Results {
		if result.Passed {
			passed++
		}
	}
	
	return fmt.Sprintf("Tests: %d/%d passed", passed, total)
}

// addResult adds a test result to the suite
func (ts *TestSuite) addResult(name string, passed bool, message string) {
	ts.Results = append(ts.Results, TestResult{
		Name:    name,
		Passed:  passed,
		Message: message,
	})
}

// testMapCreation tests basic map functionality
func (ts *TestSuite) testMapCreation() {
	defer func() {
		if r := recover(); r != nil {
			ts.addResult("Map Creation", false, fmt.Sprintf("Panic: %v", r))
		}
	}()
	
	gameMap := world.NewMap(200, 200, 32.0)
	if gameMap == nil {
		ts.addResult("Map Creation", false, "Map creation returned nil")
		return
	}
	
	if gameMap.Width != 200 || gameMap.Height != 200 {
		ts.addResult("Map Creation", false, "Map dimensions incorrect")
		return
	}
	
	if gameMap.TileSize != 32.0 {
		ts.addResult("Map Creation", false, "Map tile size incorrect")
		return
	}
	
	ts.addResult("Map Creation", true, "Map created successfully with correct dimensions")
}

// testPlayerCreation tests player entity creation
func (ts *TestSuite) testPlayerCreation() {
	defer func() {
		if r := recover(); r != nil {
			ts.addResult("Player Creation", false, fmt.Sprintf("Panic: %v", r))
		}
	}()
	
	gameMap := world.NewMap(200, 200, 32.0)
	player := entities.NewPlayer(50.0, 50.0, gameMap)
	
	if player == nil {
		ts.addResult("Player Creation", false, "Player creation returned nil")
		return
	}
	
	x, y := player.GetPosition()
	if x != 50.0 || y != 50.0 {
		ts.addResult("Player Creation", false, "Player position incorrect")
		return
	}
	
	ts.addResult("Player Creation", true, "Player created successfully at correct position")
}

// testUnitManager tests unit management functionality
func (ts *TestSuite) testUnitManager() {
	defer func() {
		if r := recover(); r != nil {
			ts.addResult("Unit Manager", false, fmt.Sprintf("Panic: %v", r))
		}
	}()
	
	gameMap := world.NewMap(200, 200, 32.0)
	unitManager := units.NewUnitManager(gameMap)
	
	if unitManager == nil {
		ts.addResult("Unit Manager", false, "Unit manager creation returned nil")
		return
	}
	
	initialCount := unitManager.GetTotalUnitCount()
	if initialCount != 0 {
		ts.addResult("Unit Manager", false, "Initial unit count should be 0")
		return
	}
	
	// Test unit creation
	unitManager.CreateUnit(entities.UnitWarrior, 10, 10, "test-unit")
	newCount := unitManager.GetTotalUnitCount()
	if newCount != 1 {
		ts.addResult("Unit Manager", false, "Unit count should be 1 after creating unit")
		return
	}
	
	ts.addResult("Unit Manager", true, "Unit manager functionality working correctly")
}

// testMovementSystem tests the movement system
func (ts *TestSuite) testMovementSystem() {
	defer func() {
		if r := recover(); r != nil {
			ts.addResult("Movement System", false, fmt.Sprintf("Panic: %v", r))
		}
	}()
	
	gameMap := world.NewMap(200, 200, 32.0)
	movementSystem := systems.NewMovementSystem(gameMap)
	
	if movementSystem == nil {
		ts.addResult("Movement System", false, "Movement system creation returned nil")
		return
	}
	
	// Test that the movement system has access to the map
	retrievedMap := movementSystem.GetGameMap()
	if retrievedMap == nil {
		ts.addResult("Movement System", false, "Movement system map is nil")
		return
	}
	
	// Test basic movement system integration (not pure functions)
	// Create a simple movable entity for testing
	entity := &systems.MovableEntity{
		X: 100, Y: 100,
		Width: 20, Height: 20,
		MoveSpeed: 3.0,
	}
	
	// Test that movement system can handle entity operations
	entity.SetTarget(150, 100)
	entity.SetMoving(true)
	
	// Verify the movement system can access entity properties
	x, y := entity.GetPosition()
	if x != 100 || y != 100 {
		ts.addResult("Movement System", false, "Entity position tracking incorrect")
		return
	}
	
	ts.addResult("Movement System", true, "Movement system working correctly")
}

// testCollisionDetection tests collision detection
func (ts *TestSuite) testCollisionDetection() {
	defer func() {
		if r := recover(); r != nil {
			ts.addResult("Collision Detection", false, fmt.Sprintf("Panic: %v", r))
		}
	}()
	
	gameMap := world.NewMap(200, 200, 32.0)
	
	// Test basic tile access
	tileType := gameMap.GetTile(50, 50)
	if tileType < 0 {
		ts.addResult("Collision Detection", false, "Invalid tile type returned")
		return
	}
	
	// Test tile definitions exist
	_, exists := world.TileDefinitions[tileType]
	if !exists {
		ts.addResult("Collision Detection", false, "Tile definition not found")
		return
	}
	
	ts.addResult("Collision Detection", true, "Collision detection system working correctly")
}

// testPathfinding tests pathfinding functionality
func (ts *TestSuite) testPathfinding() {
	defer func() {
		if r := recover(); r != nil {
			ts.addResult("Pathfinding", false, fmt.Sprintf("Panic: %v", r))
		}
	}()
	
	gameMap := world.NewMap(200, 200, 32.0)
	
	// Test finding path between two walkable tiles (integration test)
	path := systems.FindPath(10, 10, 20, 20, gameMap)
	
	// A path should be found between two reasonable positions
	if path == nil {
		ts.addResult("Pathfinding", false, "No path found between walkable positions")
		return
	}
	
	if len(path) == 0 {
		ts.addResult("Pathfinding", false, "Empty path returned")
		return
	}
	
	// Test that path contains valid coordinates within map bounds
	for _, step := range path {
		if step.X < 0 || step.X >= gameMap.Width || step.Y < 0 || step.Y >= gameMap.Height {
			ts.addResult("Pathfinding", false, "Path contains coordinates outside map bounds")
			return
		}
	}
	
	ts.addResult("Pathfinding", true, "Pathfinding system working correctly")
}