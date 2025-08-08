package world

// Common types that are used in both WebAssembly and native builds

// Tile represents a terrain tile with properties
type Tile struct {
	Walkable  bool
	WalkSpeed float64
	Color     string
	Image     string // Path to image file, empty string means use color
}

// TileType represents the type of terrain tile
type TileType int

const (
	TileGrass TileType = iota
	TileWater
	TileDirtPath
)