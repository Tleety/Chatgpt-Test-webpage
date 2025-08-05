/**
 * Tests for Top Bar Component
 */

// Import the top-bar functionality by executing it in the test environment
const fs = require('fs');
const path = require('path');

describe('Top Bar Component', () => {
  beforeEach(() => {
    // Set up a clean DOM environment
    document.body.innerHTML = '';
    
    // Execute the top-bar.js code in the current JSDOM environment
    const topBarCode = fs.readFileSync(path.join(__dirname, 'top-bar.js'), 'utf8');
    eval(topBarCode);
  });

  describe('createTopBar function', () => {
    test('should include version information in the top bar', () => {
      const topBarHTML = createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('v1.0.0');
    });

    test('should maintain existing structure with logo, title, and navigation', () => {
      const topBarHTML = createTopBar();
      
      expect(topBarHTML).toContain('class="top-bar"');
      expect(topBarHTML).toContain('class="logo"');
      expect(topBarHTML).toContain('My GitHub Page');
      expect(topBarHTML).toContain('class="navigation"');
      expect(topBarHTML).toContain('Home');
      expect(topBarHTML).toContain('Projects');
      expect(topBarHTML).toContain('Test Visualizer');
    });

    test('should respect pathToRoot option for relative paths', () => {
      const topBarHTML = createTopBar({ pathToRoot: '../' });
      
      expect(topBarHTML).toContain('src="../favicon.svg"');
      expect(topBarHTML).toContain('href="../index.html#hero"');
      expect(topBarHTML).toContain('href="../test-results.html"');
    });
  });

  describe('insertTopBar function', () => {
    test('should insert top bar as first element in body', () => {
      // Add some existing content
      document.body.innerHTML = '<main>Existing content</main>';
      
      insertTopBar();
      
      const topBar = document.querySelector('.top-bar');
      expect(topBar).toBeTruthy();
      expect(document.body.firstElementChild).toBe(topBar);
      
      // Check that version is included
      const version = topBar.querySelector('.version');
      expect(version).toBeTruthy();
      expect(version.textContent.trim()).toBe('v1.0.0');
    });

    test('should not insert duplicate top bar', () => {
      insertTopBar();
      insertTopBar(); // Try to insert again
      
      const topBars = document.querySelectorAll('.top-bar');
      expect(topBars.length).toBe(1);
    });
  });

  describe('updateFaviconPath function', () => {
    test('should update favicon href with correct base path', () => {
      // Set up a favicon link element
      document.head.innerHTML = '<link rel="icon" href="favicon.svg" type="image/svg+xml">';
      
      updateFaviconPath('/Chatgpt-Test-webpage/');
      
      const faviconLink = document.querySelector('link[rel="icon"]');
      expect(faviconLink.href).toBe('http://localhost/Chatgpt-Test-webpage/favicon.svg');
    });

    test('should handle missing favicon gracefully', () => {
      // No favicon link element
      document.head.innerHTML = '';
      
      // Should not throw an error
      expect(() => {
        updateFaviconPath('/Chatgpt-Test-webpage/');
      }).not.toThrow();
    });

    test('should update favicon when inserting top bar', () => {
      // Set up a favicon link element
      document.head.innerHTML = '<link rel="icon" href="favicon.svg" type="image/svg+xml">';
      
      // Mock GitHub Pages environment
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'tleety.github.io',
          pathname: '/Chatgpt-Test-webpage/index.html',
          href: 'https://tleety.github.io/Chatgpt-Test-webpage/index.html'
        },
        writable: true
      });
      
      insertTopBar();
      
      const faviconLink = document.querySelector('link[rel="icon"]');
      expect(faviconLink.href).toBe('http://localhost/Chatgpt-Test-webpage/favicon.svg');
    });
  });
});