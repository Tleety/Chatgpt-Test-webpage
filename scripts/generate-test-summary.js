#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Generate test summary from Jest output for the test visualizer
 */
function generateTestSummary() {
  try {
    console.log('Generating test summary from Jest...');
    
    // Run Jest with JSON output, redirecting stderr to suppress console output
    const jestOutput = execSync('npx jest --json --silent 2>/dev/null | tail -1', { 
      encoding: 'utf8',
      shell: true
    });
    
    const jestResults = JSON.parse(jestOutput.trim());
    
    // Extract key metrics
    const testSummary = {
      timestamp: new Date().toISOString(),
      success: jestResults.success,
      numTotalTests: jestResults.numTotalTests,
      numPassedTests: jestResults.numPassedTests,
      numFailedTests: jestResults.numFailedTests,
      numPendingTests: jestResults.numPendingTests || 0,
      testSuites: [],
      source: 'Jest test runner',
      fallback: false
    };
    
    // Process each test suite
    if (jestResults.testResults) {
      jestResults.testResults.forEach(suite => {
        // Use name if testFilePath is undefined
        const filePath = suite.testFilePath || suite.name;
        if (!filePath) {
          console.warn('Skipping suite with no file path or name:', suite);
          return;
        }
        
        const fileName = path.basename(filePath);
        const suiteName = fileName.replace('.test.js', '').replace(/[-_]/g, ' ');
        
        // Count passing and failing tests from assertionResults
        let numPassingTests = 0;
        let numFailingTests = 0;
        
        if (suite.assertionResults) {
          suite.assertionResults.forEach(test => {
            if (test.status === 'passed') {
              numPassingTests++;
            } else if (test.status === 'failed') {
              numFailingTests++;
            }
          });
        }
        
        testSummary.testSuites.push({
          name: suiteName,
          file: fileName,
          status: numFailingTests > 0 ? 'failed' : 'passed',
          numPassingTests: numPassingTests,
          numFailingTests: numFailingTests,
          duration: suite.perfStats ? suite.perfStats.runtime : (suite.endTime - suite.startTime)
        });
      });
    }
    
    // Write to test-summary.json
    const outputPath = path.join(process.cwd(), 'test-summary.json');
    fs.writeFileSync(outputPath, JSON.stringify(testSummary, null, 2));
    
    console.log(`Test summary written to: ${outputPath}`);
    console.log(`Total tests: ${testSummary.numTotalTests}`);
    console.log(`Passed: ${testSummary.numPassedTests}`);
    console.log(`Failed: ${testSummary.numFailedTests}`);
    
    return testSummary;
    
  } catch (error) {
    console.error('Error generating test summary:', error.message);
    
    // Create a fallback summary
    const fallbackSummary = {
      timestamp: new Date().toISOString(),
      success: false,
      numTotalTests: 0,
      numPassedTests: 0,
      numFailedTests: 0,
      numPendingTests: 0,
      testSuites: [],
      source: 'Fallback - Jest execution failed',
      fallback: true,
      error: error.message
    };
    
    const outputPath = path.join(process.cwd(), 'test-summary.json');
    fs.writeFileSync(outputPath, JSON.stringify(fallbackSummary, null, 2));
    
    console.log(`Fallback test summary written to: ${outputPath}`);
    return fallbackSummary;
  }
}

// Run if called directly
if (require.main === module) {
  generateTestSummary();
}

module.exports = { generateTestSummary };