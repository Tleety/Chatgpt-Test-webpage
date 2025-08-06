package main

import (
	"math"
	"sort"
	"syscall/js"
)

// Map represents a grid-based map with tiles
type Map struct {
	Width    int
	Height   int
	TileSize float64
	Tiles    [][]TileType
	LayerManager *LayerManager
}

// Layer represents a rendering layer with priority and visibility
type Layer struct {
	Name       string
	Priority   int  // Higher priority draws on top
	Visible    bool
	RenderFunc func(ctx js.Value, cameraX, cameraY, canvasWidth, canvasHeight float64)
}

// LayerManager manages multiple rendering layers
type LayerManager struct {
	Layers []Layer
}

// NewMap creates a new map with the specified dimensions
func NewMap(width, height int, tileSize float64) *Map {
	m := &Map{
		Width:    width,
		Height:   height,
		TileSize: tileSize,
		Tiles:    make([][]TileType, height),
		LayerManager: NewLayerManager(),
	}
	
	// Initialize the 2D slice
	for i := range m.Tiles {
		m.Tiles[i] = make([]TileType, width)
	}
	
	// Generate the map with a simple pattern
	m.generateTerrain()
	
	// Add dirt paths around the map
	m.addDirtPaths()
	
	// Initialize default layers
	m.initializeLayers()
	
	return m
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

// NewLayerManager creates a new layer manager
func NewLayerManager() *LayerManager {
	return &LayerManager{
		Layers: make([]Layer, 0),
	}
}

// AddLayer adds a new layer to the manager
func (lm *LayerManager) AddLayer(name string, priority int, visible bool, renderFunc func(ctx js.Value, cameraX, cameraY, canvasWidth, canvasHeight float64)) {
	layer := Layer{
		Name:       name,
		Priority:   priority,
		Visible:    visible,
		RenderFunc: renderFunc,
	}
	lm.Layers = append(lm.Layers, layer)
	lm.sortLayers()
}

// RemoveLayer removes a layer by name
func (lm *LayerManager) RemoveLayer(name string) bool {
	for i, layer := range lm.Layers {
		if layer.Name == name {
			lm.Layers = append(lm.Layers[:i], lm.Layers[i+1:]...)
			return true
		}
	}
	return false
}

// SetLayerVisibility sets the visibility of a layer by name
func (lm *LayerManager) SetLayerVisibility(name string, visible bool) bool {
	for i, layer := range lm.Layers {
		if layer.Name == name {
			lm.Layers[i].Visible = visible
			return true
		}
	}
	return false
}

// SetLayerPriority sets the priority of a layer by name
func (lm *LayerManager) SetLayerPriority(name string, priority int) bool {
	for i, layer := range lm.Layers {
		if layer.Name == name {
			lm.Layers[i].Priority = priority
			lm.sortLayers()
			return true
		}
	}
	return false
}

// GetLayer gets a layer by name
func (lm *LayerManager) GetLayer(name string) *Layer {
	for i, layer := range lm.Layers {
		if layer.Name == name {
			return &lm.Layers[i]
		}
	}
	return nil
}

// sortLayers sorts layers by priority (lower priority renders first)
func (lm *LayerManager) sortLayers() {
	sort.Slice(lm.Layers, func(i, j int) bool {
		return lm.Layers[i].Priority < lm.Layers[j].Priority
	})
}

// RenderAllLayers renders all visible layers in priority order
func (lm *LayerManager) RenderAllLayers(ctx js.Value, cameraX, cameraY, canvasWidth, canvasHeight float64) {
	for _, layer := range lm.Layers {
		if layer.Visible && layer.RenderFunc != nil {
			layer.RenderFunc(ctx, cameraX, cameraY, canvasWidth, canvasHeight)
		}
	}
}

// initializeLayers sets up the default layers for the map
func (m *Map) initializeLayers() {
	// Add tiles layer (priority 0 - background)
	m.LayerManager.AddLayer("tiles", 0, true, m.renderTilesLayer)
	
	// Objects layer will be added by main.go when trees and bushes are available
	// Player layer will be added by main.go when player is available
}

// renderTilesLayer renders only the tile layer
func (m *Map) renderTilesLayer(ctx js.Value, cameraX, cameraY, canvasWidth, canvasHeight float64) {
	// This is the same logic as the original Render method, but only for tiles
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

// RenderWithLayers renders the map using the layer system
func (m *Map) RenderWithLayers(ctx js.Value, cameraX, cameraY, canvasWidth, canvasHeight float64) {
	m.LayerManager.RenderAllLayers(ctx, cameraX, cameraY, canvasWidth, canvasHeight)
}