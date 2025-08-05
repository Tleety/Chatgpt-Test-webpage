/**
 * Tests for GitHub Deployment Info Generation
 * 
 * These tests ensure that the deployment information generation system works correctly
 * and creates appropriate version data from GitHub Actions environment variables.
 */

const fs = require('fs');
const path = require('path');

// Validate required files exist before running tests
describe('Deployment Info Generation', () => {
  let originalEnv;
  let packageJsonPath;
  
  beforeAll(() => {
    // Validate critical dependencies exist
    const requiredFiles = [
      { path: '../scripts/generate-deployment-info.js', name: 'generate-deployment-info script' },
      { path: '../.github/workflows/ci.yml', name: 'CI workflow' },
      { path: '../.gitignore', name: '.gitignore file' },
      { path: '../top-bar.js', name: 'top-bar.js file' },
      { path: '../package.json', name: 'package.json file' }
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file.path)));
    
    if (missingFiles.length > 0) {
      const missingList = missingFiles.map(f => f.name).join(', ');
      throw new Error(`Required files missing for deployment-info tests: ${missingList}`);
    }
    
    // Save original environment
    originalEnv = { ...process.env };
    packageJsonPath = path.join(__dirname, '../package.json');
  });
  
  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clean up any test deployment.json files
    const deploymentJsonPath = path.join(__dirname, '../deployment.json');
    if (fs.existsSync(deploymentJsonPath)) {
      fs.unlinkSync(deploymentJsonPath);
    }
  });

  beforeEach(() => {
    // Set up test environment variables
    process.env.GITHUB_RUN_NUMBER = '55';
    process.env.GITHUB_RUN_ID = '16754445277';
    process.env.GITHUB_SHA = '47a1f1015e880307efcd36a8f88dd7c944730102';
    process.env.GITHUB_REF = 'refs/heads/main';
    process.env.GITHUB_EVENT_NAME = 'push';
    process.env.GITHUB_ACTOR = 'testuser';
    process.env.GITHUB_REPOSITORY = 'Tleety/Chatgpt-Test-webpage';
    process.env.GITHUB_WORKFLOW_REF = 'Tleety/Chatgpt-Test-webpage/.github/workflows/ci.yml@refs/heads/main';
  });

  describe('generateDeploymentInfo function', () => {
    test('should create deployment info with correct structure', () => {
      let generateDeploymentInfo;
      try {
        ({ generateDeploymentInfo } = require('../scripts/generate-deployment-info'));
      } catch (error) {
        throw new Error(`Failed to require generate-deployment-info script: ${error.message}`);
      }
      
      const deploymentInfo = generateDeploymentInfo();
      
      expect(deploymentInfo).toHaveProperty('version');
      expect(deploymentInfo).toHaveProperty('fullVersion');
      expect(deploymentInfo).toHaveProperty('deployNumber');
      expect(deploymentInfo).toHaveProperty('runId');
      expect(deploymentInfo).toHaveProperty('commitSha');
      expect(deploymentInfo).toHaveProperty('shortSha');
      expect(deploymentInfo).toHaveProperty('branch');
      expect(deploymentInfo).toHaveProperty('event');
      expect(deploymentInfo).toHaveProperty('actor');
      expect(deploymentInfo).toHaveProperty('repository');
      expect(deploymentInfo).toHaveProperty('timestamp');
      expect(deploymentInfo).toHaveProperty('deployedAt');
    });

    test('should generate correct version format from GitHub run number', () => {
      let generateDeploymentInfo;
      try {
        ({ generateDeploymentInfo } = require('../scripts/generate-deployment-info'));
      } catch (error) {
        throw new Error(`Failed to require generate-deployment-info script: ${error.message}`);
      }
      
      const deploymentInfo = generateDeploymentInfo();
      
      expect(deploymentInfo.version).toBe('deploy-55');
      expect(deploymentInfo.fullVersion).toBe('deploy-55-47a1f10');
      expect(deploymentInfo.deployNumber).toBe(55);
      expect(deploymentInfo.shortSha).toBe('47a1f10');
    });

    test('should handle different run numbers correctly', () => {
      process.env.GITHUB_RUN_NUMBER = '123';
      process.env.GITHUB_SHA = 'abcdef1234567890abcdef1234567890abcdef12';
      
      let generateDeploymentInfo;
      try {
        ({ generateDeploymentInfo } = require('../scripts/generate-deployment-info'));
      } catch (error) {
        throw new Error(`Failed to require generate-deployment-info script: ${error.message}`);
      }
      
      const deploymentInfo = generateDeploymentInfo();
      
      expect(deploymentInfo.version).toBe('deploy-123');
      expect(deploymentInfo.fullVersion).toBe('deploy-123-abcdef1');
      expect(deploymentInfo.deployNumber).toBe(123);
      expect(deploymentInfo.shortSha).toBe('abcdef1');
    });

    test('should use default values when environment variables are missing', () => {
      // Clear GitHub environment variables
      delete process.env.GITHUB_RUN_NUMBER;
      delete process.env.GITHUB_SHA;
      delete process.env.GITHUB_ACTOR;
      
      let generateDeploymentInfo;
      try {
        ({ generateDeploymentInfo } = require('../scripts/generate-deployment-info'));
      } catch (error) {
        throw new Error(`Failed to require generate-deployment-info script: ${error.message}`);
      }
      
      const deploymentInfo = generateDeploymentInfo();
      
      expect(deploymentInfo.version).toBe('deploy-0');
      expect(deploymentInfo.deployNumber).toBe(0);
      expect(deploymentInfo.commitSha).toBe('unknown');
      expect(deploymentInfo.shortSha).toBe('unknown');
      expect(deploymentInfo.actor).toBe('unknown');
    });

    test('should create deployment.json file with correct content', () => {
      let generateDeploymentInfo;
      try {
        ({ generateDeploymentInfo } = require('../scripts/generate-deployment-info'));
      } catch (error) {
        throw new Error(`Failed to require generate-deployment-info script: ${error.message}`);
      }
      
      // Remove any existing deployment.json
      const deploymentJsonPath = path.join(__dirname, '../deployment.json');
      if (fs.existsSync(deploymentJsonPath)) {
        fs.unlinkSync(deploymentJsonPath);
      }
      
      const deploymentInfo = generateDeploymentInfo();
      
      // Check that file was created
      expect(fs.existsSync(deploymentJsonPath)).toBe(true);
      
      // Check file content
      const fileContent = fs.readFileSync(deploymentJsonPath, 'utf8');
      const parsedContent = JSON.parse(fileContent);
      
      expect(parsedContent.version).toBe('deploy-55');
      expect(parsedContent.deployNumber).toBe(55);
      expect(parsedContent.shortSha).toBe('47a1f10');
      
      // Clean up
      fs.unlinkSync(deploymentJsonPath);
    });

    test('should include timestamp and deployment time', () => {
      let generateDeploymentInfo;
      try {
        ({ generateDeploymentInfo } = require('../scripts/generate-deployment-info'));
      } catch (error) {
        throw new Error(`Failed to require generate-deployment-info script: ${error.message}`);
      }
      
      const beforeTime = Date.now();
      const deploymentInfo = generateDeploymentInfo();
      const afterTime = Date.now();
      
      expect(deploymentInfo.timestamp).toBeTruthy();
      expect(new Date(deploymentInfo.timestamp).getTime()).toBeGreaterThanOrEqual(beforeTime);
      expect(new Date(deploymentInfo.timestamp).getTime()).toBeLessThanOrEqual(afterTime);
      
      expect(deploymentInfo.deployedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(deploymentInfo.deployedAt).toBeLessThanOrEqual(afterTime);
    });

    test('should extract branch name from GitHub ref', () => {
      process.env.GITHUB_REF = 'refs/heads/feature-branch';
      
      let generateDeploymentInfo;
      try {
        ({ generateDeploymentInfo } = require('../scripts/generate-deployment-info'));
      } catch (error) {
        throw new Error(`Failed to require generate-deployment-info script: ${error.message}`);
      }
      
      const deploymentInfo = generateDeploymentInfo();
      
      expect(deploymentInfo.branch).toBe('feature-branch');
    });
  });

  describe('CI/CD Integration', () => {
    test('should have generate-deployment-info script in package.json', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      expect(packageJson.scripts).toHaveProperty('generate-deployment-info');
      expect(packageJson.scripts['generate-deployment-info']).toBe('node scripts/generate-deployment-info.js');
    });

    test('should have CI workflow that includes deployment info generation', () => {
      const ciWorkflowPath = path.join(__dirname, '.github', 'workflows', 'ci.yml');
      
      if (!fs.existsSync(ciWorkflowPath)) {
        throw new Error(`CI workflow file not found at ${ciWorkflowPath}`);
      }
      
      const ciWorkflow = fs.readFileSync(ciWorkflowPath, 'utf8');
      
      expect(ciWorkflow).toContain('Generate deployment info from GitHub data');
      expect(ciWorkflow).toContain('npm run generate-deployment-info');
      expect(ciWorkflow).toContain('git add -f deployment.json test-summary.json');
      expect(ciWorkflow).toContain('git commit -m "chore: update deployment info and test results [skip ci]"');
    });

    test('should have deployment.json in .gitignore', () => {
      const gitignorePath = path.join(__dirname, '.gitignore');
      
      if (!fs.existsSync(gitignorePath)) {
        throw new Error(`.gitignore file not found at ${gitignorePath}`);
      }
      
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      expect(gitignoreContent).toContain('deployment.json');
    });
  });

  describe('Version Display Integration', () => {
    beforeEach(() => {
      // Set up a clean DOM environment
      document.body.innerHTML = '';
      
      // Mock fetch for deployment.json
      global.fetch = jest.fn();
    });

    afterEach(() => {
      // Clean up fetch mock
      if (global.fetch && global.fetch.mockRestore) {
        global.fetch.mockRestore();
      }
    });

    test('should load version from deployment.json in top bar', async () => {
      // Mock successful fetch for deployment.json
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          version: 'deploy-55',
          deployNumber: 55,
          shortSha: '47a1f10'
        })
      });

      // Load and execute top-bar.js
      const topBarCodePath = path.join(__dirname, 'top-bar.js');
      if (!fs.existsSync(topBarCodePath)) {
        throw new Error(`top-bar.js file not found at ${topBarCodePath}`);
      }
      
      const topBarCode = fs.readFileSync(topBarCodePath, 'utf8');
      eval(topBarCode);

      // Test createTopBar function
      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('#55');
    });

    test('should fallback to default version when GitHub API and deployment.json fail', async () => {
      // Mock failed fetch for GitHub API and deployment.json
      global.fetch.mockImplementation((url) => {
        return Promise.reject(new Error('Not found'));
      });

      // Load and execute top-bar.js
      const topBarCodePath = path.join(__dirname, 'top-bar.js');
      if (!fs.existsSync(topBarCodePath)) {
        throw new Error(`top-bar.js file not found at ${topBarCodePath}`);
      }
      
      const topBarCode = fs.readFileSync(topBarCodePath, 'utf8');
      eval(topBarCode);

      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('v1.0.0'); // Default fallback version
    });
  });

  describe('Dependency Validation', () => {
    test('should validate all required files exist for test execution', () => {
      const requiredFiles = [
        { path: './scripts/generate-deployment-info.js', name: 'generate-deployment-info script' },
        { path: './.github/workflows/ci.yml', name: 'CI workflow' },
        { path: './.gitignore', name: '.gitignore file' },
        { path: './top-bar.js', name: 'top-bar.js file' },
        { path: './package.json', name: 'package.json file' }
      ];
      
      const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file.path)));
      
      expect(missingFiles.length).toBe(0);
      
      // Additional validation that the generate-deployment-info script can be required
      expect(() => {
        require('../scripts/generate-deployment-info');
      }).not.toThrow();
    });
    
    test('should handle require failures gracefully', () => {
      // Test that our improved error handling would catch missing dependencies
      expect(() => {
        try {
          const { generateDeploymentInfo } = require('../scripts/nonexistent-script');
        } catch (error) {
          throw new Error(`Failed to require generate-deployment-info script: ${error.message}`);
        }
      }).toThrow('Failed to require generate-deployment-info script:');
    });
  });
});