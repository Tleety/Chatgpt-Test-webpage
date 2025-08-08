/**
 * @jest-environment jsdom
 */

describe('ECS Target Component Refactored Architecture', () => {
  const path = require('path');
  const fs = require('fs');

  describe('Component Architecture', () => {
    test('WASM file should exist and be valid', () => {
      const wasmPath = path.join(__dirname, '..', 'ecs-game', 'game.wasm');
      expect(fs.existsSync(wasmPath)).toBe(true);
      
      const stats = fs.statSync(wasmPath);
      expect(stats.size).toBeGreaterThan(1000);
    });

    test('should contain Target component definition', () => {
      const componentsPath = path.join(__dirname, '..', 'ecs-game', 'components', 'components.go');
      expect(fs.existsSync(componentsPath)).toBe(true);
      
      const componentContent = fs.readFileSync(componentsPath, 'utf8');
      expect(componentContent).toContain('Target');
      expect(componentContent).toContain('X, Y                   float64');
      expect(componentContent).toContain('StopWhenTargetReached bool');
    });

    test('should have simplified ClickToMove component', () => {
      const componentsPath = path.join(__dirname, '..', 'ecs-game', 'components', 'components.go');
      const componentContent = fs.readFileSync(componentsPath, 'utf8');
      
      // Check that ClickToMove is simplified
      const clickToMoveMatch = componentContent.match(/type ClickToMove struct \{[\s\S]*?\}/);
      expect(clickToMoveMatch).toBeTruthy();
      
      const clickToMoveStruct = clickToMoveMatch[0];
      expect(clickToMoveStruct).toContain('Speed float64');
      // Should not contain target coordinates anymore
      expect(clickToMoveStruct).not.toContain('TargetX');
      expect(clickToMoveStruct).not.toContain('TargetY');
      expect(clickToMoveStruct).not.toContain('HasTarget');
    });

    test('should have simplified AI component', () => {
      const componentsPath = path.join(__dirname, '..', 'ecs-game', 'components', 'components.go');
      const componentContent = fs.readFileSync(componentsPath, 'utf8');
      
      // Check that AI is simplified
      const aiMatch = componentContent.match(/type AI struct \{[\s\S]*?\}/);
      expect(aiMatch).toBeTruthy();
      
      const aiStruct = aiMatch[0];
      expect(aiStruct).toContain('Speed float64');
      // Should not contain target coordinates anymore
      expect(aiStruct).not.toContain('TargetX');
      expect(aiStruct).not.toContain('TargetY');
    });
  });

  describe('System Integration', () => {
    test('should not contain ClickToMoveSystem', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      expect(systemContent).not.toContain('ClickToMoveSystem');
      expect(systemContent).not.toContain('NewClickToMoveSystem');
    });

    test('should have updated MovementSystem to handle targets', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      expect(systemContent).toContain('components.Target{}');
      expect(systemContent).toContain('target.StopWhenTargetReached');
      expect(systemContent).toContain('e.RemoveComponent(components.Target{})');
    });

    test('should have updated InputSystem to set targets', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      expect(systemContent).toContain('target := components.Target{');
      expect(systemContent).toContain('X:                     float64(mx)');
      expect(systemContent).toContain('Y:                     float64(my)');
      expect(systemContent).toContain('StopWhenTargetReached: true');
    });

    test('should have updated AISystem to use targets', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      expect(systemContent).toContain('components.Target{}');
      expect(systemContent).toContain('StopWhenTargetReached: false');
    });
  });

  describe('Main Game Integration', () => {
    test('should not reference ClickToMoveSystem in main', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      expect(mainContent).not.toContain('clickToMoveSystem');
      expect(mainContent).not.toContain('ClickToMoveSystem');
      expect(mainContent).not.toContain('NewClickToMoveSystem');
    });

    test('should have simplified Game struct', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // Check Game struct doesn't have clickToMoveSystem
      const gameStructMatch = mainContent.match(/type Game struct \{[\s\S]*?\}/);
      expect(gameStructMatch).toBeTruthy();
      
      const gameStruct = gameStructMatch[0];
      expect(gameStruct).not.toContain('clickToMoveSystem');
    });

    test('should have updated system update order', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // Check that clickToMoveSystem update is removed
      const updateMatch = mainContent.match(/func \(g \*Game\) Update\(\)[\s\S]*?return nil/);
      expect(updateMatch).toBeTruthy();
      
      const updateSection = updateMatch[0];
      expect(updateSection).toContain('g.inputSystem.Update()');
      expect(updateSection).toContain('g.movementSystem.Update(dt)');
      expect(updateSection).toContain('g.aiSystem.Update(dt)');
      expect(updateSection).not.toContain('g.clickToMoveSystem.Update(dt)');
    });

    test('should create entities with simplified components', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // ClickToMove entities should only have Speed
      expect(mainContent).toContain('components.ClickToMove{Speed: 120}');
      expect(mainContent).not.toContain('HasTarget: false');
      
      // AI entities should only have Speed
      expect(mainContent).toContain('components.AI{Speed: 50}');
      expect(mainContent).not.toContain('TargetX:');
      expect(mainContent).not.toContain('TargetY:');
    });
  });

  describe('Movement Logic Integration', () => {
    test('MovementSystem should handle different entity types', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      expect(systemContent).toContain('if clickComp, hasClick := e.GetComponent(components.ClickToMove{})');
      expect(systemContent).toContain('if aiComp, hasAI := e.GetComponent(components.AI{})');
      expect(systemContent).toContain('clickToMove.Speed');
      expect(systemContent).toContain('ai.Speed');
    });

    test('should handle target reaching logic properly', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      expect(systemContent).toContain('if dist < 5 && target.StopWhenTargetReached');
      expect(systemContent).toContain('velocity.X = 0');
      expect(systemContent).toContain('velocity.Y = 0');
      expect(systemContent).toContain('e.RemoveComponent(components.Target{})');
    });

    test('should maintain existing functionality for different entity types', () => {
      const mainPath = path.join(__dirname, '..', 'ecs-game', 'main.go');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // Should still have instructions mentioning click functionality
      expect(mainContent).toContain('Click mouse to move blue squares to cursor');
      expect(mainContent).toContain('Red squares are AI entities');
      expect(mainContent).toContain('Arrow keys or WASD to move green player');
    });
  });

  describe('Architecture Benefits', () => {
    test('should have removed duplicate movement logic', () => {
      const systemsPath = path.join(__dirname, '..', 'ecs-game', 'systems', 'systems.go');
      const systemContent = fs.readFileSync(systemsPath, 'utf8');
      
      // Movement calculations should only be in MovementSystem
      expect(systemContent).toContain('dx := target.X - position.X');
      expect(systemContent).toContain('dy := target.Y - position.Y');
      expect(systemContent).toContain('dist := math.Sqrt(dx*dx + dy*dy)');
      
      // Should not have duplicate movement logic
      expect(systemContent).not.toContain('func (s *ClickToMoveSystem) Update');
    });

    test('should follow ECS principles with component separation', () => {
      const componentsPath = path.join(__dirname, '..', 'ecs-game', 'components', 'components.go');
      const componentContent = fs.readFileSync(componentsPath, 'utf8');
      
      // Target component should be separate and reusable
      expect(componentContent).toContain('type Target struct');
      expect(componentContent).toContain('type ClickToMove struct');
      expect(componentContent).toContain('type AI struct');
      
      // Each component should have a single responsibility
      const targetMatch = componentContent.match(/type Target struct \{[\s\S]*?\}/);
      const targetStruct = targetMatch[0];
      expect(targetStruct).not.toContain('Speed'); // Speed should not be in Target
    });
  });
});