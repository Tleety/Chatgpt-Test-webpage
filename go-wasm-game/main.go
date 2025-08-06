package main

import (
	"math"
	"syscall/js"
)

// Tree represents a tree with trunk and canopy
type Tree struct {
	x, y          float64
	trunkWidth    float64
	trunkHeight   float64
	canopyRadius  float64
}

// Bush represents a bush 
type Bush struct {
	x, y   float64
	radius float64
}

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
	cameraX      float64
	cameraY      float64
)

var drawFunc js.Func
var recenterFunc js.Func
var clickFunc js.Func
var createUnitFunc js.Func
var getUnitsFunc js.Func
var moveUnitFunc js.Func
var removeUnitFunc js.Func

// drawTreeAt renders a tree at screen coordinates
func drawTreeAt(tree Tree) {
	// Draw trunk
	ctx.Set("fillStyle", "#8B4513")
	ctx.Call("fillRect", tree.x-tree.trunkWidth/2, tree.y-tree.trunkHeight, tree.trunkWidth, tree.trunkHeight)
	
	// Draw canopy
	ctx.Set("fillStyle", "#228B22")
	ctx.Call("beginPath")
	ctx.Call("arc", tree.x, tree.y-tree.trunkHeight+10, tree.canopyRadius, 0, 2*math.Pi)
	ctx.Call("fill")
}

// drawBushAt renders a bush at screen coordinates
func drawBushAt(bush Bush) {
	ctx.Set("fillStyle", "#32CD32")
	ctx.Call("beginPath")
	ctx.Call("arc", bush.x, bush.y, bush.radius, 0, 2*math.Pi)
	ctx.Call("fill")
}

// drawTree renders a tree with brown trunk and green canopy (legacy function, kept for compatibility)
func drawTree(tree Tree) {
	drawTreeAt(tree)
}

// drawBush renders a bush as a green circle (legacy function, kept for compatibility)
func drawBush(bush Bush) {
	drawBushAt(bush)
}

// initializeEnvironment creates trees and bushes in world coordinates
func initializeEnvironment() {
	// Clear existing environment
	trees = []Tree{}
	bushes = []Bush{}
	
	// Use the map world dimensions for environment placement
	worldWidth := float64(gameMap.Width) * gameMap.TileSize
	worldHeight := float64(gameMap.Height) * gameMap.TileSize
	
	// Generate trees across the world area
	treePositions := []struct{ x, y float64 }{
		{worldWidth * 0.1, worldHeight * 0.15},   // Top-left area
		{worldWidth * 0.3, worldHeight * 0.2},    // Top area
		{worldWidth * 0.5, worldHeight * 0.18},   // Top-center
		{worldWidth * 0.75, worldHeight * 0.16},  // Top-right
		{worldWidth * 0.2, worldHeight * 0.4},    // Middle-left
		{worldWidth * 0.6, worldHeight * 0.38},   // Middle-right
		{worldWidth * 0.85, worldHeight * 0.25},  // Right area
		{worldWidth * 0.15, worldHeight * 0.65},  // Lower-left
		{worldWidth * 0.45, worldHeight * 0.7},   // Lower-center
		{worldWidth * 0.8, worldHeight * 0.6},    // Lower-right
		{worldWidth * 0.9, worldHeight * 0.8},    // Far bottom-right
		{worldWidth * 0.05, worldHeight * 0.9},   // Far bottom-left
	}
	
	// Create trees with varied properties
	for i, pos := range treePositions {
		trunkWidth := 12.0 + float64(i%4) * 2  // 12, 14, 16, 18
		trunkHeight := 35.0 + float64(i%3) * 5 // 35, 40, 45
		canopyRadius := 22.0 + float64(i%4) * 2 // 22, 24, 26, 28
		
		trees = append(trees, Tree{
			x: pos.x, 
			y: pos.y, 
			trunkWidth: trunkWidth, 
			trunkHeight: trunkHeight, 
			canopyRadius: canopyRadius,
		})
	}
	
	// Generate bushes across the world area
	bushPositions := []struct{ x, y float64 }{
		{worldWidth * 0.15, worldHeight * 0.25},  // Upper area
		{worldWidth * 0.25, worldHeight * 0.3},   
		{worldWidth * 0.4, worldHeight * 0.12},   
		{worldWidth * 0.55, worldHeight * 0.28},  
		{worldWidth * 0.7, worldHeight * 0.32},   
		{worldWidth * 0.08, worldHeight * 0.35},  
		{worldWidth * 0.45, worldHeight * 0.45},  
		{worldWidth * 0.65, worldHeight * 0.55},  
		{worldWidth * 0.35, worldHeight * 0.75},  // Lower area
		{worldWidth * 0.75, worldHeight * 0.85},  
		{worldWidth * 0.1, worldHeight * 0.8},    
		{worldWidth * 0.9, worldHeight * 0.4},    // Far right
		{worldWidth * 0.95, worldHeight * 0.95},  // Far corner
		{worldWidth * 0.02, worldHeight * 0.05},  // Far top-left
	}
	
	// Create bushes with varied sizes
	for i, pos := range bushPositions {
		radius := 14.0 + float64(i%5) * 1.5 // 14, 15.5, 17, 18.5, 20
		
		bushes = append(bushes, Bush{
			x: pos.x, 
			y: pos.y, 
			radius: radius,
		})
	}
}

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
	
	// Draw environment objects (trees and bushes) relative to camera
	for _, tree := range trees {
		screenX := tree.x - cameraX
		screenY := tree.y - cameraY
		
		// Only draw if on screen
		if screenX > -50 && screenX < canvasWidth+50 && screenY > -50 && screenY < canvasHeight+50 {
			drawTreeAt(Tree{x: screenX, y: screenY, trunkWidth: tree.trunkWidth, trunkHeight: tree.trunkHeight, canopyRadius: tree.canopyRadius})
		}
	}
	for _, bush := range bushes {
		screenX := bush.x - cameraX
		screenY := bush.y - cameraY
		
		// Only draw if on screen
		if screenX > -30 && screenX < canvasWidth+30 && screenY > -30 && screenY < canvasHeight+30 {
			drawBushAt(Bush{x: screenX, y: screenY, radius: bush.radius})
		}
	}
	
	// Draw player
	player.Draw(ctx, cameraX, cameraY)
	
	// Draw units
	unitManager.RenderUnits(ctx, cameraX, cameraY)
	
	js.Global().Call("requestAnimationFrame", drawFunc)
	return nil
}

func recenterSquare(this js.Value, args []js.Value) interface{} {
	// Update canvas dimensions
	canvasWidth = canvas.Get("width").Float()
	canvasHeight = canvas.Get("height").Float()
	
	// Center the player box in the world map
	mapWorldWidth := float64(gameMap.Width) * gameMap.TileSize
	mapWorldHeight := float64(gameMap.Height) * gameMap.TileSize
	
	centerX := (mapWorldWidth - player.Width) / 2
	centerY := (mapWorldHeight - player.Height) / 2
	
	// Use the new SetPosition method instead of direct field assignment
	player.SetPosition(centerX, centerY)
	
	// Reinitialize environment for new canvas size (keep existing trees/bushes)
	// No need to regenerate since they're positioned in world coordinates
	return nil
}



func click(this js.Value, args []js.Value) interface{} {
	// Get mouse click coordinates relative to canvas
	event := args[0]
	canvasRect := canvas.Call("getBoundingClientRect")
	
	mouseX := event.Get("clientX").Float() - canvasRect.Get("left").Float()
	mouseY := event.Get("clientY").Float() - canvasRect.Get("top").Float()
	
	// Convert screen coordinates to world coordinates
	worldX := mouseX + cameraX
	worldY := mouseY + cameraY
	
	// Convert world coordinates to tile coordinates
	tileX, tileY := gameMap.WorldToGrid(worldX, worldY)
	
	// Check if the tile is within map bounds
	if tileX >= 0 && tileX < gameMap.Width && tileY >= 0 && tileY < gameMap.Height {
		// Move player to the clicked tile
		player.MoveToTile(gameMap, tileX, tileY)
	}
	
	return nil
}

func createUnit(this js.Value, args []js.Value) interface{} {
	if len(args) < 3 {
		return map[string]interface{}{
			"success": false,
			"error":   "createUnit requires unitType, tileX, tileY",
		}
	}

	unitType := UnitType(args[0].Int())
	tileX := args[1].Int()
	tileY := args[2].Int()
	name := ""
	if len(args) > 3 {
		name = args[3].String()
	}

	unit, err := unitManager.CreateUnit(unitType, tileX, tileY, name)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	}

	return map[string]interface{}{
		"success": true,
		"unit": map[string]interface{}{
			"id":     unit.ID,
			"name":   unit.Name,
			"typeId": int(unit.TypeID),
			"tileX":  unit.TileX,
			"tileY":  unit.TileY,
			"health": unit.CurrentStats.Health,
			"level":  unit.Level,
		},
	}
}

func getUnits(this js.Value, args []js.Value) interface{} {
	units := unitManager.GetAllUnits()
	result := make([]interface{}, 0, len(units))

	for _, unit := range units {
		if !unit.IsAlive {
			continue
		}

		result = append(result, map[string]interface{}{
			"id":     unit.ID,
			"name":   unit.Name,
			"typeId": int(unit.TypeID),
			"tileX":  unit.TileX,
			"tileY":  unit.TileY,
			"health": unit.CurrentStats.Health,
			"maxHealth": unit.MaxStats.Health,
			"level":  unit.Level,
			"status": unit.Status,
		})
	}

	return result
}

func moveUnitJS(this js.Value, args []js.Value) interface{} {
	if len(args) < 3 {
		return map[string]interface{}{
			"success": false,
			"error":   "moveUnit requires unitId, tileX, tileY",
		}
	}

	unitID := args[0].String()
	tileX := args[1].Int()
	tileY := args[2].Int()

	err := unitManager.MoveUnit(unitID, tileX, tileY)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	}

	return map[string]interface{}{
		"success": true,
	}
}

func removeUnitJS(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return map[string]interface{}{
			"success": false,
			"error":   "removeUnit requires unitId",
		}
	}

	unitID := args[0].String()

	err := unitManager.RemoveUnit(unitID)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	}

	return map[string]interface{}{
		"success": true,
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
	initializeEnvironment()

	// Add event listeners - only mouse click, no keyboard
	canvas.Call("addEventListener", "click", js.FuncOf(click))

	// Expose recenter function to JavaScript
	recenterFunc = js.FuncOf(recenterSquare)
	js.Global().Set("recenterSquare", recenterFunc)
	
	// Expose click function to JavaScript (for potential external use)
	clickFunc = js.FuncOf(click)
	js.Global().Set("gameClick", clickFunc)
	
	// Expose unit management functions to JavaScript
	createUnitFunc = js.FuncOf(createUnit)
	js.Global().Set("createUnit", createUnitFunc)
	
	getUnitsFunc = js.FuncOf(getUnits)
	js.Global().Set("getUnits", getUnitsFunc)
	
	moveUnitFunc = js.FuncOf(moveUnitJS)
	js.Global().Set("moveUnit", moveUnitFunc)
	
	removeUnitFunc = js.FuncOf(removeUnitJS)
	js.Global().Set("removeUnit", removeUnitFunc)
	
	// Set flag to indicate WASM is loaded
	js.Global().Set("wasmLoaded", true)

	drawFunc = js.FuncOf(draw)
	js.Global().Call("requestAnimationFrame", drawFunc)

	select {}
}
