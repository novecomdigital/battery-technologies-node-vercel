#!/usr/bin/env node

/**
 * Variable Reference Fix Script
 * 
 * This script fixes common variable reference errors in catch blocks and function parameters
 * that cause runtime errors during migration.
 * 
 * Based on lessons learned from the service-desk migration.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function fixVariableReferences(dir) {
  let filesProcessed = 0;
  let filesUpdated = 0;
  let totalFixes = 0;
  
  function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let fileFixes = 0;
    
    // Fix 1: error vs _error in catch blocks
    const errorRefRegex = /catch\s*\(\s*_error\s*\)\s*\{[^}]*\berror\b(?!\s*:)/g;
    const errorMatches = content.match(errorRefRegex);
    if (errorMatches) {
      errorMatches.forEach(match => {
        const fixed = match.replace(/\berror\b(?!\s*:)/g, '_error');
        updatedContent = updatedContent.replace(match, fixed);
        fileFixes++;
      });
    }
    
    // Fix 2: req vs _req in function parameters
    const reqRefRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*_req\s*:\s*NextRequest\s*\)\s*\{[^}]*\breq\b(?!\s*:)/g;
    const reqMatches = content.match(reqRefRegex);
    if (reqMatches) {
      reqMatches.forEach(match => {
        const fixed = match.replace(/\breq\b(?!\s*:)/g, '_req');
        updatedContent = updatedContent.replace(match, fixed);
        fileFixes++;
      });
    }
    
    // Fix 3: err vs _err in auth functions
    const errRefRegex = /const\s+_err\s*=\s*new\s+Error[^}]*\berr\b(?!\s*:)/g;
    const errMatches = content.match(errRefRegex);
    if (errMatches) {
      errMatches.forEach(match => {
        const fixed = match.replace(/\berr\b(?!\s*:)/g, '_err');
        updatedContent = updatedContent.replace(match, fixed);
        fileFixes++;
      });
    }
    
    // Fix 4: Generic variable reference issues in catch blocks
    const catchBlockRegex = /catch\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*\{([^}]*)\}/g;
    const catchMatches = content.match(catchBlockRegex);
    if (catchMatches) {
      catchMatches.forEach(match => {
        const paramMatch = match.match(/catch\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/);
        if (paramMatch) {
          const paramName = paramMatch[1];
          const blockContent = match.match(/\{([^}]*)\}/)[1];
          
          // Check if the block references a different variable name
          const wrongRefs = blockContent.match(new RegExp(`\\b(?!${paramName}\\b)[a-zA-Z_][a-zA-Z0-9_]*\\b`, 'g'));
          if (wrongRefs && wrongRefs.some(ref => ['error', 'err', 'req'].includes(ref))) {
            const fixed = match.replace(new RegExp(`\\b(?!${paramName}\\b)(error|err|req)\\b`, 'g'), paramName);
            updatedContent = updatedContent.replace(match, fixed);
            fileFixes++;
          }
        }
      });
    }
    
    if (fileFixes > 0) {
      fs.writeFileSync(filePath, updatedContent);
      log(`✅ Fixed ${fileFixes} variable reference(s) in ${path.relative(process.cwd(), filePath)}`, colors.green);
      filesUpdated++;
      totalFixes += fileFixes;
    }
    
    return fileFixes;
  }
  
  function processDirectory(currentDir) {
    if (!fs.existsSync(currentDir)) {
      log(`⚠️  Directory not found: ${currentDir}`, colors.yellow);
      return;
    }
    
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        filesProcessed++;
        processFile(filePath);
      }
    });
  }
  
  log('🔧 Starting variable reference fixes...', colors.cyan);
  log('', colors.reset);
  
  // Process source directory
  const srcDir = path.join(dir, 'src');
  if (fs.existsSync(srcDir)) {
    log('📁 Processing source files...', colors.blue);
    processDirectory(srcDir);
  }
  
  // Process tests directory
  const testsDir = path.join(dir, 'tests');
  if (fs.existsSync(testsDir)) {
    log('📁 Processing test files...', colors.blue);
    processDirectory(testsDir);
  }
  
  // Process e2e directory
  const e2eDir = path.join(dir, 'e2e');
  if (fs.existsSync(e2eDir)) {
    log('📁 Processing E2E test files...', colors.blue);
    processDirectory(e2eDir);
  }
  
  log('', colors.reset);
  log(`📊 Summary:`, colors.bright);
  log(`   Files processed: ${filesProcessed}`, colors.reset);
  log(`   Files updated: ${filesUpdated}`, colors.green);
  log(`   Total fixes applied: ${totalFixes}`, colors.green);
  log(`   Files with no issues: ${filesProcessed - filesUpdated}`, colors.blue);
  
  if (totalFixes > 0) {
    log('', colors.reset);
    log('🎉 Variable reference fixes complete!', colors.green);
    log('   All variable reference errors have been resolved.', colors.reset);
  } else {
    log('', colors.reset);
    log('✅ No variable reference issues found.', colors.green);
  }
}

// Main execution
function main() {
  const targetDir = process.argv[2] || process.cwd();
  
  log('🚀 Node Vercel Template - Variable Reference Fixes', colors.bright);
  log('=================================================', colors.bright);
  log('');
  
  if (!fs.existsSync(path.join(targetDir, 'src'))) {
    log('❌ Error: This doesn\'t appear to be a Next.js project (no src directory found)', colors.red);
    log('   Please run this script from your project root directory.', colors.red);
    process.exit(1);
  }
  
  fixVariableReferences(targetDir);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixVariableReferences };
