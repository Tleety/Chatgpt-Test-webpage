package world

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

// TileDefinitions contains all tile definitions with their properties
var TileDefinitions = map[TileType]Tile{
	TileGrass: {
		Walkable:  true,
		WalkSpeed: 1.0,
		Color:     "#90EE90", // Light green
		Image:     "",
	},
	TileWater: {
		Walkable:  false,
		WalkSpeed: 0.0,
		Color:     "#4169E1", // Royal blue
		Image:     "",
	},
	TileDirtPath: {
		Walkable:  true,
		WalkSpeed: 1.5, // 50% faster than grass
		Color:     "#8B4513", // Saddle brown
		Image:     "",
	},
}