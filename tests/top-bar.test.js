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
    
    // Clear any cached version
    if (global.cachedVersion) {
      global.cachedVersion = null;
    }
    
    // Mock fetch for deployment.json and package.json
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('deployment.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            version: 'deploy-55',
            deployNumber: 55,
            shortSha: '47a1f10'
          })
        });
      }
      if (url.includes('package.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: '1.0.0' })
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    // Execute the top-bar.js code in the current JSDOM environment
    const topBarCode = fs.readFileSync(path.join(__dirname, '../top-bar.js'), 'utf8');
    eval(topBarCode);
  });

  afterEach(() => {
    // Clean up fetch mock
    if (global.fetch && global.fetch.mockRestore) {
      global.fetch.mockRestore();
    }
  });

  describe('createTopBar function', () => {
    test('should include version information in the top bar', async () => {
      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('#55');
    });

    test('should maintain existing structure with logo, title, and navigation', async () => {
      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="top-bar"');
      expect(topBarHTML).toContain('class="logo"');
      expect(topBarHTML).toContain('My GitHub Page');
      expect(topBarHTML).toContain('class="navigation"');
      expect(topBarHTML).toContain('Home');
      expect(topBarHTML).toContain('Projects');
      expect(topBarHTML).toContain('Test Visualizer');
    });

    test('should respect pathToRoot option for relative paths', async () => {
      const topBarHTML = await createTopBar({ pathToRoot: '../' });
      
      expect(topBarHTML).toContain('src="../favicon.svg"');
      expect(topBarHTML).toContain('href="../index.html#hero"');
      expect(topBarHTML).toContain('href="../test-results.html"');
    });

    test('should use fallback version when deployment.json and package.json fail to load', async () => {
      // Mock fetch to fail for both deployment.json and package.json
      global.fetch.mockImplementation(() => Promise.reject(new Error('Failed to load')));
      
      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('v1.0.0'); // fallback version
    });

    test('should fallback to local deployment.json when GitHub API fails', async () => {
      // Mock fetch to fail for GitHub API but succeed for deployment.json
      global.fetch.mockImplementation((url) => {
        if (url.includes('/releases/latest') || url.includes('/commits/main')) {
          return Promise.reject(new Error('GitHub API unavailable'));
        }
        if (url.includes('deployment.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ version: 'deploy-123' })
          });
        }
        return Promise.reject(new Error('Not found'));
      });
      
      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('#123'); // Should use deployment.json
    });

    test('should use version from GitHub releases API when available', async () => {
      // Mock successful release fetch
      global.fetch.mockImplementation((url) => {
        if (url.includes('/releases/latest')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              tag_name: 'v2.1.0',
              published_at: '2023-12-15T10:30:00.000Z'
            })
          });
        }
        if (url.includes('/actions/runs')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ workflow_runs: [] })
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('v2.1.0');
    });

    test('should use commit SHA when no releases are available', async () => {
      // Mock failed release fetch but successful commit fetch
      global.fetch.mockImplementation((url) => {
        if (url.includes('/releases/latest')) {
          return Promise.reject(new Error('Not found'));
        }
        if (url.includes('/commits/main')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              sha: 'abcdef123456789',
              commit: {
                committer: {
                  date: '2023-12-15T10:30:00.000Z'
                }
              }
            })
          });
        }
        if (url.includes('/actions/runs')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ workflow_runs: [] })
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('commit-abcdef1');
    });

    test('should fallback to default version when GitHub API and local files fail', async () => {
      // Mock fetch to fail for GitHub API and local files
      global.fetch.mockImplementation((url) => {
        return Promise.reject(new Error('Not found'));
      });
      
      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('v1.0.0'); // fallback version
    });
  });

  describe('insertTopBar function', () => {
    test('should insert top bar as first element in body', async () => {
      // Add some existing content
      document.body.innerHTML = '<main>Existing content</main>';
      
      await insertTopBar();
      
      const topBar = document.querySelector('.top-bar');
      expect(topBar).toBeTruthy();
      expect(document.body.firstElementChild).toBe(topBar);
      
      // Check that version is included (should use deployment.json)
      const version = topBar.querySelector('.version');
      expect(version).toBeTruthy();
      expect(version.textContent.trim()).toBe('#55');
    });

    test('should not insert duplicate top bar', async () => {
      await insertTopBar();
      await insertTopBar(); // Try to insert again
      
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

    test('should update favicon when inserting top bar', async () => {
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
      
      await insertTopBar();
      
      const faviconLink = document.querySelector('link[rel="icon"]');
      expect(faviconLink.href).toBe('http://localhost/Chatgpt-Test-webpage/favicon.svg');
    });
  });
});