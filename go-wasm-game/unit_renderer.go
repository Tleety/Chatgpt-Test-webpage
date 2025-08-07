package main

import (
	"fmt"
	"math"
	"syscall/js"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/entities"
)

// UnitRenderer handles rendering of units on the screen
type UnitRenderer struct {
	gameMap *Map
}

// NewUnitRenderer creates a new unit renderer
func NewUnitRenderer(gameMap *Map) *UnitRenderer {
	return &UnitRenderer{
		gameMap: gameMap,
	}
}

// RenderUnits draws all units on the screen
func (renderer *UnitRenderer) RenderUnits(ctx js.Value, units map[string]*Unit, cameraX, cameraY float64) {
	for _, unit := range units {
		if !unit.IsAlive {
			continue
		}

		renderer.renderUnit(ctx, unit, cameraX, cameraY)
	}
}

// renderUnit draws a single unit
func (renderer *UnitRenderer) renderUnit(ctx js.Value, unit *Unit, cameraX, cameraY float64) {
	// Convert tile coordinates to world coordinates
	worldX, worldY := renderer.gameMap.GridToWorld(unit.TileX, unit.TileY)
	
	// Calculate screen position
	screenX := worldX - cameraX
	screenY := worldY - cameraY

	// Get unit type definition
	typeDef, exists := entities.UnitTypeDefinitions[unit.TypeID]
	if !exists {
		return
	}

	// Only draw if on screen (with some margin)
	margin := 50.0
	if screenX < -margin || screenX > canvasWidth+margin || screenY < -margin || screenY > canvasHeight+margin {
		return
	}

	// Draw unit as a colored circle with icon
	radius := typeDef.Appearance.Size / 2

	// Draw unit circle
	ctx.Set("fillStyle", typeDef.Appearance.Color)
	ctx.Call("beginPath")
	ctx.Call("arc", screenX, screenY, radius, 0, 2*math.Pi)
	ctx.Call("fill")

	// Draw unit icon (if supported by browser)
	ctx.Set("font", fmt.Sprintf("%dpx Arial", int(typeDef.Appearance.Size)))
	ctx.Set("textAlign", "center")
	ctx.Set("textBaseline", "middle")
	ctx.Set("fillStyle", "white")
	ctx.Call("fillText", typeDef.Appearance.Icon, screenX, screenY)

	// Draw health bar if damaged
	if unit.CurrentStats.Health < unit.MaxStats.Health {
		renderer.renderHealthBar(ctx, unit, screenX, screenY, radius)
	}
}

// renderHealthBar draws a health bar above the unit
func (renderer *UnitRenderer) renderHealthBar(ctx js.Value, unit *Unit, screenX, screenY, radius float64) {
	barWidth := radius * 2
	barHeight := 4.0
	barY := screenY - radius - 8

	// Background (red)
	ctx.Set("fillStyle", "#ff0000")
	ctx.Call("fillRect", screenX-barWidth/2, barY, barWidth, barHeight)

	// Health (green)
	healthPercent := unit.HealthPercentage()
	ctx.Set("fillStyle", "#00ff00")
	ctx.Call("fillRect", screenX-barWidth/2, barY, barWidth*healthPercent, barHeight)
}