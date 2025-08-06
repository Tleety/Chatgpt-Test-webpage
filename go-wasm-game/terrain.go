package main

import "math"

// generateTerrain creates a more realistic terrain pattern with grass and water on the base layer
func (m *Map) generateTerrain() {
	if len(m.Layers) == 0 {
		return
	}
	
	baseLayer := m.Layers[0] // Use the base layer
	
	// Initialize all tiles to grass
	for y := 0; y < m.Height; y++ {
		for x := 0; x < m.Width; x++ {
			baseLayer.Tiles[y][x] = TileGrass
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
					baseLayer.Tiles[y][x] = TileWater
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
}

// addRiver creates a winding river between two points on the base layer
func (m *Map) addRiver(startX, startY, endX, endY, width int) {
	if len(m.Layers) == 0 {
		return
	}
	
	baseLayer := m.Layers[0]
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
						baseLayer.Tiles[ry][rx] = TileWater
					}
				}
			}
		}
	}
}

// addCoastalAreas adds water along some edges to simulate coastlines on the base layer
func (m *Map) addCoastalAreas() {
	if len(m.Layers) == 0 {
		return
	}
	
	baseLayer := m.Layers[0]
	
	// Left edge - partial coastline
	for y := 60; y < 140; y++ {
		depth := int(6 + 4*math.Sin(float64(y)*0.1))
		for x := 0; x < depth; x++ {
			if x < m.Width {
				baseLayer.Tiles[y][x] = TileWater
			}
		}
	}
	
	// Bottom edge - small coastal area
	for x := 20; x < 80; x++ {
		depth := int(4 + 3*math.Sin(float64(x)*0.15))
		for y := m.Height - depth; y < m.Height; y++ {
			if y >= 0 {
				baseLayer.Tiles[y][x] = TileWater
			}
		}
	}
}

// addSmallPonds creates small scattered ponds across the map on the base layer
func (m *Map) addSmallPonds() {
	if len(m.Layers) == 0 {
		return
	}
	
	baseLayer := m.Layers[0]
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
							baseLayer.Tiles[y][x] = TileWater
						}
					}
				}
			}
		}
	}
}