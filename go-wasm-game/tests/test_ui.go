//go:build js && wasm
// +build js,wasm

package tests

import (
	"syscall/js"
)

// TestUI handles the visual display of test results
type TestUI struct {
	testSuite     *TestSuite
	isRunning     bool
	isComplete    bool
	showingResults bool
}

// NewTestUI creates a new test UI instance
func NewTestUI() *TestUI {
	return &TestUI{
		testSuite:     NewTestSuite(),
		isRunning:     false,
		isComplete:    false,
		showingResults: false,
	}
}

// RunTests executes the test suite and shows progress
func (tu *TestUI) RunTests() bool {
	tu.isRunning = true
	tu.isComplete = false
	tu.showingResults = true
	
	// Run all tests
	allPassed := tu.testSuite.RunAllTests()
	
	tu.isRunning = false
	tu.isComplete = true
	
	return allPassed
}

// IsComplete returns true if tests have finished running
func (tu *TestUI) IsComplete() bool {
	return tu.isComplete
}

// IsShowingResults returns true if we should show test results UI
func (tu *TestUI) IsShowingResults() bool {
	return tu.showingResults
}

// HideResults hides the test results UI
func (tu *TestUI) HideResults() {
	tu.showingResults = false
}

// Render draws the test UI on the canvas
func (tu *TestUI) Render(ctx js.Value, canvasWidth, canvasHeight float64) {
	if !tu.showingResults {
		return
	}
	
	// Draw semi-transparent overlay
	ctx.Set("globalAlpha", 0.9)
	ctx.Set("fillStyle", "#000000")
	ctx.Call("fillRect", 0, 0, canvasWidth, canvasHeight)
	ctx.Set("globalAlpha", 1.0)
	
	// Draw test results panel
	panelWidth := canvasWidth * 0.8
	panelHeight := canvasHeight * 0.8
	panelX := (canvasWidth - panelWidth) / 2
	panelY := (canvasHeight - panelHeight) / 2
	
	// Panel background
	ctx.Set("fillStyle", "#ffffff")
	ctx.Set("strokeStyle", "#333333")
	ctx.Set("lineWidth", 2)
	ctx.Call("fillRect", panelX, panelY, panelWidth, panelHeight)
	ctx.Call("strokeRect", panelX, panelY, panelWidth, panelHeight)
	
	// Title
	ctx.Set("fillStyle", "#333333")
	ctx.Set("font", "bold 24px Arial")
	ctx.Set("textAlign", "center")
	titleText := "Game Test Suite"
	if tu.isRunning {
		titleText += " - Running..."
	} else if tu.isComplete {
		titleText += " - Complete"
	}
	ctx.Call("fillText", titleText, canvasWidth/2, panelY+40)
	
	// Summary
	ctx.Set("font", "18px Arial")
	summary := tu.testSuite.GetSummary()
	ctx.Call("fillText", summary, canvasWidth/2, panelY+80)
	
	// Individual test results
	ctx.Set("font", "14px Arial")
	ctx.Set("textAlign", "left")
	
	results := tu.testSuite.GetResults()
	startY := panelY + 120
	lineHeight := 25
	
	for i, result := range results {
		y := startY + float64(i)*float64(lineHeight)
		
		// Skip if we're beyond the panel
		if y > panelY+panelHeight-100 {
			break
		}
		
		// Test name
		ctx.Set("fillStyle", "#333333")
		ctx.Call("fillText", result.Name+":", panelX+20, y)
		
		// Status
		if result.Passed {
			ctx.Set("fillStyle", "#009900")
			ctx.Call("fillText", "PASS", panelX+200, y)
		} else {
			ctx.Set("fillStyle", "#cc0000")
			ctx.Call("fillText", "FAIL", panelX+200, y)
		}
		
		// Message
		ctx.Set("fillStyle", "#666666")
		ctx.Set("font", "12px Arial")
		ctx.Call("fillText", result.Message, panelX+260, y)
		ctx.Set("font", "14px Arial")
	}
	
	// Continue button (only show when complete)
	if tu.isComplete {
		buttonWidth := 120.0
		buttonHeight := 40.0
		buttonX := canvasWidth/2 - buttonWidth/2
		buttonY := panelY + panelHeight - 60
		
		ctx.Set("fillStyle", "#007bff")
		ctx.Set("strokeStyle", "#0056b3")
		ctx.Set("lineWidth", 1)
		ctx.Call("fillRect", buttonX, buttonY, buttonWidth, buttonHeight)
		ctx.Call("strokeRect", buttonX, buttonY, buttonWidth, buttonHeight)
		
		ctx.Set("fillStyle", "#ffffff")
		ctx.Set("font", "16px Arial")
		ctx.Set("textAlign", "center")
		ctx.Call("fillText", "Start Game", canvasWidth/2, buttonY+25)
	}
}

// HandleClick handles mouse clicks on the test UI
func (tu *TestUI) HandleClick(x, y float64, canvasWidth, canvasHeight float64) bool {
	if !tu.showingResults || !tu.isComplete {
		return false
	}
	
	// Check if click is on "Start Game" button
	buttonWidth := 120.0
	buttonHeight := 40.0
	buttonX := canvasWidth/2 - buttonWidth/2
	buttonY := (canvasHeight*0.8 + (canvasHeight-canvasHeight*0.8)/2) + canvasHeight*0.8 - 60
	
	if x >= buttonX && x <= buttonX+buttonWidth && y >= buttonY && y <= buttonY+buttonHeight {
		tu.HideResults()
		return true // Button was clicked
	}
	
	return false // Click was not on button
}

// GetAllTestsPassed returns true if all tests passed
func (tu *TestUI) GetAllTestsPassed() bool {
	if !tu.isComplete {
		return false
	}
	
	results := tu.testSuite.GetResults()
	for _, result := range results {
		if !result.Passed {
			return false
		}
	}
	return true
}

// GetTestCount returns the number of tests run
func (tu *TestUI) GetTestCount() int {
	return len(tu.testSuite.GetResults())
}

// GetPassedCount returns the number of tests that passed
func (tu *TestUI) GetPassedCount() int {
	passed := 0
	for _, result := range tu.testSuite.GetResults() {
		if result.Passed {
			passed++
		}
	}
	return passed
}

// LogTestResults logs test results to browser console for debugging
func (tu *TestUI) LogTestResults() {
	if !tu.isComplete {
		return
	}
	
	console := js.Global().Get("console")
	console.Call("log", "=== Game Test Suite Results ===")
	console.Call("log", tu.testSuite.GetSummary())
	
	for _, result := range tu.testSuite.GetResults() {
		status := "PASS"
		if !result.Passed {
			status = "FAIL"
		}
		console.Call("log", result.Name+": "+status+" - "+result.Message)
	}
	console.Call("log", "=== End Test Results ===")
}