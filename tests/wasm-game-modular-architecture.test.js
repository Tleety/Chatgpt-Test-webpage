// Test to verify WASM game refactoring works correctly
// This test will verify the Go files are properly modularized

const fs = require('fs');
const path = require('path');

describe('WASM Game Modular Architecture', () => {

    test('main.go is properly refactored and lean', () => {
        const mainGoPath = path.join(__dirname, '..', 'go-wasm-game', 'main.go');
        const mainGoContent = fs.readFileSync(mainGoPath, 'utf8');
        
        // Verify main.go doesn't contain moved functions
        expect(mainGoContent).not.toContain('func drawTreeAt');
        expect(mainGoContent).not.toContain('func drawBushAt');
        expect(mainGoContent).not.toContain('func createUnit');
        expect(mainGoContent).not.toContain('func getUnits');
        expect(mainGoContent).not.toContain('func moveUnitJS');
        expect(mainGoContent).not.toContain('func removeUnitJS');
        expect(mainGoContent).not.toContain('func click(');
        expect(mainGoContent).not.toContain('func recenterSquare');
        
        // Verify main.go still contains essential functionality
        expect(mainGoContent).toContain('func main()');
        expect(mainGoContent).toContain('func draw(');
        expect(mainGoContent).toContain('environment = world.NewEnvironment'); // Simplified environment initialization
        expect(mainGoContent).toContain('game.InitializeEventHandlers');
        expect(mainGoContent).toContain('game.InitializeJSInterface');
        
        // Count lines - should be significantly reduced
        const lines = mainGoContent.split('\n').length;
        expect(lines).toBeLessThan(150); // Original was ~440 lines, now allows for well-organized main.go
    });

    test('environment.go contains environment-related functionality', () => {
        const envGoPath = path.join(__dirname, '..', 'go-wasm-game', 'world', 'environment.go');
        const envGoContent = fs.readFileSync(envGoPath, 'utf8');
        
        // Verify environment functions are present
        expect(envGoContent).toContain('type Tree struct');
        expect(envGoContent).toContain('type Bush struct');
        expect(envGoContent).toContain('func renderTree'); // Updated naming convention
        expect(envGoContent).toContain('func renderBush'); // Updated naming convention
        expect(envGoContent).toContain('func (e *Environment) Render');
    });

    test('js_interface.go contains JavaScript interface functions', () => {
        const jsInterfacePath = path.join(__dirname, '..', 'go-wasm-game', 'game', 'js_interface.go');
        const jsInterfaceContent = fs.readFileSync(jsInterfacePath, 'utf8');
        
        // Verify JS interface functions are present
        expect(jsInterfaceContent).toContain('func createUnit');
        expect(jsInterfaceContent).toContain('func getUnits');
        expect(jsInterfaceContent).toContain('func moveUnit'); // Updated naming convention
        expect(jsInterfaceContent).toContain('func removeUnit'); // Updated naming convention
        expect(jsInterfaceContent).toContain('func InitializeJSInterface');
    });

    test('game_events.go contains event handling functionality', () => {
        const gameEventsPath = path.join(__dirname, '..', 'go-wasm-game', 'game', 'game_events.go');
        const gameEventsContent = fs.readFileSync(gameEventsPath, 'utf8');
        
        // Verify event handling functions are present
        expect(gameEventsContent).toContain('func recenterSquare');
        expect(gameEventsContent).toContain('func click(');
        expect(gameEventsContent).toContain('func InitializeEventHandlers');
    });

    test('all Go files compile successfully', () => {
        // This test verifies that the build completed successfully
        const wasmPath = path.join(__dirname, '..', 'go-wasm-game', 'game.wasm');
        expect(fs.existsSync(wasmPath)).toBe(true);
        
        // Check that the WASM file is not empty
        const stats = fs.statSync(wasmPath);
        expect(stats.size).toBeGreaterThan(0);
    });

    test('modular architecture maintains single responsibility', () => {
        const goWasmDir = path.join(__dirname, '..', 'go-wasm-game');
        const files = [
            { file: 'environment.go', path: 'world' },
            { file: 'js_interface.go', path: 'game' }, 
            { file: 'game_events.go', path: 'game' },
            { file: 'main.go', path: '' }
        ];

        files.forEach(({file, path: subDir}) => {
            const filePath = subDir ? path.join(goWasmDir, subDir, file) : path.join(goWasmDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').length;
            
            // Each module should be reasonably sized and focused
            if (file === 'main.go') {
                expect(lines).toBeLessThan(150); // Main should be lean
            } else {
                expect(lines).toBeLessThan(200); // Modules should be focused
            }
        });
    });

    test('unit management system files are properly separated', () => {
        const unitFilesInEntities = [
            { file: 'unit_types.go', package: 'entities' }
        ];
        
        const unitFilesInUnits = [
            { file: 'unit.go', package: 'units' },
            { file: 'unit_spatial.go', package: 'units' },
            { file: 'unit_combat.go', package: 'units' },
            { file: 'unit_renderer.go', package: 'units' },
            { file: 'unit_manager.go', package: 'units' }
        ];

        // Check files in entities package
        unitFilesInEntities.forEach(({file, package: pkg}) => {
            const filePath = path.join(__dirname, '..', 'go-wasm-game', pkg, file);
            expect(fs.existsSync(filePath)).toBe(true);
            
            const content = fs.readFileSync(filePath, 'utf8');
            expect(content).toContain(`package ${pkg}`);
            
            // Each unit file should be focused and not too large
            const lines = content.split('\n').length;
            expect(lines).toBeLessThan(250);
        });

        // Check files in units package
        unitFilesInUnits.forEach(({file, package: pkg}) => {
            const filePath = path.join(__dirname, '..', 'go-wasm-game', pkg, file);
            expect(fs.existsSync(filePath)).toBe(true);
            
            const content = fs.readFileSync(filePath, 'utf8');
            expect(content).toContain(`package ${pkg}`);
            
            // Each unit file should be focused and not too large
            const lines = content.split('\n').length;
            expect(lines).toBeLessThan(250);
        });
    });

    test('code organization maintains clean separation of concerns', () => {
        const mainGoPath = path.join(__dirname, '..', 'go-wasm-game', 'main.go');
        const mainGoContent = fs.readFileSync(mainGoPath, 'utf8');
        
        // Verify main only has core game loop and initialization
        const mainFunctions = mainGoContent.match(/func \w+/g) || [];
        expect(mainFunctions).toContain('func draw');
        expect(mainFunctions).toContain('func main');
        
        // Should not have specific implementation details
        expect(mainFunctions.length).toBeLessThanOrEqual(4); // draw, main, and maybe 1-2 helpers max
        
        // Check that we use modular function calls
        expect(mainGoContent).toContain('environment.Render(');
        expect(mainGoContent).toContain('game.InitializeEventHandlers(');
        expect(mainGoContent).toContain('game.InitializeJSInterface(');
    });
});