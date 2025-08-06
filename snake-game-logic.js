/**
 * Snake Game Logic
 * Implements comprehensive snake game mechanics with experience system, obstacles, and high scores
 */

class SnakeGameLogic {
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.CELL_SIZE = 20;
    this.score = 0;
    this.obstacles = [];
    
    this.reset();
  }

  reset() {
    this.score = 0;
    this.direction = { x: 20, y: 0 }; // Start moving right
    
    // Place snake at center
    const centerX = Math.floor(this.gameWidth / 2 / this.CELL_SIZE) * this.CELL_SIZE;
    const centerY = Math.floor(this.gameHeight / 2 / this.CELL_SIZE) * this.CELL_SIZE;
    this.snake = [{ x: centerX, y: centerY }];
    
    // Generate obstacles based on current level
    this.generateObstacles();
    
    // Place initial food
    this.food = this.placeFood();
  }

  changeDirection(newDirection) {
    if (this.isValidDirectionChange(newDirection)) {
      this.direction = newDirection;
      return true;
    }
    return false;
  }

  isValidDirectionChange(newDirection) {
    // Prevent 180-degree turns (opposite direction)
    return !(this.direction.x === -newDirection.x && this.direction.y === -newDirection.y);
  }

  moveSnake() {
    const head = { ...this.snake[0] };
    head.x += this.direction.x;
    head.y += this.direction.y;

    // Check for collisions
    if (this.isWallCollision(head.x, head.y) || 
        this.isSelfCollision(head.x, head.y) || 
        this.isObstacleCollision(head.x, head.y)) {
      return { collision: true, ateFood: false };
    }

    // Check if food was eaten
    const ateFood = this.isFoodCollision(head.x, head.y);
    
    this.snake.unshift(head);

    if (ateFood) {
      this.score++;
      
      // Award experience based on current level
      const currentLevel = this.getLevel();
      this.addExperience(currentLevel);
      
      this.food = this.placeFood();
      return { collision: false, ateFood: true, newScore: this.score };
    } else {
      this.snake.pop(); // Remove tail if no food eaten
      return { collision: false, ateFood: false };
    }
  }

  isWallCollision(x, y) {
    return x < 0 || x >= this.gameWidth || y < 0 || y >= this.gameHeight;
  }

  isSelfCollision(x, y) {
    return this.snake.some(segment => segment.x === x && segment.y === y);
  }

  isFoodCollision(x, y) {
    return this.food.x === x && this.food.y === y;
  }

  isObstacleCollision(x, y) {
    return this.obstacles.some(obstacle => obstacle.x === x && obstacle.y === y);
  }

  placeFood() {
    let food;
    let attempts = 0;
    const maxAttempts = 1000;
    
    do {
      food = {
        x: Math.floor(Math.random() * (this.gameWidth / this.CELL_SIZE)) * this.CELL_SIZE,
        y: Math.floor(Math.random() * (this.gameHeight / this.CELL_SIZE)) * this.CELL_SIZE
      };
      attempts++;
    } while (
      attempts < maxAttempts &&
      (this.snake.some(segment => segment.x === food.x && segment.y === food.y) ||
       this.obstacles.some(obstacle => obstacle.x === food.x && obstacle.y === food.y))
    );
    
    return food;
  }

  getGameState() {
    return {
      snake: [...this.snake],
      food: { ...this.food },
      direction: { ...this.direction },
      score: this.score,
      gameWidth: this.gameWidth,
      gameHeight: this.gameHeight,
      obstacles: [...this.obstacles],
      experience: this.getExperience(),
      level: this.getLevel(),
      experienceToNextLevel: this.getExperienceToNextLevel()
    };
  }

  // Experience System
  getExperience() {
    try {
      const exp = localStorage.getItem('snakeGameExperience');
      const parsed = exp ? parseInt(exp, 10) : 0;
      return isNaN(parsed) ? 0 : parsed;
    } catch (e) {
      return 0;
    }
  }

  addExperience(points) {
    const currentExp = this.getExperience();
    const newExp = currentExp + points;
    localStorage.setItem('snakeGameExperience', newExp.toString());
    return newExp;
  }

  getExperienceRequiredForLevel(level) {
    if (level <= 1) return 0;
    if (level === 2) return 5;
    
    let totalExp = 5; // Base for level 2
    
    for (let i = 3; i <= level; i++) {
      // Pattern: 1, 2, 2, 3, 3, 4, 4, ...
      // For level i (i>=3), increment = Math.floor((i-2)/2) + 1
      const increment = Math.floor((i - 2) / 2) + 1;
      totalExp += increment;
    }
    
    return totalExp;
  }

  getLevel() {
    const exp = this.getExperience();
    let level = 1;
    
    while (exp >= this.getExperienceRequiredForLevel(level + 1)) {
      level++;
    }
    
    return level;
  }

  getExperienceToNextLevel() {
    const currentExp = this.getExperience();
    const currentLevel = this.getLevel();
    const nextLevelExp = this.getExperienceRequiredForLevel(currentLevel + 1);
    
    return nextLevelExp - currentExp;
  }

  clearExperience() {
    localStorage.removeItem('snakeGameExperience');
  }

  // Obstacle System
  generateObstacles() {
    this.obstacles = [];
    const level = this.getLevel();
    
    // No obstacles for levels 1 and 2
    if (level <= 2) return;
    
    // Calculate number of obstacles based on level
    const obstacleCount = Math.min(Math.floor((level - 2) / 2) + 1, 15);
    
    for (let i = 0; i < obstacleCount; i++) {
      this.placeObstacle();
    }
  }

  placeObstacle() {
    let obstacle;
    let attempts = 0;
    const maxAttempts = 1000;
    const centerX = Math.floor(this.gameWidth / 2 / this.CELL_SIZE) * this.CELL_SIZE;
    const centerY = Math.floor(this.gameHeight / 2 / this.CELL_SIZE) * this.CELL_SIZE;
    const safeZoneSize = 3 * this.CELL_SIZE;
    
    do {
      obstacle = {
        x: Math.floor(Math.random() * (this.gameWidth / this.CELL_SIZE)) * this.CELL_SIZE,
        y: Math.floor(Math.random() * (this.gameHeight / this.CELL_SIZE)) * this.CELL_SIZE
      };
      attempts++;
    } while (
      attempts < maxAttempts &&
      (this.snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y) ||
       this.obstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y) ||
       // Keep safe zone around snake start position
       (obstacle.x >= centerX - safeZoneSize && obstacle.x <= centerX + safeZoneSize &&
        obstacle.y >= centerY - safeZoneSize && obstacle.y <= centerY + safeZoneSize))
    );
    
    if (attempts < maxAttempts) {
      this.obstacles.push(obstacle);
    }
  }

  // High Score System
  getHighScores() {
    try {
      const scores = localStorage.getItem('snakeGameHighScores');
      return scores ? JSON.parse(scores) : [];
    } catch (e) {
      return [];
    }
  }

  isHighScore(score) {
    if (score <= 0) return false;
    
    const scores = this.getHighScores();
    
    // If less than 10 scores, any positive score qualifies
    if (scores.length < 10) return true;
    
    // Check if score beats the lowest score
    const lowestScore = scores[scores.length - 1];
    return score > lowestScore.score;
  }

  addHighScore(name, score) {
    if (!this.isHighScore(score)) return false;
    
    // Clean and validate name
    name = (name || '').trim();
    if (!name) name = 'Anonymous';
    
    const scores = this.getHighScores();
    scores.push({ name, score });
    
    // Sort by score (highest first) and keep top 10
    scores.sort((a, b) => b.score - a.score);
    scores.splice(10);
    
    localStorage.setItem('snakeGameHighScores', JSON.stringify(scores));
    return true;
  }

  clearHighScores() {
    localStorage.removeItem('snakeGameHighScores');
  }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SnakeGameLogic;
} else if (typeof window !== 'undefined') {
  window.SnakeGameLogic = SnakeGameLogic;
}