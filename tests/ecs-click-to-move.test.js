/**
 * @jest-environment jsdom
 */

describe('ECS Click-to-Move Component', () => {
  const path = require('path');
  const fs = require('fs');

  describe('Component and System Integration', () => {
    test('WASM file should exist and be valid', () => {
      const wasmPath = path.join(__dirname, '..', 'ecs-game', 'game.wasm');
      expect(fs.existsSync(wasmPath)).toBe(true);
      
      const stats = fs.statSync(wasmPath);
      expect(stats.size).toBeGreaterThan(1000);
    });

    test('should contain ClickToMove component definition', () => {
      const componentsPath = path.join(__dirname, '..', 'ecs-game', 'components', 'components.go');
      expect(fs.existsSync(componentsPath)).toBe(true);
      
      const componentContent = fs.readFileSync(componentsPath, 'utf8');
      expect(componentContent).toContain('ClickToMove');
      expect(componentContent).toContain('TargetX, TargetY float64');
      expect(componentContent).toContain('Speed');
      expect(componentContent).toContain('HasTarget');
    });

    test('should contain ClickToMoveSystem implementation', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      expect(fs.existsSync(systemsPath)).toBe(true);
      
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      expect(systemContent).toContain('ClickToMoveSystem');
      expect(systemContent).toContain('NewClickToMoveSystem');
      expect(systemContent).toContain('func (s *ClickToMoveSystem) Update');
    });

    test('should have updated main game to include ClickToMoveSystem', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      expect(fs.existsSync(mainPath)).toBe(true);
      
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      expect(mainContent).toContain('clickToMoveSystem');
      expect(mainContent).toContain('ClickToMoveSystem');
      expect(mainContent).toContain('NewClickToMoveSystem');
    });

    test('should create entities with ClickToMove component', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      expect(mainContent).toContain('components.ClickToMove');
      expect(mainContent).toContain('Speed: 120');
      expect(mainContent).toContain('HasTarget: false');
    });

    test('should have updated input system for click handling', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      expect(systemContent).toContain('ClickToMove{}');
      expect(systemContent).toContain('clickToMove.TargetX = float64(mx)');
      expect(systemContent).toContain('clickToMove.TargetY = float64(my)');
      expect(systemContent).toContain('clickToMove.HasTarget = true');
    });
  });

  describe('Component Logic Verification', () => {
    test('ClickToMove component should have required fields', () => {
      const componentsPath = path.join(__dirname, '..', 'ecs-game', 'components', 'components.go');
      const componentContent = fs.readFileSync(componentsPath, 'utf8');
      
      // Check that ClickToMove component has all necessary fields
      const clickToMoveMatch = componentContent.match(/type ClickToMove struct \{[\s\S]*?\}/);
      expect(clickToMoveMatch).toBeTruthy();
      
      const clickToMoveStruct = clickToMoveMatch[0];
      expect(clickToMoveStruct).toContain('TargetX, TargetY float64');
      expect(clickToMoveStruct).toContain('Speed            float64');
      expect(clickToMoveStruct).toContain('HasTarget        bool');
    });

    test('ClickToMoveSystem should handle target reaching logic', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Check for proper target reaching logic
      expect(systemContent).toContain('if dist < 5');
      expect(systemContent).toContain('clickToMove.HasTarget = false');
      expect(systemContent).toContain('vel.X = 0');
      expect(systemContent).toContain('vel.Y = 0');
    });

    test('ClickToMoveSystem should handle movement calculations', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Check for proper movement calculation
      expect(systemContent).toContain('dx := clickToMove.TargetX - pos.X');
      expect(systemContent).toContain('dy := clickToMove.TargetY - pos.Y');
      expect(systemContent).toContain('math.Sqrt(dx*dx + dy*dy)');
      expect(systemContent).toContain('(dx / dist) * clickToMove.Speed');
      expect(systemContent).toContain('(dy / dist) * clickToMove.Speed');
    });

    test('InputSystem should handle clicks for ClickToMove entities', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Check for click handling for ClickToMove entities
      expect(systemContent).toContain('inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonLeft)');
      expect(systemContent).toContain('e.HasComponent(components.ClickToMove{})');
      expect(systemContent).toContain('ebiten.CursorPosition()');
    });
  });

  describe('Visual Design Consistency', () => {
    test('should have distinct visual appearance for ClickToMove entities', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // Check that ClickToMove entities have blue color
      expect(mainContent).toContain('ColorR: 100, ColorG: 100, ColorB: 255');
      expect(mainContent).toContain('Width: 18, Height: 18');
    });

    test('should have updated instructions to describe ClickToMove functionality', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      expect(mainContent).toContain('Click mouse to move blue squares to cursor');
    });

    test('should create multiple ClickToMove entities for demonstration', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // Check that multiple ClickToMove entities are created
      expect(mainContent).toContain('for i := 0; i < 3; i++');
      expect(mainContent).toMatch(/clickEntity.*AddComponent.*ClickToMove/);
    });
  });

  describe('System Integration', () => {
    test('should maintain separation between Player and ClickToMove input handling', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Check that player input is handled separately
      expect(systemContent).toContain('e.HasComponent(components.Player{})');
      expect(systemContent).toContain('// Handle mouse input for player (existing behavior)');
    });

    test('should properly initialize ClickToMove entities with default state', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // Check default initialization
      expect(mainContent).toContain('HasTarget: false');
      expect(mainContent).toContain('Speed: 120');
    });

    test('should maintain existing AI system functionality', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Ensure AI system is unchanged
      expect(systemContent).toContain('AISystem');
      expect(systemContent).toContain('components.AI{}');
    });

    test('should update all systems in proper order', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // Check system update order
      const updateSection = mainContent.match(/func \(g \*Game\) Update\(\)[\s\S]*?return nil/);
      expect(updateSection).toBeTruthy();
      
      const updateOrder = updateSection[0];
      expect(updateOrder).toContain('g.inputSystem.Update()');
      expect(updateOrder).toContain('g.movementSystem.Update(dt)');
      expect(updateOrder).toContain('g.aiSystem.Update(dt)');
      expect(updateOrder).toContain('g.clickToMoveSystem.Update(dt)');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle entities without required components gracefully', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Check for component existence checks
      expect(systemContent).toContain('!e.HasComponent(components.ClickToMove{})');
      expect(systemContent).toContain('!e.HasComponent(components.Position{})');
      expect(systemContent).toContain('!exists');
      expect(systemContent).toContain('return');
    });

    test('should handle case when entity has no target', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      expect(systemContent).toContain('!clickToMove.HasTarget');
      expect(systemContent).toContain('vel.X = 0');
      expect(systemContent).toContain('vel.Y = 0');
    });
  });
});