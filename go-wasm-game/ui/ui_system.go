package ui
import (
	"syscall/js"
)
// UIElement represents a clickable UI element
type UIElement struct {
	X, Y, Width, Height float64
	Text                string
	Icon                string
	Enabled             bool
	Background          string
	HoverBackground     string
	TextColor           string
	OnClick             func()
	IsHovered           bool
}
// UISystem manages the game's user interface
type UISystem struct {
	elements       []UIElement
	canvasWidth    float64
	canvasHeight   float64
	bottomBarHeight float64
	unitCount      int
	maxUnits       int
}
// NewUISystem creates a new UI system
func NewUISystem() *UISystem {
	return &UISystem{
		elements:        make([]UIElement, 0),
		bottomBarHeight: 60.0,
		unitCount:       1, // Start with 1 unit
		maxUnits:        10,
	}
}
// UpdateCanvasSize updates the UI system with current canvas dimensions
func (ui *UISystem) UpdateCanvasSize(width, height float64) {
	ui.canvasWidth = width
	ui.canvasHeight = height
	ui.updateUILayout()
}
// updateUILayout repositions UI elements based on canvas size
func (ui *UISystem) updateUILayout() {
	if ui.canvasWidth == 0 || ui.canvasHeight == 0 {
		return
	}
	
	// Clear existing elements
	ui.elements = make([]UIElement, 0)
	
	// Bottom bar background area
	barY := ui.canvasHeight - ui.bottomBarHeight
	buttonWidth := 120.0
	buttonHeight := 35.0
	buttonSpacing := 15.0
	
	// Spawn button (left side)
	spawnX := 20.0
	spawnY := barY + (ui.bottomBarHeight-buttonHeight)/2
	
	spawnButton := UIElement{
		X:               spawnX,
		Y:               spawnY,
		Width:           buttonWidth,
		Height:          buttonHeight,
		Text:            "Spawn Unit",
		Icon:            "➕",
		Enabled:         ui.unitCount < ui.maxUnits,
		Background:      "#555",
		HoverBackground: "#2d7a2d",
		TextColor:       "#fff",
		OnClick:         ui.onSpawnUnit,
	}
	
	// Remove button (next to spawn button)
	removeX := spawnX + buttonWidth + buttonSpacing
	removeY := spawnY
	
	removeButton := UIElement{
		X:               removeX,
		Y:               removeY,
		Width:           buttonWidth,
		Height:          buttonHeight,
		Text:            "Remove Unit",
		Icon:            "➖",
		Enabled:         ui.unitCount > 1,
		Background:      "#555",
		HoverBackground: "#c34343",
		TextColor:       "#fff",
		OnClick:         ui.onRemoveUnit,
	}
	
	ui.elements = append(ui.elements, spawnButton, removeButton)
}
// Render draws the UI system
func (ui *UISystem) Render(ctx js.Value) {
	if ui.canvasWidth == 0 || ui.canvasHeight == 0 {
		return
	}
	
	// Draw bottom bar background
	ui.drawBottomBar(ctx)
	
	// Draw UI elements
	for _, element := range ui.elements {
		ui.drawElement(ctx, element)
	}
	
	// Draw unit counter (right side)
	ui.drawUnitCounter(ctx)
}
// drawBottomBar draws the bottom bar background
func (ui *UISystem) drawBottomBar(ctx js.Value) {
	barY := ui.canvasHeight - ui.bottomBarHeight
	
	// Draw background
	ctx.Set("fillStyle", "#333")
	ctx.Call("fillRect", 0, barY, ui.canvasWidth, ui.bottomBarHeight)
	
	// Draw top border
	ctx.Set("strokeStyle", "#555")
	ctx.Set("lineWidth", 1)
	ctx.Call("beginPath")
	ctx.Call("moveTo", 0, barY)
	ctx.Call("lineTo", ui.canvasWidth, barY)
	ctx.Call("stroke")
}
// drawElement draws a single UI element (button)
func (ui *UISystem) drawElement(ctx js.Value, element UIElement) {
	// Determine background color
	bgColor := element.Background
	if element.IsHovered && element.Enabled {
		bgColor = element.HoverBackground
	}
	if !element.Enabled {
		bgColor = "#444"
	}
	
	// Draw button background
	ctx.Set("fillStyle", bgColor)
	ui.drawRoundedRect(ctx, element.X, element.Y, element.Width, element.Height, 6)
	ctx.Call("fill")
	
	// Draw button border
	ctx.Set("strokeStyle", "#666")
	ctx.Set("lineWidth", 1)
	ui.drawRoundedRect(ctx, element.X, element.Y, element.Width, element.Height, 6)
	ctx.Call("stroke")
	
	// Draw button content
	textColor := element.TextColor
	if !element.Enabled {
		textColor = "#888"
	}
	
	ctx.Set("fillStyle", textColor)
	ctx.Set("font", "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif")
	ctx.Set("textAlign", "center")
	ctx.Set("textBaseline", "middle")
	
	// Draw icon and text
	centerX := element.X + element.Width/2
	centerY := element.Y + element.Height/2
	
	if element.Icon != "" && element.Text != "" {
		// Icon + text layout
		ctx.Set("font", "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif")
		iconWidth := ui.measureText(ctx, element.Icon)
		
		ctx.Set("font", "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif")
		textWidth := ui.measureText(ctx, element.Text)
		
		totalWidth := iconWidth + 8 + textWidth // 8px spacing
		startX := centerX - totalWidth/2
		
		// Draw icon
		ctx.Set("font", "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif")
		ctx.Call("fillText", element.Icon, startX+iconWidth/2, centerY)
		
		// Draw text
		ctx.Set("font", "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif")
		ctx.Call("fillText", element.Text, startX+iconWidth+8+textWidth/2, centerY)
	} else if element.Text != "" {
		// Text only
		ctx.Call("fillText", element.Text, centerX, centerY)
	} else if element.Icon != "" {
		// Icon only
		ctx.Set("font", "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif")
		ctx.Call("fillText", element.Icon, centerX, centerY)
	}
}
// drawUnitCounter draws the unit count display on the right side
func (ui *UISystem) drawUnitCounter(ctx js.Value) {
	barY := ui.canvasHeight - ui.bottomBarHeight
	
	ctx.Set("fillStyle", "#ccc")
	ctx.Set("font", "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif")
	ctx.Set("textAlign", "right")
	ctx.Set("textBaseline", "middle")
	
	unitText := "Units: " + intToString(ui.unitCount)
	ctx.Call("fillText", unitText, ui.canvasWidth-20, barY+ui.bottomBarHeight/2)
}
// drawRoundedRect draws a rounded rectangle path
func (ui *UISystem) drawRoundedRect(ctx js.Value, x, y, width, height, radius float64) {
	ctx.Call("beginPath")
	ctx.Call("moveTo", x+radius, y)
	ctx.Call("lineTo", x+width-radius, y)
	ctx.Call("arcTo", x+width, y, x+width, y+radius, radius)
	ctx.Call("lineTo", x+width, y+height-radius)
	ctx.Call("arcTo", x+width, y+height, x+width-radius, y+height, radius)
	ctx.Call("lineTo", x+radius, y+height)
	ctx.Call("arcTo", x, y+height, x, y+height-radius, radius)
	ctx.Call("lineTo", x, y+radius)
	ctx.Call("arcTo", x, y, x+radius, y, radius)
	ctx.Call("closePath")
}
// measureText measures the width of text
func (ui *UISystem) measureText(ctx js.Value, text string) float64 {
	metrics := ctx.Call("measureText", text)
	return metrics.Get("width").Float()
}
// SetUnitCount updates the unit count and refreshes UI
func (ui *UISystem) SetUnitCount(count int) {
	ui.unitCount = count
	ui.updateUILayout() // Refresh button states
}
// GetUnitCount returns the current unit count
func (ui *UISystem) GetUnitCount() int {
	return ui.unitCount
}
