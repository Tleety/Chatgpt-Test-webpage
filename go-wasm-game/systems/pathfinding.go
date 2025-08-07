package systems

import (
	"container/heap"
	"math"
	"github.com/Tleety/Chatgpt-Test-webpage/go-wasm-game/world"
)

// PathNode represents a node in the pathfinding search
type PathNode struct {
	X, Y         int     // Grid coordinates
	GCost        float64 // Cost from start to this node
	HCost        float64 // Heuristic cost from this node to goal
	FCost        float64 // Total cost (G + H)
	Parent       *PathNode // Parent node in the path
	HeapIndex    int     // Index in the priority queue heap
}

// PathNodeHeap implements heap.Interface for PathNode priority queue
type PathNodeHeap []*PathNode

func (h PathNodeHeap) Len() int           { return len(h) }
func (h PathNodeHeap) Less(i, j int) bool { 
	// Lower FCost has higher priority
	if h[i].FCost == h[j].FCost {
		return h[i].HCost < h[j].HCost // Tie-breaker: prefer lower heuristic
	}
	return h[i].FCost < h[j].FCost 
}
func (h PathNodeHeap) Swap(i, j int) {
	h[i], h[j] = h[j], h[i]
	h[i].HeapIndex = i
	h[j].HeapIndex = j
}

func (h *PathNodeHeap) Push(x interface{}) {
	node := x.(*PathNode)
	node.HeapIndex = len(*h)
	*h = append(*h, node)
}

func (h *PathNodeHeap) Pop() interface{} {
	old := *h
	n := len(old)
	node := old[n-1]
	node.HeapIndex = -1
	*h = old[0 : n-1]
	return node
}

// Path represents a sequence of grid coordinates
type Path []struct {
	X, Y int
}

// FindPath uses A* algorithm to find the shortest walkable path between two grid points
func FindPath(startX, startY, endX, endY int, gameMap *world.Map) Path {
	// Check if start and end are within bounds
	if startX < 0 || startX >= gameMap.Width || startY < 0 || startY >= gameMap.Height ||
	   endX < 0 || endX >= gameMap.Width || endY < 0 || endY >= gameMap.Height {
		return nil
	}
	
	// Check if start is walkable
	startTile := gameMap.GetTile(startX, startY)
	if !world.TileDefinitions[startTile].Walkable {
		// Find nearest walkable tile to start from
		startX, startY = FindNearestWalkableTile(startX, startY, gameMap)
	}
	
	// Check if end is walkable
	endTile := gameMap.GetTile(endX, endY)
	if !world.TileDefinitions[endTile].Walkable {
		// Find nearest walkable tile to end at
		endX, endY = FindNearestWalkableTile(endX, endY, gameMap)
	}
	
	// If start and end are the same, return single-point path
	if startX == endX && startY == endY {
		return Path{{X: endX, Y: endY}}
	}
	
	// Initialize data structures
	openSet := &PathNodeHeap{}
	heap.Init(openSet)
	
	// Keep track of all nodes for cleanup and fast lookups
	allNodes := make(map[int]*PathNode)
	closedSet := make(map[int]bool)
	
	// Add search limit to prevent infinite loops in extreme cases
	// Increased limit to handle larger rivers and complex terrain
	const maxSearchIterations = 50000
	searchIterations := 0
	
	// Helper function to get unique key for coordinates
	getKey := func(x, y int) int {
		return y*gameMap.Width + x
	}
	
	// Create start node
	startNode := &PathNode{
		X:     startX,
		Y:     startY,
		GCost: 0,
		HCost: heuristic(startX, startY, endX, endY),
	}
	startNode.FCost = startNode.GCost + startNode.HCost
	
	heap.Push(openSet, startNode)
	allNodes[getKey(startX, startY)] = startNode
	
	// Define movement directions (8-directional movement)
	directions := []struct{ dx, dy int }{
		{0, 1}, {1, 0}, {0, -1}, {-1, 0},     // Cardinal directions
		{1, 1}, {-1, -1}, {1, -1}, {-1, 1},   // Diagonal directions
	}
	
	// A* main loop
	for openSet.Len() > 0 && searchIterations < maxSearchIterations {
		searchIterations++
		
		// Get node with lowest F cost
		current := heap.Pop(openSet).(*PathNode)
		currentKey := getKey(current.X, current.Y)
		
		// Mark as explored
		closedSet[currentKey] = true
		
		// Check if we reached the goal
		if current.X == endX && current.Y == endY {
			return reconstructPath(current)
		}
		
		// Explore neighbors
		for _, dir := range directions {
			neighborX := current.X + dir.dx
			neighborY := current.Y + dir.dy
			neighborKey := getKey(neighborX, neighborY)
			
			// Skip if out of bounds
			if neighborX < 0 || neighborX >= gameMap.Width || 
			   neighborY < 0 || neighborY >= gameMap.Height {
				continue
			}
			
			// Skip if already explored
			if closedSet[neighborKey] {
				continue
			}
			
			// Skip if not walkable
			neighborTile := gameMap.GetTile(neighborX, neighborY)
			if !world.TileDefinitions[neighborTile].Walkable {
				continue
			}
			
			// Calculate movement cost (diagonal moves cost more + terrain cost)
			baseCost := 1.0
			if dir.dx != 0 && dir.dy != 0 {
				baseCost = 1.414 // sqrt(2) for diagonal movement
			}
			
			// Factor in terrain movement cost (slower terrain = higher pathfinding cost)
			// This encourages pathfinding through faster terrain when available
			tileDef := world.TileDefinitions[neighborTile]
			terrainCost := baseCost / tileDef.WalkSpeed // Invert speed to get cost
			
			tentativeGCost := current.GCost + terrainCost
			
			// Check if we found a better path to this neighbor
			neighbor, exists := allNodes[neighborKey]
			if !exists {
				// Create new node
				neighbor = &PathNode{
					X:      neighborX,
					Y:      neighborY,
					Parent: current,
					GCost:  tentativeGCost,
					HCost:  heuristic(neighborX, neighborY, endX, endY),
				}
				neighbor.FCost = neighbor.GCost + neighbor.HCost
				
				allNodes[neighborKey] = neighbor
				heap.Push(openSet, neighbor)
			} else if tentativeGCost < neighbor.GCost {
				// Found better path to existing node
				neighbor.Parent = current
				neighbor.GCost = tentativeGCost
				neighbor.FCost = neighbor.GCost + neighbor.HCost
				
				// Update position in heap
				heap.Fix(openSet, neighbor.HeapIndex)
			}
		}
	}
	
	// No path found - return nil to indicate no valid path exists
	// This prevents the player from getting stuck trying to follow an impossible path
	return nil
}

// heuristic calculates the Euclidean distance heuristic for A*
// This provides better pathfinding accuracy for diagonal movement compared to Manhattan distance
func heuristic(x1, y1, x2, y2 int) float64 {
	dx := float64(absInt(x2 - x1))
	dy := float64(absInt(y2 - y1))
	// Use Euclidean distance for more accurate pathfinding with diagonal movement
	return math.Sqrt(dx*dx + dy*dy)
}

// reconstructPath builds the final path by following parent pointers backwards
func reconstructPath(node *PathNode) Path {
	var path Path
	current := node
	
	// Build path backwards from goal to start
	for current != nil {
		path = append([]struct{ X, Y int }{{X: current.X, Y: current.Y}}, path...)
		current = current.Parent
	}
	
	return path
}

// GetNextPathStep returns the next step in the path, or current position if no path
func GetNextPathStep(path Path, currentStep int) (int, int, bool) {
	if currentStep >= len(path) {
		return 0, 0, false // Path completed
	}
	
	step := path[currentStep]
	return step.X, step.Y, true
}

// IsPathComplete checks if we've reached the end of the path
func IsPathComplete(path Path, currentStep int) bool {
	return currentStep >= len(path)
}

// PathLength returns the number of steps in the path
func PathLength(path Path) int {
	return len(path)
}

// abs returns the absolute value of an integer (moved here for pathfinding-specific use)
func absInt(x int) int {
	if x < 0 {
		return -x
	}
	return x
}