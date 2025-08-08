const path = require('path');
const fs = require('fs');

describe('ECS Game', () => {
  describe('Project Structure', () => {
    test('should have ECS game directory', () => {
      const ecsGamePath = path.join(__dirname, '..', 'ecs-game');
      expect(fs.existsSync(ecsGamePath)).toBe(true);
      expect(fs.statSync(ecsGamePath).isDirectory()).toBe(true);
    });

    test('should have go.mod file', () => {
      const goModPath = path.join(__dirname, '..', 'ecs-game', 'go.mod');
      expect(fs.existsSync(goModPath)).toBe(true);
      
      const content = fs.readFileSync(goModPath, 'utf-8');
      expect(content).toContain('module github.com/Tleety/Chatgpt-Test-webpage/ecs-game');
      expect(content).toContain('github.com/hajimehoshi/ebiten/v2');
    });

    test('should have main.go file', () => {
      const mainGoPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      expect(fs.existsSync(mainGoPath)).toBe(true);
      
      const content = fs.readFileSync(mainGoPath, 'utf-8');
      expect(content).toContain('package main');
      expect(content).toContain('ebiten.RunGame');
    });

    test('should have index.html file', () => {
      const indexPath = path.join(__dirname, '..', 'ecs-game', 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('ECS Game Demo');
      expect(content).toContain('wasm_exec.js');
      expect(content).toContain('game.wasm');
    });

    test('should have ECS components', () => {
      const componentsPath = path.join(__dirname, '..', 'ecs-game', 'components', 'components.go');
      expect(fs.existsSync(componentsPath)).toBe(true);
      
      const content = fs.readFileSync(componentsPath, 'utf-8');
      expect(content).toContain('package components');
      expect(content).toContain('type Position struct');
      expect(content).toContain('type Velocity struct');
      expect(content).toContain('type Sprite struct');
      expect(content).toContain('type Player struct');
      expect(content).toContain('type AI struct');
    });

    test('should have ECS systems', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      expect(fs.existsSync(systemsPath)).toBe(true);
      
      const content = fs.readFileSync(systemsPath, 'utf-8');
      expect(content).toContain('package systems');
      expect(content).toContain('type InputSystem struct');
      expect(content).toContain('type MovementSystem struct');
      expect(content).toContain('type AISystem struct');
    });

    test('should have custom ECS framework', () => {
      const ecsPath = path.join(__dirname, '..', 'ecs-game', 'ecs', 'ecs.go');
      expect(fs.existsSync(ecsPath)).toBe(true);
      
      const content = fs.readFileSync(ecsPath, 'utf-8');
      expect(content).toContain('package ecs');
      expect(content).toContain('type Entity struct');
      expect(content).toContain('type World struct');
      expect(content).toContain('func NewWorld()');
    });
  });

  describe('WASM Build', () => {
    test('should have WASM file', () => {
      const wasmPath = path.join(__dirname, '..', 'ecs-game', 'game.wasm');
      expect(fs.existsSync(wasmPath)).toBe(true);
      
      const stats = fs.statSync(wasmPath);
      expect(stats.size).toBeGreaterThan(1000); // Should be a reasonable size
    });

    test('should have wasm_exec.js runtime', () => {
      const wasmExecPath = path.join(__dirname, '..', 'ecs-game', 'wasm_exec.js');
      expect(fs.existsSync(wasmExecPath)).toBe(true);
      
      const content = fs.readFileSync(wasmExecPath, 'utf-8');
      expect(content).toContain('WebAssembly');
      expect(content).toContain('Go');
    });
  });

  describe('ECS Architecture Validation', () => {
    test('main.go should implement ECS pattern', () => {
      const mainGoPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const content = fs.readFileSync(mainGoPath, 'utf-8');
      
      // Check for ECS pattern implementation
      expect(content).toContain('world := ecs.NewWorld()');
      expect(content).toContain('inputSystem');
      expect(content).toContain('movementSystem');
      expect(content).toContain('aiSystem');
      expect(content).toContain('AddComponent');
      expect(content).toContain('ForEachEntity');
    });

    test('should have proper component definitions', () => {
      const componentsPath = path.join(__dirname, '..', 'ecs-game', 'components', 'components.go');
      const content = fs.readFileSync(componentsPath, 'utf-8');
      
      // Check that components are properly structured
      expect(content).toContain('X, Y float64'); // Position and Target components
      expect(content).toContain('ColorR, ColorG, ColorB uint8'); // Sprite component
      expect(content).toContain('Speed float64'); // AI and ClickToMove components
      expect(content).toContain('StopWhenTargetReached bool'); // Target component
    });

    test('should have proper system implementations', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const content = fs.readFileSync(systemsPath, 'utf-8');
      
      // Check that systems operate on entities with components
      expect(content).toContain('e.HasComponent(components.Player{})');
      expect(content).toContain('e.GetComponent(components.Position{})');
      expect(content).toContain('e.AddComponent(');
      expect(content).toContain('ebiten.IsKeyPressed');
      expect(content).toContain('inpututil.IsMouseButtonJustPressed');
    });

    test('should use Ebiten game engine properly', () => {
      const mainGoPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const content = fs.readFileSync(mainGoPath, 'utf-8');
      
      // Check for proper Ebiten usage
      expect(content).toContain('ebiten.SetWindowSize');
      expect(content).toContain('ebiten.SetWindowTitle');
      expect(content).toContain('ebiten.RunGame');
      expect(content).toContain('Update() error');
      expect(content).toContain('Draw(screen *ebiten.Image)');
      expect(content).toContain('Layout(outsideWidth, outsideHeight int)');
    });
  });

  describe('Web Integration', () => {
    test('HTML should follow repository patterns', () => {
      const indexPath = path.join(__dirname, '..', 'ecs-game', 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Check for consistent styling and structure
      expect(content).toContain('link rel="stylesheet" href="../style.css"');
      expect(content).toContain('script src="../top-bar.js"');
      expect(content).toContain('link rel="icon" href="../favicon.svg"');
      expect(content).toContain('class="hero"');
      expect(content).toContain('class="game-instructions"');
    });

    test('HTML should have proper WASM loading code', () => {
      const indexPath = path.join(__dirname, '..', 'ecs-game', 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Check for proper WASM initialization
      expect(content).toContain('const go = new Go()');
      expect(content).toContain('WebAssembly.instantiateStreaming');
      expect(content).toContain('go.run(result.instance)');
      expect(content).toContain('canvas.width = 800'); // Fixed size instead of viewport
      expect(content).toContain('canvas.height = 600'); // Fixed size instead of viewport
    });

    test('should be integrated into main index.html', () => {
      const mainIndexPath = path.join(__dirname, '..', 'index.html');
      const content = fs.readFileSync(mainIndexPath, 'utf-8');
      
      // Check that ECS game is listed in main page
      expect(content).toContain('href="ecs-game/index.html"');
      expect(content).toContain('ECS Game');
    });
  });

  describe('Game Logic', () => {
    test('should have player entity creation', () => {
      const mainGoPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const content = fs.readFileSync(mainGoPath, 'utf-8');
      
      // Check that player entity is properly created
      expect(content).toContain('player := g.world.NewEntity()');
      expect(content).toContain('player.AddComponent(components.Position{X: 400, Y: 300})');
      expect(content).toContain('player.AddComponent(components.Player{})');
    });

    test('should have AI entities creation', () => {
      const mainGoPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const content = fs.readFileSync(mainGoPath, 'utf-8');
      
      // Check that AI entities are properly created
      expect(content).toContain('ai := g.world.NewEntity()');
      expect(content).toContain('ai.AddComponent(components.AI{');
      expect(content).toContain('for i := 0; i < 3; i++');
    });

    test('should have proper rendering system', () => {
      const mainGoPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const content = fs.readFileSync(mainGoPath, 'utf-8');
      
      // Check that entities are rendered with their sprite components
      expect(content).toContain('ebitenutil.DrawRect');
      expect(content).toContain('color.RGBA{sprite.ColorR, sprite.ColorG, sprite.ColorB, 255}');
      expect(content).toContain('ebitenutil.DebugPrint');
    });
  });

  describe('Performance and Quality', () => {
    test('ECS framework should be efficient', () => {
      const ecsPath = path.join(__dirname, '..', 'ecs-game', 'ecs', 'ecs.go');
      const content = fs.readFileSync(ecsPath, 'utf-8');
      
      // Check for efficient component storage using reflect.Type as key
      expect(content).toContain('map[reflect.Type]Component');
      expect(content).toContain('reflect.TypeOf(component)');
    });

    test('should have proper delta time handling', () => {
      const mainGoPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const content = fs.readFileSync(mainGoPath, 'utf-8');
      
      // Check for frame-rate independent movement
      expect(content).toContain('dt := now.Sub(g.lastUpdate).Seconds()');
      expect(content).toContain('Update(dt)');
    });

    test('should have boundary checking', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const content = fs.readFileSync(systemsPath, 'utf-8');
      
      // Check that entities stay within screen bounds
      expect(content).toContain('if position.X < 0');
      expect(content).toContain('if position.Y < 0');
      expect(content).toContain('800-20'); // Screen width minus entity width
      expect(content).toContain('600-20'); // Screen height minus entity height
    });
  });
});