/**
 * Bottom Bar Component for Game UI
 * 
 * This file provides a reusable bottom bar for game controls
 * specifically designed for unit management in the WASM game.
 */

function createBottomBar(options = {}) {
  // Create the bottom bar HTML
  const bottomBarHTML = `
    <div class="bottom-bar">
      <div class="game-controls">
        <button id="spawn-unit-btn" class="control-button spawn-button">
          <span class="button-icon">➕</span>
          <span class="button-text">Spawn Unit</span>
        </button>
        <button id="remove-unit-btn" class="control-button remove-button">
          <span class="button-icon">➖</span>
          <span class="button-text">Remove Unit</span>
        </button>
      </div>
      <div class="unit-info">
        <span id="unit-count">Units: 1</span>
      </div>
    </div>
  `;
  
  return bottomBarHTML;
}

function setupBottomBarEvents() {
  const spawnButton = document.getElementById('spawn-unit-btn');
  const removeButton = document.getElementById('remove-unit-btn');
  const unitCountDisplay = document.getElementById('unit-count');
  
  // Keep track of unit count
  let unitCount = 1; // Start with 1 unit (the existing square)
  
  function updateUnitCount() {
    unitCountDisplay.textContent = `Units: ${unitCount}`;
    
    // Disable remove button if only one unit remains
    removeButton.disabled = unitCount <= 1;
    
    // Optional: disable spawn button if too many units (for performance)
    spawnButton.disabled = unitCount >= 10;
  }
  
  // Spawn unit button handler
  if (spawnButton) {
    spawnButton.addEventListener('click', () => {
      if (unitCount < 10) { // Maximum 10 units for performance
        unitCount++;
        updateUnitCount();
        
        // Call WASM function if it exists
        if (window.spawnUnit && typeof window.spawnUnit === 'function') {
          window.spawnUnit();
        } else {
          console.log('Spawn unit requested - unit count:', unitCount);
        }
      }
    });
  }
  
  // Remove unit button handler
  if (removeButton) {
    removeButton.addEventListener('click', () => {
      if (unitCount > 1) { // Keep at least one unit
        unitCount--;
        updateUnitCount();
        
        // Call WASM function if it exists
        if (window.removeUnit && typeof window.removeUnit === 'function') {
          window.removeUnit();
        } else {
          console.log('Remove unit requested - unit count:', unitCount);
        }
      }
    });
  }
  
  // Initialize the UI state
  updateUnitCount();
}

function insertBottomBar(options = {}) {
  // Check if bottom bar already exists
  if (document.querySelector('.bottom-bar')) {
    console.log('Bottom bar already exists, skipping insertion');
    return;
  }
  
  // Create and insert the bottom bar at the end of the body
  const bottomBarElement = document.createElement('div');
  bottomBarElement.innerHTML = createBottomBar(options);
  
  // Append to body
  document.body.appendChild(bottomBarElement.firstElementChild);
  
  // Set up event handlers
  setupBottomBarEvents();
}

// Auto-insert bottom bar when DOM is ready if not prevented
async function autoInsertBottomBar() {
  insertBottomBar();
}

// Export functions for manual use
window.createBottomBar = createBottomBar;
window.insertBottomBar = insertBottomBar;
window.autoInsertBottomBar = autoInsertBottomBar;
window.setupBottomBarEvents = setupBottomBarEvents;

// Note: Unlike top-bar.js, we don't auto-insert this on DOMContentLoaded
// because it should only be included on pages that need game controls