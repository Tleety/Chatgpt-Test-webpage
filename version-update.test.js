/**
 * Tests for Version Update Functionality
 * 
 * These tests ensure that the version display system works correctly
 * and that version updates are properly reflected in the UI.
 */

const fs = require('fs');
const path = require('path');

// Simple test approach - test the core components separately
describe('Version Update System', () => {
  let originalPackageJson;
  let packageJsonPath;
  
  beforeAll(() => {
    packageJsonPath = path.join(__dirname, 'package.json');
    originalPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  });
  
  afterAll(() => {
    // Restore original package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2) + '\n');
  });

  describe('Bump Version Script', () => {
    test('should increment patch version correctly', () => {
      const { bumpVersion } = require('./scripts/bump-version');
      
      // Create a temporary package.json for testing
      const testPackageJson = { version: '1.2.3' };
      
      // Mock fs.readFileSync and fs.writeFileSync for the bump script
      const originalReadFileSync = fs.readFileSync;
      const originalWriteFileSync = fs.writeFileSync;
      
      fs.readFileSync = jest.fn().mockImplementation((filePath, encoding) => {
        if (filePath.includes('package.json')) {
          return JSON.stringify(testPackageJson);
        }
        return originalReadFileSync(filePath, encoding);
      });
      
      let writtenContent;
      fs.writeFileSync = jest.fn().mockImplementation((filePath, content) => {
        if (filePath.includes('package.json')) {
          writtenContent = content;
        } else {
          originalWriteFileSync(filePath, content);
        }
      });
      
      const newVersion = bumpVersion();
      
      expect(newVersion).toBe('1.2.4');
      expect(writtenContent).toContain('"version": "1.2.4"');
      
      // Restore original functions
      fs.readFileSync = originalReadFileSync;
      fs.writeFileSync = originalWriteFileSync;
    });

    test('should handle invalid version format', () => {
      const { bumpVersion } = require('./scripts/bump-version');
      
      const originalReadFileSync = fs.readFileSync;
      const originalConsoleError = console.error;
      const originalProcessExit = process.exit;
      
      // Mock console.error and process.exit
      console.error = jest.fn();
      process.exit = jest.fn();
      
      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({ version: 'invalid' }));
      
      bumpVersion();
      
      expect(console.error).toHaveBeenCalledWith('Error bumping version:', 'Invalid version format: invalid');
      expect(process.exit).toHaveBeenCalledWith(1);
      
      // Restore original functions
      fs.readFileSync = originalReadFileSync;
      console.error = originalConsoleError;
      process.exit = originalProcessExit;
    });
  });

  describe('CI/CD Integration', () => {
    test('should have bump-version script in package.json', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      expect(packageJson.scripts).toHaveProperty('bump-version');
      expect(packageJson.scripts['bump-version']).toBe('node scripts/bump-version.js');
    });

    test('should have CI workflow that includes version bump', () => {
      const ciWorkflowPath = path.join(__dirname, '.github', 'workflows', 'ci.yml');
      const ciWorkflow = fs.readFileSync(ciWorkflowPath, 'utf8');
      
      expect(ciWorkflow).toContain('Bump version on main branch push');
      expect(ciWorkflow).toContain('npm run bump-version');
      expect(ciWorkflow).toContain('git add package.json');
      expect(ciWorkflow).toContain('git commit -m "chore: bump version [skip ci]"');
    });

    test('should have version bump before build artifacts are created', () => {
      const ciWorkflowPath = path.join(__dirname, '.github', 'workflows', 'ci.yml');
      const ciWorkflow = fs.readFileSync(ciWorkflowPath, 'utf8');
      
      // Check that version bump happens before Upload artifact
      const versionBumpIndex = ciWorkflow.indexOf('npm run bump-version');
      const uploadArtifactIndex = ciWorkflow.indexOf('Upload artifact');
      
      expect(versionBumpIndex).toBeGreaterThan(-1);
      expect(uploadArtifactIndex).toBeGreaterThan(-1);
      expect(versionBumpIndex).toBeLessThan(uploadArtifactIndex);
    });
  });

  describe('Version Display Integration', () => {
    beforeEach(() => {
      // Set up a clean DOM environment
      document.body.innerHTML = '';
      
      // Mock fetch for testing
      global.fetch = jest.fn();
    });

    afterEach(() => {
      // Clean up fetch mock
      if (global.fetch && global.fetch.mockRestore) {
        global.fetch.mockRestore();
      }
    });

    test('should include version in top bar when package.json is available', async () => {
      // Mock successful fetch
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.1.0' })
      });

      // Load and execute top-bar.js
      const topBarCode = fs.readFileSync(path.join(__dirname, 'top-bar.js'), 'utf8');
      eval(topBarCode);

      // Test createTopBar function
      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('v2.1.0');
    });

    test('should fallback to default version when package.json is not available', async () => {
      // Mock failed fetch
      global.fetch.mockRejectedValue(new Error('Not found'));

      // Load and execute top-bar.js
      const topBarCode = fs.readFileSync(path.join(__dirname, 'top-bar.js'), 'utf8');
      eval(topBarCode);

      // Test createTopBar function
      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('v1.0.0'); // Default fallback
    });

    test('should try multiple paths for package.json', async () => {
      // Mock multiple failures then success
      global.fetch
        .mockRejectedValueOnce(new Error('Not found')) // package.json
        .mockRejectedValueOnce(new Error('Not found')) // ../package.json
        .mockResolvedValueOnce({                        // ../../package.json
          ok: true,
          json: () => Promise.resolve({ version: '3.0.0' })
        });

      // Load and execute top-bar.js
      const topBarCode = fs.readFileSync(path.join(__dirname, 'top-bar.js'), 'utf8');
      eval(topBarCode);

      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('v3.0.0');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('End-to-End Version Update Validation', () => {
    test('should validate that version bump script exists and is executable', () => {
      const bumpScriptPath = path.join(__dirname, 'scripts', 'bump-version.js');
      
      // Check that the file exists
      expect(fs.existsSync(bumpScriptPath)).toBe(true);
      
      // Check that it's a valid JavaScript file
      const scriptContent = fs.readFileSync(bumpScriptPath, 'utf8');
      expect(scriptContent).toContain('bumpVersion');
      expect(scriptContent).toContain('module.exports');
    });

    test('should validate that CI workflow deploys updated version', () => {
      const ciWorkflowPath = path.join(__dirname, '.github', 'workflows', 'ci.yml');
      const ciWorkflow = fs.readFileSync(ciWorkflowPath, 'utf8');
      
      // Verify workflow structure ensures version is updated before deployment
      expect(ciWorkflow).toContain('needs: [validate-workflow, test, build]');
      expect(ciWorkflow).toContain('if: github.ref == \'refs/heads/main\' && github.event_name == \'push\'');
      
      // Check that dependencies are installed after version bump
      const lines = ciWorkflow.split('\n');
      let bumpVersionLineIndex = -1;
      let installDepsLineIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('npm run bump-version')) {
          bumpVersionLineIndex = i;
        }
        if (lines[i].includes('Install dependencies (post version bump)')) {
          installDepsLineIndex = i;
        }
      }
      
      expect(bumpVersionLineIndex).toBeGreaterThan(-1);
      expect(installDepsLineIndex).toBeGreaterThan(bumpVersionLineIndex);
    });
  });
});