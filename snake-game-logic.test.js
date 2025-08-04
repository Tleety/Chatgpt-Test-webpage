/**
 * Unit tests for Snake Game Logic
 */

const SnakeGameLogic = require('./snake-game-logic');

describe('SnakeGameLogic', () => {
  let game;

  beforeEach(() => {
    // Use smaller game area for easier testing
    game = new SnakeGameLogic(400, 300);
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(game.gameWidth).toBe(400);
      expect(game.gameHeight).toBe(300);
      expect(game.CELL_SIZE).toBe(20);
      expect(game.score).toBe(0);
      expect(game.snake).toHaveLength(1);
      expect(game.direction).toEqual({ x: 20, y: 0 });
    });

    test('should place snake in center of game area', () => {
      const expectedX = Math.floor(400 / 2 / 20) * 20; // 200
      const expectedY = Math.floor(300 / 2 / 20) * 20; // 140
      expect(game.snake[0]).toEqual({ x: expectedX, y: expectedY });
    });

    test('should place food at valid position', () => {
      expect(game.food).toBeDefined();
      expect(game.food.x).toBeGreaterThanOrEqual(0);
      expect(game.food.x).toBeLessThan(400);
      expect(game.food.y).toBeGreaterThanOrEqual(0);
      expect(game.food.y).toBeLessThan(300);
      expect(game.food.x % 20).toBe(0);
      expect(game.food.y % 20).toBe(0);
    });
  });

  describe('Direction Changes', () => {
    test('should allow valid direction changes', () => {
      // Starting direction is right (x: 20, y: 0)
      expect(game.changeDirection({ x: 0, y: -20 })).toBe(true); // up
      expect(game.direction).toEqual({ x: 0, y: -20 });
      
      expect(game.changeDirection({ x: -20, y: 0 })).toBe(true); // left
      expect(game.direction).toEqual({ x: -20, y: 0 });
    });

    test('should prevent 180-degree turns', () => {
      // Starting direction is right (x: 20, y: 0)
      expect(game.changeDirection({ x: -20, y: 0 })).toBe(false); // left (opposite)
      expect(game.direction).toEqual({ x: 20, y: 0 }); // unchanged
      
      // Change to up
      game.changeDirection({ x: 0, y: -20 });
      expect(game.changeDirection({ x: 0, y: 20 })).toBe(false); // down (opposite)
      expect(game.direction).toEqual({ x: 0, y: -20 }); // unchanged
    });

    test('should validate direction changes correctly', () => {
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
    });
  });

  describe('Collision Detection', () => {
    test('should detect wall collisions', () => {
      expect(game.isWallCollision(-20, 140)).toBe(true);  // left wall
      expect(game.isWallCollision(400, 140)).toBe(true);  // right wall
      expect(game.isWallCollision(200, -20)).toBe(true);  // top wall
      expect(game.isWallCollision(200, 300)).toBe(true);  // bottom wall
      expect(game.isWallCollision(200, 140)).toBe(false); // inside bounds
    });

    test('should detect self collisions', () => {
      // Add more segments to snake
      game.snake = [
        { x: 200, y: 140 },
        { x: 180, y: 140 },
        { x: 160, y: 140 }
      ];
      
      expect(game.isSelfCollision(180, 140)).toBe(true);  // hits body
      expect(game.isSelfCollision(160, 140)).toBe(true);  // hits tail
      expect(game.isSelfCollision(220, 140)).toBe(false); // clear space
    });

    test('should detect food collisions', () => {
      game.food = { x: 100, y: 100 };
      expect(game.isFoodCollision(100, 100)).toBe(true);
      expect(game.isFoodCollision(120, 100)).toBe(false);
    });
  });

  describe('Snake Movement', () => {
    test('should move snake forward correctly', () => {
      const initialHeadX = game.snake[0].x;
      const result = game.moveSnake();
      
      expect(result.collision).toBe(false);
      expect(result.ateFood).toBe(false);
      expect(game.snake[0].x).toBe(initialHeadX + 20);
      expect(game.snake).toHaveLength(1); // tail removed since no food eaten
    });

    test('should grow snake when eating food', () => {
      // Place food right in front of snake
      const headX = game.snake[0].x;
      const headY = game.snake[0].y;
      game.food = { x: headX + 20, y: headY };
      const initialScore = game.score;
      
      const result = game.moveSnake();
      
      expect(result.collision).toBe(false);
      expect(result.ateFood).toBe(true);
      expect(result.newScore).toBe(initialScore + 1);
      expect(game.snake).toHaveLength(2); // snake grew
      expect(game.score).toBe(initialScore + 1);
    });

    test('should detect collision with wall', () => {
      // Move snake to right edge
      game.snake = [{ x: 380, y: 140 }];
      game.direction = { x: 20, y: 0 };
      
      const result = game.moveSnake();
      
      expect(result.collision).toBe(true);
      expect(result.ateFood).toBe(false);
    });

    test('should detect collision with self', () => {
      // Create a snake that will collide with itself
      game.snake = [
        { x: 200, y: 140 },
        { x: 180, y: 140 },
        { x: 160, y: 140 },
        { x: 160, y: 120 },
        { x: 180, y: 120 },
        { x: 200, y: 120 }
      ];
      game.direction = { x: 0, y: 20 }; // moving down into body
      
      // The head at (200, 140) moving down by 20 will be at (200, 160)
      // But there's no body segment at (200, 160), so let's fix this
      game.snake = [
        { x: 200, y: 120 }, // head
        { x: 180, y: 120 },
        { x: 160, y: 120 },
        { x: 160, y: 140 },
        { x: 180, y: 140 },
        { x: 200, y: 140 } // body segment that head will hit
      ];
      game.direction = { x: 0, y: 20 }; // moving down, will hit (200, 140)
      
      const result = game.moveSnake();
      
      expect(result.collision).toBe(true);
    });
  });

  describe('Food Placement', () => {
    test('should place food in valid grid positions', () => {
      for (let i = 0; i < 10; i++) {
        const food = game.placeFood();
        expect(food.x % 20).toBe(0);
        expect(food.y % 20).toBe(0);
        expect(food.x).toBeGreaterThanOrEqual(0);
        expect(food.x).toBeLessThan(400);
        expect(food.y).toBeGreaterThanOrEqual(0);
        expect(food.y).toBeLessThan(300);
      }
    });

    test('should not place food on snake body', () => {
      // Create a long snake
      game.snake = [
        { x: 100, y: 100 },
        { x: 80, y: 100 },
        { x: 60, y: 100 },
        { x: 40, y: 100 },
        { x: 20, y: 100 }
      ];
      
      const food = game.placeFood();
      
      // Food should not be on any snake segment
      expect(game.snake.some(seg => seg.x === food.x && seg.y === food.y)).toBe(false);
    });
  });

  describe('Game State', () => {
    test('should return complete game state', () => {
      const state = game.getGameState();
      
      expect(state).toHaveProperty('snake');
      expect(state).toHaveProperty('food');
      expect(state).toHaveProperty('direction');
      expect(state).toHaveProperty('score');
      expect(state).toHaveProperty('gameWidth');
      expect(state).toHaveProperty('gameHeight');
      
      expect(state.snake).toHaveLength(game.snake.length);
      expect(state.score).toBe(game.score);
    });

    test('should reset game state correctly', () => {
      // Modify game state
      game.score = 10;
      game.snake = [{ x: 100, y: 100 }, { x: 80, y: 100 }];
      game.direction = { x: 0, y: -20 };
      
      game.reset();
      
      expect(game.score).toBe(0);
      expect(game.snake).toHaveLength(1);
      expect(game.direction).toEqual({ x: 20, y: 0 });
      expect(game.snake[0].x).toBe(200); // back to center
      expect(game.snake[0].y).toBe(140);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very small game area', () => {
      const smallGame = new SnakeGameLogic(40, 40);
      expect(smallGame.snake).toHaveLength(1);
      expect(smallGame.food).toBeDefined();
    });

    test('should handle food placement when most spaces are occupied', () => {
      // Fill most of the game area with snake
      const segments = [];
      for (let y = 0; y < 300; y += 20) {
        for (let x = 0; x < 380; x += 20) { // leave some space
          segments.push({ x, y });
        }
      }
      game.snake = segments;
      
      const food = game.placeFood();
      expect(food).toBeDefined();
      expect(game.snake.some(seg => seg.x === food.x && seg.y === food.y)).toBe(false);
    });
  });
});