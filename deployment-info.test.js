/**
 * Tests for GitHub Deployment Info Generation
 * 
 * These tests ensure that the deployment information generation system works correctly
 * and creates appropriate version data from GitHub Actions environment variables.
 */

const fs = require('fs');
const path = require('path');

describe('Deployment Info Generation', () => {
  let originalEnv;
  let packageJsonPath;
  
  beforeAll(() => {
    // Save original environment
    originalEnv = { ...process.env };
    packageJsonPath = path.join(__dirname, 'package.json');
  });
  
  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clean up any test deployment.json files
    const deploymentJsonPath = path.join(__dirname, 'deployment.json');
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
      const { generateDeploymentInfo } = require('./scripts/generate-deployment-info');
      
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
      const { generateDeploymentInfo } = require('./scripts/generate-deployment-info');
      
      const deploymentInfo = generateDeploymentInfo();
      
      expect(deploymentInfo.version).toBe('deploy-55');
      expect(deploymentInfo.fullVersion).toBe('deploy-55-47a1f10');
      expect(deploymentInfo.deployNumber).toBe(55);
      expect(deploymentInfo.shortSha).toBe('47a1f10');
    });

    test('should handle different run numbers correctly', () => {
      process.env.GITHUB_RUN_NUMBER = '123';
      process.env.GITHUB_SHA = 'abcdef1234567890abcdef1234567890abcdef12';
      
      const { generateDeploymentInfo } = require('./scripts/generate-deployment-info');
      
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
      
      const { generateDeploymentInfo } = require('./scripts/generate-deployment-info');
      
      const deploymentInfo = generateDeploymentInfo();
      
      expect(deploymentInfo.version).toBe('deploy-0');
      expect(deploymentInfo.deployNumber).toBe(0);
      expect(deploymentInfo.commitSha).toBe('unknown');
      expect(deploymentInfo.shortSha).toBe('unknown');
      expect(deploymentInfo.actor).toBe('unknown');
    });

    test('should create deployment.json file with correct content', () => {
      const { generateDeploymentInfo } = require('./scripts/generate-deployment-info');
      
      // Remove any existing deployment.json
      const deploymentJsonPath = path.join(__dirname, 'deployment.json');
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
      const { generateDeploymentInfo } = require('./scripts/generate-deployment-info');
      
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
      
      const { generateDeploymentInfo } = require('./scripts/generate-deployment-info');
      
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
      const ciWorkflow = fs.readFileSync(ciWorkflowPath, 'utf8');
      
      expect(ciWorkflow).toContain('Generate deployment info from GitHub data');
      expect(ciWorkflow).toContain('npm run generate-deployment-info');
      expect(ciWorkflow).toContain('git add deployment.json');
      expect(ciWorkflow).toContain('git commit -m "chore: update deployment info [skip ci]"');
    });

    test('should have deployment.json in .gitignore', () => {
      const gitignorePath = path.join(__dirname, '.gitignore');
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
      const topBarCode = fs.readFileSync(path.join(__dirname, 'top-bar.js'), 'utf8');
      eval(topBarCode);

      // Test createTopBar function
      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('class="version"');
      expect(topBarHTML).toContain('vdeploy-55');
    });

    test('should fallback to package.json when deployment.json is not available', async () => {
      // Mock failed fetch for deployment.json but successful for package.json
      global.fetch.mockImplementation((url) => {
        if (url.includes('deployment.json')) {
          return Promise.reject(new Error('Not found'));
        }
        if (url.includes('package.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ version: '1.0.2' })
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      // Load and execute top-bar.js
      const topBarCode = fs.readFileSync(path.join(__dirname, 'top-bar.js'), 'utf8');
      eval(topBarCode);

      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain('v1.0.2');
    });
  });
});