package main

import (
	"math"
	"syscall/js"
)

// Tree represents a tree with trunk and canopy
type Tree struct {
	x, y          float64
	trunkWidth    float64
	trunkHeight   float64
	canopyRadius  float64
}

// Bush represents a bush 
type Bush struct {
	x, y   float64
	radius float64
}

// Environment manages and renders all environmental objects
type Environment struct {
	trees  []Tree
	bushes []Bush
}

// renderTree renders a tree at screen coordinates
func renderTree(ctx js.Value, tree Tree) {
	// Draw trunk
	ctx.Set("fillStyle", "#8B4513")
	ctx.Call("fillRect", tree.x-tree.trunkWidth/2, tree.y-tree.trunkHeight, tree.trunkWidth, tree.trunkHeight)
	
	// Draw canopy
	ctx.Set("fillStyle", "#228B22")
	ctx.Call("beginPath")
	ctx.Call("arc", tree.x, tree.y-tree.trunkHeight+10, tree.canopyRadius, 0, 2*math.Pi)
	ctx.Call("fill")
}

// renderBush renders a bush at screen coordinates
func renderBush(ctx js.Value, bush Bush) {
	ctx.Set("fillStyle", "#32CD32")
	ctx.Call("beginPath")
	ctx.Call("arc", bush.x, bush.y, bush.radius, 0, 2*math.Pi)
	ctx.Call("fill")
}

// NewEnvironment creates a new environment with trees and bushes
func NewEnvironment(gameMap *Map) *Environment {
	var trees []Tree
	var bushes []Bush
	
	// Use the map world dimensions for environment placement
	worldWidth := float64(gameMap.Width) * gameMap.TileSize
	worldHeight := float64(gameMap.Height) * gameMap.TileSize
	
	// Generate trees across the world area
	treePositions := []struct{ x, y float64 }{
		{worldWidth * 0.1, worldHeight * 0.15},   // Top-left area
		{worldWidth * 0.3, worldHeight * 0.2},    // Top area
		{worldWidth * 0.5, worldHeight * 0.18},   // Top-center
		{worldWidth * 0.75, worldHeight * 0.16},  // Top-right
		{worldWidth * 0.2, worldHeight * 0.4},    // Middle-left
		{worldWidth * 0.6, worldHeight * 0.38},   // Middle-right
		{worldWidth * 0.85, worldHeight * 0.25},  // Right area
		{worldWidth * 0.15, worldHeight * 0.65},  // Lower-left
		{worldWidth * 0.45, worldHeight * 0.7},   // Lower-center
		{worldWidth * 0.8, worldHeight * 0.6},    // Lower-right
		{worldWidth * 0.9, worldHeight * 0.8},    // Far bottom-right
		{worldWidth * 0.05, worldHeight * 0.9},   // Far bottom-left
	}
	
	// Create trees with varied properties
	for i, pos := range treePositions {
		trunkWidth := 12.0 + float64(i%4) * 2  // 12, 14, 16, 18
		trunkHeight := 35.0 + float64(i%3) * 5 // 35, 40, 45
		canopyRadius := 22.0 + float64(i%4) * 2 // 22, 24, 26, 28
		
		trees = append(trees, Tree{
			x: pos.x, 
			y: pos.y, 
			trunkWidth: trunkWidth, 
			trunkHeight: trunkHeight, 
			canopyRadius: canopyRadius,
		})
	}
	
	// Generate bushes across the world area
	bushPositions := []struct{ x, y float64 }{
		{worldWidth * 0.15, worldHeight * 0.25},  // Upper area
		{worldWidth * 0.25, worldHeight * 0.3},   
		{worldWidth * 0.4, worldHeight * 0.12},   
		{worldWidth * 0.55, worldHeight * 0.28},  
		{worldWidth * 0.7, worldHeight * 0.32},   
		{worldWidth * 0.08, worldHeight * 0.35},  
		{worldWidth * 0.45, worldHeight * 0.45},  
		{worldWidth * 0.65, worldHeight * 0.55},  
		{worldWidth * 0.35, worldHeight * 0.75},  // Lower area
		{worldWidth * 0.75, worldHeight * 0.85},  
		{worldWidth * 0.1, worldHeight * 0.8},    
		{worldWidth * 0.9, worldHeight * 0.4},    // Far right
		{worldWidth * 0.95, worldHeight * 0.95},  // Far corner
		{worldWidth * 0.02, worldHeight * 0.05},  // Far top-left
	}
	
	// Create bushes with varied sizes
	for i, pos := range bushPositions {
		radius := 14.0 + float64(i%5) * 1.5 // 14, 15.5, 17, 18.5, 20
		
		bushes = append(bushes, Bush{
			x: pos.x, 
			y: pos.y, 
			radius: radius,
		})
	}

	return &Environment{
		trees:  trees,
		bushes: bushes,
	}
}

// Render draws all trees and bushes relative to camera
func (e *Environment) Render(ctx js.Value, cameraX, cameraY, canvasWidth, canvasHeight float64) {
	// Draw environment objects (trees and bushes) relative to camera
	for _, tree := range e.trees {
		screenX := tree.x - cameraX
		screenY := tree.y - cameraY
		
		// Only draw if on screen
		if screenX > -50 && screenX < canvasWidth+50 && screenY > -50 && screenY < canvasHeight+50 {
			renderTree(ctx, Tree{x: screenX, y: screenY, trunkWidth: tree.trunkWidth, trunkHeight: tree.trunkHeight, canopyRadius: tree.canopyRadius})
		}
	}
	for _, bush := range e.bushes {
		screenX := bush.x - cameraX
		screenY := bush.y - cameraY
		
		// Only draw if on screen
		if screenX > -30 && screenX < canvasWidth+30 && screenY > -30 && screenY < canvasHeight+30 {
			renderBush(ctx, Bush{x: screenX, y: screenY, radius: bush.radius})
		}
	}
}

