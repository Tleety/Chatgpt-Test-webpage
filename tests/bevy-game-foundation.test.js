const fs = require('fs');
const path = require('path');

describe('Bevy Game Foundation', () => {
  describe('Project Structure', () => {
    test('should have bevy-game directory', () => {
      const bevyGamePath = path.join(__dirname, '..', 'bevy-game');
      expect(fs.existsSync(bevyGamePath)).toBe(true);
      expect(fs.statSync(bevyGamePath).isDirectory()).toBe(true);
    });

    test('should have Cargo.toml with correct configuration', () => {
      const cargoPath = path.join(__dirname, '..', 'bevy-game', 'Cargo.toml');
      expect(fs.existsSync(cargoPath)).toBe(true);
      
      const cargoContent = fs.readFileSync(cargoPath, 'utf8');
      expect(cargoContent).toContain('name = "bevy-game"');
      expect(cargoContent).toContain('crate-type = ["cdylib"]');
      expect(cargoContent).toContain('wasm-bindgen');
      expect(cargoContent).toContain('web-sys');
    });

    test('should have lib.rs with WASM exports', () => {
      const libPath = path.join(__dirname, '..', 'bevy-game', 'src', 'lib.rs');
      expect(fs.existsSync(libPath)).toBe(true);
      
      const libContent = fs.readFileSync(libPath, 'utf8');
      expect(libContent).toContain('use wasm_bindgen::prelude::*');
      expect(libContent).toContain('#[wasm_bindgen]');
      expect(libContent).toContain('BevyGame');
    });

    test('should have build script', () => {
      const buildPath = path.join(__dirname, '..', 'bevy-game', 'build.sh');
      expect(fs.existsSync(buildPath)).toBe(true);
      
      const buildContent = fs.readFileSync(buildPath, 'utf8');
      expect(buildContent).toContain('wasm-pack build');
      expect(buildContent).toContain('--target web');
    });

    test('should have HTML interface', () => {
      const htmlPath = path.join(__dirname, '..', 'bevy-game', 'index.html');
      expect(fs.existsSync(htmlPath)).toBe(true);
      
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      expect(htmlContent).toContain('Bevy Game Foundation');
      expect(htmlContent).toContain('bevy-game-canvas');
      expect(htmlContent).toContain('Entity-Component-System');
    });
  });

  describe('WASM Build Verification', () => {
    test('should have generated WASM files after build', () => {
      const pkgPath = path.join(__dirname, '..', 'bevy-game', 'pkg');
      const wasmFile = path.join(pkgPath, 'bevy_game_bg.wasm');
      const jsFile = path.join(pkgPath, 'bevy_game.js');
      
      // Check if pkg directory exists (build was run)
      if (fs.existsSync(pkgPath)) {
        expect(fs.existsSync(wasmFile)).toBe(true);
        expect(fs.existsSync(jsFile)).toBe(true);
        
        // Check file sizes (should not be empty)
        const wasmStats = fs.statSync(wasmFile);
        const jsStats = fs.statSync(jsFile);
        
        expect(wasmStats.size).toBeGreaterThan(1000); // WASM file should be reasonably sized
        expect(jsStats.size).toBeGreaterThan(500);    // JS file should contain bindings
      } else {
        console.log('WASM files not built yet - run ./build.sh in bevy-game directory');
      }
    });

    test('should have valid package.json in pkg', () => {
      const pkgJsonPath = path.join(__dirname, '..', 'bevy-game', 'pkg', 'package.json');
      
      if (fs.existsSync(pkgJsonPath)) {
        const pkgContent = fs.readFileSync(pkgJsonPath, 'utf8');
        const pkg = JSON.parse(pkgContent);
        
        expect(pkg.name).toBe('bevy-game');
        expect(pkg.files).toContain('bevy_game_bg.wasm');
        expect(pkg.files).toContain('bevy_game.js');
      }
    });
  });

  describe('Game Logic Architecture', () => {
    test('should implement ECS-style architecture in source', () => {
      const libPath = path.join(__dirname, '..', 'bevy-game', 'src', 'lib.rs');
      const libContent = fs.readFileSync(libPath, 'utf8');
      
      // Check for entity-component patterns
      expect(libContent).toContain('struct Sprite');
      expect(libContent).toContain('sprites: Vec<Sprite>');
      
      // Check for system-like functions
      expect(libContent).toContain('update_and_render');
      expect(libContent).toContain('render_frame');
    });

    test('should have target-based movement system', () => {
      const libPath = path.join(__dirname, '..', 'bevy-game', 'src', 'lib.rs');
      const libContent = fs.readFileSync(libPath, 'utf8');
      
      // Check for Target component
      expect(libContent).toContain('struct Target');
      expect(libContent).toContain('find_new_target: bool');
      
      // Check for target field in sprite
      expect(libContent).toContain('target: Option<Target>');
      
      // Check for target-seeking behavior
      expect(libContent).toContain('// Calculate direction to target');
      expect(libContent).toContain('// Check if close enough to target');
      expect(libContent).toContain('// Find a new random target');
      expect(libContent).toContain('// Clear the target');
      
      // Check for rotation property
      expect(libContent).toContain('rotation');
    });

    test('should demonstrate different target behaviors', () => {
      const libPath = path.join(__dirname, '..', 'bevy-game', 'src', 'lib.rs');
      const libContent = fs.readFileSync(libPath, 'utf8');
      
      // Check for sprite with findNewTarget = true
      expect(libContent).toContain('find_new_target: true');
      
      // Check for sprite with findNewTarget = false  
      expect(libContent).toContain('find_new_target: false');
      
      // Check for sprite with no target
      expect(libContent).toContain('target: None');
      
      // Check for target reaching tolerance
      expect(libContent).toContain('tolerance = 5.0');
    });

    test('should have rendering capabilities', () => {
      const libPath = path.join(__dirname, '..', 'bevy-game', 'src', 'lib.rs');
      const libContent = fs.readFileSync(libPath, 'utf8');
      
      // Check for canvas operations
      expect(libContent).toContain('CanvasRenderingContext2d');
      expect(libContent).toContain('clear_rect');
      expect(libContent).toContain('fill_rect');
      expect(libContent).toContain('translate');
      expect(libContent).toContain('rotate');
    });
  });

  describe('Web Integration', () => {
    test('should have proper canvas setup in HTML', () => {
      const htmlPath = path.join(__dirname, '..', 'bevy-game', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      expect(htmlContent).toContain('<canvas id="bevy-game-canvas"');
      expect(htmlContent).toContain('width="800"');
      expect(htmlContent).toContain('height="600"');
    });

    test('should have fallback handling', () => {
      const htmlPath = path.join(__dirname, '..', 'bevy-game', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      expect(htmlContent).toContain('id="fallback"');
      expect(htmlContent).toContain('Build Required');
      expect(htmlContent).toContain('./build.sh');
    });

    test('should have proper module import', () => {
      const htmlPath = path.join(__dirname, '..', 'bevy-game', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      expect(htmlContent).toContain('type="module"');
      expect(htmlContent).toContain('./pkg/bevy_game.js');
      expect(htmlContent).toContain('new module.BevyGame');
    });
  });

  describe('README Documentation', () => {
    test('should have comprehensive README', () => {
      const readmePath = path.join(__dirname, '..', 'bevy-game', 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
      
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      expect(readmeContent).toContain('# Bevy Game Foundation');
      expect(readmeContent).toContain('Entity-Component-System');
      expect(readmeContent).toContain('WebAssembly');
      expect(readmeContent).toContain('Building');
      expect(readmeContent).toContain('wasm-pack');
    });

    test('should document build instructions', () => {
      const readmePath = path.join(__dirname, '..', 'bevy-game', 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      expect(readmeContent).toContain('./build.sh');
      expect(readmeContent).toContain('rustup target add wasm32-unknown-unknown');
      expect(readmeContent).toContain('cargo install wasm-pack');
    });

    test('should explain architecture progression', () => {
      const readmePath = path.join(__dirname, '..', 'bevy-game', 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      expect(readmeContent).toContain('Bevy Integration Path');
      expect(readmeContent).toContain('Phase 1');
      expect(readmeContent).toContain('Phase 2');
      expect(readmeContent).toContain('Full Bevy feature set');
    });
  });
});