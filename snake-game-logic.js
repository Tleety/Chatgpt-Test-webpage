/**
 * Snake Game Logic Module
 * Contains the core game logic extracted from the Phaser implementation
 */

const CELL_SIZE = 20;

class SnakeGameLogic {
  constructor(gameWidth = 800, gameHeight = 600) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.CELL_SIZE = CELL_SIZE;
    this.reset();
  }

  reset() {
    this.snake = [];
    this.direction = { x: CELL_SIZE, y: 0 };
    this.score = 0;
    
    // Initialize snake in the center
    const startX = Math.floor(this.gameWidth / 2 / CELL_SIZE) * CELL_SIZE;
    const startY = Math.floor(this.gameHeight / 2 / CELL_SIZE) * CELL_SIZE;
    this.snake.push({ x: startX, y: startY });
    
    this.food = this.placeFood();
  }

  /**
   * Validates if a direction change is allowed (prevents 180-degree turns)
   */
  isValidDirectionChange(newDirection) {
    // Can't reverse direction directly
    return !(this.direction.x !== 0 && newDirection.x === -this.direction.x) &&
           !(this.direction.y !== 0 && newDirection.y === -this.direction.y);
  }

  /**
   * Changes snake direction if valid
   */
  changeDirection(newDirection) {
    if (this.isValidDirectionChange(newDirection)) {
      this.direction = newDirection;
      return true;
    }
    return false;
  }

  /**
   * Moves the snake one step in current direction
   * Returns: { collision: boolean, ateFood: boolean, newScore: number }
   */
  moveSnake() {
    const head = this.snake[0];
    const newX = head.x + this.direction.x;
    const newY = head.y + this.direction.y;

    // Check wall collision
    if (this.isWallCollision(newX, newY)) {
      return { collision: true, ateFood: false, newScore: this.score };
    }

    // Check self collision
    if (this.isSelfCollision(newX, newY)) {
      return { collision: true, ateFood: false, newScore: this.score };
    }

    // Add new head
    this.snake.unshift({ x: newX, y: newY });

    // Check food collision
    const ateFood = this.isFoodCollision(newX, newY);
    if (ateFood) {
      this.score += 1;
      this.food = this.placeFood();
    } else {
      // Remove tail if no food eaten
      this.snake.pop();
    }

    return { collision: false, ateFood, newScore: this.score };
  }

  /**
   * Checks if position collides with walls
   */
  isWallCollision(x, y) {
    return x < 0 || x >= this.gameWidth || y < 0 || y >= this.gameHeight;
  }

  /**
   * Checks if position collides with snake body
   */
  isSelfCollision(x, y) {
    return this.snake.some(segment => segment.x === x && segment.y === y);
  }

  /**
   * Checks if position collides with food
   */
  isFoodCollision(x, y) {
    return x === this.food.x && y === this.food.y;
  }

  /**
   * Places food at random valid position
   */
  placeFood() {
    let x, y;
    let attempts = 0;
    const maxAttempts = 1000; // Prevent infinite loop
    
    do {
      x = Math.floor(Math.random() * this.gameWidth / CELL_SIZE) * CELL_SIZE;
      y = Math.floor(Math.random() * this.gameHeight / CELL_SIZE) * CELL_SIZE;
      attempts++;
    } while (this.snake.some(seg => seg.x === x && seg.y === y) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      // Fallback: find first available position
      for (let testY = 0; testY < this.gameHeight; testY += CELL_SIZE) {
        for (let testX = 0; testX < this.gameWidth; testX += CELL_SIZE) {
          if (!this.snake.some(seg => seg.x === testX && seg.y === testY)) {
            return { x: testX, y: testY };
          }
        }
      }
    }

    return { x, y };
  }

  /**
   * Gets current game state
   */
  getGameState() {
    return {
      snake: [...this.snake],
      food: { ...this.food },
      direction: { ...this.direction },
      score: this.score,
      gameWidth: this.gameWidth,
      gameHeight: this.gameHeight
    };
  }
}

// For Node.js environment (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SnakeGameLogic;
}

// For browser environment
if (typeof window !== 'undefined') {
  window.SnakeGameLogic = SnakeGameLogic;
}