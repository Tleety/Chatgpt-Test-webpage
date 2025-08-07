package ui

// Callback functions (to be set by the game)
var (
	SpawnUnitCallback  func()
	RemoveUnitCallback func()
)

// HandleMouseMove processes mouse movement for hover effects
func (ui *UISystem) HandleMouseMove(x, y float64) {
	for i := range ui.elements {
		element := &ui.elements[i]
		element.IsHovered = ui.isPointInElement(x, y, element)
	}
}

// HandleMouseClick processes mouse clicks on UI elements
func (ui *UISystem) HandleMouseClick(x, y float64) bool {
	for _, element := range ui.elements {
		if element.Enabled && ui.isPointInElement(x, y, &element) {
			if element.OnClick != nil {
				element.OnClick()
			}
			return true // Click was handled by UI
		}
	}
	return false // Click was not handled by UI
}

// isPointInElement checks if a point is within an element's bounds
func (ui *UISystem) isPointInElement(x, y float64, element *UIElement) bool {
	return x >= element.X && x <= element.X+element.Width &&
		   y >= element.Y && y <= element.Y+element.Height
}

// onSpawnUnit handles spawn button clicks
func (ui *UISystem) onSpawnUnit() {
	if ui.unitCount < ui.maxUnits && SpawnUnitCallback != nil {
		SpawnUnitCallback()
	}
}

// onRemoveUnit handles remove button clicks
func (ui *UISystem) onRemoveUnit() {
	if ui.unitCount > 1 && RemoveUnitCallback != nil {
		RemoveUnitCallback()
	}
}