package world

import (
	"math"
)

// addDirtPaths creates snaking dirt paths across the landscape
func (m *Map) addDirtPaths() {
	// Create just a few main paths that are continuous and well-defined
	// Focus on fewer, more pronounced paths instead of many scattered ones
	
	// Main horizontal path across the map
	m.addSnakingPath(10, m.Height/2, m.Width-10, m.Height/2, 120)
	
	// Main vertical path connecting top to bottom
	m.addSnakingPath(m.Width/2, 10, m.Width/2, m.Height-10, 100)
	
	// One diagonal path for variety
	m.addSnakingPath(20, 20, m.Width-20, m.Height-20, 110)
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
	totalDistance := math.Sqrt(float64((endX-startX)*(endX-startX) + (endY-startY)*(endY-startY)))
	if totalDistance == 0 {
		return
	}
	
	// Use smaller, more consistent steps to ensure continuity
	stepSize := 1.0 // Guarantee no gaps in the path
	steps := int(totalDistance / stepSize)
	
	for step := 0; step <= steps; step++ {
		// Calculate progress along the path (0 to 1)
		t := float64(step) / float64(steps)
		
		// Base linear interpolation between start and end
		baseX := float64(startX)*(1-t) + float64(endX)*t
		baseY := float64(startY)*(1-t) + float64(endY)*t
		
		// Add gentle snaking using sine waves for smooth curves
		// Use multiple sine waves with different frequencies for natural curves
		snakeAmplitude := 8.0 // Moderate snaking - not too wild
		
		// Primary curve
		primaryCurve := math.Sin(t * math.Pi * 3) * snakeAmplitude
		
		// Secondary subtle curve for more natural appearance
		secondaryCurve := math.Sin(t * math.Pi * 7) * (snakeAmplitude * 0.3)
		
		// Calculate perpendicular direction for snaking
		dirX := float64(endX - startX) / totalDistance
		dirY := float64(endY - startY) / totalDistance
		perpX := -dirY // Perpendicular to main direction
		perpY := dirX
		
		// Apply snaking offset perpendicular to the main direction
		finalX := baseX + perpX*(primaryCurve + secondaryCurve)
		finalY := baseY + perpY*(primaryCurve + secondaryCurve)
		
		// Round to get tile coordinates
		tileX := int(math.Round(finalX))
		tileY := int(math.Round(finalY))
		
		// Place the path tile
		if tileX >= 0 && tileX < m.Width && tileY >= 0 && tileY < m.Height {
			// Only place dirt path on grass (don't overwrite water)
			if m.Tiles[tileY][tileX] == TileGrass {
				m.Tiles[tileY][tileX] = TileDirtPath
			}
		}
		
		// Also place tiles at adjacent positions to ensure continuity
		// This helps prevent gaps when the path curves
		for dx := -1; dx <= 1; dx++ {
			for dy := -1; dy <= 1; dy++ {
				if dx == 0 && dy == 0 {
					continue // Already placed above
				}
				
				adjX := tileX + dx
				adjY := tileY + dy
				
				if adjX >= 0 && adjX < m.Width && adjY >= 0 && adjY < m.Height {
					// Only fill small gaps to maintain path continuity
					if m.Tiles[adjY][adjX] == TileGrass {
						// Check if this helps connect the path
						distToLine := math.Abs(float64(dx)) + math.Abs(float64(dy))
						if distToLine <= 1.0 { // Only immediate neighbors
							m.Tiles[adjY][adjX] = TileDirtPath
						}
					}
				}
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