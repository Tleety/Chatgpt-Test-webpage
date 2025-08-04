package main

import (
	"syscall/js"
)

var (
	ctx js.Value
	x   float64 = 50
	y   float64 = 50
)

var drawFunc js.Func

func draw(this js.Value, args []js.Value) interface{} {
	ctx.Call("clearRect", 0, 0, 300, 300)
	ctx.Set("fillStyle", "green")
	ctx.Call("fillRect", x, y, 20, 20)
	js.Global().Call("requestAnimationFrame", drawFunc)
	return nil
}

func keydown(this js.Value, args []js.Value) interface{} {
	key := args[0].Get("key").String()
	switch key {
	case "ArrowUp":
		y -= 5
	case "ArrowDown":
		y += 5
	case "ArrowLeft":
		x -= 5
	case "ArrowRight":
		x += 5
	}
	return nil
}

func main() {
	doc := js.Global().Get("document")
	canvas := doc.Call("getElementById", "game")
	ctx = canvas.Call("getContext", "2d")

	js.Global().Call("addEventListener", "keydown", js.FuncOf(keydown))

	drawFunc = js.FuncOf(draw)
	js.Global().Call("requestAnimationFrame", drawFunc)

	select {}
}
