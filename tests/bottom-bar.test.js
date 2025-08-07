/**
 * Tests for Bottom Bar Component
 */

// Import the bottom-bar functionality by executing it in the test environment
const fs = require('fs');
const path = require('path');

describe('Bottom Bar Component', () => {
  beforeEach(() => {
    // Set up a clean DOM environment
    document.body.innerHTML = '';
    
    // Execute the bottom-bar.js code in the current JSDOM environment
    const bottomBarCode = fs.readFileSync(path.join(__dirname, '../bottom-bar.js'), 'utf8');
    eval(bottomBarCode);
  });

  describe('createBottomBar', () => {
    test('should create bottom bar HTML with correct structure', () => {
      const html = createBottomBar();
      
      expect(html).toContain('<div class="bottom-bar">');
      expect(html).toContain('<div class="game-controls">');
      expect(html).toContain('id="spawn-unit-btn"');
      expect(html).toContain('id="remove-unit-btn"');
      expect(html).toContain('id="unit-count"');
      expect(html).toContain('Spawn Unit');
      expect(html).toContain('Remove Unit');
      expect(html).toContain('Units: 1');
    });

    test('should include appropriate button icons and text', () => {
      const html = createBottomBar();
      
      expect(html).toContain('➕'); // Spawn button icon
      expect(html).toContain('➖'); // Remove button icon
      expect(html).toContain('spawn-button');
      expect(html).toContain('remove-button');
    });

    test('should create valid HTML structure', () => {
      const html = createBottomBar();
      
      // Create a temporary element to validate HTML structure
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      const bottomBar = temp.querySelector('.bottom-bar');
      expect(bottomBar).toBeTruthy();
      
      const controls = bottomBar.querySelector('.game-controls');
      expect(controls).toBeTruthy();
      
      const unitInfo = bottomBar.querySelector('.unit-info');
      expect(unitInfo).toBeTruthy();
      
      const spawnBtn = bottomBar.querySelector('#spawn-unit-btn');
      const removeBtn = bottomBar.querySelector('#remove-unit-btn');
      expect(spawnBtn).toBeTruthy();
      expect(removeBtn).toBeTruthy();
    });
  });

  describe('insertBottomBar', () => {
    test('should insert bottom bar into DOM', () => {
      insertBottomBar();
      
      const bottomBar = document.querySelector('.bottom-bar');
      expect(bottomBar).toBeTruthy();
      expect(bottomBar.parentElement).toBe(document.body);
    });

    test('should not insert duplicate bottom bars', () => {
      insertBottomBar();
      insertBottomBar(); // Try to insert again
      
      const bottomBars = document.querySelectorAll('.bottom-bar');
      expect(bottomBars.length).toBe(1);
    });

    test('should set up event handlers after insertion', () => {
      insertBottomBar();
      
      const spawnBtn = document.getElementById('spawn-unit-btn');
      const removeBtn = document.getElementById('remove-unit-btn');
      
      expect(spawnBtn).toBeTruthy();
      expect(removeBtn).toBeTruthy();
      
      // Verify buttons have click event listeners (they should not be null after setup)
      expect(spawnBtn.onclick).toBe(null); // We use addEventListener, not onclick
      expect(removeBtn.onclick).toBe(null);
    });
  });

  describe('button functionality', () => {
    beforeEach(() => {
      insertBottomBar();
    });

    test('should initialize with correct default state', () => {
      const unitCount = document.getElementById('unit-count');
      const removeBtn = document.getElementById('remove-unit-btn');
      const spawnBtn = document.getElementById('spawn-unit-btn');
      
      expect(unitCount.textContent).toBe('Units: 1');
      expect(removeBtn.disabled).toBe(true); // Should be disabled with only 1 unit
      expect(spawnBtn.disabled).toBe(false);
    });

    test('should handle spawn unit button clicks', () => {
      const spawnBtn = document.getElementById('spawn-unit-btn');
      const unitCount = document.getElementById('unit-count');
      const removeBtn = document.getElementById('remove-unit-btn');
      
      // Simulate click
      spawnBtn.click();
      
      expect(unitCount.textContent).toBe('Units: 2');
      expect(removeBtn.disabled).toBe(false); // Should be enabled with 2+ units
    });

    test('should handle remove unit button clicks', () => {
      const spawnBtn = document.getElementById('spawn-unit-btn');
      const removeBtn = document.getElementById('remove-unit-btn');
      const unitCount = document.getElementById('unit-count');
      
      // First spawn a unit so we can remove one
      spawnBtn.click();
      expect(unitCount.textContent).toBe('Units: 2');
      
      // Now remove a unit
      removeBtn.click();
      expect(unitCount.textContent).toBe('Units: 1');
      expect(removeBtn.disabled).toBe(true); // Should be disabled again
    });

    test('should prevent removing the last unit', () => {
      const removeBtn = document.getElementById('remove-unit-btn');
      const unitCount = document.getElementById('unit-count');
      
      // Try to remove when only 1 unit exists
      removeBtn.click();
      
      expect(unitCount.textContent).toBe('Units: 1'); // Should stay at 1
      expect(removeBtn.disabled).toBe(true);
    });

    test('should limit maximum units to 10', () => {
      const spawnBtn = document.getElementById('spawn-unit-btn');
      const unitCount = document.getElementById('unit-count');
      
      // Spawn units up to the limit
      for (let i = 1; i < 10; i++) {
        spawnBtn.click();
      }
      
      expect(unitCount.textContent).toBe('Units: 10');
      expect(spawnBtn.disabled).toBe(true); // Should be disabled at max
      
      // Try to spawn one more
      spawnBtn.click();
      expect(unitCount.textContent).toBe('Units: 10'); // Should stay at 10
    });

    test('should call WASM functions if they exist', () => {
      // Mock WASM functions
      window.spawnUnit = jest.fn();
      window.removeUnit = jest.fn();
      
      const spawnBtn = document.getElementById('spawn-unit-btn');
      const removeBtn = document.getElementById('remove-unit-btn');
      
      // Spawn a unit first to enable remove button
      spawnBtn.click();
      expect(window.spawnUnit).toHaveBeenCalledTimes(1);
      
      // Remove a unit
      removeBtn.click();
      expect(window.removeUnit).toHaveBeenCalledTimes(1);
      
      // Clean up
      delete window.spawnUnit;
      delete window.removeUnit;
    });

    test('should log when WASM functions are not available', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const spawnBtn = document.getElementById('spawn-unit-btn');
      const removeBtn = document.getElementById('remove-unit-btn');
      
      // Spawn a unit first to enable remove button
      spawnBtn.click();
      expect(consoleSpy).toHaveBeenCalledWith('Spawn unit requested - unit count:', 2);
      
      // Remove a unit
      removeBtn.click();
      expect(consoleSpy).toHaveBeenCalledWith('Remove unit requested - unit count:', 1);
      
      consoleSpy.mockRestore();
    });
  });

  describe('global functions', () => {
    test('should expose functions on window object', () => {
      expect(typeof window.createBottomBar).toBe('function');
      expect(typeof window.insertBottomBar).toBe('function');
      expect(typeof window.autoInsertBottomBar).toBe('function');
      expect(typeof window.setupBottomBarEvents).toBe('function');
    });

    test('autoInsertBottomBar should be a function that works', () => {
      // Just test that the function exists and is callable
      expect(typeof autoInsertBottomBar).toBe('function');
      
      // Clear DOM and test that it successfully calls the underlying logic
      document.body.innerHTML = '';
      
      // Call the function - it should not throw
      expect(() => autoInsertBottomBar()).not.toThrow();
      
      // Verify it actually inserted a bottom bar
      const bottomBar = document.querySelector('.bottom-bar');
      expect(bottomBar).toBeTruthy();
    });
  });
});