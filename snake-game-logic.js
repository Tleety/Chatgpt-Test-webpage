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
    // Note: experience persists between games
    
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
      // Award experience based on current level (exponential growth)
      const currentLevel = this.getLevel();
      this.addExperience(currentLevel);
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
      experience: this.getExperience(),
      level: this.getLevel(),
      experienceToNextLevel: this.getExperienceToNextLevel(),
      gameWidth: this.gameWidth,
      gameHeight: this.gameHeight
    };
  }

  /**
   * Experience and Level Management
   */

  /**
   * Gets current experience from localStorage
   */
  getExperience() {
    try {
      const stored = localStorage.getItem('snakeGameExperience');
      const parsed = stored ? parseInt(stored, 10) : 0;
      return isNaN(parsed) ? 0 : parsed;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Adds experience points and saves to localStorage
   */
  addExperience(points) {
    const currentExp = this.getExperience();
    const newExp = currentExp + points;
    try {
      localStorage.setItem('snakeGameExperience', newExp.toString());
      return newExp;
    } catch (e) {
      return currentExp;
    }
  }

  /**
   * Calculates the experience required to reach a specific level
   * Level progression: Level 1: 0 exp, Level 2: 5 exp, Level 3: 6 exp, Level 4: 8 exp, Level 5: 10 exp, etc.
   * Pattern starting at level 2: 5, then +1, +2, +2, +3, +3, +4, +4, +5, +5, ...
   */
  getExperienceRequiredForLevel(level) {
    if (level <= 1) return 0;
    if (level === 2) return 5;
    
    let exp = 5; // Level 2 base
    
    for (let currentLevel = 3; currentLevel <= level; currentLevel++) {
      // Calculate increment: +1, +2, +2, +3, +3, +4, +4, ...
      // For level 3: increment = 1, level 4: increment = 2, level 5: increment = 2, etc.
      const increment = Math.floor((currentLevel - 2) / 2) + 1;
      exp += increment;
    }
    
    return exp;
  }

  /**
   * Gets current level based on experience
   */
  getLevel() {
    const experience = this.getExperience();
    
    let level = 1;
    while (level < 100) { // Cap at 100 for safety
      const nextLevelReq = this.getExperienceRequiredForLevel(level + 1);
      if (experience < nextLevelReq) {
        break;
      }
      level++;
    }
    
    return level;
  }

  /**
   * Gets experience needed to reach the next level
   */
  getExperienceToNextLevel() {
    const currentExp = this.getExperience();
    const currentLevel = this.getLevel();
    const nextLevelExp = this.getExperienceRequiredForLevel(currentLevel + 1);
    
    return Math.max(0, nextLevelExp - currentExp);
  }

  /**
   * Clears experience (useful for testing)
   */
  clearExperience() {
    try {
      localStorage.removeItem('snakeGameExperience');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * High Score Management
   */

  /**
   * Gets high scores from localStorage
   * Returns array of {name, score} objects sorted by score descending
   */
  getHighScores() {
    try {
      const stored = localStorage.getItem('snakeGameHighScores');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Checks if a score qualifies for the high score list (top 10)
   */
  isHighScore(score) {
    if (score <= 0) return false; // Don't allow zero or negative scores
    const highScores = this.getHighScores();
    return highScores.length < 10 || score > highScores[highScores.length - 1].score;
  }

  /**
   * Adds a new high score if it qualifies
   * Returns true if score was added, false otherwise
   */
  addHighScore(name, score) {
    if (!this.isHighScore(score)) {
      return false;
    }

    const highScores = this.getHighScores();
    highScores.push({ name: name.trim() || 'Anonymous', score });
    
    // Sort by score descending
    highScores.sort((a, b) => b.score - a.score);
    
    // Keep only top 10
    const topScores = highScores.slice(0, 10);
    
    try {
      localStorage.setItem('snakeGameHighScores', JSON.stringify(topScores));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Clears all high scores (useful for testing)
   */
  clearHighScores() {
    try {
      localStorage.removeItem('snakeGameHighScores');
      return true;
    } catch (e) {
      return false;
    }
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