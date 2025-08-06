package main

// UnitType represents different types of units
type UnitType int

const (
	UnitWarrior UnitType = iota
	UnitArcher
	UnitMage
	UnitScout
)

// UnitStats represents the statistics of a unit
type UnitStats struct {
	Health  int
	Damage  int
	Speed   int
	Defense int
}

// UnitAppearance represents the visual properties of a unit
type UnitAppearance struct {
	Icon  string
	Color string
	Size  float64
}

// UnitTypeDef defines a unit type with its properties
type UnitTypeDef struct {
	Name        string
	Stats       UnitStats
	Appearance  UnitAppearance
	Description string
}

// UnitTypeDefinitions contains all available unit types
var UnitTypeDefinitions = map[UnitType]UnitTypeDef{
	UnitWarrior: {
		Name: "Warrior",
		Stats: UnitStats{
			Health:  100,
			Damage:  25,
			Speed:   2,
			Defense: 15,
		},
		Appearance: UnitAppearance{
			Icon:  "⚔️",
			Color: "#8B4513",
			Size:  24.0,
		},
		Description: "A heavy armored fighter with high health and defense",
	},
	UnitArcher: {
		Name: "Archer",
		Stats: UnitStats{
			Health:  60,
			Damage:  40,
			Speed:   4,
			Defense: 5,
		},
		Appearance: UnitAppearance{
			Icon:  "🏹",
			Color: "#228B22",
			Size:  20.0,
		},
		Description: "A ranged fighter with high damage and speed",
	},
	UnitMage: {
		Name: "Mage",
		Stats: UnitStats{
			Health:  40,
			Damage:  60,
			Speed:   3,
			Defense: 2,
		},
		Appearance: UnitAppearance{
			Icon:  "🔮",
			Color: "#4B0082",
			Size:  20.0,
		},
		Description: "A magic user with devastating spells but low defense",
	},
	UnitScout: {
		Name: "Scout",
		Stats: UnitStats{
			Health:  30,
			Damage:  15,
			Speed:   6,
			Defense: 3,
		},
		Appearance: UnitAppearance{
			Icon:  "👁️",
			Color: "#DAA520",
			Size:  18.0,
		},
		Description: "A fast reconnaissance unit with high mobility",
	},
}