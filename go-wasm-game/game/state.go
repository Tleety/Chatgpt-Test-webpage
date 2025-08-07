package game

import (
	"syscall/js"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/entities"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/units"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/world"
)

// GameState holds all the global game state
type GameState struct {
	Ctx          js.Value
	Canvas       js.Value
	Player       *entities.Player
	CanvasWidth  float64
	CanvasHeight float64
	GameMap      *world.Map
	UnitManager  *units.UnitManager
	Environment  *world.Environment
	CameraX      float64
	CameraY      float64
}

// Global game state instance
var State *GameState

// InitializeState sets up the global game state
func InitializeState(ctx js.Value, canvas js.Value, player *entities.Player, gameMap *world.Map, unitManager *units.UnitManager, environment *world.Environment) {
	State = &GameState{
		Ctx:         ctx,
		Canvas:      canvas,
		Player:      player,
		GameMap:     gameMap,
		UnitManager: unitManager,
		Environment: environment,
	}
}

// UpdateCamera updates the camera position
func (gs *GameState) UpdateCamera(cameraX, cameraY float64) {
	gs.CameraX = cameraX
	gs.CameraY = cameraY
}

// UpdateCanvasDimensions updates the canvas dimensions
func (gs *GameState) UpdateCanvasDimensions() {
	gs.CanvasWidth = gs.Canvas.Get("width").Float()
	gs.CanvasHeight = gs.Canvas.Get("height").Float()
}