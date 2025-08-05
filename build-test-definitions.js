#!/usr/bin/env node

/**
 * Build script to extract test definitions from Jest test files
 * and generate browser-compatible test definitions for test-results.html
 */

const fs = require('fs');
const path = require('path');

// Test files to process
const testFiles = [
  'snake-game-logic.test.js',
  'snake-game-ui.test.js', 
  'todo-list-logic.test.js',
  'top-bar.test.js'
];

// Mapping of test files to their corresponding modules and suite names
const fileMapping = {
  'snake-game-logic.test.js': {
    module: 'SnakeGameLogic',
    suiteName: 'SnakeGameLogic'
  },
  'snake-game-ui.test.js': {
    module: 'SnakeGameUI', 
    suiteName: 'SnakeGameUI'
  },
  'todo-list-logic.test.js': {
    module: 'TodoListLogic',
    suiteName: 'TodoListLogic'
  },
  'top-bar.test.js': {
    module: 'TopBarComponent',
    suiteName: 'TopBarComponent'
  }
};

function extractTestDefinitions(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const testDefinitions = {};
  let currentDescribe = null;
  let braceCount = 0;
  let inDescribe = false;
  let isMainDescribe = true;
  let foundNestedDescribe = false;
  
  // First pass: check if there are nested describe blocks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('describe(')) {
      const match = line.match(/describe\(['"`]([^'"`]+)['"`]/);
      if (match && !isMainDescribe) {
        foundNestedDescribe = true;
        break;
      }
      if (isMainDescribe) {
        isMainDescribe = false;
      }
    }
  }
  
  // Reset for actual parsing
  isMainDescribe = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Track describe blocks
    if (line.startsWith('describe(')) {
      const match = line.match(/describe\(['"`]([^'"`]+)['"`]/);
      if (match) {
        if (isMainDescribe) {
          // This is the main describe block
          isMainDescribe = false;
          if (!foundNestedDescribe) {
            // If no nested describes, use main describe name as category
            currentDescribe = match[1];
            testDefinitions[currentDescribe] = [];
          }
          inDescribe = true;
          braceCount = 1;
        } else {
          // This is a nested describe block (category)
          const categoryName = match[1];
          if (!testDefinitions[categoryName]) {
            testDefinitions[categoryName] = [];
          }
          currentDescribe = categoryName;
          inDescribe = true;
          braceCount = 1;
        }
      }
    }
    
    // Track braces to know when we exit describe blocks
    if (inDescribe) {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceCount += openBraces - closeBraces;
      
      if (braceCount <= 0) {
        if (foundNestedDescribe || !isMainDescribe) {
          currentDescribe = null;
        }
        inDescribe = false;
        braceCount = 0;
      }
    }
    
    // Extract test definitions
    if (currentDescribe && (line.startsWith('test(') || line.startsWith('it('))) {
      const match = line.match(/(?:test|it)\(['"`]([^'"`]+)['"`]/);
      if (match) {
        const testName = match[1];
        
        // Extract complete test function
        let testBody = '';
        let testBraceCount = 0;
        let foundStart = false;
        let inString = false;
        let stringChar = '';
        
        for (let j = i; j < lines.length; j++) {
          const testLine = lines[j];
          testBody += testLine + '\n';
          
          // More robust brace counting that handles strings
          for (let k = 0; k < testLine.length; k++) {
            const char = testLine[k];
            const prevChar = k > 0 ? testLine[k-1] : '';
            
            if (!inString && (char === '"' || char === "'" || char === '`')) {
              inString = true;
              stringChar = char;
            } else if (inString && char === stringChar && prevChar !== '\\') {
              inString = false;
              stringChar = '';
            } else if (!inString) {
              if (char === '{') {
                foundStart = true;
                testBraceCount++;
              } else if (char === '}') {
                testBraceCount--;
              }
            }
          }
          
          if (foundStart && testBraceCount <= 0) {
            break;
          }
        }
        
        testDefinitions[currentDescribe].push({
          name: testName,
          body: testBody.trim()
        });
      }
    }
  }
  
  return testDefinitions;
}

function convertToFunctionBody(testBody, moduleName) {
  // Extract the test function body from Jest test() call
  // Use non-greedy matching and handle nested braces properly
  let testMatch = testBody.match(/test\(['"`][^'"`]+['"`],\s*(?:async\s+)?\(\)\s*=>\s*{([\s\S]*?)}\s*\)\s*;?\s*$/);
  if (!testMatch) {
    // Try alternative pattern
    testMatch = testBody.match(/test\(['"`][^'"`]+['"`],\s*(?:async\s+)?\(\)\s*=>\s*{\s*([\s\S]*?)\s*}\)\s*;?\s*$/);
  }
  if (!testMatch) {
    return testBody; // Return as-is if pattern doesn't match
  }
  
  let testLogic = testMatch[1];
  
  // Convert Jest syntax to browser-compatible code
  testLogic = testLogic
    // Convert const/let to var for broader compatibility - but preserve 'let's' in comments
    .replace(/\b(?:const|let)\s+(?![s'])/g, 'var ')
    // Convert arrow functions to regular functions
    .replace(/(\w+)\s*=>\s*{/g, 'function($1) {')
    .replace(/\(\s*(\w+)\s*\)\s*=>\s*{/g, 'function($1) {')
    // Handle forEach with arrow functions
    .replace(/\.forEach\(\s*(\w+)\s*=>\s*{/g, '.forEach(function($1) {')
    .replace(/\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>\s*{/g, '.forEach(function($1) {')
    // Convert async/await for TopBar tests - make them synchronous for browser
    .replace(/await\s+createTopBar\(\)/g, 'createTopBar()')
    .replace(/await\s+/g, '')
    // Convert Jest mock patterns
    .replace(/jest\.fn\([^)]*\)/g, 'function() {}')
    .replace(/\.mockClear\(\)/g, '')
    .replace(/\.toHaveBeenCalled\(\)/g, '')
    .replace(/\.not\.toHaveBeenCalled\(\)/g, '')
    // Handle Jest expect extensions for mocks - convert to simpler assertions
    .replace(/expect\(mockPreventDefault\)\.toHaveBeenCalled\(\)/g, 'expect(mockPreventDefault.called).toBe(true)')
    .replace(/expect\(mockPreventDefault\)\.not\.toHaveBeenCalled\(\)/g, 'expect(mockPreventDefault.called).toBe(false)')
    // Handle localStorage patterns
    .replace(/localStorageMock\.clear\(\);?\s*/g, '')
    .replace(/localStorage\.clear\(\);?\s*/g, 'if (typeof localStorage !== "undefined") { localStorage.clear(); }')
    .replace(/localStorage\.removeItem\([^)]+\);?\s*/g, function(match) {
      return 'if (typeof localStorage !== "undefined") { ' + match + ' }';
    })
    // Clean up Jest-specific patterns that might remain
    .replace(/mockPreventDefault\s*;?\s*$/gm, 'mockPreventDefault.called = false;')
    // Clean up extra whitespace and fix formatting
    .replace(/\s*\n\s*\n\s*/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim();
  
  return testLogic;
}

function generateTestSuites() {
  const allTestSuites = {};
  
  for (const testFile of testFiles) {
    if (!fs.existsSync(testFile)) {
      console.warn(`Warning: Test file ${testFile} not found, skipping...`);
      continue;
    }
    
    console.log(`Processing ${testFile}...`);
    const testDefinitions = extractTestDefinitions(testFile);
    const mapping = fileMapping[testFile];
    
    if (Object.keys(testDefinitions).length === 0) {
      console.warn(`No test definitions found in ${testFile}`);
      continue;
    }
    
    allTestSuites[mapping.suiteName] = {};
    
    for (const [category, tests] of Object.entries(testDefinitions)) {
      allTestSuites[mapping.suiteName][category] = tests.map(test => ({
        name: test.name,
        test: convertToFunctionBody(test.body, mapping.module)
      }));
    }
  }
  
  return allTestSuites;
}

function generateTestDefinitionsFile() {
  console.log('Extracting test definitions from Jest files...');
  const testSuites = generateTestSuites();
  
  const testCount = Object.values(testSuites).reduce((total, suite) => {
    return total + Object.values(suite).reduce((suiteTotal, category) => {
      return suiteTotal + category.length;
    }, 0);
  }, 0);
  
  console.log(`Generated ${testCount} test definitions from ${testFiles.length} test files`);
  
  // Generate JavaScript file that can be included in the HTML
  const jsContent = `// Auto-generated test definitions from Jest files
// Generated on: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use 'node build-test-definitions.js' to regenerate

var testSuites = ${JSON.stringify(testSuites, (key, value) => {
    if (key === 'test' && typeof value === 'string') {
      return value.replace(/^function\(\) \{/, '').replace(/\}$/, '');
    }
    return value;
  }, 2)};

// Convert string test bodies back to functions
for (var suiteName in testSuites) {
  for (var categoryName in testSuites[suiteName]) {
    for (var i = 0; i < testSuites[suiteName][categoryName].length; i++) {
      var test = testSuites[suiteName][categoryName][i];
      if (typeof test.test === 'string') {
        test.test = new Function(test.test);
      }
    }
  }
}

// Export for use in test-results.html
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testSuites;
}
`;

  fs.writeFileSync('test-definitions.js', jsContent);
  console.log('Generated test-definitions.js');
  
  return testSuites;
}

if (require.main === module) {
  generateTestDefinitionsFile();
}

module.exports = { generateTestDefinitionsFile };