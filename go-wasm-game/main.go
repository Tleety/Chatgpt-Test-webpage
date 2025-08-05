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
	
	// Add some trees
	trees = append(trees, Tree{x: 100, y: 150, trunkWidth: 15, trunkHeight: 40, canopyRadius: 25})
	trees = append(trees, Tree{x: 300, y: 200, trunkWidth: 12, trunkHeight: 35, canopyRadius: 22})
	trees = append(trees, Tree{x: 500, y: 180, trunkWidth: 18, trunkHeight: 45, canopyRadius: 28})
	trees = append(trees, Tree{x: 750, y: 160, trunkWidth: 14, trunkHeight: 38, canopyRadius: 24})
	trees = append(trees, Tree{x: 200, y: 400, trunkWidth: 16, trunkHeight: 42, canopyRadius: 26})
	trees = append(trees, Tree{x: 600, y: 380, trunkWidth: 13, trunkHeight: 36, canopyRadius: 23})
	
	// Add some bushes
	bushes = append(bushes, Bush{x: 150, y: 250, radius: 18})
	bushes = append(bushes, Bush{x: 250, y: 300, radius: 15})
	bushes = append(bushes, Bush{x: 400, y: 120, radius: 20})
	bushes = append(bushes, Bush{x: 550, y: 280, radius: 16})
	bushes = append(bushes, Bush{x: 700, y: 320, radius: 17})
	bushes = append(bushes, Bush{x: 80, y: 350, radius: 19})
	bushes = append(bushes, Bush{x: 450, y: 350, radius: 14})
	bushes = append(bushes, Bush{x: 650, y: 450, radius: 18})
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
