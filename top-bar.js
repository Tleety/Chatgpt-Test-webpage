/**
 * Shared Top Bar Component
 * 
 * This file provides a reusable top bar that can be included in all project pages
 * to ensure consistency. If the top bar needs to change, only this file needs to be updated.
 */

function createTopBar(options = {}) {
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
  
  // Create the top bar HTML
  const topBarHTML = `
    <header class="top-bar">
      <img src="${basePath}favicon.svg" alt="Site logo" class="logo">
      <span class="title">My GitHub Page</span>
      <span class="version">v1.0.0</span>
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

function insertTopBar(options = {}) {
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
  topBarElement.innerHTML = createTopBar(options);
  
  // Insert as the first child of body
  if (document.body.firstChild) {
    document.body.insertBefore(topBarElement.firstElementChild, document.body.firstChild);
  } else {
    document.body.appendChild(topBarElement.firstElementChild);
  }
}

// Auto-detect path and insert top bar when DOM is ready
function autoInsertTopBar() {
  insertTopBar();
}

// Export functions for manual use
window.createTopBar = createTopBar;
window.insertTopBar = insertTopBar;
window.autoInsertTopBar = autoInsertTopBar;
window.updateFaviconPath = updateFaviconPath;

// Auto-insert when DOM is ready if not prevented
document.addEventListener('DOMContentLoaded', () => {
  // Only auto-insert if no manual insertion has occurred
  if (!document.querySelector('.top-bar')) {
    autoInsertTopBar();
  }
});