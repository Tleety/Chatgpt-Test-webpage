package main

import (
	"syscall/js"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/entities"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/game"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/units"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/world"
)

// Main game loop for the Go WebAssembly game with selective build optimization
var (
	ctx          js.Value
	canvas       js.Value
	player       *entities.Player
	canvasWidth  float64
	canvasHeight float64
	gameMap      *world.Map
	unitManager  *units.UnitManager
	environment  *world.Environment
	cameraX      float64
	cameraY      float64
)

var drawFunc js.Func

func draw(this js.Value, args []js.Value) interface{} {
	// Get current canvas dimensions
	canvasWidth = canvas.Get("width").Float()
	canvasHeight = canvas.Get("height").Float()
	
	// Update player (handles movement animations with pathfinding and tile-based speed)
	player.Update()
	
	// Update all units using the unified movement system
	unitManager.Update()
	
	// Keep player within world bounds (map bounds)
	player.ClampToMapBounds(float64(gameMap.Width), float64(gameMap.Height), gameMap.TileSize)
	
	// Get player position
	playerX, playerY := player.GetPosition()
	
	// Update camera to follow player (center player on screen)
	cameraX = playerX - canvasWidth/2 + player.Width/2
	cameraY = playerY - canvasHeight/2 + player.Height/2
	
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
	if cameraY > mapWorldHeight-canvasHeight {
		cameraY = mapWorldHeight - canvasHeight
	}
	
	// Update the game state with current camera position
	game.State.UpdateCamera(cameraX, cameraY)
	
	// Clear canvas
	ctx.Call("clearRect", 0, 0, canvasWidth, canvasHeight)
	
	// Use the new layer system to render everything
	gameMap.RenderWithLayers(ctx, cameraX, cameraY, canvasWidth, canvasHeight)

	// Draw environment objects (trees and bushes)
	environment.Render(ctx, cameraX, cameraY, canvasWidth, canvasHeight)
	
	// Draw units
	unitManager.Render(ctx, cameraX, cameraY)
	
	// Draw player
	player.Draw(ctx, cameraX, cameraY)
	
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

	// Initialize game state for shared access
	game.InitializeState(ctx, canvas, player, gameMap, unitManager, environment)

	// Initialize game layers
	initializeGameLayers()

	// Initialize event handlers and JavaScript interface
	game.InitializeEventHandlers(canvas)
	game.InitializeJSInterface()
	
	// Set flag to indicate WASM is loaded
	js.Global().Set("wasmLoaded", true)

	drawFunc = js.FuncOf(draw)
	js.Global().Call("requestAnimationFrame", drawFunc)

	select {}
}
