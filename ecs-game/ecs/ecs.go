package ecs

import "reflect"

// Component represents any game component
type Component interface{}

// Entity represents a game entity with components
type Entity struct {
	id         uint32
	components map[reflect.Type]Component
}

// NewEntity creates a new entity
func NewEntity(id uint32) *Entity {
	return &Entity{
		id:         id,
		components: make(map[reflect.Type]Component),
	}
}

// AddComponent adds a component to the entity
func (e *Entity) AddComponent(component Component) {
	e.components[reflect.TypeOf(component)] = component
}

// GetComponent retrieves a component from the entity
func (e *Entity) GetComponent(componentType Component) (Component, bool) {
	comp, exists := e.components[reflect.TypeOf(componentType)]
	return comp, exists
}

// HasComponent checks if entity has a specific component
func (e *Entity) HasComponent(componentType Component) bool {
	_, exists := e.components[reflect.TypeOf(componentType)]
	return exists
}

// RemoveComponent removes a component from the entity
func (e *Entity) RemoveComponent(componentType Component) {
	delete(e.components, reflect.TypeOf(componentType))
}

// World manages all entities and systems
type World struct {
	entities   []*Entity
	nextID     uint32
	entityPool []*Entity
}

// NewWorld creates a new ECS world
func NewWorld() *World {
	return &World{
		entities: make([]*Entity, 0),
		nextID:   1,
	}
}

// NewEntity creates a new entity in the world
func (w *World) NewEntity() *Entity {
	entity := NewEntity(w.nextID)
	w.nextID++
	w.entities = append(w.entities, entity)
	return entity
}

// ForEachEntity iterates over all entities with a given component
func (w *World) ForEachEntity(fn func(*Entity)) {
	for _, entity := range w.entities {
		fn(entity)
	}
}

// ForEachEntityWith iterates over entities that have specific components
func (w *World) ForEachEntityWith(componentTypes []Component, fn func(*Entity)) {
	for _, entity := range w.entities {
		hasAll := true
		for _, compType := range componentTypes {
			if !entity.HasComponent(compType) {
				hasAll = false
				break
			}
		}
		if hasAll {
			fn(entity)
		}
	}
}

// RemoveEntity removes an entity from the world
func (w *World) RemoveEntity(entity *Entity) {
	for i, e := range w.entities {
		if e == entity {
			w.entities = append(w.entities[:i], w.entities[i+1:]...)
			break
		}
	}
}