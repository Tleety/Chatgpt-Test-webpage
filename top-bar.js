/**
 * Shared Top Bar Component
 * 
 * This file provides a reusable top bar that can be included in all project pages
 * to ensure consistency. If the top bar needs to change, only this file needs to be updated.
 */

function createTopBar(options = {}) {
  // Determine the relative path to the root based on current location
  const pathToRoot = options.pathToRoot || '';
  
  // Create the top bar HTML
  const topBarHTML = `
    <header class="top-bar">
      <img src="${pathToRoot}favicon.svg" alt="Site logo" class="logo">
      <span class="title">My GitHub Page</span>
      <span class="version">v1.0.0</span>
      <nav class="navigation">
        <a href="${pathToRoot}index.html#hero">Home</a>
        <a href="${pathToRoot}index.html#projects">Projects</a>
        <a href="${pathToRoot}test-results.html">Test Visualizer</a>
      </nav>
    </header>
  `;
  
  return topBarHTML;
}

function insertTopBar(options = {}) {
  // Check if top bar already exists
  if (document.querySelector('.top-bar')) {
    console.log('Top bar already exists, skipping insertion');
    return;
  }
  
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

// Auto-detect path depth and insert top bar when DOM is ready
function autoInsertTopBar() {
  // Try to detect if we're in a subdirectory by looking at the current page path
  const path = window.location.pathname;
  const pathSegments = path.split('/').filter(segment => segment.length > 0);
  
  // Remove filename from path segments to count directories
  const currentFile = pathSegments[pathSegments.length - 1];
  if (currentFile && currentFile.includes('.html')) {
    pathSegments.pop();
  }
  
  // Calculate path to root based on directory depth
  const pathToRoot = pathSegments.length > 0 ? '../'.repeat(pathSegments.length) : '';
  
  insertTopBar({ pathToRoot });
}

// Export functions for manual use
window.createTopBar = createTopBar;
window.insertTopBar = insertTopBar;
window.autoInsertTopBar = autoInsertTopBar;

// Auto-insert when DOM is ready if not prevented
document.addEventListener('DOMContentLoaded', () => {
  // Only auto-insert if no manual insertion has occurred
  if (!document.querySelector('.top-bar')) {
    autoInsertTopBar();
  }
});