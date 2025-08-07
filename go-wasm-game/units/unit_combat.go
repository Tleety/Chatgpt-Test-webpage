package units

import (
	"fmt"
	"math"
)

// UnitCombatSystem handles combat-related operations for units
type UnitCombatSystem struct{}

// NewUnitCombatSystem creates a new combat system
func NewUnitCombatSystem() *UnitCombatSystem {
	return &UnitCombatSystem{}
}

// DamageUnit applies damage to a unit
func (cs *UnitCombatSystem) DamageUnit(unit *Unit, damage int) error {
	if unit == nil {
		return fmt.Errorf("unit is nil")
	}

	if !unit.IsAlive {
		return fmt.Errorf("unit is already dead: %s", unit.ID)
	}

	// Apply damage (with defense reduction)
	actualDamage := int(math.Max(1, float64(damage-unit.CurrentStats.Defense)))
	unit.CurrentStats.Health -= actualDamage

	// Check if unit died
	if unit.CurrentStats.Health <= 0 {
		unit.CurrentStats.Health = 0
		unit.IsAlive = false
		unit.Status = "dead"
	}

	return nil
}

// HealUnit restores health to a unit
func (cs *UnitCombatSystem) HealUnit(unit *Unit, healAmount int) error {
	if unit == nil {
		return fmt.Errorf("unit is nil")
	}

	if !unit.IsAlive {
		return fmt.Errorf("cannot heal dead unit: %s", unit.ID)
	}

	// Apply healing (capped at max health)
	unit.CurrentStats.Health = int(math.Min(float64(unit.CurrentStats.Health+healAmount), float64(unit.MaxStats.Health)))

	return nil
}

// CalculateDamage calculates the actual damage after defense
func (cs *UnitCombatSystem) CalculateDamage(baseDamage, defense int) int {
	return int(math.Max(1, float64(baseDamage-defense)))
}

// IsUnitDead checks if a unit is dead
func (cs *UnitCombatSystem) IsUnitDead(unit *Unit) bool {
	return unit == nil || !unit.IsAlive || unit.CurrentStats.Health <= 0
}