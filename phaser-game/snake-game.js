// Snake Game Logic
class SnakeGame {
  constructor(config) {
    this.CELL_SIZE = 20;
    this.config = config || { width: 800, height: 600 };
    this.snake = [];
    this.direction = { x: this.CELL_SIZE, y: 0 };
    this.score = 0;
    this.food = { x: 0, y: 0 };
  }

  // Initialize the game state
  initGame() {
    this.snake = [];
    this.direction = { x: this.CELL_SIZE, y: 0 };
    this.score = 0;
    
    const startX = Math.floor(this.config.width / 2 / this.CELL_SIZE) * this.CELL_SIZE;
    const startY = Math.floor(this.config.height / 2 / this.CELL_SIZE) * this.CELL_SIZE;
    this.snake.push({ x: startX, y: startY });
    
    this.placeFood();
    return this;
  }

  // Change snake direction (with validation to prevent 180-degree turns)
  changeDirection(newDirection) {
    // Prevent moving in opposite direction
    if (newDirection.x !== 0 && this.direction.x === 0) {
      this.direction = newDirection;
      return true;
    } else if (newDirection.y !== 0 && this.direction.y === 0) {
      this.direction = newDirection;
      return true;
    }
    return false;
  }

  // Move the snake one step
  moveSnake() {
    const head = this.snake[0];
    const newX = head.x + this.direction.x;
    const newY = head.y + this.direction.y;

    // Check for collisions
    if (this.checkCollision(newX, newY)) {
      return { collision: true, gameOver: true };
    }

    const newHead = { x: newX, y: newY };
    this.snake.unshift(newHead);

    // Check if food is eaten
    if (this.checkFoodCollision(newX, newY)) {
      this.score += 1;
      this.placeFood();
      return { collision: false, gameOver: false, foodEaten: true };
    } else {
      this.snake.pop(); // Remove tail if no food eaten
      return { collision: false, gameOver: false, foodEaten: false };
    }
  }

  // Check for wall or self-collision
  checkCollision(x, y) {
    // Check wall collision
    if (x < 0 || x >= this.config.width || y < 0 || y >= this.config.height) {
      return true;
    }
    
    // Check self-collision
    return this.snake.some(segment => segment.x === x && segment.y === y);
  }

  // Check if snake head collides with food
  checkFoodCollision(x, y) {
    return x === this.food.x && y === this.food.y;
  }

  // Place food at random location not occupied by snake
  placeFood() {
    let x, y;
    let attempts = 0;
    const maxAttempts = 1000; // Prevent infinite loop
    
    do {
      x = Math.floor(Math.random() * this.config.width / this.CELL_SIZE) * this.CELL_SIZE;
      y = Math.floor(Math.random() * this.config.height / this.CELL_SIZE) * this.CELL_SIZE;
      attempts++;
    } while (this.snake.some(segment => segment.x === x && segment.y === y) && attempts < maxAttempts);
    
    this.food = { x, y };
    return this.food;
  }

  // Get current game state
  getGameState() {
    return {
      snake: [...this.snake],
      direction: { ...this.direction },
      food: { ...this.food },
      score: this.score
    };
  }

  // Get snake head position
  getHeadPosition() {
    return this.snake.length > 0 ? { ...this.snake[0] } : null;
  }

  // Get snake length
  getSnakeLength() {
    return this.snake.length;
  }
}

// Export for testing (Node.js) and browser use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SnakeGame;
} else {
  window.SnakeGame = SnakeGame;
}