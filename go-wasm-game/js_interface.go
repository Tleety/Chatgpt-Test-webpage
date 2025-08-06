package main

import "syscall/js"

// JavaScript interface functions for unit management

var createUnitFunc js.Func
var getUnitsFunc js.Func
var moveUnitFunc js.Func
var removeUnitFunc js.Func

// jsError creates a standardized error response
func jsError(message string) interface{} {
	return map[string]interface{}{
		"success": false,
		"error":   message,
	}
}

// jsSuccess creates a standardized success response
func jsSuccess(data interface{}) interface{} {
	if data == nil {
		return map[string]interface{}{"success": true}
	}
	return map[string]interface{}{
		"success": true,
		"data":    data,
	}
}

func createUnit(this js.Value, args []js.Value) interface{} {
	if len(args) < 3 {
		return jsError("createUnit requires unitType, tileX, tileY")
	}

	unitType := UnitType(args[0].Int())
	tileX := args[1].Int()
	tileY := args[2].Int()
	name := ""
	if len(args) > 3 {
		name = args[3].String()
	}

	unit, err := unitManager.CreateUnit(unitType, tileX, tileY, name)
	if err != nil {
		return jsError(err.Error())
	}

	return jsSuccess(map[string]interface{}{
		"id":     unit.ID,
		"name":   unit.Name,
		"typeId": int(unit.TypeID),
		"tileX":  unit.TileX,
		"tileY":  unit.TileY,
		"health": unit.CurrentStats.Health,
		"level":  unit.Level,
	})
}

func getUnits(this js.Value, args []js.Value) interface{} {
	units := unitManager.GetAllUnits()
	result := make([]interface{}, 0, len(units))

	for _, unit := range units {
		if !unit.IsAlive {
			continue
		}

		result = append(result, map[string]interface{}{
			"id":     unit.ID,
			"name":   unit.Name,
			"typeId": int(unit.TypeID),
			"tileX":  unit.TileX,
			"tileY":  unit.TileY,
			"health": unit.CurrentStats.Health,
			"maxHealth": unit.MaxStats.Health,
			"level":  unit.Level,
			"status": unit.Status,
		})
	}

	return result
}

func moveUnit(this js.Value, args []js.Value) interface{} {
	if len(args) < 3 {
		return jsError("moveUnit requires unitId, tileX, tileY")
	}

	err := unitManager.MoveUnit(args[0].String(), args[1].Int(), args[2].Int())
	if err != nil {
		return jsError(err.Error())
	}

	return jsSuccess(nil)
}

func removeUnit(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return jsError("removeUnit requires unitId")
	}

	err := unitManager.RemoveUnit(args[0].String())
	if err != nil {
		return jsError(err.Error())
	}

	return jsSuccess(nil)
}

// initializeJSInterface sets up JavaScript function bindings
func initializeJSInterface() {
	// Expose unit management functions to JavaScript
	createUnitFunc = js.FuncOf(createUnit)
	js.Global().Set("createUnit", createUnitFunc)
	
	getUnitsFunc = js.FuncOf(getUnits)
	js.Global().Set("getUnits", getUnitsFunc)
	
	moveUnitFunc = js.FuncOf(moveUnit)
	js.Global().Set("moveUnit", moveUnitFunc)
	
	removeUnitFunc = js.FuncOf(removeUnit)
	js.Global().Set("removeUnit", removeUnitFunc)
}