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

  describe('Experience and Level Management', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('snakeGameExperience');
      }
    });

    describe('getExperience', () => {
      test('should return 0 when no experience exists', () => {
        expect(game.getExperience()).toBe(0);
      });

      test('should return stored experience from localStorage', () => {
        localStorage.setItem('snakeGameExperience', '25');
        expect(game.getExperience()).toBe(25);
      });

      test('should handle corrupted localStorage data', () => {
        localStorage.setItem('snakeGameExperience', 'invalid');
        expect(game.getExperience()).toBe(0);
      });
    });

    describe('addExperience', () => {
      test('should add experience points', () => {
        const result = game.addExperience(5);
        expect(result).toBe(5);
        expect(game.getExperience()).toBe(5);
      });

      test('should accumulate experience points', () => {
        game.addExperience(3);
        game.addExperience(2);
        expect(game.getExperience()).toBe(5);
      });

      test('should persist experience in localStorage', () => {
        game.addExperience(10);
        // Create new game instance to test persistence
        const newGame = new SnakeGameLogic(400, 300);
        expect(newGame.getExperience()).toBe(10);
      });
    });

    describe('getExperienceRequiredForLevel', () => {
      test('should return correct experience for level 1', () => {
        expect(game.getExperienceRequiredForLevel(1)).toBe(0);
      });

      test('should return correct experience for early levels', () => {
        expect(game.getExperienceRequiredForLevel(2)).toBe(5);  // Base
        expect(game.getExperienceRequiredForLevel(3)).toBe(6);  // 5 + 1
        expect(game.getExperienceRequiredForLevel(4)).toBe(8);  // 6 + 2  
        expect(game.getExperienceRequiredForLevel(5)).toBe(10); // 8 + 2
        expect(game.getExperienceRequiredForLevel(6)).toBe(13); // 10 + 3
        expect(game.getExperienceRequiredForLevel(7)).toBe(16); // 13 + 3
        expect(game.getExperienceRequiredForLevel(8)).toBe(20); // 16 + 4
        expect(game.getExperienceRequiredForLevel(9)).toBe(24); // 20 + 4
      });

      test('should handle level 0 and negative levels', () => {
        expect(game.getExperienceRequiredForLevel(0)).toBe(0);
        expect(game.getExperienceRequiredForLevel(-1)).toBe(0);
      });
    });

    describe('getLevel', () => {
      test('should return level 1 for 0-4 experience', () => {
        expect(game.getLevel()).toBe(1); // 0 exp
        
        localStorage.setItem('snakeGameExperience', '0');
        expect(game.getLevel()).toBe(1);
        
        localStorage.setItem('snakeGameExperience', '4');
        expect(game.getLevel()).toBe(1);
      });

      test('should return correct level for various experience amounts', () => {
        localStorage.setItem('snakeGameExperience', '5');
        expect(game.getLevel()).toBe(2);

        localStorage.setItem('snakeGameExperience', '6');
        expect(game.getLevel()).toBe(3);

        localStorage.setItem('snakeGameExperience', '7');
        expect(game.getLevel()).toBe(3);

        localStorage.setItem('snakeGameExperience', '8');
        expect(game.getLevel()).toBe(4);

        localStorage.setItem('snakeGameExperience', '10');
        expect(game.getLevel()).toBe(5);

        localStorage.setItem('snakeGameExperience', '13');
        expect(game.getLevel()).toBe(6);
      });

      test('should handle higher experience levels', () => {
        localStorage.setItem('snakeGameExperience', '50');
        expect(game.getLevel()).toBeGreaterThanOrEqual(1);
      });
    });

    describe('getExperienceToNextLevel', () => {
      test('should return correct experience needed for next level', () => {
        localStorage.setItem('snakeGameExperience', '0');
        expect(game.getExperienceToNextLevel()).toBe(5); // Need 5 for level 2

        localStorage.setItem('snakeGameExperience', '3');
        expect(game.getExperienceToNextLevel()).toBe(2); // Need 2 more for level 2

        localStorage.setItem('snakeGameExperience', '5');
        expect(game.getExperienceToNextLevel()).toBe(1); // Need 1 more for level 3

        localStorage.setItem('snakeGameExperience', '6');
        expect(game.getExperienceToNextLevel()).toBe(2); // Need 2 more for level 4
      });

      test('should return correct amount when at exact level threshold', () => {
        localStorage.setItem('snakeGameExperience', '5');
        expect(game.getExperienceToNextLevel()).toBe(1); // At level 2, need 1 more for level 3
      });
    });

    describe('clearExperience', () => {
      test('should remove experience from localStorage', () => {
        game.addExperience(10);
        expect(game.getExperience()).toBe(10);
        
        game.clearExperience();
        expect(game.getExperience()).toBe(0);
      });
    });

    describe('experience integration with game mechanics', () => {
      test('should award experience when eating food based on current level', () => {
        // Clear experience first
        game.clearExperience();
        
        // Place food right in front of snake
        const headX = game.snake[0].x;
        const headY = game.snake[0].y;
        game.food = { x: headX + 20, y: headY };
        
        const initialExp = game.getExperience();
        const currentLevel = game.getLevel();
        const result = game.moveSnake();
        
        expect(result.ateFood).toBe(true);
        expect(game.getExperience()).toBe(initialExp + currentLevel);
      });

      test('should award exponentially more experience at higher levels', () => {
        // Test experience gain at level 1 (should get 1 exp)
        game.clearExperience();
        expect(game.getLevel()).toBe(1);
        
        const headX = game.snake[0].x;
        const headY = game.snake[0].y;
        game.food = { x: headX + 20, y: headY };
        
        game.moveSnake();
        expect(game.getExperience()).toBe(1); // Level 1 = 1 exp per food
        
        // Manually set experience to level 2 threshold and test again
        game.clearExperience();
        game.addExperience(5); // Level 2 threshold
        expect(game.getLevel()).toBe(2);
        
        // Reset snake and food for another test
        game.reset();
        const newHeadX = game.snake[0].x;
        const newHeadY = game.snake[0].y;
        game.food = { x: newHeadX + 20, y: newHeadY };
        
        const expBefore = game.getExperience();
        game.moveSnake();
        expect(game.getExperience()).toBe(expBefore + 2); // Level 2 = 2 exp per food
        
        // Test level 3
        game.clearExperience();
        game.addExperience(6); // Level 3 threshold  
        expect(game.getLevel()).toBe(3);
        
        game.reset();
        const head3X = game.snake[0].x;
        const head3Y = game.snake[0].y;
        game.food = { x: head3X + 20, y: head3Y };
        
        const exp3Before = game.getExperience();
        game.moveSnake();
        expect(game.getExperience()).toBe(exp3Before + 3); // Level 3 = 3 exp per food
      });

      test('should not award experience when not eating food', () => {
        game.clearExperience();
        
        const initialExp = game.getExperience();
        const result = game.moveSnake();
        
        expect(result.ateFood).toBe(false);
        expect(game.getExperience()).toBe(initialExp);
      });

      test('should preserve experience when game resets', () => {
        game.clearExperience();
        game.addExperience(10);
        
        game.reset();
        
        expect(game.getExperience()).toBe(10);
        expect(game.score).toBe(0); // Score should reset
      });

      test('should include experience and level in game state', () => {
        game.clearExperience();
        game.addExperience(7);
        
        const state = game.getGameState();
        
        expect(state.experience).toBe(7);
        expect(state.level).toBe(3); // 7 exp = level 3 (6 exp needed for level 3, 8 exp needed for level 4)
        expect(state.experienceToNextLevel).toBe(1); // Need 1 more for level 4
      });
    });
  });

  describe('High Score Management', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('snakeGameHighScores');
        localStorage.removeItem('snakeGameExperience');
      }
    });

    describe('getHighScores', () => {
      test('should return empty array when no scores exist', () => {
        const scores = game.getHighScores();
        expect(scores).toEqual([]);
      });

      test('should return parsed scores from localStorage', () => {
        const testScores = [
          { name: 'Alice', score: 10 },
          { name: 'Bob', score: 5 }
        ];
        localStorage.setItem('snakeGameHighScores', JSON.stringify(testScores));
        
        const scores = game.getHighScores();
        expect(scores).toEqual(testScores);
      });

      test('should handle corrupted localStorage data', () => {
        localStorage.setItem('snakeGameHighScores', 'invalid json');
        
        const scores = game.getHighScores();
        expect(scores).toEqual([]);
      });
    });

    describe('isHighScore', () => {
      test('should return false for zero or negative scores', () => {
        expect(game.isHighScore(0)).toBe(false);
        expect(game.isHighScore(-1)).toBe(false);
      });

      test('should return true when no scores exist and score is positive', () => {
        expect(game.isHighScore(1)).toBe(true);
      });

      test('should return true when less than 10 scores exist', () => {
        const testScores = [
          { name: 'Alice', score: 10 },
          { name: 'Bob', score: 5 }
        ];
        localStorage.setItem('snakeGameHighScores', JSON.stringify(testScores));
        
        expect(game.isHighScore(1)).toBe(true);
        expect(game.isHighScore(15)).toBe(true);
      });

      test('should return true when score beats lowest of 10 scores', () => {
        const testScores = [];
        for (let i = 10; i >= 1; i--) {
          testScores.push({ name: `Player${i}`, score: i });
        }
        localStorage.setItem('snakeGameHighScores', JSON.stringify(testScores));
        
        expect(game.isHighScore(2)).toBe(true);
        expect(game.isHighScore(11)).toBe(true);
      });

      test('should return false when score does not beat lowest of 10 scores', () => {
        const testScores = [];
        for (let i = 10; i >= 1; i--) {
          testScores.push({ name: `Player${i}`, score: i });
        }
        // Sort the test scores properly
        testScores.sort((a, b) => b.score - a.score);
        localStorage.setItem('snakeGameHighScores', JSON.stringify(testScores));
        
        expect(game.isHighScore(0)).toBe(false);
        expect(game.isHighScore(1)).toBe(false);
      });
    });

    describe('addHighScore', () => {
      test('should add score when list is empty', () => {
        const result = game.addHighScore('Alice', 10);
        
        expect(result).toBe(true);
        expect(game.getHighScores()).toEqual([{ name: 'Alice', score: 10 }]);
      });

      test('should add score and maintain sort order', () => {
        game.addHighScore('Bob', 5);
        game.addHighScore('Alice', 10);
        game.addHighScore('Charlie', 7);
        
        const scores = game.getHighScores();
        expect(scores).toEqual([
          { name: 'Alice', score: 10 },
          { name: 'Charlie', score: 7 },
          { name: 'Bob', score: 5 }
        ]);
      });

      test('should limit to top 10 scores', () => {
        // Add 11 scores
        for (let i = 1; i <= 11; i++) {
          game.addHighScore(`Player${i}`, i);
        }
        
        const scores = game.getHighScores();
        expect(scores).toHaveLength(10);
        expect(scores[0].score).toBe(11);
        expect(scores[9].score).toBe(2);
      });

      test('should not add score that does not qualify', () => {
        // Fill with 10 scores (1-10)
        for (let i = 1; i <= 10; i++) {
          game.addHighScore(`Player${i}`, i);
        }
        
        const result = game.addHighScore('LowScore', 0);
        expect(result).toBe(false);
        expect(game.getHighScores()).toHaveLength(10);
        expect(game.getHighScores()[9].score).toBe(1);
      });

      test('should handle empty name by using Anonymous', () => {
        game.addHighScore('', 10);
        game.addHighScore('   ', 5);
        
        const scores = game.getHighScores();
        expect(scores[0].name).toBe('Anonymous');
        expect(scores[1].name).toBe('Anonymous');
      });

      test('should trim whitespace from names', () => {
        game.addHighScore('  Alice  ', 10);
        
        const scores = game.getHighScores();
        expect(scores[0].name).toBe('Alice');
      });
    });

    describe('clearHighScores', () => {
      test('should remove all high scores', () => {
        game.addHighScore('Alice', 10);
        game.addHighScore('Bob', 5);
        
        expect(game.getHighScores()).toHaveLength(2);
        
        game.clearHighScores();
        
        expect(game.getHighScores()).toEqual([]);
      });
    });
  });
});