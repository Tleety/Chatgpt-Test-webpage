package main

import (
	"image/color"
	"time"

	"github.com/Tleety/Chatgpt-Test-webpage/ecs-game/components"
	"github.com/Tleety/Chatgpt-Test-webpage/ecs-game/ecs"
	"github.com/Tleety/Chatgpt-Test-webpage/ecs-game/systems"
	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/ebitenutil"
)

const (
	screenWidth  = 800
	screenHeight = 600
)

// Game represents the main game state
type Game struct {
	world          *ecs.World
	inputSystem    *systems.InputSystem
	movementSystem *systems.MovementSystem
	aiSystem       *systems.AISystem
	lastUpdate     time.Time
}

// NewGame creates a new game instance
func NewGame() *Game {
	world := ecs.NewWorld()
	
	game := &Game{
		world:          world,
		inputSystem:    systems.NewInputSystem(world),
		movementSystem: systems.NewMovementSystem(world),
		aiSystem:       systems.NewAISystem(world),
		lastUpdate:     time.Now(),
	}

	game.initEntities()
	return game
}

// initEntities creates the initial game entities
func (g *Game) initEntities() {
	// Create player entity
	player := g.world.NewEntity()
	player.AddComponent(components.Position{X: 400, Y: 300})
	player.AddComponent(components.Velocity{X: 0, Y: 0})
	player.AddComponent(components.Sprite{ColorR: 0, ColorG: 255, ColorB: 0, Width: 20, Height: 20})
	player.AddComponent(components.Player{})

	// Create AI entities
	for i := 0; i < 2; i++ {
		ai := g.world.NewEntity()
		x := float64(100 + i*200)
		y := float64(100 + i*100)
		ai.AddComponent(components.Position{X: x, Y: y})
		ai.AddComponent(components.Velocity{X: 0, Y: 0})
		ai.AddComponent(components.Sprite{ColorR: 255, ColorG: 100, ColorB: 100, Width: 15, Height: 15})
		ai.AddComponent(components.AI{Speed: 50})
	}

	// Create ClickToMove entities (blue squares)
	for i := 0; i < 3; i++ {
		clickEntity := g.world.NewEntity()
		x := float64(150 + i*150)
		y := float64(400)
		clickEntity.AddComponent(components.Position{X: x, Y: y})
		clickEntity.AddComponent(components.Velocity{X: 0, Y: 0})
		clickEntity.AddComponent(components.Sprite{ColorR: 100, ColorG: 100, ColorB: 255, Width: 18, Height: 18})
		clickEntity.AddComponent(components.ClickToMove{Speed: 120})
	}
}

// Update is called every frame to update game logic
func (g *Game) Update() error {
	now := time.Now()
	dt := now.Sub(g.lastUpdate).Seconds()
	g.lastUpdate = now

	// Update all systems
	g.inputSystem.Update()
	g.movementSystem.Update(dt)
	g.aiSystem.Update(dt)

	return nil
}

// Draw is called every frame to render the game
func (g *Game) Draw(screen *ebiten.Image) {
	screen.Fill(color.RGBA{50, 50, 80, 255})

	// Draw all entities with sprites
	g.world.ForEachEntity(func(e *ecs.Entity) {
		if !e.HasComponent(components.Position{}) || !e.HasComponent(components.Sprite{}) {
			return
		}

		posComp, _ := e.GetComponent(components.Position{})
		spriteComp, _ := e.GetComponent(components.Sprite{})
		
		pos := posComp.(components.Position)
		sprite := spriteComp.(components.Sprite)

		clr := color.RGBA{sprite.ColorR, sprite.ColorG, sprite.ColorB, 255}
		ebitenutil.DrawRect(screen, pos.X, pos.Y, sprite.Width, sprite.Height, clr)
	})

	// Draw instructions
	ebitenutil.DebugPrint(screen, "ECS Game Demo\nArrow keys or WASD to move green player\nClick mouse to move blue squares to cursor\nRed squares are AI entities")
}

// Layout returns the game's screen size
func (g *Game) Layout(outsideWidth, outsideHeight int) (int, int) {
	return screenWidth, screenHeight
}

func main() {
	ebiten.SetWindowSize(screenWidth, screenHeight)
	ebiten.SetWindowTitle("ECS Game - Ebiten + Custom ECS")

	game := NewGame()

	if err := ebiten.RunGame(game); err != nil {
		panic(err)
	}
}