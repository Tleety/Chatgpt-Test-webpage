package main

// IsPositionWalkable checks if the player can walk on the tiles at the given position
// This checks all four corners of the player rectangle against tile types
func IsPositionWalkable(x, y, width, height float64, gameMap *Map) bool {
	// Get the corners of the player rectangle at the new position
	corners := []struct{ px, py float64 }{
		{x, y},                           // Top-left
		{x + width, y},                   // Top-right
		{x, y + height},                  // Bottom-left
		{x + width, y + height},          // Bottom-right
	}
	
	// Check if any corner of the player would be on a water tile
	for _, corner := range corners {
		tileX, tileY := gameMap.WorldToGrid(corner.px, corner.py)
		if gameMap.GetTile(tileX, tileY) == TileWater {
			return false
		}
	}
	
	return true
}

// FindNearestWalkableTile finds the closest walkable tile to the target coordinates
// This is used when the player clicks on water - we find the nearest grass tile
func FindNearestWalkableTile(targetX, targetY int, gameMap *Map) (int, int) {
	// If the target tile is already walkable, return it
	if gameMap.GetTile(targetX, targetY) != TileWater {
		return targetX, targetY
	}
	
	// Use a spiral search pattern to find the nearest walkable tile
	maxSearchRadius := 20 // Limit search to avoid infinite loops
	
	for radius := 1; radius <= maxSearchRadius; radius++ {
		// Check all tiles at this radius using a diamond pattern
		for dx := -radius; dx <= radius; dx++ {
			for dy := -radius; dy <= radius; dy++ {
				// Only check tiles at the current radius (diamond shape)
				if abs(dx) + abs(dy) != radius {
					continue
				}
				
				checkX := targetX + dx
				checkY := targetY + dy
				
				// Check if this tile is within map bounds and walkable
				if checkX >= 0 && checkX < gameMap.Width && 
				   checkY >= 0 && checkY < gameMap.Height &&
				   gameMap.GetTile(checkX, checkY) != TileWater {
					return checkX, checkY
				}
			}
		}
	}
	
	// If no walkable tile found within search radius, return the center of the map
	return gameMap.Width / 2, gameMap.Height / 2
}

// abs returns the absolute value of an integer
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// CanPlayerMoveToTile checks if a player can move to a specific tile position
// This validates that the entire player rectangle would be on walkable terrain
func CanPlayerMoveToTile(tileX, tileY int, playerWidth, playerHeight float64, gameMap *Map) bool {
	// Convert tile coordinates to world coordinates (center of tile)
	worldX, worldY := gameMap.GridToWorld(tileX, tileY)
	
	// Calculate player position to center it in the tile
	playerX := worldX - playerWidth/2
	playerY := worldY - playerHeight/2
	
	return IsPositionWalkable(playerX, playerY, playerWidth, playerHeight, gameMap)
}