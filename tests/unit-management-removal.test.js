/**
 * Unit tests for Unit Management Removal
 * Tests that unit management UI has been removed and only one unit exists
 */

/**
 * @jest-environment jsdom
 */

describe('Unit Management Removal', () => {
  beforeEach(() => {
    // Clear any existing DOM content
    document.body.innerHTML = '';
  });

  describe('Go WASM Game HTML Structure', () => {
    test('should not contain unit management UI elements', () => {
      // Load the Go WASM game HTML content
      const fs = require('fs');
      const path = require('path');
      const htmlPath = path.join(__dirname, '../go-wasm-game/index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Parse HTML content
      document.body.innerHTML = htmlContent;
      
      // Verify unit management UI elements are removed
      expect(document.querySelector('.unit-controls')).toBeNull();
      expect(document.querySelector('#unitType')).toBeNull();
      expect(document.querySelector('#typeStats')).toBeNull();
      expect(document.querySelector('#unitsList')).toBeNull();
      expect(document.querySelector('.unit-creation')).toBeNull();
      expect(document.querySelector('.unit-list')).toBeNull();
    });

    test('should not contain unit management JavaScript functions', () => {
      // Load the Go WASM game HTML content
      const fs = require('fs');
      const path = require('path');
      const htmlPath = path.join(__dirname, '../go-wasm-game/index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Check that unit management functions are not present in the HTML
      expect(htmlContent).not.toContain('createRandomUnit');
      expect(htmlContent).not.toContain('updateUnitsList');
      expect(htmlContent).not.toContain('moveUnitRandom');
      expect(htmlContent).not.toContain('removeUnit');
      expect(htmlContent).not.toContain('unitTypes');
    });

    test('should not contain unit management CSS styles', () => {
      // Load the Go WASM game HTML content
      const fs = require('fs');
      const path = require('path');
      const htmlPath = path.join(__dirname, '../go-wasm-game/index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Check that unit management CSS classes are not present
      expect(htmlContent).not.toContain('.unit-controls');
      expect(htmlContent).not.toContain('.unit-creation');
      expect(htmlContent).not.toContain('.unit-list');
      expect(htmlContent).not.toContain('.unit-item');
      expect(htmlContent).not.toContain('.unit-actions');
      expect(htmlContent).not.toContain('.remove-btn');
    });

    test('should still contain essential game elements', () => {
      // Load the Go WASM game HTML content
      const fs = require('fs');
      const path = require('path');
      const htmlPath = path.join(__dirname, '../go-wasm-game/index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Parse HTML content
      document.body.innerHTML = htmlContent;
      
      // Verify essential game elements remain
      expect(document.querySelector('#game')).toBeTruthy(); // Canvas element
      expect(document.querySelector('.hero')).toBeTruthy(); // Game instructions
      expect(htmlContent).toContain('wasm_exec.js'); // WASM runtime
      expect(htmlContent).toContain('loadWasm'); // WASM loading function
    });

    test('should have updated game description', () => {
      // Load the Go WASM game HTML content
      const fs = require('fs');
      const path = require('path');
      const htmlPath = path.join(__dirname, '../go-wasm-game/index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Check that description mentions single unit
      expect(htmlContent).toContain('with a single unit');
      expect(htmlContent).not.toContain('integrated unit management');
    });
  });

  describe('Go Code Unit Creation', () => {
    test('should verify main.go creates only one unit', () => {
      // Load the Go main.go content
      const fs = require('fs');
      const path = require('path');
      const mainGoPath = path.join(__dirname, '../go-wasm-game/main.go');
      const mainGoContent = fs.readFileSync(mainGoPath, 'utf8');
      
      // Count CreateUnit calls
      const createUnitMatches = mainGoContent.match(/unitManager\.CreateUnit/g);
      expect(createUnitMatches).toHaveLength(1);
      
      // Verify only Warrior unit is created
      expect(mainGoContent).toContain('CreateUnit(UnitWarrior, 95, 95, "")');
      expect(mainGoContent).not.toContain('CreateUnit(UnitArcher');
      expect(mainGoContent).not.toContain('CreateUnit(UnitMage');
      expect(mainGoContent).not.toContain('CreateUnit(UnitScout');
    });

    test('should have updated comment for single unit', () => {
      // Load the Go main.go content
      const fs = require('fs');
      const path = require('path');
      const mainGoPath = path.join(__dirname, '../go-wasm-game/main.go');
      const mainGoContent = fs.readFileSync(mainGoPath, 'utf8');
      
      // Check comment reflects single unit
      expect(mainGoContent).toContain('Create one initial unit for demonstration');
      expect(mainGoContent).not.toContain('Create some initial units for demonstration');
    });
  });

  describe('Main Page Project Name', () => {
    test('should have updated project name on main page', () => {
      // Load the main index.html content
      const fs = require('fs');
      const path = require('path');
      const indexPath = path.join(__dirname, '../index.html');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check that project name is updated
      expect(indexContent).toContain('Go WASM Game</div>');
      expect(indexContent).not.toContain('Go WASM Game + Units</div>');
    });
  });

  describe('WASM Game Build Verification', () => {
    test('should verify WASM file exists after build', () => {
      const fs = require('fs');
      const path = require('path');
      const wasmPath = path.join(__dirname, '../go-wasm-game/game.wasm');
      
      // Check that WASM file exists (built by previous step)
      expect(fs.existsSync(wasmPath)).toBe(true);
    });
  });
});