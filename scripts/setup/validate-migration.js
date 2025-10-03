#!/usr/bin/env node

/**
 * Migration Validation Script
 * 
 * This script validates that a migration was successful by checking
 * various aspects of the migrated project.
 * 
 * Based on lessons learned from the service-desk migration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function validateMigration() {
  const projectRoot = process.cwd();
  const validationResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    checks: []
  };
  
  log('🔍 Validating migration...', colors.cyan);
  log('', colors.reset);
  
  // Check 1: Project structure
  log('📁 Checking project structure...', colors.blue);
  validateProjectStructure(projectRoot, validationResults);
  
  // Check 2: Dependencies
  log('📦 Checking dependencies...', colors.blue);
  validateDependencies(projectRoot, validationResults);
  
  // Check 3: Configuration files
  log('⚙️  Checking configuration files...', colors.blue);
  validateConfiguration(projectRoot, validationResults);
  
  // Check 4: Runtime configuration
  log('🚀 Checking runtime configuration...', colors.blue);
  validateRuntimeConfiguration(projectRoot, validationResults);
  
  // Check 5: TypeScript compilation
  log('🔧 Checking TypeScript compilation...', colors.blue);
  validateTypeScript(projectRoot, validationResults);
  
  // Check 6: Build process
  log('🏗️  Checking build process...', colors.blue);
  validateBuild(projectRoot, validationResults);
  
  // Display results
  log('', colors.reset);
  log('📊 Validation Results:', colors.bright);
  log(`   ✅ Passed: ${validationResults.passed}`, colors.green);
  log(`   ❌ Failed: ${validationResults.failed}`, colors.red);
  log(`   ⚠️  Warnings: ${validationResults.warnings}`, colors.yellow);
  
  // Show detailed results
  if (validationResults.checks.length > 0) {
    log('', colors.reset);
    log('📋 Detailed Results:', colors.bright);
    validationResults.checks.forEach(check => {
      const status = check.passed ? '✅' : check.warning ? '⚠️' : '❌';
      const color = check.passed ? colors.green : check.warning ? colors.yellow : colors.red;
      log(`   ${status} ${check.name}`, color);
      if (check.message) {
        log(`      ${check.message}`, colors.reset);
      }
    });
  }
  
  // Final result
  log('', colors.reset);
  if (validationResults.failed === 0) {
    log('🎉 Migration validation passed!', colors.green);
    if (validationResults.warnings > 0) {
      log('   Some warnings were found - review the details above.', colors.yellow);
    }
  } else {
    log('❌ Migration validation failed!', colors.red);
    log('   Please fix the issues above before proceeding.', colors.red);
    process.exit(1);
  }
}

function validateProjectStructure(projectRoot, results) {
  const requiredDirs = ['src', 'prisma'];
  const requiredFiles = ['package.json', 'tsconfig.json', 'next.config.js'];
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      results.passed++;
      results.checks.push({ name: `Directory exists: ${dir}`, passed: true });
    } else {
      results.failed++;
      results.checks.push({ name: `Directory exists: ${dir}`, passed: false, message: 'Required directory not found' });
    }
  });
  
  requiredFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      results.passed++;
      results.checks.push({ name: `File exists: ${file}`, passed: true });
    } else {
      results.failed++;
      results.checks.push({ name: `File exists: ${file}`, passed: false, message: 'Required file not found' });
    }
  });
}

function validateDependencies(projectRoot, results) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    results.failed++;
    results.checks.push({ name: 'Package.json exists', passed: false, message: 'package.json not found' });
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = ['next', 'react', 'react-dom', 'typescript', 'prisma', '@prisma/client'];
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      results.passed++;
      results.checks.push({ name: `Dependency: ${dep}`, passed: true });
    } else {
      results.failed++;
      results.checks.push({ name: `Dependency: ${dep}`, passed: false, message: 'Required dependency missing' });
    }
  });
  
  // Check for node_modules
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    results.passed++;
    results.checks.push({ name: 'Dependencies installed', passed: true });
  } else {
    results.warnings++;
    results.checks.push({ name: 'Dependencies installed', passed: false, warning: true, message: 'Run npm install to install dependencies' });
  }
}

function validateConfiguration(projectRoot, results) {
  const configFiles = [
    { file: 'tailwind.config.js', required: true },
    { file: 'postcss.config.js', required: true },
    { file: 'jest.config.js', required: false },
    { file: 'playwright.config.ts', required: false }
  ];
  
  configFiles.forEach(config => {
    const configPath = path.join(projectRoot, config.file);
    if (fs.existsSync(configPath)) {
      results.passed++;
      results.checks.push({ name: `Config file: ${config.file}`, passed: true });
    } else if (config.required) {
      results.failed++;
      results.checks.push({ name: `Config file: ${config.file}`, passed: false, message: 'Required configuration file not found' });
    } else {
      results.warnings++;
      results.checks.push({ name: `Config file: ${config.file}`, passed: false, warning: true, message: 'Optional configuration file not found' });
    }
  });
}

function validateRuntimeConfiguration(projectRoot, results) {
  const apiDir = path.join(projectRoot, 'src', 'app', 'api');
  
  if (!fs.existsSync(apiDir)) {
    results.warnings++;
    results.checks.push({ name: 'API routes runtime config', passed: false, warning: true, message: 'No API routes found' });
    return;
  }
  
  let apiRoutesWithRuntime = 0;
  let apiRoutesWithoutRuntime = 0;
  
  function checkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        checkDirectory(filePath);
      } else if (file.endsWith('.ts') && (file.includes('route') || file.includes('api'))) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes("export const runtime = 'nodejs'")) {
          apiRoutesWithRuntime++;
        } else if (content.includes('prisma') || content.includes('PrismaClient')) {
          apiRoutesWithoutRuntime++;
        }
      }
    });
  }
  
  checkDirectory(apiDir);
  
  if (apiRoutesWithRuntime > 0) {
    results.passed++;
    results.checks.push({ name: 'API routes runtime config', passed: true, message: `${apiRoutesWithRuntime} routes configured` });
  }
  
  if (apiRoutesWithoutRuntime > 0) {
    results.warnings++;
    results.checks.push({ name: 'API routes runtime config', passed: false, warning: true, message: `${apiRoutesWithoutRuntime} routes may need runtime config` });
  }
}

function validateTypeScript(projectRoot, results) {
  try {
    execSync('npx tsc --noEmit', { cwd: projectRoot, stdio: 'pipe' });
    results.passed++;
    results.checks.push({ name: 'TypeScript compilation', passed: true });
  } catch (error) {
    results.failed++;
    results.checks.push({ name: 'TypeScript compilation', passed: false, message: 'TypeScript compilation failed' });
  }
}

function validateBuild(projectRoot, results) {
  try {
    execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
    results.passed++;
    results.checks.push({ name: 'Build process', passed: true });
  } catch (error) {
    results.failed++;
    results.checks.push({ name: 'Build process', passed: false, message: 'Build process failed' });
  }
}

// Main execution
function main() {
  log('🚀 Node Vercel Template - Migration Validation', colors.bright);
  log('============================================', colors.bright);
  log('');
  
  validateMigration();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateMigration };
