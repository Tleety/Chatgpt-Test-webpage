package game

import "syscall/js"

// setupUIEventHandlers sets up UI-specific event handlers
func SetupUIEventHandlers(canvas js.Value, uiSystem interface{}) {
	// Add mouse move handler for UI hover effects
	canvas.Call("addEventListener", "mousemove", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		event := args[0]
		rect := canvas.Call("getBoundingClientRect")
		x := event.Get("clientX").Float() - rect.Get("left").Float()
		y := event.Get("clientY").Float() - rect.Get("top").Float()
		
		// Use interface{} to avoid circular import, cast in main
		if ui, ok := uiSystem.(interface{ HandleMouseMove(float64, float64) }); ok {
			ui.HandleMouseMove(x, y)
		}
		return nil
	}))
	
	// Add custom click handler that checks UI first
	canvas.Call("addEventListener", "click", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		event := args[0]
		rect := canvas.Call("getBoundingClientRect")
		x := event.Get("clientX").Float() - rect.Get("left").Float()
		y := event.Get("clientY").Float() - rect.Get("top").Float()
		
		// Check if click was handled by UI
		if ui, ok := uiSystem.(interface{ HandleMouseClick(float64, float64) bool }); ok {
			if ui.HandleMouseClick(x, y) {
				return nil // UI handled the click, don't pass to game
			}
		}
		
		// Pass click to game logic
		HandleGameClick(event)
		return nil
	}))
}

// HandleGameClick processes game area clicks
func HandleGameClick(event js.Value) {
	// Get mouse click coordinates relative to canvas
	canvasRect := State.Canvas.Call("getBoundingClientRect")
	
	mouseX := event.Get("clientX").Float() - canvasRect.Get("left").Float()
	mouseY := event.Get("clientY").Float() - canvasRect.Get("top").Float()
	
	// Only process clicks in the game area (not UI area)
	gameAreaHeight := State.CanvasHeight - GetUIAreaHeight()
	if mouseY >= gameAreaHeight {
		return // Click was in UI area, ignore
	}
	
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
}

// GetUIAreaHeight returns the height of the UI area
func GetUIAreaHeight() float64 {
	// Default UI area height
	return 60.0
}