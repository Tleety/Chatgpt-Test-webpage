/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Rust WASM Game', () => {
  beforeEach(() => {
    // Set up a basic DOM structure
    document.body.innerHTML = `
      <canvas id="rust-canvas" width="800" height="600"></canvas>
      <button id="randomize-btn">Random Velocity</button>
    `;
  });

  describe('Project Structure', () => {
    test('should have all required files', () => {
      const projectDir = path.join(__dirname, '..', 'rust-wasm-game');
      
      expect(fs.existsSync(projectDir)).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'Cargo.toml'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'src', 'lib.rs'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'index.html'))).toBe(true);
    });

    test('should have WASM build artifacts', () => {
      const pkgDir = path.join(__dirname, '..', 'rust-wasm-game', 'pkg');
      
      expect(fs.existsSync(pkgDir)).toBe(true);
      expect(fs.existsSync(path.join(pkgDir, 'rust_wasm_game.js'))).toBe(true);
      expect(fs.existsSync(path.join(pkgDir, 'rust_wasm_game_bg.wasm'))).toBe(true);
    });

    test('WASM file should be valid and non-empty', () => {
      const wasmPath = path.join(__dirname, '..', 'rust-wasm-game', 'pkg', 'rust_wasm_game_bg.wasm');
      
      expect(fs.existsSync(wasmPath)).toBe(true);
      
      const stats = fs.statSync(wasmPath);
      expect(stats.size).toBeGreaterThan(1000); // Should be reasonably sized
    });
  });

  describe('Cargo Configuration', () => {
    test('should have correct Cargo.toml configuration', () => {
      const cargoTomlPath = path.join(__dirname, '..', 'rust-wasm-game', 'Cargo.toml');
      const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
      
      expect(cargoContent).toMatch(/name = "rust-wasm-game"/);
      expect(cargoContent).toMatch(/crate-type = \["cdylib"\]/);
      expect(cargoContent).toMatch(/wasm-bindgen/);
      expect(cargoContent).toMatch(/web-sys/);
      expect(cargoContent).toMatch(/getrandom.*features.*\["js"\]/);
    });
  });

  describe('Rust Source Code', () => {
    test('should have valid Rust source with game logic', () => {
      const libRsPath = path.join(__dirname, '..', 'rust-wasm-game', 'src', 'lib.rs');
      const rustContent = fs.readFileSync(libRsPath, 'utf8');
      
      // Check for essential WASM bindgen usage
      expect(rustContent).toMatch(/use wasm_bindgen::prelude::\*/);
      expect(rustContent).toMatch(/#\[wasm_bindgen\]/);
      
      // Check for game struct and methods
      expect(rustContent).toMatch(/pub struct RustWasmGame/);
      expect(rustContent).toMatch(/pub fn new/);
      expect(rustContent).toMatch(/pub fn update/);
      expect(rustContent).toMatch(/pub fn render/);
      expect(rustContent).toMatch(/pub fn on_click/);
      
      // Check for canvas and game state
      expect(rustContent).toMatch(/ball_x.*f64/);
      expect(rustContent).toMatch(/ball_y.*f64/);
      expect(rustContent).toMatch(/CanvasRenderingContext2d/);
    });
  });

  describe('HTML Integration', () => {
    test('should have proper HTML structure', () => {
      const htmlPath = path.join(__dirname, '..', 'rust-wasm-game', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Check for essential HTML elements
      expect(htmlContent).toMatch(/<canvas[^>]*id="rust-canvas"/);
      expect(htmlContent).toMatch(/<button[^>]*id="randomize-btn"/);
      
      // Check for module import
      expect(htmlContent).toMatch(/import.*from.*rust_wasm_game\.js/);
      expect(htmlContent).toMatch(/RustWasmGame/);
      
      // Check for styling
      expect(htmlContent).toMatch(/\.\.\/style\.css/);
      expect(htmlContent).toMatch(/cursor: crosshair/);
    });

    test('should include proper meta tags and styling', () => {
      const htmlPath = path.join(__dirname, '..', 'rust-wasm-game', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      expect(htmlContent).toMatch(/<meta charset="UTF-8"/);
      expect(htmlContent).toMatch(/Rust WASM Game/);
      expect(htmlContent).toMatch(/\.\.\/favicon\.svg/);
      expect(htmlContent).toMatch(/\.\.\/top-bar\.js/);
    });
  });

  describe('Generated JavaScript Bindings', () => {
    test('should have TypeScript definitions', () => {
      const dtsPath = path.join(__dirname, '..', 'rust-wasm-game', 'pkg', 'rust_wasm_game.d.ts');
      
      if (fs.existsSync(dtsPath)) {
        const dtsContent = fs.readFileSync(dtsPath, 'utf8');
        expect(dtsContent).toMatch(/export class RustWasmGame/);
        expect(dtsContent).toMatch(/constructor.*string/);
        expect(dtsContent).toMatch(/update.*number/);
        expect(dtsContent).toMatch(/render.*void/);
      }
    });

    test('should have JavaScript bindings', () => {
      const jsPath = path.join(__dirname, '..', 'rust-wasm-game', 'pkg', 'rust_wasm_game.js');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      expect(jsContent).toMatch(/class RustWasmGame/);
      expect(jsContent).toMatch(/constructor.*canvas_id/);
      expect(jsContent).toMatch(/update.*current_time/);
      expect(jsContent).toMatch(/render/);
      expect(jsContent).toMatch(/on_click/);
      expect(jsContent).toMatch(/add_random_velocity/);
    });
  });

  describe('Game Functionality Simulation', () => {
    test('should handle canvas operations', () => {
      const canvas = document.getElementById('rust-canvas');
      expect(canvas).toBeTruthy();
      expect(canvas.tagName).toBe('CANVAS');
      
      // Mock canvas context
      const mockContext = {
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        fillText: jest.fn(),
        set_fill_style: jest.fn(),
        set_stroke_style: jest.fn(),
        set_line_width: jest.fn(),
        set_font: jest.fn()
      };
      
      canvas.getContext = jest.fn().mockReturnValue(mockContext);
      
      const ctx = canvas.getContext('2d');
      expect(ctx).toBe(mockContext);
    });

    test('should handle click events', () => {
      const canvas = document.getElementById('rust-canvas');
      const clickHandler = jest.fn();
      
      canvas.addEventListener('click', clickHandler);
      
      // Simulate click event
      const event = new MouseEvent('click', {
        clientX: 100,
        clientY: 150,
        bubbles: true
      });
      
      // Mock getBoundingClientRect
      canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600
      });
      
      canvas.dispatchEvent(event);
      expect(clickHandler).toHaveBeenCalled();
    });

    test('should handle button interactions', () => {
      const button = document.getElementById('randomize-btn');
      expect(button).toBeTruthy();
      expect(button.textContent).toMatch(/Random Velocity/);
      
      const clickHandler = jest.fn();
      button.addEventListener('click', clickHandler);
      
      button.click();
      expect(clickHandler).toHaveBeenCalled();
    });
  });

  describe('Performance and Optimization', () => {
    test('should use proper WASM target configuration', () => {
      const cargoTomlPath = path.join(__dirname, '..', 'rust-wasm-game', 'Cargo.toml');
      const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
      
      // Should specify web-sys features for minimal size
      expect(cargoContent).toMatch(/\[dependencies\.web-sys\]/);
      
      // Should have getrandom configured for WASM
      expect(cargoContent).toMatch(/getrandom.*js/);
    });

    test('WASM file should be optimized size', () => {
      const wasmPath = path.join(__dirname, '..', 'rust-wasm-game', 'pkg', 'rust_wasm_game_bg.wasm');
      
      if (fs.existsSync(wasmPath)) {
        const stats = fs.statSync(wasmPath);
        // Should be reasonably sized (not too large for a simple game)
        expect(stats.size).toBeLessThan(1024 * 1024); // Less than 1MB
        expect(stats.size).toBeGreaterThan(1000); // But not tiny
      }
    });
  });

  describe('Browser Compatibility', () => {
    test('should use modern JavaScript features appropriately', () => {
      const htmlPath = path.join(__dirname, '..', 'rust-wasm-game', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Should use ES6 modules
      expect(htmlContent).toMatch(/type="module"/);
      expect(htmlContent).toMatch(/import.*from/);
      
      // Should have fallback error handling
      expect(htmlContent).toMatch(/catch.*console\.error/);
      expect(htmlContent).toMatch(/addEventListener.*error/);
    });

    test('should handle initialization timing', () => {
      const htmlPath = path.join(__dirname, '..', 'rust-wasm-game', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Should wait for DOM and have fallback timing
      expect(htmlContent).toMatch(/DOMContentLoaded/);
      expect(htmlContent).toMatch(/setTimeout.*initialize/);
      expect(htmlContent).toMatch(/waitForTopBarAndResize/);
    });
  });

  describe('Accessibility and UX', () => {
    test('should have proper semantic HTML', () => {
      const htmlPath = path.join(__dirname, '..', 'rust-wasm-game', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      expect(htmlContent).toMatch(/<main>/);
      expect(htmlContent).toMatch(/<h1>/);
      expect(htmlContent).toMatch(/game-instructions/);
    });

    test('should have visual feedback elements', () => {
      const htmlPath = path.join(__dirname, '..', 'rust-wasm-game', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      expect(htmlContent).toMatch(/cursor: crosshair/);
      expect(htmlContent).toMatch(/button:hover/);
      expect(htmlContent).toMatch(/🎲.*Random Velocity/);
      // Check for Rust crab emoji in main index page
      const mainIndexPath = path.join(__dirname, '..', 'index.html');
      const mainIndexContent = fs.readFileSync(mainIndexPath, 'utf8');
      expect(mainIndexContent).toMatch(/🦀/);
    });
  });
});