package main

import (
	"math"
	"syscall/js"
)

// TileType represents the type of terrain tile
type TileType int

const (
	TileGrass TileType = iota
	TileWater
)

// Map represents a grid-based map with tiles
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
	}
	
	// Generate the map with a simple pattern
	m.generateTerrain()
	
	return m
}

// generateTerrain creates a simple terrain pattern with grass and water
func (m *Map) generateTerrain() {
	// Create a simple pattern: mostly grass with some water areas
	for y := 0; y < m.Height; y++ {
		for x := 0; x < m.Width; x++ {
			// Default to grass
			m.Tiles[y][x] = TileGrass
			
			// Add some water areas using a simple pattern
			// Create water near edges and some interior lakes
			if x < 5 || x >= m.Width-5 || y < 5 || y >= m.Height-5 {
				// Border areas have higher chance of water
				if (x+y)%7 == 0 || (x*2+y)%9 == 0 {
					m.Tiles[y][x] = TileWater
				}
			} else {
				// Interior lakes - create some circular water areas
				centerX1, centerY1 := 50, 50
				centerX2, centerY2 := 150, 100
				centerX3, centerY3 := 100, 150
				
				dist1 := math.Sqrt(float64((x-centerX1)*(x-centerX1) + (y-centerY1)*(y-centerY1)))
				dist2 := math.Sqrt(float64((x-centerX2)*(x-centerX2) + (y-centerY2)*(y-centerY2)))
				dist3 := math.Sqrt(float64((x-centerX3)*(x-centerX3) + (y-centerY3)*(y-centerY3)))
				
				if dist1 < 15 || dist2 < 12 || dist3 < 10 {
					m.Tiles[y][x] = TileWater
				}
				
				// Add some random water patches
				if (x*3+y*5)%23 == 0 && (x*y)%17 == 3 {
					m.Tiles[y][x] = TileWater
				}
			}
		}
	}
}

// GetTile returns the tile type at the given grid coordinates
func (m *Map) GetTile(x, y int) TileType {
	if x < 0 || x >= m.Width || y < 0 || y >= m.Height {
		return TileWater // Out of bounds is water
	}
	return m.Tiles[y][x]
}

// SetTile sets the tile type at the given grid coordinates
func (m *Map) SetTile(x, y int, tileType TileType) {
	if x >= 0 && x < m.Width && y >= 0 && y < m.Height {
		m.Tiles[y][x] = tileType
	}
}

// Render draws the visible portion of the map
func (m *Map) Render(ctx js.Value, cameraX, cameraY, canvasWidth, canvasHeight float64) {
	// Calculate which tiles are visible
	startX := int(math.Max(0, math.Floor(cameraX/m.TileSize)))
	startY := int(math.Max(0, math.Floor(cameraY/m.TileSize)))
	endX := int(math.Min(float64(m.Width-1), math.Ceil((cameraX+canvasWidth)/m.TileSize)))
	endY := int(math.Min(float64(m.Height-1), math.Ceil((cameraY+canvasHeight)/m.TileSize)))
	
	// Draw only visible tiles for performance
	for y := startY; y <= endY; y++ {
		for x := startX; x <= endX; x++ {
			tileType := m.GetTile(x, y)
			
			// Calculate screen position
			screenX := float64(x)*m.TileSize - cameraX
			screenY := float64(y)*m.TileSize - cameraY
			
			// Set color based on tile type
			switch tileType {
			case TileGrass:
				ctx.Set("fillStyle", "#90EE90") // Light green
			case TileWater:
				ctx.Set("fillStyle", "#4169E1") // Royal blue
			}
			
			// Draw the tile
			ctx.Call("fillRect", screenX, screenY, m.TileSize, m.TileSize)
		}
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