package main

import "syscall/js"

// Game event handlers

var recenterFunc js.Func
var clickFunc js.Func

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
		player.MoveToTile(tileX, tileY)
	}
	
	return nil
}

// initializeEventHandlers sets up game event listeners and JS function bindings
func initializeEventHandlers(canvas js.Value) {
	// Add event listeners - only mouse click, no keyboard
	canvas.Call("addEventListener", "click", js.FuncOf(click))

	// Expose recenter function to JavaScript
	recenterFunc = js.FuncOf(recenterSquare)
	js.Global().Set("recenterSquare", recenterFunc)
	
	// Expose click function to JavaScript (for potential external use)
	clickFunc = js.FuncOf(click)
	js.Global().Set("gameClick", clickFunc)
}