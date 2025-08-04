const SnakeGame = require('../phaser-game/snake-game');

describe('SnakeGame', () => {
  let game;

  beforeEach(() => {
    game = new SnakeGame({ width: 800, height: 600 });
    game.initGame();
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(game.CELL_SIZE).toBe(20);
      expect(game.config.width).toBe(800);
      expect(game.config.height).toBe(600);
      expect(game.score).toBe(0);
    });

    test('should start snake in center of game area', () => {
      const expectedX = Math.floor(800 / 2 / 20) * 20; // 400
      const expectedY = Math.floor(600 / 2 / 20) * 20; // 300
      const head = game.getHeadPosition();
      
      expect(head.x).toBe(expectedX);
      expect(head.y).toBe(expectedY);
    });

    test('should start with snake length of 1', () => {
      expect(game.getSnakeLength()).toBe(1);
    });

    test('should start moving right', () => {
      expect(game.direction.x).toBe(20);
      expect(game.direction.y).toBe(0);
    });

    test('should place initial food', () => {
      expect(game.food.x).toBeDefined();
      expect(game.food.y).toBeDefined();
      expect(game.food.x % 20).toBe(0);
      expect(game.food.y % 20).toBe(0);
    });
  });

  describe('Direction Changes', () => {
    test('should allow changing from right to up', () => {
      const result = game.changeDirection({ x: 0, y: -20 });
      expect(result).toBe(true);
      expect(game.direction.x).toBe(0);
      expect(game.direction.y).toBe(-20);
    });

    test('should allow changing from right to down', () => {
      const result = game.changeDirection({ x: 0, y: 20 });
      expect(result).toBe(true);
      expect(game.direction.x).toBe(0);
      expect(game.direction.y).toBe(20);
    });

    test('should not allow changing from right to left (opposite direction)', () => {
      const result = game.changeDirection({ x: -20, y: 0 });
      expect(result).toBe(false);
      expect(game.direction.x).toBe(20); // Should remain right
      expect(game.direction.y).toBe(0);
    });

    test('should allow changing from up to left', () => {
      game.direction = { x: 0, y: -20 }; // Set to up first
      const result = game.changeDirection({ x: -20, y: 0 });
      expect(result).toBe(true);
      expect(game.direction.x).toBe(-20);
      expect(game.direction.y).toBe(0);
    });

    test('should not allow changing from up to down (opposite direction)', () => {
      game.direction = { x: 0, y: -20 }; // Set to up first
      const result = game.changeDirection({ x: 0, y: 20 });
      expect(result).toBe(false);
      expect(game.direction.x).toBe(0);
      expect(game.direction.y).toBe(-20); // Should remain up
    });
  });

  describe('Snake Movement', () => {
    test('should move snake head forward', () => {
      const initialHead = game.getHeadPosition();
      const result = game.moveSnake();
      const newHead = game.getHeadPosition();
      
      expect(result.collision).toBe(false);
      expect(result.gameOver).toBe(false);
      expect(newHead.x).toBe(initialHead.x + 20);
      expect(newHead.y).toBe(initialHead.y);
    });

    test('should maintain snake length when no food eaten', () => {
      const initialLength = game.getSnakeLength();
      game.moveSnake();
      expect(game.getSnakeLength()).toBe(initialLength);
    });

    test('should increase snake length when food eaten', () => {
      // Position food directly in front of snake
      const head = game.getHeadPosition();
      game.food = { x: head.x + 20, y: head.y };
      
      const initialLength = game.getSnakeLength();
      const result = game.moveSnake();
      
      expect(result.foodEaten).toBe(true);
      expect(game.getSnakeLength()).toBe(initialLength + 1);
    });

    test('should increase score when food eaten', () => {
      // Position food directly in front of snake
      const head = game.getHeadPosition();
      game.food = { x: head.x + 20, y: head.y };
      
      const initialScore = game.score;
      game.moveSnake();
      
      expect(game.score).toBe(initialScore + 1);
    });
  });

  describe('Collision Detection', () => {
    test('should detect wall collision - left wall', () => {
      const collision = game.checkCollision(-20, 300);
      expect(collision).toBe(true);
    });

    test('should detect wall collision - right wall', () => {
      const collision = game.checkCollision(800, 300);
      expect(collision).toBe(true);
    });

    test('should detect wall collision - top wall', () => {
      const collision = game.checkCollision(400, -20);
      expect(collision).toBe(true);
    });

    test('should detect wall collision - bottom wall', () => {
      const collision = game.checkCollision(400, 600);
      expect(collision).toBe(true);
    });

    test('should not detect collision for valid position', () => {
      const collision = game.checkCollision(100, 100);
      expect(collision).toBe(false);
    });

    test('should detect self-collision', () => {
      // Add more segments to snake
      game.snake.push({ x: 380, y: 300 });
      game.snake.push({ x: 360, y: 300 });
      
      // Check collision with existing segment
      const collision = game.checkCollision(380, 300);
      expect(collision).toBe(true);
    });

    test('should return game over when hitting wall', () => {
      // Move snake to edge and try to go through wall
      game.snake = [{ x: 780, y: 300 }]; // Near right edge
      game.direction = { x: 20, y: 0 }; // Moving right
      
      const result = game.moveSnake();
      expect(result.collision).toBe(true);
      expect(result.gameOver).toBe(true);
    });
  });

  describe('Food Placement', () => {
    test('should place food on grid-aligned coordinates', () => {
      game.placeFood();
      expect(game.food.x % 20).toBe(0);
      expect(game.food.y % 20).toBe(0);
    });

    test('should place food within game boundaries', () => {
      game.placeFood();
      expect(game.food.x).toBeGreaterThanOrEqual(0);
      expect(game.food.x).toBeLessThan(800);
      expect(game.food.y).toBeGreaterThanOrEqual(0);
      expect(game.food.y).toBeLessThan(600);
    });

    test('should not place food on snake body', () => {
      // Create a large snake to increase chance of conflict
      game.snake = [];
      for (let i = 0; i < 50; i++) {
        game.snake.push({ x: i * 20, y: 0 });
      }
      
      game.placeFood();
      
      // Check that food is not on any snake segment
      const foodOnSnake = game.snake.some(segment => 
        segment.x === game.food.x && segment.y === game.food.y
      );
      expect(foodOnSnake).toBe(false);
    });
  });

  describe('Food Collision', () => {
    test('should detect food collision when coordinates match', () => {
      game.food = { x: 100, y: 100 };
      const collision = game.checkFoodCollision(100, 100);
      expect(collision).toBe(true);
    });

    test('should not detect food collision when coordinates do not match', () => {
      game.food = { x: 100, y: 100 };
      const collision = game.checkFoodCollision(120, 100);
      expect(collision).toBe(false);
    });
  });

  describe('Game State', () => {
    test('should return correct game state', () => {
      const state = game.getGameState();
      
      expect(state.snake).toEqual(game.snake);
      expect(state.direction).toEqual(game.direction);
      expect(state.food).toEqual(game.food);
      expect(state.score).toBe(game.score);
    });

    test('should return independent copies of state objects', () => {
      const state = game.getGameState();
      
      // Modify returned state
      state.snake.push({ x: 999, y: 999 });
      state.direction.x = 999;
      state.food.x = 999;
      state.score = 999;
      
      // Original game state should be unchanged
      expect(game.snake.length).toBe(1);
      expect(game.direction.x).toBe(20);
      expect(game.food.x).not.toBe(999);
      expect(game.score).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty snake gracefully', () => {
      game.snake = [];
      const head = game.getHeadPosition();
      expect(head).toBeNull();
    });

    test('should handle game with custom dimensions', () => {
      const customGame = new SnakeGame({ width: 400, height: 300 });
      customGame.initGame();
      
      expect(customGame.config.width).toBe(400);
      expect(customGame.config.height).toBe(300);
      
      const head = customGame.getHeadPosition();
      expect(head.x).toBe(200); // Center of 400
      expect(head.y).toBe(140); // Center of 300 (rounded to grid)
    });

    test('should prevent infinite loop in food placement', () => {
      // Fill entire game area with snake except one spot
      game.snake = [];
      const totalCells = (800 / 20) * (600 / 20);
      
      // Create snake that fills most of the game area
      for (let i = 0; i < totalCells - 1; i++) {
        const x = (i % (800 / 20)) * 20;
        const y = Math.floor(i / (800 / 20)) * 20;
        game.snake.push({ x, y });
      }
      
      // This should still work and not cause infinite loop
      const result = game.placeFood();
      expect(result).toBeDefined();
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
    });
  });
});