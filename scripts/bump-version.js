#!/usr/bin/env node

/**
 * Version bump script for automatic PR version updates
 * 
 * This script automatically increments the patch version in package.json
 * when changes are merged to the main branch.
 */

const fs = require('fs');
const path = require('path');

function bumpVersion() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Parse current version
    const currentVersion = packageJson.version;
    const versionParts = currentVersion.split('.').map(Number);
    
    if (versionParts.length !== 3) {
      throw new Error(`Invalid version format: ${currentVersion}`);
    }
    
    // Increment patch version
    versionParts[2] += 1;
    const newVersion = versionParts.join('.');
    
    // Update package.json
    packageJson.version = newVersion;
    
    // Write back to package.json with proper formatting
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`Version bumped from ${currentVersion} to ${newVersion}`);
    
    return newVersion;
  } catch (error) {
    console.error('Error bumping version:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  bumpVersion();
}

module.exports = { bumpVersion };