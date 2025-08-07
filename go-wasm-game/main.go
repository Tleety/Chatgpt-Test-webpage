package main

import (
	"syscall/js"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/entities"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/game"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/units"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/world"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/ui"
)

var (
	ctx          js.Value
	canvas       js.Value
	player       *entities.Player
	canvasWidth  float64
	canvasHeight float64
	gameMap      *world.Map
	unitManager  *units.UnitManager
	environment  *world.Environment
	uiSystem     *ui.UISystem
	cameraX      float64
	cameraY      float64
)

var drawFunc js.Func

func draw(this js.Value, args []js.Value) interface{} {
	// Get current canvas dimensions
	canvasWidth = canvas.Get("width").Float()
	canvasHeight = canvas.Get("height").Float()
	
	// Update UI system with current canvas size
	uiSystem.UpdateCanvasSize(canvasWidth, canvasHeight)
	
	// Update player (handles movement animations with pathfinding and tile-based speed)
	player.Update()
	
	// Update all units using the unified movement system
	unitManager.Update()
	
	// Keep player within world bounds (map bounds)
	player.ClampToMapBounds(float64(gameMap.Width), float64(gameMap.Height), gameMap.TileSize)
	
	// Get player position
	playerX, playerY := player.GetPosition()
	
	// Calculate game area height (full canvas minus UI area)
	gameAreaHeight := canvasHeight - uiSystem.GetUIAreaHeight()
	
	// Update camera to follow player (center player on screen)
	cameraX = playerX - canvasWidth/2 + player.Width/2
	cameraY = playerY - gameAreaHeight/2 + player.Height/2
	
	// Clamp camera to map bounds
	mapWorldWidth := float64(gameMap.Width) * gameMap.TileSize
	mapWorldHeight := float64(gameMap.Height) * gameMap.TileSize
	
	if cameraX < 0 {
		cameraX = 0
	}
	if cameraY < 0 {
		cameraY = 0
	}
	if cameraX > mapWorldWidth-canvasWidth {
		cameraX = mapWorldWidth - canvasWidth
	}
	if cameraY > mapWorldHeight-gameAreaHeight {
		cameraY = mapWorldHeight - gameAreaHeight
	}
	
	// Update the game state with current camera position
	game.State.UpdateCamera(cameraX, cameraY)
	
	// Clear canvas
	ctx.Call("clearRect", 0, 0, canvasWidth, canvasHeight)
	
	// Use the new layer system to render everything (only in game area)
	ctx.Call("save")
	ctx.Call("rect", 0, 0, canvasWidth, gameAreaHeight)
	ctx.Call("clip")
	
	gameMap.RenderWithLayers(ctx, cameraX, cameraY, canvasWidth, gameAreaHeight)

	// Draw environment objects (trees and bushes)
	environment.Render(ctx, cameraX, cameraY, canvasWidth, gameAreaHeight)
	
	// Draw units
	unitManager.Render(ctx, cameraX, cameraY)
	
	// Draw player
	player.Draw(ctx, cameraX, cameraY)
	
	ctx.Call("restore")
	
	// Draw UI system (always on top)
	uiSystem.Render(ctx)
	
	js.Global().Call("requestAnimationFrame", drawFunc)
	return nil
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

// spawnUnitHandler handles UI spawn button clicks
func spawnUnitHandler() {
	err := unitManager.SpawnRandomUnit()
	if err == nil {
		// Update UI with new unit count
		uiSystem.SetUnitCount(unitManager.GetTotalUnitCount())
	}
}

// removeUnitHandler handles UI remove button clicks
func removeUnitHandler() {
	err := unitManager.RemoveNewestUnit()
	if err == nil {
		// Update UI with new unit count
		uiSystem.SetUnitCount(unitManager.GetTotalUnitCount())
	}
}

func main() {
	doc := js.Global().Get("document")
	canvas = doc.Call("getElementById", "game")
	ctx = canvas.Call("getContext", "2d")

	// Get initial canvas dimensions
	canvasWidth = canvas.Get("width").Float()
	canvasHeight = canvas.Get("height").Float()

	// Initialize the map (200x200 tiles, 32px per tile)
	gameMap = world.NewMap(200, 200, 32.0)
	
	// Initialize unit manager
	unitManager = units.NewUnitManager(gameMap)
	
	// Create one initial unit for demonstration
	unitManager.CreateUnit(entities.UnitWarrior, 95, 95, "")
	
	// Calculate world dimensions and create player at center
	mapWorldWidth := float64(gameMap.Width) * gameMap.TileSize
	mapWorldHeight := float64(gameMap.Height) * gameMap.TileSize

	// Create player at center of map
	centerX := (mapWorldWidth - 20) / 2
	centerY := (mapWorldHeight - 20) / 2
	player = entities.NewPlayer(centerX, centerY)
  
	environment = world.NewEnvironment(gameMap)

	// Initialize UI system
	uiSystem = ui.NewUISystem()
	uiSystem.SetUnitCount(unitManager.GetTotalUnitCount())
	
	// Set up UI callbacks
	ui.SpawnUnitCallback = spawnUnitHandler
	ui.RemoveUnitCallback = removeUnitHandler

	// Initialize game state for shared access
	game.InitializeState(ctx, canvas, player, gameMap, unitManager, environment)

	// Initialize game layers
	initializeGameLayers()

	// Setup custom event handlers before initializing game event handlers
	setupUIEventHandlers()

	// Initialize JavaScript interface
	game.InitializeJSInterface()
	
	// Set flag to indicate WASM is loaded
	js.Global().Set("wasmLoaded", true)

	drawFunc = js.FuncOf(draw)
	js.Global().Call("requestAnimationFrame", drawFunc)

	select {}
}

// setupUIEventHandlers sets up UI-specific event handlers
func setupUIEventHandlers() {
	// Add mouse move handler for UI hover effects
	canvas.Call("addEventListener", "mousemove", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		event := args[0]
		rect := canvas.Call("getBoundingClientRect")
		x := event.Get("clientX").Float() - rect.Get("left").Float()
		y := event.Get("clientY").Float() - rect.Get("top").Float()
		
		uiSystem.HandleMouseMove(x, y)
		return nil
	}))
	
	// Add custom click handler that checks UI first
	canvas.Call("addEventListener", "click", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		event := args[0]
		rect := canvas.Call("getBoundingClientRect")
		x := event.Get("clientX").Float() - rect.Get("left").Float()
		y := event.Get("clientY").Float() - rect.Get("top").Float()
		
		// Check if click was handled by UI
		if uiSystem.HandleMouseClick(x, y) {
			return nil // UI handled the click, don't pass to game
		}
		
		// Pass click to game logic
		handleGameClick(event)
		return nil
	}))
}

// handleGameClick processes game area clicks (copied from game/game_events.go)
func handleGameClick(event js.Value) {
	// Get mouse click coordinates relative to canvas
	canvasRect := canvas.Call("getBoundingClientRect")
	
	mouseX := event.Get("clientX").Float() - canvasRect.Get("left").Float()
	mouseY := event.Get("clientY").Float() - canvasRect.Get("top").Float()
	
	// Only process clicks in the game area (not UI area)
	gameAreaHeight := canvasHeight - uiSystem.GetUIAreaHeight()
	if mouseY >= gameAreaHeight {
		return // Click was in UI area, ignore
	}
	
	// Convert screen coordinates to world coordinates
	worldX := mouseX + cameraX
	worldY := mouseY + cameraY
	
	// Convert world coordinates to tile coordinates
	tileX, tileY := gameMap.WorldToGrid(worldX, worldY)
	
	// Check if the tile is within map bounds
	if tileX >= 0 && tileX < gameMap.Width && tileY >= 0 && tileY < gameMap.Height {
		// Move player to the clicked tile
		player.MoveToTile(tileX, tileY)
	}
}
