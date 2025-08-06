package main

import (
	"syscall/js"
)

var (
	ctx          js.Value
	canvas       js.Value
	player       *Player
	canvasWidth  float64
	canvasHeight float64
	trees        []Tree
	bushes       []Bush
	gameMap      *Map
	unitManager  *UnitManager
	environment  *Environment
	cameraX      float64
	cameraY      float64
)

var drawFunc js.Func

func draw(this js.Value, args []js.Value) interface{} {
	// Get current canvas dimensions
	canvasWidth = canvas.Get("width").Float()
	canvasHeight = canvas.Get("height").Float()
	
	// Update player (handles movement animations with pathfinding and tile-based speed)
	player.Update(gameMap)
	
	// Keep player within world bounds (map bounds)
	player.ClampToMapBounds(gameMap)
	
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
	
	// Clear canvas
	ctx.Call("clearRect", 0, 0, canvasWidth, canvasHeight)
	
	// Draw map first (background)
	gameMap.Render(ctx, cameraX, cameraY, canvasWidth, canvasHeight)
	
	// Draw environment objects (trees and bushes)
	environment.Render(ctx, cameraX, cameraY, canvasWidth, canvasHeight)
	
	// Draw player
	player.Draw(ctx, cameraX, cameraY)
	
	// Draw units
	unitManager.Render(ctx, cameraX, cameraY)
	
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
	gameMap = NewMap(200, 200, 32.0)
	
	// Initialize unit manager
	unitManager = NewUnitManager(gameMap)
	
	// Create some initial units for demonstration
	unitManager.CreateUnit(UnitWarrior, 95, 95, "")
	unitManager.CreateUnit(UnitArcher, 97, 95, "")
	unitManager.CreateUnit(UnitMage, 95, 97, "")
	unitManager.CreateUnit(UnitScout, 97, 97, "")
	
	// Calculate world dimensions and create player at center
	mapWorldWidth := float64(gameMap.Width) * gameMap.TileSize
	mapWorldHeight := float64(gameMap.Height) * gameMap.TileSize

	// Create player at center of map
	centerX := (mapWorldWidth - 20) / 2
	centerY := (mapWorldHeight - 20) / 2
	player = NewPlayer(centerX, centerY)

	// Initialize environment (trees and bushes positioned in world coordinates)
	environment = NewEnvironment(gameMap)
	trees, bushes = initializeEnvironment(gameMap)

	// Initialize event handlers and JavaScript interface
	initializeEventHandlers(canvas)
	initializeJSInterface()
	
	// Set flag to indicate WASM is loaded
	js.Global().Set("wasmLoaded", true)

	drawFunc = js.FuncOf(draw)
	js.Global().Call("requestAnimationFrame", drawFunc)

	select {}
}
