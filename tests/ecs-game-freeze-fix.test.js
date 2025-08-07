const fs = require('fs');
const path = require('path');

describe('ECS Game Freeze Fix', () => {
  const htmlPath = path.join(__dirname, '..', 'ecs-game', 'index.html');
  
  describe('HTML Code Analysis', () => {
    let htmlContent;
    
    beforeAll(() => {
      htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    });
    
    test('should have fixed canvas sizing to prevent initial screen fill', () => {
      // Check that canvas is set to fixed size instead of full viewport
      expect(htmlContent).toContain('canvas.width = 800');
      expect(htmlContent).toContain('canvas.height = 600');
      expect(htmlContent).not.toContain('canvas.width = window.innerWidth');
      expect(htmlContent).not.toContain('canvas.height = window.innerHeight');
    });
    
    test('should have timeout protection to prevent infinite waiting', () => {
      // Check for maximum attempts limit
      expect(htmlContent).toContain('maxAttempts = 50');
      expect(htmlContent).toContain('attempts >= maxAttempts');
      expect(htmlContent).toMatch(/waitForTopBarAndResize\(attempts \+ 1\)/);
    });
    
    test('should prevent multiple initialization attempts', () => {
      // Check for initialization guard
      expect(htmlContent).toContain('initializationStarted = false');
      expect(htmlContent).toContain('if (initializationStarted)');
      expect(htmlContent).toContain('initializationStarted = true');
    });
    
    test('should have proper error handling for WASM loading', () => {
      // Check for fallback error handling
      expect(htmlContent).toContain('fallbackErr');
      expect(htmlContent).toContain('Failed to load WASM');
      expect(htmlContent).toContain('Failed to load game');
    });
    
    test('should have removed problematic recursive initialization', () => {
      // Check that the old infinite recursion pattern is gone
      expect(htmlContent).not.toContain('setTimeout(initialize, 100)');
      expect(htmlContent).not.toContain('setTimeout(waitForTopBarAndResize, 100)');
    });
    
    test('should have single fallback initialization with guard', () => {
      // Check for controlled fallback
      expect(htmlContent).toContain('if (!initializationStarted)');
      expect(htmlContent).toMatch(/setTimeout.*{.*if.*initializationStarted.*}.*1000/s);
    });
  });
  
  describe('CSS Layout Fixes', () => {
    let htmlContent;
    
    beforeAll(() => {
      htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    });
    
    test('should center canvas properly', () => {
      expect(htmlContent).toContain('align-items: center');
      expect(htmlContent).toContain('justify-content: flex-start');
    });
    
    test('should have responsive canvas constraints', () => {
      expect(htmlContent).toContain('max-width: 100%');
      expect(htmlContent).toContain('max-height: calc(100vh - 120px)');
    });
  });
  
  describe('JavaScript Logic Safety', () => {
    let htmlContent;
    
    beforeAll(() => {
      htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    });
    
    test('should have safe DOM ready detection', () => {
      // Check for proper DOM ready handling
      expect(htmlContent).toContain("document.addEventListener('DOMContentLoaded', initialize)");
    });
    
    test('should handle missing top bar gracefully', () => {
      // Check for fallback when top bar doesn't exist
      expect(htmlContent).toContain('attempts >= maxAttempts');
      expect(htmlContent).toContain('if (topBar || attempts >= maxAttempts)');
    });
  });
  
  describe('Performance Optimizations', () => {
    let htmlContent;
    
    beforeAll(() => {
      htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    });
    
    test('should avoid unnecessary canvas resizing', () => {
      // Canvas should be set to fixed size, not constantly resized
      expect(htmlContent).toContain('// Resize canvas on window resize (but keep fixed game size)');
    });
    
    test('should have controlled initialization timing', () => {
      // Should not have multiple rapid initialization attempts
      const initTimeouts = (htmlContent.match(/setTimeout.*initialize/g) || []).length;
      expect(initTimeouts).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Error Recovery', () => {
    let htmlContent;
    
    beforeAll(() => {
      htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    });
    
    test('should show user-friendly error message on WASM failure', () => {
      expect(htmlContent).toContain('ctx.fillText(\'Failed to load game\'');
      expect(htmlContent).toContain('ctx.fillStyle = \'#ff4444\'');
      expect(htmlContent).toContain('ctx.fillStyle = \'#ffffff\'');
    });
    
    test('should handle streaming and fallback WASM loading', () => {
      expect(htmlContent).toContain('WebAssembly.instantiateStreaming');
      expect(htmlContent).toContain('WebAssembly.instantiate(bytes');
    });
  });
});