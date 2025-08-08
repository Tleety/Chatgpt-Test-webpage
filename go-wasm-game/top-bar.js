/**
 * Shared Top Bar Component
 * 
 * This file provides a reusable top bar that can be included in all project pages
 * to ensure consistency. If the top bar needs to change, only this file needs to be updated.
 */

// Cache for version to avoid multiple fetches
let cachedVersionInfo = null;

async function getVersionInfo() {
  if (cachedVersionInfo) {
    return cachedVersionInfo;
  }
  
  // Get repository info from current URL or fallback to known repo
  const repoOwner = 'Tleety';
  const repoName = 'Chatgpt-Test-webpage';
  
  try {
    // First try local deployment.json which contains the deployed version info
    const possiblePaths = [
      'deployment.json',
      '../deployment.json', 
      '../../deployment.json',
      '/Chatgpt-Test-webpage/deployment.json'
    ];
    
    for (const path of possiblePaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const deploymentInfo = await response.json();
          
          // Check if there's a deployment in progress
          const isDeploymentInProgress = await checkDeploymentInProgress(repoOwner, repoName);
          
          // Extract just the number from deploy-xxx format for cleaner display
          const versionNumber = deploymentInfo.version.replace('deploy-', '');
          const timestamp = new Date(deploymentInfo.timestamp);
          
          cachedVersionInfo = {
            version: `#${versionNumber}`,
            timestamp: timestamp,
            isInProgress: isDeploymentInProgress,
            deployedAt: deploymentInfo.deployedAt
          };
          return cachedVersionInfo;
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.warn('Could not load version from deployment.json:', error);
  }
  
  try {
    // Fallback: try to get the latest release from GitHub API
    const releaseResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`);
    if (releaseResponse.ok) {
      const releaseData = await releaseResponse.json();
      if (releaseData.tag_name) {
        const version = releaseData.tag_name.startsWith('v') ? releaseData.tag_name : `v${releaseData.tag_name}`;
        cachedVersionInfo = {
          version: version,
          timestamp: new Date(releaseData.published_at || Date.now()),
          isInProgress: false,
          deployedAt: new Date(releaseData.published_at || Date.now()).getTime()
        };
        return cachedVersionInfo;
      }
    } else if (releaseResponse.status === 404) {
      // Repository has no releases yet, this is expected - don't log as error
      console.debug('No releases found for repository (this is normal for new repositories)');
    }
  } catch (error) {
    console.warn('Could not load version from GitHub releases:', error);
  }
  
  try {
    // If no releases, try to get latest commit info as final API fallback
    const commitResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits/main`);
    if (commitResponse.ok) {
      const commitData = await commitResponse.json();
      if (commitData.sha) {
        const shortSha = commitData.sha.substring(0, 7);
        const version = `commit-${shortSha}`;
        cachedVersionInfo = {
          version: version,
          timestamp: new Date(commitData.commit.committer.date || Date.now()),
          isInProgress: false,
          deployedAt: new Date(commitData.commit.committer.date || Date.now()).getTime()
        };
        return cachedVersionInfo;
      }
    }
  } catch (error) {
    console.warn('Could not load version from GitHub commits:', error);
  }
  
  // Final fallback to default version
  cachedVersionInfo = {
    version: 'v1.0.0',
    timestamp: new Date(Date.now()),
    isInProgress: false,
    deployedAt: Date.now()
  };
  return cachedVersionInfo;
}

async function checkDeploymentInProgress(repoOwner, repoName) {
  try {
    // Check if there are any running workflows
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?status=in_progress&per_page=10`);
    if (response.ok) {
      const data = await response.json();
      // Check if any running workflows are the CI/CD pipeline
      const hasRunningDeployment = data.workflow_runs.some(run => 
        run.name === 'CI/CD Pipeline' && run.status === 'in_progress'
      );
      return hasRunningDeployment;
    }
  } catch (error) {
    console.warn('Could not check deployment status:', error);
  }
  return false;
}

async function getVersion() {
  const versionInfo = await getVersionInfo();
  return versionInfo.version;
}

async function createTopBar(options = {}) {
  // Maintain backward compatibility with pathToRoot option
  // while supporting the new basePath system
  let basePath;
  
  if (options.pathToRoot !== undefined) {
    // Legacy API: use pathToRoot directly for backward compatibility
    basePath = options.pathToRoot;
  } else if (options.basePath !== undefined) {
    // New API: use basePath
    basePath = options.basePath;
  } else {
    // Auto-detect based on environment
    basePath = getBasePath();
  }
  
  // Get version info (includes timestamp and deployment status)
  const versionInfo = await getVersionInfo();
  
  // Format timestamp for display
  const timestampFormatted = versionInfo.timestamp.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Create the deployment status indicator
  const statusIndicator = versionInfo.isInProgress 
    ? '<span class="deployment-status in-progress" title="Deployment in progress"></span>' 
    : '';
  
  // Create the top bar HTML
  const topBarHTML = `
    <header class="top-bar">
      <img src="${basePath}favicon.svg" alt="Site logo" class="logo">
      <span class="title">My GitHub Page</span>
      <div class="version-info">
        <span class="version">${versionInfo.version}</span>
        ${statusIndicator}
        <span class="timestamp" title="Deployed: ${versionInfo.timestamp.toLocaleString()}">${timestampFormatted}</span>
      </div>
      <nav class="navigation">
        <a href="${basePath}index.html#hero">Home</a>
        <a href="${basePath}index.html#projects">Projects</a>
        <a href="${basePath}test-results.html">Test Visualizer</a>
      </nav>
    </header>
  `;
  
  return topBarHTML;
}

function getBasePath() {
  // Detect if we're on GitHub Pages or local development
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const href = window.location.href;
  
  // If running locally, use relative paths
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Calculate relative path based on current directory depth
    const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
    
    // Remove filename if present
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment && lastSegment.includes('.html')) {
      pathSegments.pop();
    }
    
    const relativePath = pathSegments.length > 0 ? '../'.repeat(pathSegments.length) : '';
    return relativePath;
  }
  
  // For GitHub Pages, use absolute paths with repository base
  if (hostname.includes('github.io')) {
    // Method 1: Extract repository name from pathname
    const segments = pathname.split('/').filter(segment => segment.length > 0);
    
    if (segments.length > 0) {
      const repoName = segments[0];
      const absolutePath = `/${repoName}/`;
      return absolutePath;
    }
    
    // Method 2: Extract repository name from full URL as backup
    // Pattern: https://username.github.io/repository-name/
    const urlMatch = href.match(/https?:\/\/[^\/]+\.github\.io\/([^\/]+)/);
    if (urlMatch && urlMatch[1]) {
      const repoName = urlMatch[1];
      const absolutePath = `/${repoName}/`;
      return absolutePath;
    }
    
    // Method 3: Check if we know this is the Chatgpt-Test-webpage repository
    if (href.includes('Chatgpt-Test-webpage')) {
      return '/Chatgpt-Test-webpage/';
    }
  }
  
  // Default to root-relative paths
  return '/';
}

function updateFaviconPath(basePath) {
  // Find the favicon link element
  const faviconLink = document.querySelector('link[rel="icon"]');
  if (faviconLink) {
    // Update the href to use the correct base path
    faviconLink.href = basePath + 'favicon.svg';
  }
}

async function insertTopBar(options = {}) {
  // Check if top bar already exists
  if (document.querySelector('.top-bar')) {
    console.log('Top bar already exists, skipping insertion');
    return;
  }
  
  // Get the base path for consistent path handling
  let basePath;
  if (options.pathToRoot !== undefined) {
    basePath = options.pathToRoot;
  } else if (options.basePath !== undefined) {
    basePath = options.basePath;
  } else {
    basePath = getBasePath();
  }
  
  // Update favicon link to use correct base path
  updateFaviconPath(basePath);
  
  // Create and insert the top bar at the beginning of the body
  const topBarElement = document.createElement('div');
  topBarElement.innerHTML = await createTopBar(options);
  
  // Insert as the first child of body
  if (document.body.firstChild) {
    document.body.insertBefore(topBarElement.firstElementChild, document.body.firstChild);
  } else {
    document.body.appendChild(topBarElement.firstElementChild);
  }
}

// Auto-detect path and insert top bar when DOM is ready
async function autoInsertTopBar() {
  await insertTopBar();
}

// Export functions for manual use
window.createTopBar = createTopBar;
window.insertTopBar = insertTopBar;
window.autoInsertTopBar = autoInsertTopBar;
window.updateFaviconPath = updateFaviconPath;

// Auto-insert when DOM is ready if not prevented
document.addEventListener('DOMContentLoaded', async () => {
  // Only auto-insert if no manual insertion has occurred
  if (!document.querySelector('.top-bar')) {
    await autoInsertTopBar();
  }
});