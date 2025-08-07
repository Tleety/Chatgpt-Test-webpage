//go:build !js
// +build !js

package world

import (
	"math"
)

// Map represents a grid-based map with tiles (test version without WebAssembly)
type Map struct {
	Width    int
	Height   int
	TileSize float64
	Tiles    [][]TileType
}

// NewMap creates a new map with the specified dimensions
func NewMap(width, height int, tileSize float64) *Map {
	m := &Map{
		Width:    width,
		Height:   height,
		TileSize: tileSize,
		Tiles:    make([][]TileType, height),
	}
	
	// Initialize the 2D slice
	for i := range m.Tiles {
		m.Tiles[i] = make([]TileType, width)
		// Fill with grass by default
		for j := range m.Tiles[i] {
			m.Tiles[i][j] = TileGrass
		}
	}
	
	return m
}

// GetTile returns the tile type at the specified grid coordinates
func (m *Map) GetTile(x, y int) TileType {
	if x < 0 || x >= m.Width || y < 0 || y >= m.Height {
		return TileWater // Out of bounds is water
	}
	return m.Tiles[y][x]
}

// SetTile sets the tile type at the specified grid coordinates (for testing)
func (m *Map) SetTile(x, y int, tileType TileType) {
	if x >= 0 && x < m.Width && y >= 0 && y < m.Height {
		m.Tiles[y][x] = tileType
	}
}

// WorldToGrid converts world coordinates to grid coordinates
func (m *Map) WorldToGrid(worldX, worldY float64) (int, int) {
	gridX := int(math.Floor(worldX / m.TileSize))
	gridY := int(math.Floor(worldY / m.TileSize))
	return gridX, gridY
}

// GridToWorld converts grid coordinates to world coordinates (center of tile)
func (m *Map) GridToWorld(gridX, gridY int) (float64, float64) {
	worldX := float64(gridX)*m.TileSize + m.TileSize/2
	worldY := float64(gridY)*m.TileSize + m.TileSize/2
	return worldX, worldY
}