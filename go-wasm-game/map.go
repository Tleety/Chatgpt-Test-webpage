package main

import (
	"math"
	"syscall/js"
)

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

// Tile definitions with their properties
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

// generateTerrain creates a more realistic terrain pattern with grass and water
func (m *Map) generateTerrain() {
	// Initialize all tiles to grass
	for y := 0; y < m.Height; y++ {
		for x := 0; x < m.Width; x++ {
			m.Tiles[y][x] = TileGrass
		}
	}
	
	// Generate multiple realistic lakes with varied sizes
	lakes := []struct {
		centerX, centerY int
		radiusX, radiusY float64
		irregularity     float64
	}{
		{40, 30, 18, 12, 0.3},    // Top-left lake (oval)
		{160, 45, 22, 20, 0.4},   // Top-right lake (round)
		{80, 120, 15, 25, 0.5},   // Central lake (vertical oval)
		{140, 160, 20, 15, 0.3},  // Bottom-right lake
		{25, 170, 12, 18, 0.4},   // Bottom-left small lake
	}
	
	// Create lakes with irregular, natural-looking shores
	for _, lake := range lakes {
		for y := 0; y < m.Height; y++ {
			for x := 0; x < m.Width; x++ {
				// Calculate normalized distance from lake center
				dx := float64(x - lake.centerX)
				dy := float64(y - lake.centerY)
				
				// Create irregular shore using simple noise
				angle := math.Atan2(dy, dx)
				noise := math.Sin(angle*6) * lake.irregularity
				noise += math.Sin(angle*4 + 2.5) * lake.irregularity * 0.5
				
				// Calculate elliptical distance with noise
				distX := dx / (lake.radiusX + noise)
				distY := dy / (lake.radiusY + noise*0.7)
				distance := math.Sqrt(distX*distX + distY*distY)
				
				if distance < 1.0 {
					m.Tiles[y][x] = TileWater
				}
			}
		}
	}
	
	// Add connecting rivers between some lakes
	m.addRiver(40, 30, 80, 120, 3)   // Connect top-left to central lake
	m.addRiver(80, 120, 140, 160, 2) // Connect central to bottom-right lake
	m.addRiver(160, 45, 140, 160, 2) // Connect top-right to bottom-right lake
	
	// Add some border water areas (coastal regions)
	m.addCoastalAreas()
	
	// Add small scattered ponds
	m.addSmallPonds()
	
	// Add dirt paths around the map
	m.addDirtPaths()
}

// addRiver creates a winding river between two points
func (m *Map) addRiver(startX, startY, endX, endY, width int) {
	steps := int(math.Sqrt(float64((endX-startX)*(endX-startX) + (endY-startY)*(endY-startY))))
	if steps == 0 {
		return
	}
	
	for step := 0; step <= steps; step++ {
		// Linear interpolation with some randomness for natural curves
		t := float64(step) / float64(steps)
		
		// Add curve using sine wave
		curve := math.Sin(t * math.Pi * 2) * 8
		
		x := int(float64(startX)*(1-t) + float64(endX)*t + curve)
		y := int(float64(startY)*(1-t) + float64(endY)*t)
		
		// Draw river with specified width
		for dx := -width; dx <= width; dx++ {
			for dy := -width; dy <= width; dy++ {
				if dx*dx + dy*dy <= width*width {
					rx, ry := x+dx, y+dy
					if rx >= 0 && rx < m.Width && ry >= 0 && ry < m.Height {
						m.Tiles[ry][rx] = TileWater
					}
				}
			}
		}
	}
}

// addCoastalAreas adds water along some edges to simulate coastlines
func (m *Map) addCoastalAreas() {
	// Left edge - partial coastline
	for y := 60; y < 140; y++ {
		depth := int(6 + 4*math.Sin(float64(y)*0.1))
		for x := 0; x < depth; x++ {
			if x < m.Width {
				m.Tiles[y][x] = TileWater
			}
		}
	}
	
	// Bottom edge - small coastal area
	for x := 20; x < 80; x++ {
		depth := int(4 + 3*math.Sin(float64(x)*0.15))
		for y := m.Height - depth; y < m.Height; y++ {
			if y >= 0 {
				m.Tiles[y][x] = TileWater
			}
		}
	}
}

// addSmallPonds creates small scattered ponds across the map
func (m *Map) addSmallPonds() {
	ponds := []struct{ x, y, radius int }{
		{120, 80, 4},   // Small pond
		{180, 120, 3},  // Tiny pond
		{50, 90, 5},    // Medium pond
		{170, 30, 3},   // Small pond
		{30, 140, 4},   // Small pond
		{110, 40, 3},   // Tiny pond
		{190, 180, 4},  // Corner pond
	}
	
	for _, pond := range ponds {
		for dy := -pond.radius; dy <= pond.radius; dy++ {
			for dx := -pond.radius; dx <= pond.radius; dx++ {
				if dx*dx + dy*dy <= pond.radius*pond.radius {
					x, y := pond.x+dx, pond.y+dy
					if x >= 0 && x < m.Width && y >= 0 && y < m.Height {
						// Add some irregularity to pond edges
						if dx*dx + dy*dy <= (pond.radius-1)*(pond.radius-1) || 
						   (x+y)%3 == 0 {
							m.Tiles[y][x] = TileWater
						}
					}
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

// addDirtPaths creates snaking dirt paths across the landscape
func (m *Map) addDirtPaths() {
	// Create several snaking paths that wind naturally across the map
	// All paths are exactly 1 tile wide (width = 0)
	
	// Generate multiple snaking paths from different starting points
	pathStarts := []struct{ x, y int }{
		{5, m.Height / 4},        // Left edge, upper
		{5, 3 * m.Height / 4},    // Left edge, lower
		{m.Width / 4, 5},         // Top edge, left
		{3 * m.Width / 4, 5},     // Top edge, right
		{m.Width - 5, m.Height / 3},     // Right edge, upper
		{m.Width - 5, 2 * m.Height / 3}, // Right edge, lower
		{m.Width / 3, m.Height - 5},     // Bottom edge, left
		{2 * m.Width / 3, m.Height - 5}, // Bottom edge, right
	}
	
	// Create snaking paths from each starting point
	for i, start := range pathStarts {
		// Each path winds toward the center area with variations
		centerX := m.Width/2 + (i-4)*10  // Offset center slightly for each path
		centerY := m.Height/2 + (i-4)*8
		
		m.addSnakingPath(start.x, start.y, centerX, centerY, 80+i*10)
	}
	
	// Add some connecting snaking paths between lakes
	m.addSnakingPath(40, 30, 160, 45, 60)    // Between top lakes
	m.addSnakingPath(80, 120, 140, 160, 50)  // Between central and bottom-right lakes
	m.addSnakingPath(25, 170, 80, 120, 70)   // Between bottom-left and central
	
	// Add a few more random snaking paths for variety
	m.addSnakingPath(m.Width/6, m.Height/6, 5*m.Width/6, 5*m.Height/6, 90)
	m.addSnakingPath(5*m.Width/6, m.Height/6, m.Width/6, 5*m.Height/6, 85)
}

// addPath creates a straight path between two points, avoiding water when possible
func (m *Map) addPath(startX, startY, endX, endY, width int, avoidWater bool) {
	steps := int(math.Sqrt(float64((endX-startX)*(endX-startX) + (endY-startY)*(endY-startY))))
	if steps == 0 {
		return
	}
	
	for step := 0; step <= steps; step++ {
		// Linear interpolation
		t := float64(step) / float64(steps)
		x := int(float64(startX)*(1-t) + float64(endX)*t)
		y := int(float64(startY)*(1-t) + float64(endY)*t)
		
		// Draw path with specified width
		for dx := -width; dx <= width; dx++ {
			for dy := -width; dy <= width; dy++ {
				if dx*dx + dy*dy <= width*width {
					px, py := x+dx, y+dy
					if px >= 0 && px < m.Width && py >= 0 && py < m.Height {
						// Only place dirt path on grass (don't overwrite water)
						if m.Tiles[py][px] == TileGrass {
							m.Tiles[py][px] = TileDirtPath
						}
					}
				}
			}
		}
	}
}

// addSnakingPath creates a winding, snake-like path between two points
func (m *Map) addSnakingPath(startX, startY, endX, endY, windiness int) {
	steps := int(math.Sqrt(float64((endX-startX)*(endX-startX) + (endY-startY)*(endY-startY))))
	if steps == 0 {
		return
	}
	
	// Current position starts at the beginning
	currentX := float64(startX)
	currentY := float64(startY)
	
	// Random walk parameters
	baseStepSize := 2.0
	randomness := 0.6
	
	for step := 0; step < windiness; step++ {
		// Calculate how far we still need to go
		remainingDx := float64(endX) - currentX
		remainingDy := float64(endY) - currentY
		remainingDistance := math.Sqrt(remainingDx*remainingDx + remainingDy*remainingDy)
		
		if remainingDistance < baseStepSize {
			break
		}
		
		// Base direction toward target (normalized)
		dirX := remainingDx / remainingDistance
		dirY := remainingDy / remainingDistance
		
		// Add random perpendicular offset for snaking effect
		perpX := -dirY // Perpendicular to direction
		perpY := dirX
		
		// Random offset strength (varies throughout the path)
		noiseStrength := 15.0 * math.Sin(float64(step)*0.3) * randomness
		randomOffset := (float64(step%7) - 3.0) / 3.0 // Pseudo-random between -1 and 1
		
		// Calculate next position with snaking
		nextX := currentX + dirX*baseStepSize + perpX*noiseStrength*randomOffset
		nextY := currentY + dirY*baseStepSize + perpY*noiseStrength*randomOffset
		
		// Add some curves by changing direction slightly
		curve := math.Sin(float64(step)*0.15) * 8.0
		nextX += curve * perpX
		nextY += curve * perpY
		
		// Place the path tile (1 tile wide)
		tileX := int(math.Round(nextX))
		tileY := int(math.Round(nextY))
		
		if tileX >= 0 && tileX < m.Width && tileY >= 0 && tileY < m.Height {
			// Only place dirt path on grass (don't overwrite water)
			if m.Tiles[tileY][tileX] == TileGrass {
				m.Tiles[tileY][tileX] = TileDirtPath
			}
		}
		
		// Update current position
		currentX = nextX
		currentY = nextY
		
		// Occasionally add small branches for more organic look
		if step%20 == 0 && step > 10 {
			branchLength := 5 + step%8
			branchAngle := float64(step%6) - 3.0 // Random branch direction
			
			branchEndX := currentX + math.Cos(branchAngle)*float64(branchLength)
			branchEndY := currentY + math.Sin(branchAngle)*float64(branchLength)
			
			// Create a short branch
			for i := 0; i < branchLength; i++ {
				t := float64(i) / float64(branchLength)
				bx := int(math.Round(currentX*(1-t) + branchEndX*t))
				by := int(math.Round(currentY*(1-t) + branchEndY*t))
				
				if bx >= 0 && bx < m.Width && by >= 0 && by < m.Height {
					if m.Tiles[by][bx] == TileGrass {
						m.Tiles[by][bx] = TileDirtPath
					}
				}
			}
		}
	}
	
	// Connect final segment to the target
	finalSteps := int(math.Sqrt((float64(endX)-currentX)*(float64(endX)-currentX) + (float64(endY)-currentY)*(float64(endY)-currentY)))
	for step := 0; step <= finalSteps; step++ {
		if finalSteps == 0 {
			break
		}
		t := float64(step) / float64(finalSteps)
		x := int(math.Round(currentX*(1-t) + float64(endX)*t))
		y := int(math.Round(currentY*(1-t) + float64(endY)*t))
		
		if x >= 0 && x < m.Width && y >= 0 && y < m.Height {
			if m.Tiles[y][x] == TileGrass {
				m.Tiles[y][x] = TileDirtPath
			}
		}
	}
}

// addCurvedPath creates a curved path with some randomness for natural appearance
func (m *Map) addCurvedPath(startX, startY, endX, endY, width int) {
	steps := int(math.Sqrt(float64((endX-startX)*(endX-startX) + (endY-startY)*(endY-startY))))
	if steps == 0 {
		return
	}
	
	for step := 0; step <= steps; step++ {
		// Linear interpolation with sine curve for natural look
		t := float64(step) / float64(steps)
		
		// Add slight curve
		curve := math.Sin(t*math.Pi*3) * 5
		
		x := int(float64(startX)*(1-t) + float64(endX)*t + curve)
		y := int(float64(startY)*(1-t) + float64(endY)*t)
		
		// Draw curved path
		for dx := -width; dx <= width; dx++ {
			for dy := -width; dy <= width; dy++ {
				if dx*dx + dy*dy <= width*width {
					px, py := x+dx, y+dy
					if px >= 0 && px < m.Width && py >= 0 && py < m.Height {
						// Only place dirt path on grass (don't overwrite water)
						if m.Tiles[py][px] == TileGrass {
							m.Tiles[py][px] = TileDirtPath
						}
					}
				}
			}
		}
	}
}