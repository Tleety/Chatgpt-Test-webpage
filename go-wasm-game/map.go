package main

import (
	"math"
	"sort"
	"syscall/js"
)

// Layer represents a single map layer with tiles
type Layer struct {
	Title     string
	DrawOrder int
	Visible   bool
	Tiles     [][]TileType
}

// Map represents a grid-based map with multiple layers
type Map struct {
	Width    int
	Height   int
	TileSize float64
	Layers   []*Layer
}

// NewLayer creates a new layer with the given properties
func NewLayer(title string, drawOrder int, visible bool, width, height int) *Layer {
	layer := &Layer{
		Title:     title,
		DrawOrder: drawOrder,
		Visible:   visible,
		Tiles:     make([][]TileType, height),
	}
	
	// Initialize the 2D slice
	for i := range layer.Tiles {
		layer.Tiles[i] = make([]TileType, width)
	}
	
	return layer
}

// NewMap creates a new map with the specified dimensions
func NewMap(width, height int, tileSize float64) *Map {
	m := &Map{
		Width:    width,
		Height:   height,
		TileSize: tileSize,
		Layers:   make([]*Layer, 0),
	}
	
	// Create the base terrain layer
	baseLayer := NewLayer("Base Terrain", 0, true, width, height)
	m.Layers = append(m.Layers, baseLayer)
	
	// Generate the map with a simple pattern on the base layer
	m.generateTerrain()
	
	// Add dirt paths around the map on the base layer
	m.addDirtPaths()
	
	return m
}

// GetTile returns the tile type at the given grid coordinates from the top visible layer
func (m *Map) GetTile(x, y int) TileType {
	if x < 0 || x >= m.Width || y < 0 || y >= m.Height {
		return TileWater // Out of bounds is water
	}
	
	// Get visible layers sorted by draw order (top layer first for GetTile)
	visibleLayers := m.GetVisibleLayersSorted()
	
	// Return the tile from the topmost visible layer (reverse order)
	for i := len(visibleLayers) - 1; i >= 0; i-- {
		if visibleLayers[i].Tiles[y][x] != TileGrass { // Assume grass is the default "transparent" tile
			return visibleLayers[i].Tiles[y][x]
		}
	}
	
	// If all layers are transparent at this position, return grass
	return TileGrass
}

// GetTileFromLayer returns the tile type at the given grid coordinates from a specific layer
func (m *Map) GetTileFromLayer(layerIndex, x, y int) TileType {
	if layerIndex < 0 || layerIndex >= len(m.Layers) {
		return TileWater // Invalid layer
	}
	if x < 0 || x >= m.Width || y < 0 || y >= m.Height {
		return TileWater // Out of bounds is water
	}
	return m.Layers[layerIndex].Tiles[y][x]
}

// SetTile sets the tile type at the given grid coordinates on the base layer (index 0)
func (m *Map) SetTile(x, y int, tileType TileType) {
	if len(m.Layers) > 0 {
		m.SetTileOnLayer(0, x, y, tileType)
	}
}

// SetTileOnLayer sets the tile type at the given grid coordinates on a specific layer
func (m *Map) SetTileOnLayer(layerIndex, x, y int, tileType TileType) {
	if layerIndex >= 0 && layerIndex < len(m.Layers) && 
	   x >= 0 && x < m.Width && y >= 0 && y < m.Height {
		m.Layers[layerIndex].Tiles[y][x] = tileType
	}
}

// AddLayer adds a new layer to the map
func (m *Map) AddLayer(title string, drawOrder int, visible bool) int {
	layer := NewLayer(title, drawOrder, visible, m.Width, m.Height)
	m.Layers = append(m.Layers, layer)
	return len(m.Layers) - 1 // Return the layer index
}

// RemoveLayer removes a layer by index
func (m *Map) RemoveLayer(layerIndex int) bool {
	if layerIndex < 0 || layerIndex >= len(m.Layers) || len(m.Layers) <= 1 {
		return false // Can't remove the last layer or invalid index
	}
	
	// Remove the layer
	m.Layers = append(m.Layers[:layerIndex], m.Layers[layerIndex+1:]...)
	return true
}

// SetLayerVisibility sets the visibility of a layer
func (m *Map) SetLayerVisibility(layerIndex int, visible bool) bool {
	if layerIndex >= 0 && layerIndex < len(m.Layers) {
		m.Layers[layerIndex].Visible = visible
		return true
	}
	return false
}

// SetLayerDrawOrder sets the draw order of a layer
func (m *Map) SetLayerDrawOrder(layerIndex int, drawOrder int) bool {
	if layerIndex >= 0 && layerIndex < len(m.Layers) {
		m.Layers[layerIndex].DrawOrder = drawOrder
		return true
	}
	return false
}

// GetVisibleLayersSorted returns visible layers sorted by draw order (bottom to top)
func (m *Map) GetVisibleLayersSorted() []*Layer {
	var visibleLayers []*Layer
	
	for _, layer := range m.Layers {
		if layer.Visible {
			visibleLayers = append(visibleLayers, layer)
		}
	}
	
	// Sort by draw order (ascending - lower numbers drawn first)
	sort.Slice(visibleLayers, func(i, j int) bool {
		return visibleLayers[i].DrawOrder < visibleLayers[j].DrawOrder
	})
	
	return visibleLayers
}

// Render draws the visible portion of the map layers in correct order
func (m *Map) Render(ctx js.Value, cameraX, cameraY, canvasWidth, canvasHeight float64) {
	// Calculate which tiles are visible
	startX := int(math.Max(0, math.Floor(cameraX/m.TileSize)))
	startY := int(math.Max(0, math.Floor(cameraY/m.TileSize)))
	endX := int(math.Min(float64(m.Width-1), math.Ceil((cameraX+canvasWidth)/m.TileSize)))
	endY := int(math.Min(float64(m.Height-1), math.Ceil((cameraY+canvasHeight)/m.TileSize)))
	
	// Get visible layers in draw order
	visibleLayers := m.GetVisibleLayersSorted()
	
	// Draw each visible layer in order
	for _, layer := range visibleLayers {
		// Draw only visible tiles for performance
		for y := startY; y <= endY; y++ {
			for x := startX; x <= endX; x++ {
				tileType := layer.Tiles[y][x]
				
				// Skip drawing grass tiles on non-base layers (treat as transparent)
				if layer.DrawOrder > 0 && tileType == TileGrass {
					continue
				}
				
				// Calculate screen position
				screenX := float64(x)*m.TileSize - cameraX
				screenY := float64(y)*m.TileSize - cameraY
				
				// Get tile definition and set color
				tileDef, exists := TileDefinitions[tileType]
				if !exists {
					// Fallback to grass if tile type not found
					tileDef = TileDefinitions[TileGrass]
				}
				
				// For now, we'll use color (image support can be added later)
				ctx.Set("fillStyle", tileDef.Color)
				
				// Draw the tile
				ctx.Call("fillRect", screenX, screenY, m.TileSize, m.TileSize)
			}
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