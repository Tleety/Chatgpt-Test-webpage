package systems

import (
	"math"

	"github.com/Tleety/Chatgpt-Test-webpage/ecs-game/components"
	"github.com/Tleety/Chatgpt-Test-webpage/ecs-game/ecs"
	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/inpututil"
)

// InputSystem handles player input
type InputSystem struct {
	world *ecs.World
}

func NewInputSystem(world *ecs.World) *InputSystem {
	return &InputSystem{world: world}
}

func (s *InputSystem) Update() {
	// Find player entity
	s.world.ForEachEntity(func(e *ecs.Entity) {
		if !e.HasComponent(components.Player{}) {
			return
		}

		vel, exists := e.GetComponent(components.Velocity{})
		if !exists {
			return
		}
		velocity := vel.(components.Velocity)
		
		// Handle keyboard input
		velocity.X, velocity.Y = 0, 0
		
		if ebiten.IsKeyPressed(ebiten.KeyArrowLeft) || ebiten.IsKeyPressed(ebiten.KeyA) {
			velocity.X = -200
		}
		if ebiten.IsKeyPressed(ebiten.KeyArrowRight) || ebiten.IsKeyPressed(ebiten.KeyD) {
			velocity.X = 200
		}
		if ebiten.IsKeyPressed(ebiten.KeyArrowUp) || ebiten.IsKeyPressed(ebiten.KeyW) {
			velocity.Y = -200
		}
		if ebiten.IsKeyPressed(ebiten.KeyArrowDown) || ebiten.IsKeyPressed(ebiten.KeyS) {
			velocity.Y = 200
		}

		// Handle mouse input
		if inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonLeft) {
			mx, my := ebiten.CursorPosition()
			pos, exists := e.GetComponent(components.Position{})
			if !exists {
				return
			}
			position := pos.(components.Position)
			
			// Calculate direction to mouse click
			dx := float64(mx) - position.X
			dy := float64(my) - position.Y
			dist := math.Sqrt(dx*dx + dy*dy)
			
			if dist > 5 { // Avoid division by zero for very small distances
				velocity.X = (dx / dist) * 150
				velocity.Y = (dy / dist) * 150
			}
		}

		e.AddComponent(velocity)
	})
}

// MovementSystem handles entity movement
type MovementSystem struct {
	world *ecs.World
}

func NewMovementSystem(world *ecs.World) *MovementSystem {
	return &MovementSystem{world: world}
}

func (s *MovementSystem) Update(dt float64) {
	s.world.ForEachEntity(func(e *ecs.Entity) {
		if !e.HasComponent(components.Position{}) || !e.HasComponent(components.Velocity{}) {
			return
		}

		pos, _ := e.GetComponent(components.Position{})
		vel, _ := e.GetComponent(components.Velocity{})
		
		position := pos.(components.Position)
		velocity := vel.(components.Velocity)

		// Update position based on velocity
		position.X += velocity.X * dt
		position.Y += velocity.Y * dt

		// Keep entities within screen bounds
		if position.X < 0 {
			position.X = 0
		}
		if position.Y < 0 {
			position.Y = 0
		}
		if position.X > 800-20 { // Screen width minus entity width
			position.X = 800 - 20
		}
		if position.Y > 600-20 { // Screen height minus entity height
			position.Y = 600 - 20
		}

		e.AddComponent(position)
	})
}

// AISystem handles AI entity behavior
type AISystem struct {
	world *ecs.World
}

func NewAISystem(world *ecs.World) *AISystem {
	return &AISystem{world: world}
}

func (s *AISystem) Update(dt float64) {
	s.world.ForEachEntity(func(e *ecs.Entity) {
		if !e.HasComponent(components.AI{}) || !e.HasComponent(components.Position{}) {
			return
		}

		aiComp, _ := e.GetComponent(components.AI{})
		posComp, _ := e.GetComponent(components.Position{})
		velComp, exists := e.GetComponent(components.Velocity{})
		if !exists {
			return
		}
		
		ai := aiComp.(components.AI)
		pos := posComp.(components.Position)
		vel := velComp.(components.Velocity)

		// Calculate direction to target
		dx := ai.TargetX - pos.X
		dy := ai.TargetY - pos.Y
		dist := math.Sqrt(dx*dx + dy*dy)

		// If close to target, pick a new random target
		if dist < 30 {
			ai.TargetX = float64((int(pos.X) + 100 + (int(pos.X)*17)%300) % 760)
			ai.TargetY = float64((int(pos.Y) + 100 + (int(pos.Y)*23)%200) % 560)
			e.AddComponent(ai)
		} else {
			// Move towards target
			vel.X = (dx / dist) * ai.Speed
			vel.Y = (dy / dist) * ai.Speed
			e.AddComponent(vel)
		}
	})
}