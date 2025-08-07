package ui

// GetUIAreaHeight returns the height reserved for UI
func (ui *UISystem) GetUIAreaHeight() float64 {
	return ui.bottomBarHeight
}

// intToString converts an integer to string without using strconv
func intToString(n int) string {
	if n == 0 {
		return "0"
	}
	
	var result string
	negative := n < 0
	if negative {
		n = -n
	}
	
	for n > 0 {
		digit := n % 10
		result = string(rune('0'+digit)) + result
		n /= 10
	}
	
	if negative {
		result = "-" + result
	}
	
	return result
}