package main

import "syscall/js"

// JavaScript interface functions for unit management

var createUnitFunc js.Func
var getUnitsFunc js.Func
var moveUnitFunc js.Func
var removeUnitFunc js.Func

func createUnit(this js.Value, args []js.Value) interface{} {
	if len(args) < 3 {
		return map[string]interface{}{
			"success": false,
			"error":   "createUnit requires unitType, tileX, tileY",
		}
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
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	}

	return map[string]interface{}{
		"success": true,
		"unit": map[string]interface{}{
			"id":     unit.ID,
			"name":   unit.Name,
			"typeId": int(unit.TypeID),
			"tileX":  unit.TileX,
			"tileY":  unit.TileY,
			"health": unit.CurrentStats.Health,
			"level":  unit.Level,
		},
	}
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

func moveUnitJS(this js.Value, args []js.Value) interface{} {
	if len(args) < 3 {
		return map[string]interface{}{
			"success": false,
			"error":   "moveUnit requires unitId, tileX, tileY",
		}
	}

	unitID := args[0].String()
	tileX := args[1].Int()
	tileY := args[2].Int()

	err := unitManager.MoveUnit(unitID, tileX, tileY)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	}

	return map[string]interface{}{
		"success": true,
	}
}

func removeUnitJS(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return map[string]interface{}{
			"success": false,
			"error":   "removeUnit requires unitId",
		}
	}

	unitID := args[0].String()

	err := unitManager.RemoveUnit(unitID)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	}

	return map[string]interface{}{
		"success": true,
	}
}

// initializeJSInterface sets up JavaScript function bindings
func initializeJSInterface() {
	// Expose unit management functions to JavaScript
	createUnitFunc = js.FuncOf(createUnit)
	js.Global().Set("createUnit", createUnitFunc)
	
	getUnitsFunc = js.FuncOf(getUnits)
	js.Global().Set("getUnits", getUnitsFunc)
	
	moveUnitFunc = js.FuncOf(moveUnitJS)
	js.Global().Set("moveUnit", moveUnitFunc)
	
	removeUnitFunc = js.FuncOf(removeUnitJS)
	js.Global().Set("removeUnit", removeUnitFunc)
}