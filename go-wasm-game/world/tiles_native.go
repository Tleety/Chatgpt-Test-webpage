//go:build !js
// +build !js

package world

// TileDefinitions contains all tile definitions (non-WebAssembly version)
var TileDefinitions = map[TileType]Tile{
	TileGrass: {
		Walkable:  true,
		WalkSpeed: 1.0,
		Color:     "#90EE90",
		Image:     "",
	},
	TileWater: {
		Walkable:  false,
		WalkSpeed: 0.0,
		Color:     "#4169E1",
		Image:     "",
	},
	TileDirtPath: {
		Walkable:  true,
		WalkSpeed: 1.5,
		Color:     "#8B4513",
		Image:     "",
	},
}