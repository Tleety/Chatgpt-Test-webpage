package main

import (
	"syscall/js"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/entities"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/units"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/ui"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/world"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/game"
)

// initializeGameEntities creates and initializes player and unit manager
func initializeGameEntities(gameMap *world.Map) (*entities.Player, *units.UnitManager, *ui.UISystem) {
	// Create unit manager
	um := units.NewUnitManager(gameMap)
	
	// Calculate world dimensions and create player at center
	mapWorldWidth := float64(gameMap.Width) * gameMap.TileSize
	mapWorldHeight := float64(gameMap.Height) * gameMap.TileSize

	// Create player at center of map
	centerX := (mapWorldWidth - 20) / 2
	centerY := (mapWorldHeight - 20) / 2
	p := entities.NewPlayer(centerX, centerY, gameMap)

	// Initialize UI system
	uiSys := ui.NewUISystem()
	uiSys.SetUnitCount(um.GetTotalUnitCount())
	
	return p, um, uiSys
}

// initializeGameSystems sets up all game systems and event handlers
func initializeGameSystems(ctx, canvas js.Value, player *entities.Player, gameMap *world.Map, 
	unitManager *units.UnitManager, environment *world.Environment, uiSystem *ui.UISystem) {
	
	// Set up UI callbacks
	setupUIHandlers(unitManager, uiSystem)

	// Initialize game state for shared access
	game.InitializeState(ctx, canvas, player, gameMap, unitManager, environment)

	// Initialize game layers
	initializeGameLayers()

	// Setup UI-specific event handlers  
	game.SetupUIEventHandlers(canvas, uiSystem)
}

// renderObjectsLayer renders objects (units) on the game map
func renderObjectsLayer(ctx js.Value, cameraX, cameraY, canvasWidth, canvasHeight float64) {
	unitManager.Render(ctx, cameraX, cameraY)
}

// initializeGameLayers sets up all game layers after game objects are created
func initializeGameLayers() {
	// Add objects layer (priority 10 - foreground)
	gameMap.Layers.AddLayer("objects", 10, true, renderObjectsLayer)
}

// setupUIHandlers sets up UI button handlers
func setupUIHandlers(um *units.UnitManager, uiSys *ui.UISystem) {
	// Setup spawn unit handler
	ui.SpawnUnitCallback = func() {
		err := um.SpawnRandomUnit()
		if err == nil {
			// Update UI with new unit count
			uiSys.SetUnitCount(um.GetTotalUnitCount())
		}
	}
	
	// Setup remove unit handler
	ui.RemoveUnitCallback = func() {
		err := um.RemoveNewestUnit()
		if err == nil {
			// Update UI with new unit count
			uiSys.SetUnitCount(um.GetTotalUnitCount())
		}
	}
}