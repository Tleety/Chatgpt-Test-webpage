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

var (
	ctx          js.Value
	canvas       js.Value
	x            float64
	y            float64
	canvasWidth  float64
	canvasHeight float64
	trees        []Tree
	bushes       []Bush
)

var drawFunc js.Func
var recenterFunc js.Func

// drawTree renders a tree with brown trunk and green canopy
func drawTree(tree Tree) {
	// Draw trunk
	ctx.Set("fillStyle", "#8B4513")
	ctx.Call("fillRect", tree.x-tree.trunkWidth/2, tree.y-tree.trunkHeight, tree.trunkWidth, tree.trunkHeight)
	
	// Draw canopy
	ctx.Set("fillStyle", "#228B22")
	ctx.Call("beginPath")
	ctx.Call("arc", tree.x, tree.y-tree.trunkHeight+10, tree.canopyRadius, 0, 2*math.Pi)
	ctx.Call("fill")
}

// drawBush renders a bush as a green circle
func drawBush(bush Bush) {
	ctx.Set("fillStyle", "#32CD32")
	ctx.Call("beginPath")
	ctx.Call("arc", bush.x, bush.y, bush.radius, 0, 2*math.Pi)
	ctx.Call("fill")
}

// initializeEnvironment creates trees and bushes on the canvas
func initializeEnvironment() {
	// Clear existing environment
	trees = []Tree{}
	bushes = []Bush{}
	
	// Define world area - make it larger than canvas for future world map expansion
	worldWidth := math.Max(canvasWidth * 2, 1600)  // At least 1600px wide, or 2x canvas width
	worldHeight := math.Max(canvasHeight * 2, 1200) // At least 1200px tall, or 2x canvas height
	
	// Generate trees across the larger world area
	// Use a simple pseudo-random approach for consistent placement
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
	
	// Generate bushes across the larger world area
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
}

func draw(this js.Value, args []js.Value) interface{} {
	// Get current canvas dimensions
	canvasWidth = canvas.Get("width").Float()
	canvasHeight = canvas.Get("height").Float()
	
	// Keep square within bounds
	if x < 0 {
		x = 0
	}
	if y < 0 {
		y = 0
	}
	if x > canvasWidth-20 {
		x = canvasWidth - 20
	}
	if y > canvasHeight-20 {
		y = canvasHeight - 20
	}
	
	// Clear and draw
	ctx.Call("clearRect", 0, 0, canvasWidth, canvasHeight)
	
	// Draw environment first (trees and bushes)
	for _, tree := range trees {
		drawTree(tree)
	}
	for _, bush := range bushes {
		drawBush(bush)
	}
	
	// Draw player on top
	ctx.Set("fillStyle", "green")
	ctx.Call("fillRect", x, y, 20, 20)
	js.Global().Call("requestAnimationFrame", drawFunc)
	return nil
}

func recenterSquare(this js.Value, args []js.Value) interface{} {
	// Update canvas dimensions
	canvasWidth = canvas.Get("width").Float()
	canvasHeight = canvas.Get("height").Float()
	
	// Center the player box on the canvas
	x = (canvasWidth - 20) / 2
	y = (canvasHeight - 20) / 2
	
	// Reinitialize environment for new canvas size
	initializeEnvironment()
	return nil
}

func keydown(this js.Value, args []js.Value) interface{} {
	key := args[0].Get("key").String()
	switch key {
	case "ArrowUp", "w", "W":
		y -= 5
	case "ArrowDown", "s", "S":
		y += 5
	case "ArrowLeft", "a", "A":
		x -= 5
	case "ArrowRight", "d", "D":
		x += 5
	}
	return nil
}

func main() {
	doc := js.Global().Get("document")
	canvas = doc.Call("getElementById", "game")
	ctx = canvas.Call("getContext", "2d")

	// Get initial canvas dimensions
	canvasWidth = canvas.Get("width").Float()
	canvasHeight = canvas.Get("height").Float()

	// Center the player box on the canvas
	// Box size is 20x20, so position it at center minus half the box size
	x = (canvasWidth - 20) / 2
	y = (canvasHeight - 20) / 2

	// Initialize environment
	initializeEnvironment()

	js.Global().Call("addEventListener", "keydown", js.FuncOf(keydown))

	// Expose recenter function to JavaScript
	recenterFunc = js.FuncOf(recenterSquare)
	js.Global().Set("recenterSquare", recenterFunc)
	
	// Set flag to indicate WASM is loaded
	js.Global().Set("wasmLoaded", true)

	drawFunc = js.FuncOf(draw)
	js.Global().Call("requestAnimationFrame", drawFunc)

	select {}
}
