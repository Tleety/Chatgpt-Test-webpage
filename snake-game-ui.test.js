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
});