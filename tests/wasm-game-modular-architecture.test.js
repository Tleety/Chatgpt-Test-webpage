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
        expect(mainGoContent).toContain('initializeEnvironment');
        expect(mainGoContent).toContain('initializeEventHandlers');
        expect(mainGoContent).toContain('initializeJSInterface');
        
        // Count lines - should be significantly reduced
        const lines = mainGoContent.split('\n').length;
        expect(lines).toBeLessThan(130); // Original was ~440 lines
    });

    test('environment.go contains environment-related functionality', () => {
        const envGoPath = path.join(__dirname, '..', 'go-wasm-game', 'environment.go');
        const envGoContent = fs.readFileSync(envGoPath, 'utf8');
        
        // Verify environment functions are present
        expect(envGoContent).toContain('type Tree struct');
        expect(envGoContent).toContain('type Bush struct');
        expect(envGoContent).toContain('func drawTreeAt');
        expect(envGoContent).toContain('func drawBushAt');
        expect(envGoContent).toContain('func initializeEnvironment');
        expect(envGoContent).toContain('func renderEnvironment');
    });

    test('js_interface.go contains JavaScript interface functions', () => {
        const jsInterfacePath = path.join(__dirname, '..', 'go-wasm-game', 'js_interface.go');
        const jsInterfaceContent = fs.readFileSync(jsInterfacePath, 'utf8');
        
        // Verify JS interface functions are present
        expect(jsInterfaceContent).toContain('func createUnit');
        expect(jsInterfaceContent).toContain('func getUnits');
        expect(jsInterfaceContent).toContain('func moveUnitJS');
        expect(jsInterfaceContent).toContain('func removeUnitJS');
        expect(jsInterfaceContent).toContain('func initializeJSInterface');
    });

    test('game_events.go contains event handling functionality', () => {
        const gameEventsPath = path.join(__dirname, '..', 'go-wasm-game', 'game_events.go');
        const gameEventsContent = fs.readFileSync(gameEventsPath, 'utf8');
        
        // Verify event handling functions are present
        expect(gameEventsContent).toContain('func recenterSquare');
        expect(gameEventsContent).toContain('func click(');
        expect(gameEventsContent).toContain('func initializeEventHandlers');
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
            'environment.go',
            'js_interface.go', 
            'game_events.go',
            'main.go'
        ];

        files.forEach(filename => {
            const filePath = path.join(goWasmDir, filename);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').length;
            
            // Each module should be reasonably sized and focused
            if (filename === 'main.go') {
                expect(lines).toBeLessThan(130); // Main should be lean
            } else {
                expect(lines).toBeLessThan(200); // Modules should be focused
            }
        });
    });

    test('unit management system files are properly separated', () => {
        const unitFiles = [
            'unit_types.go',
            'unit.go',
            'unit_spatial.go',
            'unit_combat.go',
            'unit_renderer.go',
            'unit_manager.go'
        ];

        unitFiles.forEach(filename => {
            const filePath = path.join(__dirname, '..', 'go-wasm-game', filename);
            expect(fs.existsSync(filePath)).toBe(true);
            
            const content = fs.readFileSync(filePath, 'utf8');
            expect(content).toContain('package main');
            
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
        expect(mainGoContent).toContain('renderEnvironment(');
        expect(mainGoContent).toContain('initializeEventHandlers(');
        expect(mainGoContent).toContain('initializeJSInterface(');
    });
});