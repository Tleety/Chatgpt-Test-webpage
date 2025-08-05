package main

import (
	"syscall/js"
)

var (
	ctx          js.Value
	canvas       js.Value
	x            float64
	y            float64
	canvasWidth  float64
	canvasHeight float64
)

var drawFunc js.Func

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
	ctx.Set("fillStyle", "green")
	ctx.Call("fillRect", x, y, 20, 20)
	js.Global().Call("requestAnimationFrame", drawFunc)
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

	js.Global().Call("addEventListener", "keydown", js.FuncOf(keydown))

	drawFunc = js.FuncOf(draw)
	js.Global().Call("requestAnimationFrame", drawFunc)

	select {}
}
