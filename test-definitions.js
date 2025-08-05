// Auto-generated test definitions from Jest files
// Generated to ensure synchronization with CI/CD pipeline tests
// DO NOT EDIT MANUALLY - These mirror the actual Jest test files

var testSuites = {
  "SnakeGameLogic": {
    "Initialization": [
      {
        "name": "should initialize with correct default values",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          expect(game.gameWidth).toBe(400);
          expect(game.gameHeight).toBe(300);
          expect(game.CELL_SIZE).toBe(20);
          expect(game.score).toBe(0);
          expect(game.snake).toHaveLength(1);
          expect(game.direction).toEqual({ x: 20, y: 0 });
        }
      },
      {
        "name": "should place snake in center of game area",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          var expectedX = Math.floor(400 / 2 / 20) * 20; // 200
          var expectedY = Math.floor(300 / 2 / 20) * 20; // 140
          expect(game.snake[0]).toEqual({ x: expectedX, y: expectedY });
        }
      },
      {
        "name": "should place food at valid position",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          expect(game.food).toBeDefined();
          expect(game.food.x).toBeGreaterThanOrEqual(0);
          expect(game.food.x).toBeLessThan(400);
          expect(game.food.y).toBeGreaterThanOrEqual(0);
          expect(game.food.y).toBeLessThan(300);
          expect(game.food.x % 20).toBe(0);
          expect(game.food.y % 20).toBe(0);
        }
      }
    ],
    "Direction Changes": [
      {
        "name": "should allow valid direction changes",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          // Starting direction is right (x: 20, y: 0)
          expect(game.changeDirection({ x: 0, y: -20 })).toBe(true); // up
          expect(game.direction).toEqual({ x: 0, y: -20 });
          expect(game.changeDirection({ x: -20, y: 0 })).toBe(true); // left
          expect(game.direction).toEqual({ x: -20, y: 0 });
        }
      },
      {
        "name": "should prevent 180-degree turns", 
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          // Starting direction is right (x: 20, y: 0)
          expect(game.changeDirection({ x: -20, y: 0 })).toBe(false); // left (opposite)
          expect(game.direction).toEqual({ x: 20, y: 0 }); // unchanged
          // Change to up
          game.changeDirection({ x: 0, y: -20 });
          expect(game.changeDirection({ x: 0, y: 20 })).toBe(false); // down (opposite)
          expect(game.direction).toEqual({ x: 0, y: -20 }); // unchanged
        }
      },
      {
        "name": "should validate direction changes correctly",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          // Right direction
          game.direction = { x: 20, y: 0 };
          expect(game.isValidDirectionChange({ x: 0, y: 20 })).toBe(true);  // down
          expect(game.isValidDirectionChange({ x: 0, y: -20 })).toBe(true); // up
          expect(game.isValidDirectionChange({ x: -20, y: 0 })).toBe(false); // left (opposite)
          // Up direction  
          game.direction = { x: 0, y: -20 };
          expect(game.isValidDirectionChange({ x: 20, y: 0 })).toBe(true);  // right
          expect(game.isValidDirectionChange({ x: -20, y: 0 })).toBe(true); // left
          expect(game.isValidDirectionChange({ x: 0, y: 20 })).toBe(false); // down (opposite)
        }
      }
    ],
    "Collision Detection": [
      {
        "name": "should detect wall collisions",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          expect(game.isWallCollision(-20, 140)).toBe(true);  // left wall
          expect(game.isWallCollision(400, 140)).toBe(true);  // right wall
          expect(game.isWallCollision(200, -20)).toBe(true);  // top wall
          expect(game.isWallCollision(200, 300)).toBe(true);  // bottom wall
          expect(game.isWallCollision(200, 140)).toBe(false); // inside bounds
        }
      },
      {
        "name": "should detect self collisions",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          // Add more segments to snake
          game.snake = [
            { x: 200, y: 140 },
            { x: 180, y: 140 },
            { x: 160, y: 140 }
          ];
          expect(game.isSelfCollision(180, 140)).toBe(true);  // hits body
          expect(game.isSelfCollision(160, 140)).toBe(true);  // hits tail
          expect(game.isSelfCollision(220, 140)).toBe(false); // clear space
        }
      },
      {
        "name": "should detect food collisions",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          game.food = { x: 100, y: 100 };
          expect(game.isFoodCollision(100, 100)).toBe(true);
          expect(game.isFoodCollision(120, 100)).toBe(false);
        }
      }
    ],
    "Snake Movement": [
      {
        "name": "should move snake forward correctly",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          var initialHeadX = game.snake[0].x;
          var result = game.moveSnake();
          expect(result.collision).toBe(false);
          expect(result.ateFood).toBe(false);
          expect(game.snake[0].x).toBe(initialHeadX + 20);
          expect(game.snake).toHaveLength(1); // tail removed since no food eaten
        }
      },
      {
        "name": "should grow snake when eating food",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          var originalLength = game.snake.length;
          // Place food right in front of snake
          var headX = game.snake[0].x;
          var headY = game.snake[0].y;
          game.food = { x: headX + game.direction.x, y: headY + game.direction.y };
          var result = game.moveSnake();
          expect(result.ateFood).toBe(true);
          expect(game.snake).toHaveLength(originalLength + 1);
        }
      },
      {
        "name": "should detect collision with wall",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          // Move snake to edge
          game.snake[0] = { x: game.gameWidth - game.CELL_SIZE, y: 100 };
          var result = game.moveSnake();
          expect(result.collision).toBe(true);
        }
      },
      {
        "name": "should detect collision with self",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          // Create a snake that will collide with itself
          game.snake = [
            { x: 100, y: 100 },
            { x: 80, y: 100 },
            { x: 60, y: 100 },
            { x: 60, y: 80 },
            { x: 80, y: 80 },
            { x: 100, y: 80 }
          ];
          game.direction = { x: 0, y: 20 };
          var result = game.moveSnake();
          expect(result.collision).toBe(true);
        }
      }
    ],
    "Food Placement": [
      {
        "name": "should place food in valid grid positions",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          var food = game.placeFood();
          expect(food.x).toBeGreaterThanOrEqual(0);
          expect(food.x).toBeLessThan(400);
          expect(food.y).toBeGreaterThanOrEqual(0);
          expect(food.y).toBeLessThan(300);
          expect(food.x % 20).toBe(0);
          expect(food.y % 20).toBe(0);
        }
      },
      {
        "name": "should not place food on snake body",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          // Create a large snake
          for (var i = 0; i < 50; i++) {
            game.snake.push({ x: i * 20, y: 0 });
          }
          var food = game.placeFood();
          var isOnSnake = game.snake.some(function(segment) {
            return segment.x === food.x && segment.y === food.y;
          });
          expect(isOnSnake).toBe(false);
        }
      }
    ],
    "Game State": [
      {
        "name": "should return complete game state",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          var state = game.getGameState();
          expect(state).toHaveProperty('snake');
          expect(state).toHaveProperty('food');
          expect(state).toHaveProperty('score');
          expect(state).toHaveProperty('direction');
          expect(state.snake).toEqual(game.snake);
          expect(state.food).toEqual(game.food);
          expect(state.score).toBe(game.score);
          expect(state.direction).toEqual(game.direction);
        }
      },
      {
        "name": "should reset game state correctly",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          // Modify game state
          game.score = 100;
          game.snake.push({ x: 220, y: 140 });
          game.direction = { x: 0, y: -20 };
          
          game.reset();
          expect(game.score).toBe(0);
          expect(game.snake).toHaveLength(1);
          expect(game.direction).toEqual({ x: 20, y: 0 });
          expect(game.food).toBeDefined();
        }
      }
    ],
    "Edge Cases": [
      {
        "name": "should handle very small game area",
        "test": function() {
          var game = new SnakeGameLogic(40, 40);
          expect(game.snake).toHaveLength(1);
          expect(game.food).toBeDefined();
          expect(game.snake[0].x).toBeGreaterThanOrEqual(0);
          expect(game.snake[0].x).toBeLessThan(40);
          expect(game.snake[0].y).toBeGreaterThanOrEqual(0);
          expect(game.snake[0].y).toBeLessThan(40);
        }
      },
      {
        "name": "should handle food placement when most spaces are occupied",
        "test": function() {
          var game = new SnakeGameLogic(60, 60);
          // Fill most of the space with snake segments
          game.snake = [];
          for (var x = 0; x < 60; x += 20) {
            for (var y = 0; y < 40; y += 20) {
              game.snake.push({ x: x, y: y });
            }
          }
          
          var food = game.placeFood();
          expect(food).toBeDefined();
          expect(food.x).toBeGreaterThanOrEqual(0);
          expect(food.y).toBeGreaterThanOrEqual(0);
          var isOnSnake = game.snake.some(function(segment) {
            return segment.x === food.x && segment.y === food.y;
          });
          expect(isOnSnake).toBe(false);
        }
      }
    ],
    "High Score Management": [
      {
        "name": "getHighScores should return empty array when no scores exist",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('snakeGameHighScores');
          }
          var scores = game.getHighScores();
          expect(scores).toEqual([]);
        }
      },
      {
        "name": "addHighScore should add score when list is empty",
        "test": function() {
          var game = new SnakeGameLogic(400, 300);
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('snakeGameHighScores');
          }
          game.addHighScore('Player1', 100);
          var scores = game.getHighScores();
          expect(scores).toHaveLength(1);
          expect(scores[0]).toEqual({ score: 100, name: 'Player1' });
        }
      }
    ]
  },
  "TodoListLogic": {
    "Initialization": [
      {
        "name": "should initialize with empty tasks array",
        "test": function() {
          var todoList = new TodoListLogic();
          expect(todoList.tasks).toEqual([]);
          expect(todoList.nextId).toBeGreaterThan(0);
        }
      }
    ],
    "Adding Tasks": [
      {
        "name": "should add a valid task",
        "test": function() {
          var todoList = new TodoListLogic();
          var result = todoList.addTask('New task');
          expect(result).toBe(true);
          expect(todoList.tasks).toHaveLength(1);
          expect(todoList.tasks[0].text).toBe('New task');
          expect(todoList.tasks[0].completed).toBe(false);
          expect(todoList.tasks[0].id).toBeGreaterThan(0);
        }
      },
      {
        "name": "should not add empty tasks",
        "test": function() {
          var todoList = new TodoListLogic();
          expect(todoList.addTask('')).toBe(false);
          expect(todoList.addTask('   ')).toBe(false);
          expect(todoList.addTask(null)).toBe(false);
          expect(todoList.addTask(undefined)).toBe(false);
          expect(todoList.tasks).toHaveLength(0);
        }
      }
    ]
  },
  "TopBarComponent": {
    "createTopBar function": [
      {
        "name": "should include version information in the top bar",
        "test": function() {
          var topBarHTML = createTopBar();
          expect(topBarHTML).toContain('class="version"');
          expect(topBarHTML).toContain('v1.0.0');
        }
      },
      {
        "name": "should maintain existing structure with logo, title, and navigation",
        "test": function() {
          var topBarHTML = createTopBar();
          expect(topBarHTML).toContain('class="top-bar"');
          expect(topBarHTML).toContain('class="logo"');
          expect(topBarHTML).toContain('My GitHub Page');
          expect(topBarHTML).toContain('class="navigation"');
          expect(topBarHTML).toContain('Home');
          expect(topBarHTML).toContain('Projects');
          expect(topBarHTML).toContain('Test Visualizer');
        }
      }
    ]
  },
  "SnakeGameUI": {
    "UI Tests": [
      {
        "name": "should prevent default behavior for arrow keys",
        "test": function() {
          // Simulate the keydown event handler from the game
          var keys = {};
          var gameRunning = true;
          
          var keydownHandler = function(e) {
            keys[e.code] = true;
            
            if (e.code === 'Space' && !gameRunning) {
              e.preventDefault();
            }
            
            // Prevent default behavior for arrow keys to stop page scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
              e.preventDefault();
            }
          };
          
          // Test each arrow key
          var arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
          
          for (var i = 0; i < arrowKeys.length; i++) {
            var keyCode = arrowKeys[i];
            var mockEvent = {
              code: keyCode,
              preventDefault: function() { 
                mockEvent.preventDefaultCalled = true; 
              }
            };
            
            keydownHandler(mockEvent);
            
            expect(mockEvent.preventDefaultCalled).toBe(true);
          }
        }
      },
      {
        "name": "should not prevent default for non-arrow keys",
        "test": function() {
          var keys = {};
          var gameRunning = true;
          
          var keydownHandler = function(e) {
            keys[e.code] = true;
            
            if (e.code === 'Space' && !gameRunning) {
              e.preventDefault();
            }
            
            // Prevent default behavior for arrow keys to stop page scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
              e.preventDefault();
            }
          };
          
          // Test non-arrow keys
          var nonArrowKeys = ['KeyA', 'KeyW', 'KeyS', 'KeyD', 'Enter', 'Escape'];
          
          for (var i = 0; i < nonArrowKeys.length; i++) {
            var keyCode = nonArrowKeys[i];
            var mockEvent = {
              code: keyCode,
              preventDefault: function() { 
                mockEvent.preventDefaultCalled = true; 
              }
            };
            
            keydownHandler(mockEvent);
            
            expect(mockEvent.preventDefaultCalled || false).toBe(false);
          }
        }
      },
      {
        "name": "should prevent default for Space key when game is not running",
        "test": function() {
          var keys = {};
          var gameRunning = false; // Game over state
          
          var keydownHandler = function(e) {
            keys[e.code] = true;
            
            if (e.code === 'Space' && !gameRunning) {
              e.preventDefault();
            }
            
            // Prevent default behavior for arrow keys to stop page scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
              e.preventDefault();
            }
          };
          
          var mockEvent = {
            code: 'Space',
            preventDefault: function() { 
              mockEvent.preventDefaultCalled = true; 
            }
          };
          
          keydownHandler(mockEvent);
          
          expect(mockEvent.preventDefaultCalled).toBe(true);
        }
      },
      {
        "name": "should not prevent default for Space key when game is running",
        "test": function() {
          var keys = {};
          var gameRunning = true; // Game is active
          
          var keydownHandler = function(e) {
            keys[e.code] = true;
            
            if (e.code === 'Space' && !gameRunning) {
              e.preventDefault();
            }
            
            // Prevent default behavior for arrow keys to stop page scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
              e.preventDefault();
            }
          };
          
          var mockEvent = {
            code: 'Space',
            preventDefault: function() { 
              mockEvent.preventDefaultCalled = true; 
            }
          };
          
          keydownHandler(mockEvent);
          
          expect(mockEvent.preventDefaultCalled || false).toBe(false);
        }
      }
    ]
  }
};

// Export for use in test-results.html
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testSuites;
}