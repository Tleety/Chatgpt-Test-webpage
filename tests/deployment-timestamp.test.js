/**
 * Tests for Deployment Timestamp Feature
 * 
 * These tests verify that the deployment timestamp is correctly displayed
 * in the version information and that deployment progress indicators work.
 */

const fs = require('fs');
const path = require('path');

describe('Deployment Timestamp Feature', () => {
  beforeEach(() => {
    // Set up a clean DOM environment
    document.body.innerHTML = '';
    
    // Mock fetch for testing
    global.fetch = jest.fn();
    
    // Clear cached version info
    if (global.cachedVersionInfo) {
      global.cachedVersionInfo = null;
    }
  });

  afterEach(() => {
    // Clean up fetch mock
    if (global.fetch && global.fetch.mockRestore) {
      global.fetch.mockRestore();
    }
  });

  test('should display version with timestamp when deployment.json is available', async () => {
    const mockDeploymentInfo = {
      version: 'deploy-55',
      timestamp: '2023-12-15T10:30:00.000Z',
      deployedAt: 1702634600000
    };

    // Mock successful fetch for deployment.json
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeploymentInfo)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workflow_runs: [] })
      });

    // Load and execute top-bar.js
    const topBarCodePath = path.join(__dirname, '..', 'top-bar.js');
    const topBarCode = fs.readFileSync(topBarCodePath, 'utf8');
    eval(topBarCode);

    const topBarHTML = await createTopBar();
    
    expect(topBarHTML).toContain('class="version-info"');
    expect(topBarHTML).toContain('#55');
    expect(topBarHTML).toContain('class="timestamp"');
    expect(topBarHTML).toContain('Dec 15');
  });

  test('should display yellow dot when deployment is in progress', async () => {
    const mockDeploymentInfo = {
      version: 'deploy-54',
      timestamp: '2023-12-15T09:30:00.000Z',
      deployedAt: 1702631000000
    };

    const mockRunningWorkflows = {
      workflow_runs: [
        {
          name: 'CI/CD Pipeline',
          status: 'in_progress'
        }
      ]
    };

    // Mock deployment.json and running workflow
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeploymentInfo)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRunningWorkflows)
      });

    const topBarCodePath = path.join(__dirname, '..', 'top-bar.js');
    const topBarCode = fs.readFileSync(topBarCodePath, 'utf8');
    eval(topBarCode);

    const topBarHTML = await createTopBar();
    
    expect(topBarHTML).toContain('deployment-status in-progress');
    expect(topBarHTML).toContain('Deployment in progress');
    expect(topBarHTML).toContain('#54');
    expect(topBarHTML).toContain('Dec 15');
  });

  test('should not display deployment indicator when no deployment is in progress', async () => {
    const mockDeploymentInfo = {
      version: 'deploy-55',
      timestamp: '2023-12-15T10:30:00.000Z',
      deployedAt: 1702634600000
    };

    const mockNoRunningWorkflows = {
      workflow_runs: []
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeploymentInfo)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNoRunningWorkflows)
      });

    const topBarCodePath = path.join(__dirname, '..', 'top-bar.js');
    const topBarCode = fs.readFileSync(topBarCodePath, 'utf8');
    eval(topBarCode);

    const topBarHTML = await createTopBar();
    
    expect(topBarHTML).not.toContain('deployment-status in-progress');
    expect(topBarHTML).toContain('#55');
    expect(topBarHTML).toContain('Dec 15');
  });

  test('should handle API failures gracefully', async () => {
    // Mock failed deployment.json fetch and GitHub API
    global.fetch.mockImplementation(() => Promise.reject(new Error('Network error')));

    const topBarCodePath = path.join(__dirname, '..', 'top-bar.js');
    const topBarCode = fs.readFileSync(topBarCodePath, 'utf8');
    eval(topBarCode);

    const topBarHTML = await createTopBar();
    
    // Should fallback to default version
    expect(topBarHTML).toContain('v1.0.0');
    expect(topBarHTML).toContain('class="timestamp"');
    expect(topBarHTML).not.toContain('deployment-status in-progress');
  });

  test('should format timestamp correctly for different dates', async () => {
    const testCases = [
      {
        timestamp: '2023-12-15T10:30:00.000Z',
        expectedMonth: 'Dec',
        expectedDay: '15'
      },
      {
        timestamp: '2023-01-01T00:00:00.000Z',
        expectedMonth: 'Jan',
        expectedDay: '1'
      },
      {
        timestamp: '2023-06-30T23:59:59.000Z',
        expectedMonth: 'Jun',
        expectedDay: '30'
      }
    ];

    for (const testCase of testCases) {
      const mockDeploymentInfo = {
        version: 'deploy-55',
        timestamp: testCase.timestamp,
        deployedAt: new Date(testCase.timestamp).getTime()
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDeploymentInfo)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ workflow_runs: [] })
        });

      // Clear cache for each test
      global.cachedVersionInfo = null;

      const topBarCodePath = path.join(__dirname, '..', 'top-bar.js');
      const topBarCode = fs.readFileSync(topBarCodePath, 'utf8');
      eval(topBarCode);

      const topBarHTML = await createTopBar();
      
      expect(topBarHTML).toContain(testCase.expectedMonth);
      expect(topBarHTML).toContain(testCase.expectedDay);
    }
  });

  test('should provide detailed tooltip with full timestamp', async () => {
    const mockDeploymentInfo = {
      version: 'deploy-55',
      timestamp: '2023-12-15T10:30:00.000Z',
      deployedAt: 1702634600000
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeploymentInfo)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workflow_runs: [] })
      });

    const topBarCodePath = path.join(__dirname, '..', 'top-bar.js');
    const topBarCode = fs.readFileSync(topBarCodePath, 'utf8');
    eval(topBarCode);

    const topBarHTML = await createTopBar();
    
    expect(topBarHTML).toContain('title="Deployed:');
    expect(topBarHTML).toContain('12/15/2023');
  });

  test('should maintain backward compatibility with getVersion function', async () => {
    const mockDeploymentInfo = {
      version: 'deploy-55',
      timestamp: '2023-12-15T10:30:00.000Z',
      deployedAt: 1702634600000
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeploymentInfo)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workflow_runs: [] })
      });

    const topBarCodePath = path.join(__dirname, '..', 'top-bar.js');
    const topBarCode = fs.readFileSync(topBarCodePath, 'utf8');
    eval(topBarCode);

    const version = await getVersion();
    
    expect(version).toBe('#55');
  });
});