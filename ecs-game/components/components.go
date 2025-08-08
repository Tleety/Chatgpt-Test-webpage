package components

// Position represents an entity's position in 2D space
type Position struct {
	X, Y float64
}

// Velocity represents an entity's movement speed and direction
type Velocity struct {
	X, Y float64
}

// Sprite represents visual appearance of an entity
type Sprite struct {
	ColorR, ColorG, ColorB uint8
	Width, Height          float64
}

// Player marks an entity as controllable by player input
type Player struct{}

// Target represents a destination for an entity to move towards
type Target struct {
	X, Y                   float64
	StopWhenTargetReached bool
}

// AI marks an entity as computer-controlled
type AI struct {
	Speed float64
}

// ClickToMove marks an entity as controllable by mouse clicks
type ClickToMove struct {
	Speed float64
}