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



func main() {
	doc := js.Global().Get("document")
	canvas = doc.Call("getElementById", "game")
	ctx = canvas.Call("getContext", "2d")

	// Get initial canvas dimensions
	canvasWidth = canvas.Get("width").Float()
	canvasHeight = canvas.Get("height").Float()

	// Initialize the map (200x200 tiles, 32px per tile)
	gameMap = world.NewMap(200, 200, 32.0)
	
	// Create game entities
	player, unitManager, uiSystem = initializeGameEntities(gameMap)
	
	// Create environment  
	environment = world.NewEnvironment(gameMap)
	
	// Create one initial unit for demonstration
	unitManager.CreateUnit(entities.UnitWarrior, 95, 95, "")
	uiSystem.SetUnitCount(unitManager.GetTotalUnitCount())
	
	// Initialize all game systems
	initializeGameSystems(ctx, canvas, player, gameMap, unitManager, environment, uiSystem)
	
	// Initialize game event handlers
	game.InitializeEventHandlers(canvas)
	
	// Initialize JavaScript interface
	game.InitializeJSInterface()


	
	// Set flag to indicate WASM is loaded
	js.Global().Set("wasmLoaded", true)

	drawFunc = js.FuncOf(draw)
	js.Global().Call("requestAnimationFrame", drawFunc)

	select {}
}
