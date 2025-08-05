#!/usr/bin/env node

/**
 * Generate deployment information for GitHub-based versioning
 * 
 * This script creates a deployment.json file with version information 
 * derived from GitHub Actions environment variables instead of package.json
 */

const fs = require('fs');
const path = require('path');

function generateDeploymentInfo() {
  // Get GitHub environment variables
  const runNumber = process.env.GITHUB_RUN_NUMBER || '0';
  const runId = process.env.GITHUB_RUN_ID || 'unknown';
  const sha = process.env.GITHUB_SHA || 'unknown';
  const ref = process.env.GITHUB_REF || 'unknown';
  const eventName = process.env.GITHUB_EVENT_NAME || 'unknown';
  const actor = process.env.GITHUB_ACTOR || 'unknown';
  const repository = process.env.GITHUB_REPOSITORY || 'unknown';
  const workflowRef = process.env.GITHUB_WORKFLOW_REF || 'unknown';
  
  // Create version string based on GitHub run number
  const version = `deploy-${runNumber}`;
  const shortSha = sha.substring(0, 7);
  
  // Create deployment info object
  const deploymentInfo = {
    version: version,
    fullVersion: `${version}-${shortSha}`,
    deployNumber: parseInt(runNumber, 10),
    runId: runId,
    commitSha: sha,
    shortSha: shortSha,
    branch: ref.replace('refs/heads/', ''),
    event: eventName,
    actor: actor,
    repository: repository,
    workflow: workflowRef,
    timestamp: new Date().toISOString(),
    deployedAt: Date.now()
  };
  
  // Write deployment info to JSON file
  const outputPath = path.join(__dirname, '..', 'deployment.json');
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2) + '\n');
    console.log(`Deployment info generated: ${version} (${shortSha})`);
    console.log(`Deploy number: ${runNumber}`);
    console.log(`Commit: ${shortSha}`);
    console.log(`Written to: ${outputPath}`);
    
    return deploymentInfo;
  } catch (error) {
    console.error('Error generating deployment info:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateDeploymentInfo();
}

module.exports = { generateDeploymentInfo };