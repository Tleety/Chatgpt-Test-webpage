// Auto-generated test definitions from Jest files
// Generated on: 2025-08-05T10:34:32.347Z
// DO NOT EDIT MANUALLY - Use 'node build-test-definitions.js' to regenerate

var testSuites = {
  "SnakeGameLogic": {
    "Initialization": [
      {
        "name": "should initialize with correct default values",
        "test": "expect(game.gameWidth).toBe(400);\nexpect(game.gameHeight).toBe(300);\nexpect(game.CELL_SIZE).toBe(20);\nexpect(game.score).toBe(0);\nexpect(game.snake).toHaveLength(1);\nexpect(game.direction).toEqual({ x: 20, y: 0 });"
      },
      {
        "name": "should place snake in center of game area",
        "test": "var expectedX = Math.floor(400 / 2 / 20) * 20; // 200\nvar expectedY = Math.floor(300 / 2 / 20) * 20; // 140\nexpect(game.snake[0]).toEqual({ x: expectedX, y: expectedY });"
      },
      {
        "name": "should place food at valid position",
        "test": "expect(game.food).toBeDefined();\nexpect(game.food.x).toBeGreaterThanOrEqual(0);\nexpect(game.food.x).toBeLessThan(400);\nexpect(game.food.y).toBeGreaterThanOrEqual(0);\nexpect(game.food.y).toBeLessThan(300);\nexpect(game.food.x % 20).toBe(0);\nexpect(game.food.y % 20).toBe(0);"
      }
    ],
    "Direction Changes": [
      {
        "name": "should allow valid direction changes",
        "test": "// Starting direction is right (x: 20, y: 0)\nexpect(game.changeDirection({ x: 0, y: -20 })).toBe(true); // up\nexpect(game.direction).toEqual({ x: 0, y: -20 });\nexpect(game.changeDirection({ x: -20, y: 0 })).toBe(true); // left\nexpect(game.direction).toEqual({ x: -20, y: 0 });"
      },
      {
        "name": "should prevent 180-degree turns",
        "test": "// Starting direction is right (x: 20, y: 0)\nexpect(game.changeDirection({ x: -20, y: 0 })).toBe(false); // left (opposite)\nexpect(game.direction).toEqual({ x: 20, y: 0 }); // unchanged\n// Change to up\ngame.changeDirection({ x: 0, y: -20 });\nexpect(game.changeDirection({ x: 0, y: 20 })).toBe(false); // down (opposite)\nexpect(game.direction).toEqual({ x: 0, y: -20 }); // unchanged"
      },
      {
        "name": "should validate direction changes correctly",
        "test": "// Right direction\ngame.direction = { x: 20, y: 0 };\nexpect(game.isValidDirectionChange({ x: 0, y: 20 })).toBe(true);  // down\nexpect(game.isValidDirectionChange({ x: 0, y: -20 })).toBe(true); // up\nexpect(game.isValidDirectionChange({ x: -20, y: 0 })).toBe(false); // left (opposite)\n// Up direction\ngame.direction = { x: 0, y: -20 };\nexpect(game.isValidDirectionChange({ x: 20, y: 0 })).toBe(true);  // right\nexpect(game.isValidDirectionChange({ x: -20, y: 0 })).toBe(true); // left\nexpect(game.isValidDirectionChange({ x: 0, y: 20 })).toBe(false); // down (opposite)"
      }
    ],
    "Collision Detection": [
      {
        "name": "should detect wall collisions",
        "test": "expect(game.isWallCollision(-20, 140)).toBe(true);  // left wall\nexpect(game.isWallCollision(400, 140)).toBe(true);  // right wall\nexpect(game.isWallCollision(200, -20)).toBe(true);  // top wall\nexpect(game.isWallCollision(200, 300)).toBe(true);  // bottom wall\nexpect(game.isWallCollision(200, 140)).toBe(false); // inside bounds"
      },
      {
        "name": "should detect self collisions",
        "test": "// Add more segments to snake\ngame.snake = [\n{ x: 200, y: 140 },\n{ x: 180, y: 140 },\n{ x: 160, y: 140 }\n];\nexpect(game.isSelfCollision(180, 140)).toBe(true);  // hits body\nexpect(game.isSelfCollision(160, 140)).toBe(true);  // hits tail\nexpect(game.isSelfCollision(220, 140)).toBe(false); // clear space"
      },
      {
        "name": "should detect food collisions",
        "test": "game.food = { x: 100, y: 100 };\nexpect(game.isFoodCollision(100, 100)).toBe(true);\nexpect(game.isFoodCollision(120, 100)).toBe(false);"
      }
    ],
    "Snake Movement": [
      {
        "name": "should move snake forward correctly",
        "test": "var initialHeadX = game.snake[0].x;\nvar result = game.moveSnake();\nexpect(result.collision).toBe(false);\nexpect(result.ateFood).toBe(false);\nexpect(game.snake[0].x).toBe(initialHeadX + 20);\nexpect(game.snake).toHaveLength(1); // tail removed since no food eaten"
      },
      {
        "name": "should grow snake when eating food",
        "test": "// Place food right in front of snake\nvar headX = game.snake[0].x;\nvar headY = game.snake[0].y;\ngame.food = { x: headX + 20, y: headY };\nvar initialScore = game.score;\nvar result = game.moveSnake();\nexpect(result.collision).toBe(false);\nexpect(result.ateFood).toBe(true);\nexpect(result.newScore).toBe(initialScore + 1);\nexpect(game.snake).toHaveLength(2); // snake grew\nexpect(game.score).toBe(initialScore + 1);"
      },
      {
        "name": "should detect collision with wall",
        "test": "// Move snake to right edge\ngame.snake = [{ x: 380, y: 140 }];\ngame.direction = { x: 20, y: 0 };\nvar result = game.moveSnake();\nexpect(result.collision).toBe(true);\nexpect(result.ateFood).toBe(false);"
      },
      {
        "name": "should detect collision with self",
        "test": "// Create a snake that will collide with itself\ngame.snake = [\n{ x: 200, y: 140 },\n{ x: 180, y: 140 },\n{ x: 160, y: 140 },\n{ x: 160, y: 120 },\n{ x: 180, y: 120 },\n{ x: 200, y: 120 }\n];\ngame.direction = { x: 0, y: 20 }; // moving down into body\n// The head at (200, 140) moving down by 20 will be at (200, 160)\n// But there's no body segment at (200, 160), so let's fix this\ngame.snake = [\n{ x: 200, y: 120 }, // head\n{ x: 180, y: 120 },\n{ x: 160, y: 120 },\n{ x: 160, y: 140 },\n{ x: 180, y: 140 },\n{ x: 200, y: 140 } // body segment that head will hit\n];\ngame.direction = { x: 0, y: 20 }; // moving down, will hit (200, 140)\nvar result = game.moveSnake();\nexpect(result.collision).toBe(true);"
      }
    ],
    "Food Placement": [
      {
        "name": "should place food in valid grid positions",
        "test": "for (var i = 0; i < 10; i++) {\nvar food = game.placeFood();\nexpect(food.x % 20).toBe(0);\nexpect(food.y % 20).toBe(0);\nexpect(food.x).toBeGreaterThanOrEqual(0);\nexpect(food.x).toBeLessThan(400);\nexpect(food.y).toBeGreaterThanOrEqual(0);\nexpect(food.y).toBeLessThan(300);\n}"
      },
      {
        "name": "should not place food on snake body",
        "test": "// Create a long snake\ngame.snake = [\n{ x: 100, y: 100 },\n{ x: 80, y: 100 },\n{ x: 60, y: 100 },\n{ x: 40, y: 100 },\n{ x: 20, y: 100 }\n];\nvar food = game.placeFood();\n// Food should not be on any snake segment\nexpect(game.snake.some(function(seg) { return seg.x === food.x && seg.y === food.y; })).toBe(false);"
      }
    ],
    "Game State": [
      {
        "name": "should return complete game state",
        "test": "var state = game.getGameState();\nexpect(state).toHaveProperty('snake');\nexpect(state).toHaveProperty('food');\nexpect(state).toHaveProperty('direction');\nexpect(state).toHaveProperty('score');\nexpect(state).toHaveProperty('gameWidth');\nexpect(state).toHaveProperty('gameHeight');\nexpect(state.snake).toHaveLength(game.snake.length);\nexpect(state.score).toBe(game.score);"
      },
      {
        "name": "should reset game state correctly",
        "test": "// Modify game state\ngame.score = 10;\ngame.snake = [{ x: 100, y: 100 }, { x: 80, y: 100 }];\ngame.direction = { x: 0, y: -20 };\ngame.reset();\nexpect(game.score).toBe(0);\nexpect(game.snake).toHaveLength(1);\nexpect(game.direction).toEqual({ x: 20, y: 0 });\nexpect(game.snake[0].x).toBe(200); // back to center\nexpect(game.snake[0].y).toBe(140);"
      }
    ],
    "Edge Cases": [
      {
        "name": "should handle very small game area",
        "test": "var smallGame = new SnakeGameLogic(40, 40);\nexpect(smallGame.snake).toHaveLength(1);\nexpect(smallGame.food).toBeDefined();"
      },
      {
        "name": "should handle food placement when most spaces are occupied",
        "test": "// Fill most of the game area with snake\nvar segments = [];\nfor (var y = 0; y < 300; y += 20) {\nfor (var x = 0; x < 380; x += 20) { // leave some space\nsegments.push({ x: x, y: y });\n}\n}\ngame.snake = segments;\nvar food = game.placeFood();\nexpect(food).toBeDefined();\nexpect(game.snake.some(function(seg) { return seg.x === food.x && seg.y === food.y; })).toBe(false);"
      }
    ],
    "High Score Management": [],
    "getHighScores": [
      {
        "name": "should return empty array when no scores exist",
        "test": "var scores = game.getHighScores();\nexpect(scores).toEqual([]);"
      },
      {
        "name": "should return parsed scores from localStorage",
        "test": "var testScores = [\n{ name: 'Alice', score: 10 },\n{ name: 'Bob', score: 5 }\n];\nlocalStorage.setItem('snakeGameHighScores', JSON.stringify(testScores));\nvar scores = game.getHighScores();\nexpect(scores).toEqual(testScores);"
      },
      {
        "name": "should handle corrupted localStorage data",
        "test": "localStorage.setItem('snakeGameHighScores', 'invalid json');\nvar scores = game.getHighScores();\nexpect(scores).toEqual([]);"
      }
    ],
    "isHighScore": [
      {
        "name": "should return false for zero or negative scores",
        "test": "expect(game.isHighScore(0)).toBe(false);\nexpect(game.isHighScore(-1)).toBe(false);"
      },
      {
        "name": "should return true when no scores exist and score is positive",
        "test": "expect(game.isHighScore(1)).toBe(true);"
      },
      {
        "name": "should return true when less than 10 scores exist",
        "test": "var testScores = [\n{ name: 'Alice', score: 10 },\n{ name: 'Bob', score: 5 }\n];\nlocalStorage.setItem('snakeGameHighScores', JSON.stringify(testScores));\nexpect(game.isHighScore(1)).toBe(true);\nexpect(game.isHighScore(15)).toBe(true);"
      },
      {
        "name": "should return true when score beats lowest of 10 scores",
        "test": "var testScores = [];\nfor (var i = 10; i >= 1; i--) {\ntestScores.push({ name: \"Player\" + i, score: i });\n}\nlocalStorage.setItem('snakeGameHighScores', JSON.stringify(testScores));\nexpect(game.isHighScore(2)).toBe(true);\nexpect(game.isHighScore(11)).toBe(true);"
      },
      {
        "name": "should return false when score does not beat lowest of 10 scores",
        "test": "var testScores = [];\nfor (var i = 10; i >= 1; i--) {\ntestScores.push({ name: \"Player\" + i, score: i });\n}\n// Sort the test scores properly\ntestScores.sort(function(a, b) { return b.score - a.score; });\nlocalStorage.setItem('snakeGameHighScores', JSON.stringify(testScores));\nexpect(game.isHighScore(0)).toBe(false);\nexpect(game.isHighScore(1)).toBe(false);"
      }
    ],
    "addHighScore": [
      {
        "name": "should add score when list is empty",
        "test": "var result = game.addHighScore('Alice', 10);\nexpect(result).toBe(true);\nexpect(game.getHighScores()).toEqual([{ name: 'Alice', score: 10 }]);"
      },
      {
        "name": "should add score and maintain sort order",
        "test": "game.addHighScore('Bob', 5);\ngame.addHighScore('Alice', 10);\ngame.addHighScore('Charlie', 7);\nvar scores = game.getHighScores();\nexpect(scores).toEqual([\n{ name: 'Alice', score: 10 },\n{ name: 'Charlie', score: 7 },\n{ name: 'Bob', score: 5 }\n]);"
      },
      {
        "name": "should limit to top 10 scores",
        "test": "// Add 11 scores\nfor (var i = 1; i <= 11; i++) {\ngame.addHighScore(\"Player\" + i, i);\n}\nvar scores = game.getHighScores();\nexpect(scores).toHaveLength(10);\nexpect(scores[0].score).toBe(11);\nexpect(scores[9].score).toBe(2);"
      },
      {
        "name": "should not add score that does not qualify",
        "test": "// Fill with 10 scores (1-10)\nfor (var i = 1; i <= 10; i++) {\ngame.addHighScore(\"Player\" + i, i);\n}\nvar result = game.addHighScore('LowScore', 0);\nexpect(result).toBe(false);\nexpect(game.getHighScores()).toHaveLength(10);\nexpect(game.getHighScores()[9].score).toBe(1);"
      },
      {
        "name": "should handle empty name by using Anonymous",
        "test": "game.addHighScore('', 10);\ngame.addHighScore('   ', 5);\nvar scores = game.getHighScores();\nexpect(scores[0].name).toBe('Anonymous');\nexpect(scores[1].name).toBe('Anonymous');"
      },
      {
        "name": "should trim whitespace from names",
        "test": "game.addHighScore('  Alice  ', 10);\nvar scores = game.getHighScores();\nexpect(scores[0].name).toBe('Alice');"
      }
    ],
    "clearHighScores": [
      {
        "name": "should remove all high scores",
        "test": "game.addHighScore('Alice', 10);\ngame.addHighScore('Bob', 5);\nexpect(game.getHighScores()).toHaveLength(2);\ngame.clearHighScores();\nexpect(game.getHighScores()).toEqual([]);"
      }
    ]
  },
  "SnakeGameUI": {
    "Snake Game UI": [
      {
        "name": "should prevent default behavior for arrow keys",
        "test": "// Simulate the keydown event handler from the game\nvar keys = {};\nvar gameRunning = true;\nvar keydownHandler = function(e) {\nkeys[e.code] = true;\nif (e.code === 'Space' && !gameRunning) {\ne.preventDefault();\n}\n// Prevent default behavior for arrow keys to stop page scrolling\nif (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {\ne.preventDefault();\n}\n};\n// Test each arrow key\nvar arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];\narrowKeys.forEach(function(keyCode) {\nvar mockEvent = {\ncode: keyCode,\npreventDefault: mockPreventDefault.called = false;\n};\nkeydownHandler(mockEvent);\nexpect(mockPreventDefault);\nmockPreventDefault.called = false;\n});"
      },
      {
        "name": "should not prevent default for non-arrow keys",
        "test": "var keys = {};\nvar gameRunning = true;\nvar keydownHandler = function(e) {\nkeys[e.code] = true;\nif (e.code === 'Space' && !gameRunning) {\ne.preventDefault();\n}\n// Prevent default behavior for arrow keys to stop page scrolling\nif (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {\ne.preventDefault();\n}\n};\n// Test non-arrow keys\nvar nonArrowKeys = ['KeyA', 'KeyW', 'KeyS', 'KeyD', 'Enter', 'Escape'];\nnonArrowKeys.forEach(function(keyCode) {\nvar mockEvent = {\ncode: keyCode,\npreventDefault: mockPreventDefault.called = false;\n};\nkeydownHandler(mockEvent);\nexpect(mockPreventDefault).not;\n});"
      },
      {
        "name": "should prevent default for Space key when game is not running",
        "test": "var keys = {};\nvar gameRunning = false; // Game over state\nvar keydownHandler = function(e) {\nkeys[e.code] = true;\nif (e.code === 'Space' && !gameRunning) {\ne.preventDefault();\n}\n// Prevent default behavior for arrow keys to stop page scrolling\nif (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {\ne.preventDefault();\n}\n};\nvar mockEvent = {\ncode: 'Space',\npreventDefault: mockPreventDefault.called = false;\n};\nkeydownHandler(mockEvent);\nexpect(mockPreventDefault);"
      },
      {
        "name": "should not prevent default for Space key when game is running",
        "test": "var keys = {};\nvar gameRunning = true; // Game is active\nvar keydownHandler = function(e) {\nkeys[e.code] = true;\nif (e.code === 'Space' && !gameRunning) {\ne.preventDefault();\n}\n// Prevent default behavior for arrow keys to stop page scrolling\nif (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {\ne.preventDefault();\n}\n};\nvar mockEvent = {\ncode: 'Space',\npreventDefault: mockPreventDefault.called = false;\n};\nkeydownHandler(mockEvent);\nexpect(mockPreventDefault).not;"
      },
      {
        "name": "should verify game over overlay positioning when displayed",
        "test": "// Set up DOM with game container and game over element\ndocument.body.innerHTML = `\n<div id=\"gameContainer\" style=\"position: relative;\">\n<canvas id=\"gameCanvas\" width=\"800\" height=\"600\"></canvas>\n<div id=\"gameOver\" style=\"\nposition: absolute;\ntop: 50%;\nleft: 50%;\ntransform: translate(-50%, -50%);\nz-index: 100;\ndisplay: block;\n\">Game Over! Press SPACE to restart</div>\n</div>\n`;\nvar gameOverElement = document.getElementById('gameOver');\nvar gameContainer = document.getElementById('gameContainer');\n// Verify the game over element exists and has correct positioning\nexpect(gameOverElement).toBeTruthy();\nexpect(gameContainer).toBeTruthy();\n// Get computed styles to verify positioning\nvar gameOverStyles = window.getComputedStyle(gameOverElement);\nvar containerStyles = window.getComputedStyle(gameContainer);\n// Verify the overlay is positioned absolutely\nexpect(gameOverStyles.position).toBe('absolute');\n// Verify the container has relative positioning\nexpect(containerStyles.position).toBe('relative');\n// Verify centering styles\nexpect(gameOverStyles.top).toBe('50%');\nexpect(gameOverStyles.left).toBe('50%');\nexpect(gameOverStyles.transform).toContain('translate(-50%, -50%)');\n// Verify z-index for overlay effect\nexpect(gameOverStyles.zIndex).toBe('100');"
      }
    ]
  },
  "TodoListLogic": {
    "Initialization": [
      {
        "name": "should initialize with empty tasks array",
        "test": "expect(todoList.tasks).toEqual([]);\nexpect(todoList.nextId).toBeGreaterThan(0);"
      },
      {
        "name": "should load tasks from localStorage when available",
        "test": "var savedTasks = [\n{ id: 1, text: 'Test task', completed: false }\n];\nlocalStorageMock.getItem.mockReturnValue(JSON.stringify(savedTasks));\nvar loadedTasks = todoList.loadTasks();\nexpect(loadedTasks).toEqual(savedTasks);\nexpect(localStorageMock.getItem).toHaveBeenCalledWith('todoTasks');"
      },
      {
        "name": "should return empty array when no saved tasks exist",
        "test": "localStorageMock.getItem.mockReturnValue(null);\nvar loadedTasks = todoList.loadTasks();\nexpect(loadedTasks).toEqual([]);"
      },
      {
        "name": "should initialize with tasks from storage",
        "test": "var savedTasks = [\n{ id: 1, text: 'Existing task', completed: true }\n];\nlocalStorageMock.getItem.mockReturnValue(JSON.stringify(savedTasks));\ntodoList.initialize();\nexpect(todoList.tasks).toEqual(savedTasks);"
      }
    ],
    "Adding Tasks": [
      {
        "name": "should add a valid task",
        "test": "var result = todoList.addTask('New task');\nexpect(result).toBe(true);\nexpect(todoList.tasks).toHaveLength(1);\nexpect(todoList.tasks[0]).toMatchObject({\ntext: 'New task',\ncompleted: false\n});\nexpect(todoList.tasks[0].id).toBeGreaterThan(0);"
      },
      {
        "name": "should trim whitespace from task text",
        "test": "todoList.addTask('  Spaced task  ');\nexpect(todoList.tasks[0].text).toBe('Spaced task');"
      },
      {
        "name": "should not add empty tasks",
        "test": "expect(todoList.addTask('')).toBe(false);\nexpect(todoList.addTask('   ')).toBe(false);\nexpect(todoList.addTask(null)).toBe(false);\nexpect(todoList.addTask(undefined)).toBe(false);\nexpect(todoList.tasks).toHaveLength(0);"
      },
      {
        "name": "should assign unique IDs to tasks",
        "test": "todoList.addTask('Task 1');\ntodoList.addTask('Task 2');\nexpect(todoList.tasks[0].id).not.toBe(todoList.tasks[1].id);\nexpect(todoList.tasks[1].id).toBeGreaterThan(todoList.tasks[0].id);"
      },
      {
        "name": "should save tasks to localStorage after adding",
        "test": "todoList.addTask('Test task');\nexpect(localStorageMock.setItem).toHaveBeenCalledWith(\n'todoTasks',\nJSON.stringify(todoList.tasks)\n);"
      }
    ],
    "Toggling Tasks": [
      {
        "name": "should toggle task completion status",
        "test": "var taskId = todoList.tasks[0].id;\nexpect(todoList.tasks[0].completed).toBe(false);\nvar result = todoList.toggleTask(taskId);\nexpect(result).toBe(true);\nexpect(todoList.tasks[0].completed).toBe(true);\ntodoList.toggleTask(taskId);\nexpect(todoList.tasks[0].completed).toBe(false);"
      },
      {
        "name": "should return false for non-existent task ID",
        "test": "var result = todoList.toggleTask(99999);\nexpect(result).toBe(false);"
      },
      {
        "name": "should save tasks to localStorage after toggling",
        "test": "var taskId = todoList.tasks[0].id;\nlocalStorageMock.setItem;\ntodoList.toggleTask(taskId);\nexpect(localStorageMock.setItem).toHaveBeenCalledWith(\n'todoTasks',\nJSON.stringify(todoList.tasks)\n);"
      }
    ],
    "Deleting Tasks": [
      {
        "name": "should delete existing task",
        "test": "var taskId = todoList.tasks[0].id;\nvar result = todoList.deleteTask(taskId);\nexpect(result).toBe(true);\nexpect(todoList.tasks).toHaveLength(1);\nexpect(todoList.tasks[0].text).toBe('Task 2');"
      },
      {
        "name": "should return false for non-existent task ID",
        "test": "var result = todoList.deleteTask(99999);\nexpect(result).toBe(false);\nexpect(todoList.tasks).toHaveLength(2);"
      },
      {
        "name": "should save tasks to localStorage after deleting",
        "test": "var taskId = todoList.tasks[0].id;\nlocalStorageMock.setItem;\ntodoList.deleteTask(taskId);\nexpect(localStorageMock.setItem).toHaveBeenCalledWith(\n'todoTasks',\nJSON.stringify(todoList.tasks)\n);"
      }
    ],
    "Task Retrieval": [
      {
        "name": "should return all tasks",
        "test": "var allTasks = todoList.getAllTasks();\nexpect(allTasks).toHaveLength(3);\nexpect(allTasks).not.toBe(todoList.tasks); // Should return a copy"
      },
      {
        "name": "should return completed tasks only",
        "test": "var completedTasks = todoList.getCompletedTasks();\nexpect(completedTasks).toHaveLength(1);\nexpect(completedTasks[0].text).toBe('Completed task');\nexpect(completedTasks[0].completed).toBe(true);"
      },
      {
        "name": "should return pending tasks only",
        "test": "var pendingTasks = todoList.getPendingTasks();\nexpect(pendingTasks).toHaveLength(2);\nexpect(pendingTasks.every(function(task) { return !task.completed; })).toBe(true);"
      },
      {
        "name": "should find task by ID",
        "test": "var taskId = todoList.tasks[1].id;\nvar task = todoList.getTaskById(taskId);\nexpect(task).toMatchObject({\nid: taskId,\ntext: 'Pending task 1',\ncompleted: false\n});"
      },
      {
        "name": "should return null for non-existent task ID",
        "test": "var task = todoList.getTaskById(99999);\nexpect(task).toBeNull();"
      }
    ],
    "Task Statistics": [
      {
        "name": "should return correct stats for empty list",
        "test": "var stats = todoList.getTaskStats();\nexpect(stats).toEqual({\ntotal: 0,\ncompleted: 0,\npending: 0\n});"
      },
      {
        "name": "should return correct stats with mixed tasks",
        "test": "todoList.addTask('Task 1');\ntodoList.addTask('Task 2');\ntodoList.addTask('Task 3');\ntodoList.toggleTask(todoList.tasks[0].id);\ntodoList.toggleTask(todoList.tasks[1].id);\nvar stats = todoList.getTaskStats();\nexpect(stats).toEqual({\ntotal: 3,\ncompleted: 2,\npending: 1\n});"
      }
    ],
    "Updating Tasks": [
      {
        "name": "should update task text",
        "test": "var taskId = todoList.tasks[0].id;\nvar result = todoList.updateTask(taskId, 'Updated text');\nexpect(result).toBe(true);\nexpect(todoList.tasks[0].text).toBe('Updated text');"
      },
      {
        "name": "should trim whitespace when updating",
        "test": "var taskId = todoList.tasks[0].id;\ntodoList.updateTask(taskId, '  Updated with spaces  ');\nexpect(todoList.tasks[0].text).toBe('Updated with spaces');"
      },
      {
        "name": "should not update with empty text",
        "test": "var taskId = todoList.tasks[0].id;\nvar originalText = todoList.tasks[0].text;\nexpect(todoList.updateTask(taskId, '')).toBe(false);\nexpect(todoList.updateTask(taskId, '   ')).toBe(false);\nexpect(todoList.tasks[0].text).toBe(originalText);"
      },
      {
        "name": "should return false for non-existent task ID",
        "test": "var result = todoList.updateTask(99999, 'New text');\nexpect(result).toBe(false);"
      },
      {
        "name": "should save tasks to localStorage after updating",
        "test": "var taskId = todoList.tasks[0].id;\nlocalStorageMock.setItem;\ntodoList.updateTask(taskId, 'Updated text');\nexpect(localStorageMock.setItem).toHaveBeenCalledWith(\n'todoTasks',\nJSON.stringify(todoList.tasks)\n);"
      }
    ],
    "Clearing Tasks": [
      {
        "name": "should clear all tasks",
        "test": "todoList.clearAllTasks();\nexpect(todoList.tasks).toHaveLength(0);"
      },
      {
        "name": "should clear completed tasks only",
        "test": "var cleared = todoList.clearCompletedTasks();\nexpect(cleared).toBe(2);\nexpect(todoList.tasks).toHaveLength(1);\nexpect(todoList.tasks[0].completed).toBe(false);"
      },
      {
        "name": "should return 0 when no completed tasks to clear",
        "test": "// First clear all completed tasks\ntodoList.clearCompletedTasks();\n// Try to clear again\nvar cleared = todoList.clearCompletedTasks();\nexpect(cleared).toBe(0);"
      },
      {
        "name": "should save tasks to localStorage after clearing",
        "test": "localStorageMock.setItem;\ntodoList.clearAllTasks();\nexpect(localStorageMock.setItem).toHaveBeenCalledWith(\n'todoTasks',\nJSON.stringify([])\n);"
      }
    ],
    "HTML Escaping": [
      {
        "name": "should escape HTML characters",
        "test": "expect(TodoListLogic.escapeHtml('<script>alert(\"xss\")</script>'))\n.toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');\nexpect(TodoListLogic.escapeHtml('Tom & Jerry'))\n.toBe('Tom &amp; Jerry');\nexpect(TodoListLogic.escapeHtml(\"It's a test\"))\n.toBe('It&#x27;s a test');"
      },
      {
        "name": "should handle empty and normal text",
        "test": "expect(TodoListLogic.escapeHtml('')).toBe('');\nexpect(TodoListLogic.escapeHtml('Normal text')).toBe('Normal text');"
      }
    ],
    "Edge Cases": [
      {
        "name": "should handle operations on empty task list",
        "test": "expect(todoList.toggleTask(1)).toBe(false);\nexpect(todoList.deleteTask(1)).toBe(false);\nexpect(todoList.updateTask(1, 'text')).toBe(false);\nexpect(todoList.getTaskById(1)).toBeNull();\nexpect(todoList.clearCompletedTasks()).toBe(0);"
      },
      {
        "name": "should handle multiple rapid additions",
        "test": "for (var i = 0; i < 100; i++) {\ntodoList.addTask(\"Task \" + i);\n}\nexpect(todoList.tasks).toHaveLength(100);\nexpect(new Set(todoList.tasks.map(function(t) { return t.id; })).size).toBe(100); // All IDs should be unique"
      },
      {
        "name": "should preserve task order",
        "test": "todoList.addTask('First');\ntodoList.addTask('Second');\ntodoList.addTask('Third');\nexpect(todoList.tasks[0].text).toBe('First');\nexpect(todoList.tasks[1].text).toBe('Second');\nexpect(todoList.tasks[2].text).toBe('Third');"
      }
    ],
    "LocalStorage Integration": [
      {
        "name": "should handle localStorage unavailable gracefully",
        "test": "// Temporarily remove localStorage\nvar originalLocalStorage = global.localStorage;\ndelete global.localStorage;\nvar todoListWithoutStorage = new TodoListLogic();\nexpect(todoListWithoutStorage.loadTasks()).toEqual([]);\nexpect(() => todoListWithoutStorage.saveTasks()).not.toThrow();\nexpect(() => todoListWithoutStorage.addTask('Test')).not.toThrow();\n// Restore localStorage\nglobal.localStorage = originalLocalStorage;"
      },
      {
        "name": "should handle corrupt localStorage data",
        "test": "localStorageMock.getItem.mockReturnValue('invalid json');\nexpect(() => todoList.loadTasks()).toThrow();"
      }
    ]
  },
  "TopBarComponent": {
    "createTopBar function": [
      {
        "name": "should include version information in the top bar",
        "test": "var topBarHTML = createTopBar();\nexpect(topBarHTML).toContain('class=\"version\"');\nexpect(topBarHTML).toContain('v1.0.0');"
      },
      {
        "name": "should maintain existing structure with logo, title, and navigation",
        "test": "var topBarHTML = createTopBar();\nexpect(topBarHTML).toContain('class=\"top-bar\"');\nexpect(topBarHTML).toContain('class=\"logo\"');\nexpect(topBarHTML).toContain('My GitHub Page');\nexpect(topBarHTML).toContain('class=\"navigation\"');\nexpect(topBarHTML).toContain('Home');\nexpect(topBarHTML).toContain('Projects');\nexpect(topBarHTML).toContain('Test Visualizer');"
      },
      {
        "name": "should respect pathToRoot option for relative paths",
        "test": "var topBarHTML = createTopBar({ pathToRoot: '../' });\nexpect(topBarHTML).toContain('src=\"../favicon.svg\"');\nexpect(topBarHTML).toContain('href=\"../index.html#hero\"');\nexpect(topBarHTML).toContain('href=\"../test-results.html\"');"
      },
      {
        "name": "should use fallback version when package.json fails to load",
        "test": "// Mock fetch to fail\nglobal.fetch.mockImplementation(() => Promise.reject(new Error('Failed to load')));\nvar topBarHTML = createTopBar();\nexpect(topBarHTML).toContain('class=\"version\"');\nexpect(topBarHTML).toContain('v1.0.0'); // fallback version"
      },
      {
        "name": "should use version from package.json when available",
        "test": "// Mock fetch to return different version\nglobal.fetch.mockImplementation(function(url) {\nif (url.includes('package.json')) {\nreturn Promise.resolve({\nok: true,\njson: () => Promise.resolve({ version: '2.5.1' })\n});\n}\nreturn Promise.reject(new Error('Not found'));\n});\nvar topBarHTML = createTopBar();\nexpect(topBarHTML).toContain('class=\"version\"');\nexpect(topBarHTML).toContain('v2.5.1');"
      }
    ],
    "insertTopBar function": [
      {
        "name": "should insert top bar as first element in body",
        "test": "// Add some existing content\ndocument.body.innerHTML = '<main>Existing content</main>';\ninsertTopBar();\nvar topBar = document.querySelector('.top-bar');\nexpect(topBar).toBeTruthy();\nexpect(document.body.firstElementChild).toBe(topBar);\n// Check that version is included\nvar version = topBar.querySelector('.version');\nexpect(version).toBeTruthy();\nexpect(version.textContent.trim()).toBe('v1.0.0');"
      },
      {
        "name": "should not insert duplicate top bar",
        "test": "insertTopBar();\ninsertTopBar(); // Try to insert again\nvar topBars = document.querySelectorAll('.top-bar');\nexpect(topBars.length).toBe(1);"
      }
    ],
    "updateFaviconPath function": [
      {
        "name": "should update favicon href with correct base path",
        "test": "// Set up a favicon link element\ndocument.head.innerHTML = '<link rel=\"icon\" href=\"favicon.svg\" type=\"image/svg+xml\">';\nupdateFaviconPath('/Chatgpt-Test-webpage/');\nvar faviconLink = document.querySelector('link[rel=\"icon\"]');\nexpect(faviconLink.href).toBe('http://localhost/Chatgpt-Test-webpage/favicon.svg');"
      },
      {
        "name": "should handle missing favicon gracefully",
        "test": "// No favicon link element\ndocument.head.innerHTML = '';\n// Should not throw an error\nexpect(() => {\nupdateFaviconPath('/Chatgpt-Test-webpage/');\n}).not.toThrow();"
      },
      {
        "name": "should update favicon when inserting top bar",
        "test": "// Set up a favicon link element\ndocument.head.innerHTML = '<link rel=\"icon\" href=\"favicon.svg\" type=\"image/svg+xml\">';\n// Mock GitHub Pages environment\nObject.defineProperty(window, 'location', {\nvalue: {\nhostname: 'tleety.github.io',\npathname: '/Chatgpt-Test-webpage/index.html',\nhref: 'https://tleety.github.io/Chatgpt-Test-webpage/index.html'\n},\nwritable: true\n});\ninsertTopBar();\nvar faviconLink = document.querySelector('link[rel=\"icon\"]');\nexpect(faviconLink.href).toBe('http://localhost/Chatgpt-Test-webpage/favicon.svg');"
      }
    ]
  }
};

// Convert string test bodies back to functions
for (var suiteName in testSuites) {
  for (var categoryName in testSuites[suiteName]) {
    for (var i = 0; i < testSuites[suiteName][categoryName].length; i++) {
      var test = testSuites[suiteName][categoryName][i];
      if (typeof test.test === 'string') {
        test.test = new Function(test.test);
      }
    }
  }
}

// Export for use in test-results.html
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testSuites;
}
