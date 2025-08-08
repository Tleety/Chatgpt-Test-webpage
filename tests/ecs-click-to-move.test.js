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
      expect(componentContent).toContain('Speed float64');
      // ClickToMove component should be simplified - no target coordinates
      expect(componentContent).not.toContain('TargetX, TargetY');
      expect(componentContent).not.toContain('HasTarget');
    });

    test('should contain Target component and no ClickToMoveSystem', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      expect(fs.existsSync(systemsPath)).toBe(true);
      
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      // ClickToMoveSystem should be removed in favor of unified MovementSystem
      expect(systemContent).not.toContain('ClickToMoveSystem');
      expect(systemContent).not.toContain('NewClickToMoveSystem');
      expect(systemContent).not.toContain('func (s *ClickToMoveSystem) Update');
      
      // Should have Target component handling in systems
      expect(systemContent).toContain('components.Target{');
      expect(systemContent).toContain('StopWhenTargetReached');
    });

    test('should have updated main game to not include ClickToMoveSystem', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      expect(fs.existsSync(mainPath)).toBe(true);
      
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      // ClickToMoveSystem should be removed from main game
      expect(mainContent).not.toContain('clickToMoveSystem');
      expect(mainContent).not.toContain('ClickToMoveSystem');
      expect(mainContent).not.toContain('NewClickToMoveSystem');
      
      // Should have the three remaining systems
      expect(mainContent).toContain('inputSystem');
      expect(mainContent).toContain('movementSystem');
      expect(mainContent).toContain('aiSystem');
    });

    test('should create entities with simplified ClickToMove component', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      expect(mainContent).toContain('components.ClickToMove');
      expect(mainContent).toContain('Speed: 120');
      // Should not contain old ClickToMove fields
      expect(mainContent).not.toContain('HasTarget: false');
      expect(mainContent).not.toContain('TargetX:');
      expect(mainContent).not.toContain('TargetY:');
    });

    test('should have updated input system to set Target components', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      expect(systemContent).toContain('components.ClickToMove{}');
      expect(systemContent).toContain('target := components.Target{');
      expect(systemContent).toContain('X:                     float64(mx)');
      expect(systemContent).toContain('Y:                     float64(my)');
      expect(systemContent).toContain('StopWhenTargetReached: true');
      expect(systemContent).toContain('e.AddComponent(target)');
    });
  });

  describe('Component Logic Verification', () => {
    test('ClickToMove component should have simplified structure', () => {
      const componentsPath = path.join(__dirname, '..', 'ecs-game', 'components', 'components.go');
      const componentContent = fs.readFileSync(componentsPath, 'utf8');
      
      // Check that ClickToMove component has simplified structure
      const clickToMoveMatch = componentContent.match(/type ClickToMove struct \{[\s\S]*?\}/);
      expect(clickToMoveMatch).toBeTruthy();
      
      const clickToMoveStruct = clickToMoveMatch[0];
      expect(clickToMoveStruct).toContain('Speed float64');
      // Should not contain target coordinates anymore (moved to Target component)
      expect(clickToMoveStruct).not.toContain('TargetX, TargetY');
      expect(clickToMoveStruct).not.toContain('HasTarget');
    });

    test('MovementSystem should handle target reaching logic', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Check for proper target reaching logic in MovementSystem
      expect(systemContent).toContain('if dist < 5 && target.StopWhenTargetReached');
      expect(systemContent).toContain('velocity.X = 0');
      expect(systemContent).toContain('velocity.Y = 0');
      expect(systemContent).toContain('e.RemoveComponent(components.Target{})');
    });

    test('MovementSystem should handle unified movement calculations', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Check for proper movement calculation in unified MovementSystem
      expect(systemContent).toContain('dx := target.X - position.X');
      expect(systemContent).toContain('dy := target.Y - position.Y');
      expect(systemContent).toContain('math.Sqrt(dx*dx + dy*dy)');
      expect(systemContent).toContain('clickToMove.Speed');
      expect(systemContent).toContain('ai.Speed');
      expect(systemContent).toContain('(dx / dist) * speed');
      expect(systemContent).toContain('(dy / dist) * speed');
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

    test('should properly initialize ClickToMove entities with simplified state', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // Check simplified initialization
      expect(mainContent).toContain('components.ClickToMove{Speed: 120}');
      expect(mainContent).not.toContain('HasTarget: false');
      expect(mainContent).not.toContain('TargetX:');
      expect(mainContent).not.toContain('TargetY:');
    });

    test('should maintain existing AI system functionality', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Ensure AI system is unchanged
      expect(systemContent).toContain('AISystem');
      expect(systemContent).toContain('components.AI{}');
    });

    test('should update systems in simplified order without ClickToMoveSystem', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // Check system update order - should not include clickToMoveSystem
      const updateSection = mainContent.match(/func \(g \*Game\) Update\(\)[\s\S]*?return nil/);
      expect(updateSection).toBeTruthy();
      
      const updateOrder = updateSection[0];
      expect(updateOrder).toContain('g.inputSystem.Update()');
      expect(updateOrder).toContain('g.movementSystem.Update(dt)');
      expect(updateOrder).toContain('g.aiSystem.Update(dt)');
      expect(updateOrder).not.toContain('g.clickToMoveSystem.Update(dt)');
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

    test('should handle entities without Target component gracefully', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Check for component existence checks in MovementSystem
      expect(systemContent).toContain('!e.HasComponent(components.ClickToMove{})');
      expect(systemContent).toContain('!e.HasComponent(components.Position{})');
      expect(systemContent).toContain('if targetComp, hasTarget := e.GetComponent(components.Target{})');
      expect(systemContent).toContain('return');
    });
  });
});