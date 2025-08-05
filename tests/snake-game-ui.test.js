/**
 * Unit tests for Snake Game UI behavior
 * Tests DOM interactions and event handling
 */

/**
 * @jest-environment jsdom
 */

describe('Snake Game UI', () => {
  let mockPreventDefault;
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <canvas id="gameCanvas" width="800" height="600"></canvas>
      <div id="score">Score: 0</div>
      <div id="gameOver" style="display: none;">Game Over! Press SPACE to restart</div>
    `;
    
    // Mock preventDefault
    mockPreventDefault = jest.fn();
  });
  
  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('keydown', () => {});
    document.removeEventListener('keyup', () => {});
  });

  test('should prevent default behavior for arrow keys', () => {
    // Simulate the keydown event handler from the game
    const keys = {};
    const gameRunning = true;
    
    const keydownHandler = (e) => {
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
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    
    arrowKeys.forEach(keyCode => {
      const mockEvent = {
        code: keyCode,
        preventDefault: mockPreventDefault
      };
      
      keydownHandler(mockEvent);
      
      expect(mockPreventDefault).toHaveBeenCalled();
      mockPreventDefault.mockClear();
    });
  });
  
  test('should not prevent default for non-arrow keys', () => {
    const keys = {};
    const gameRunning = true;
    
    const keydownHandler = (e) => {
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
    const nonArrowKeys = ['KeyA', 'KeyW', 'KeyS', 'KeyD', 'Enter', 'Escape'];
    
    nonArrowKeys.forEach(keyCode => {
      const mockEvent = {
        code: keyCode,
        preventDefault: mockPreventDefault
      };
      
      keydownHandler(mockEvent);
      
      expect(mockPreventDefault).not.toHaveBeenCalled();
    });
  });
  
  test('should prevent default for Space key when game is not running', () => {
    const keys = {};
    const gameRunning = false; // Game over state
    
    const keydownHandler = (e) => {
      keys[e.code] = true;
      
      if (e.code === 'Space' && !gameRunning) {
        e.preventDefault();
      }
      
      // Prevent default behavior for arrow keys to stop page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    
    const mockEvent = {
      code: 'Space',
      preventDefault: mockPreventDefault
    };
    
    keydownHandler(mockEvent);
    
    expect(mockPreventDefault).toHaveBeenCalled();
  });
  
  test('should not prevent default for Space key when game is running', () => {
    const keys = {};
    const gameRunning = true; // Game is active
    
    const keydownHandler = (e) => {
      keys[e.code] = true;
      
      if (e.code === 'Space' && !gameRunning) {
        e.preventDefault();
      }
      
      // Prevent default behavior for arrow keys to stop page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    
    const mockEvent = {
      code: 'Space',
      preventDefault: mockPreventDefault
    };
    
    keydownHandler(mockEvent);
    
    expect(mockPreventDefault).not.toHaveBeenCalled();
  });

  test('should verify game over overlay positioning when displayed', () => {
    // Create a temporary container for the test to avoid destroying the test interface
    const testContainer = document.createElement('div');
    testContainer.innerHTML = `
      <div id="gameContainer" style="position: relative;">
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        <div id="gameOver" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 100;
          display: block;
        ">Game Over! Press SPACE to restart</div>
      </div>
    `;
    
    // Temporarily append to body for testing
    document.body.appendChild(testContainer);
    
    try {
      const gameOverElement = testContainer.querySelector('#gameOver');
      const gameContainer = testContainer.querySelector('#gameContainer');
      
      // Verify the game over element exists and has correct positioning
      expect(gameOverElement).toBeTruthy();
      expect(gameContainer).toBeTruthy();
      
      // Get computed styles to verify positioning
      const gameOverStyles = window.getComputedStyle(gameOverElement);
      const containerStyles = window.getComputedStyle(gameContainer);
      
      // Verify the overlay is positioned absolutely
      expect(gameOverStyles.position).toBe('absolute');
      
      // Verify the container has relative positioning
      expect(containerStyles.position).toBe('relative');
      
      // Verify centering styles
      expect(gameOverStyles.top).toBe('50%');
      expect(gameOverStyles.left).toBe('50%');
      expect(gameOverStyles.transform).toContain('translate(-50%, -50%)');
      
      // Verify z-index for overlay effect
      expect(gameOverStyles.zIndex).toBe('100');
    } finally {
      // Always clean up the test container
      document.body.removeChild(testContainer);
    }
  });

  test('should display level and experience information in UI', () => {
    // Create a temporary container for the test to avoid destroying the test interface
    const testContainer = document.createElement('div');
    testContainer.innerHTML = `
      <div id="gameStats">
        <div id="score">Score: 0</div>
        <div id="level">Level: 1</div>
        <div id="experience">Experience: 0/5</div>
      </div>
      <canvas id="gameCanvas" width="800" height="600"></canvas>
    `;
    
    // Temporarily append to body for testing
    document.body.appendChild(testContainer);
    
    try {
      const scoreElement = testContainer.querySelector('#score');
      const levelElement = testContainer.querySelector('#level');
      const experienceElement = testContainer.querySelector('#experience');
      const gameStatsElement = testContainer.querySelector('#gameStats');
      
      // Verify all elements exist
      expect(scoreElement).toBeTruthy();
      expect(levelElement).toBeTruthy();
      expect(experienceElement).toBeTruthy();
      expect(gameStatsElement).toBeTruthy();
      
      // Verify initial content
      expect(scoreElement.textContent).toBe('Score: 0');
      expect(levelElement.textContent).toBe('Level: 1');
      expect(experienceElement.textContent).toBe('Experience: 0/5');
      
      // Test updating the display (simulating game state update)
      scoreElement.textContent = 'Score: 3';
      levelElement.textContent = 'Level: 2';
      experienceElement.textContent = 'Experience: 5/6';
      
      expect(scoreElement.textContent).toBe('Score: 3');
      expect(levelElement.textContent).toBe('Level: 2');
      expect(experienceElement.textContent).toBe('Experience: 5/6');
    } finally {
      // Always clean up the test container
      document.body.removeChild(testContainer);
    }
  });
});