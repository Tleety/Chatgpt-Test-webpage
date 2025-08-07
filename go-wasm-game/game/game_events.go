package game

import "syscall/js"

// Game event handlers

var recenterFunc js.Func
var clickFunc js.Func

func recenterSquare(this js.Value, args []js.Value) interface{} {
	// Update canvas dimensions
	State.UpdateCanvasDimensions()
	
	// Center the player box in the world map
	mapWorldWidth := float64(State.GameMap.Width) * State.GameMap.TileSize
	mapWorldHeight := float64(State.GameMap.Height) * State.GameMap.TileSize
	
	centerX := (mapWorldWidth - State.Player.Width) / 2
	centerY := (mapWorldHeight - State.Player.Height) / 2
	
	// Use the new SetPosition method instead of direct field assignment
	State.Player.SetPosition(centerX, centerY)
	
	// Reinitialize environment for new canvas size (keep existing trees/bushes)
	// No need to regenerate since they're positioned in world coordinates
	return nil
}

func click(this js.Value, args []js.Value) interface{} {
	// Get mouse click coordinates relative to canvas
	event := args[0]
	canvasRect := State.Canvas.Call("getBoundingClientRect")
	
	mouseX := event.Get("clientX").Float() - canvasRect.Get("left").Float()
	mouseY := event.Get("clientY").Float() - canvasRect.Get("top").Float()
	
	// Convert screen coordinates to world coordinates
	worldX := mouseX + State.CameraX
	worldY := mouseY + State.CameraY
	
	// Convert world coordinates to tile coordinates
	tileX, tileY := State.GameMap.WorldToGrid(worldX, worldY)
	
	// Check if the tile is within map bounds
	if tileX >= 0 && tileX < State.GameMap.Width && tileY >= 0 && tileY < State.GameMap.Height {
		// Move player to the clicked tile
		State.Player.MoveToTile(tileX, tileY)
	}
	
	return nil
}

// initializeEventHandlers sets up game event listeners and JS function bindings
func InitializeEventHandlers(canvas js.Value) {
	// Add event listeners - only mouse click, no keyboard
	canvas.Call("addEventListener", "click", js.FuncOf(click))

	// Expose recenter function to JavaScript
	recenterFunc = js.FuncOf(recenterSquare)
	js.Global().Set("recenterSquare", recenterFunc)
	
	// Expose click function to JavaScript (for potential external use)
	clickFunc = js.FuncOf(click)
	js.Global().Set("gameClick", clickFunc)
}