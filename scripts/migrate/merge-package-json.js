#!/usr/bin/env node

/**
 * Package.json Merger
 * 
 * This script merges dependencies from a legacy project's package.json
 * into the template's package.json, handling conflicts intelligently.
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

// Priority dependencies (template versions take precedence)
const TEMPLATE_PRIORITY_DEPS = [
  'next',
  'react',
  'react-dom',
  'typescript',
  'tailwindcss',
  '@tailwindcss/postcss',
  'autoprefixer',
  'prisma',
  '@prisma/client',
  'next-auth',
  'zod',
  'eslint',
  'prettier',
  'jest',
  'playwright',
  '@playwright/test'
];

// Dependencies to always use template version
const TEMPLATE_ONLY_DEPS = [
  'next',
  'react',
  'react-dom',
  'typescript',
  'tailwindcss',
  '@tailwindcss/postcss',
  'autoprefixer',
  'prisma',
  '@prisma/client',
  'next-auth',
  'zod',
  'eslint',
  'prettier'
];

function mergePackageJson(sourcePackageJsonPath) {
  const targetPackageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(sourcePackageJsonPath)) {
    log(`❌ Error: Source package.json not found: ${sourcePackageJsonPath}`, colors.red);
    process.exit(1);
  }
  
  if (!fs.existsSync(targetPackageJsonPath)) {
    log(`❌ Error: Target package.json not found: ${targetPackageJsonPath}`, colors.red);
    process.exit(1);
  }
  
  log('📦 Merging package.json files...', colors.cyan);
  log('', colors.reset);
  
  // Read both package.json files
  const sourcePackageJson = JSON.parse(fs.readFileSync(sourcePackageJsonPath, 'utf8'));
  const targetPackageJson = JSON.parse(fs.readFileSync(targetPackageJsonPath, 'utf8'));
  
  const merged = { ...targetPackageJson };
  const conflicts = [];
  const added = [];
  const skipped = [];
  
  // Merge dependencies
  log('🔧 Merging dependencies...', colors.blue);
  merged.dependencies = mergeDependencies(
    targetPackageJson.dependencies || {},
    sourcePackageJson.dependencies || {},
    'dependencies',
    conflicts,
    added,
    skipped
  );
  
  // Merge devDependencies
  log('🔧 Merging devDependencies...', colors.blue);
  merged.devDependencies = mergeDependencies(
    targetPackageJson.devDependencies || {},
    sourcePackageJson.devDependencies || {},
    'devDependencies',
    conflicts,
    added,
    skipped
  );
  
  // Merge scripts
  log('🔧 Merging scripts...', colors.blue);
  merged.scripts = { ...targetPackageJson.scripts, ...sourcePackageJson.scripts };
  
  // Merge other fields
  if (sourcePackageJson.name && sourcePackageJson.name !== targetPackageJson.name) {
    log(`📝 Using source project name: ${sourcePackageJson.name}`, colors.yellow);
    merged.name = sourcePackageJson.name;
  }
  
  if (sourcePackageJson.description) {
    merged.description = sourcePackageJson.description;
  }
  
  if (sourcePackageJson.version) {
    merged.version = sourcePackageJson.version;
  }
  
  // Write merged package.json
  fs.writeFileSync(targetPackageJsonPath, JSON.stringify(merged, null, 2));
  
  // Display summary
  log('', colors.reset);
  log('📊 Merge Summary:', colors.bright);
  log(`   Dependencies added: ${added.length}`, colors.green);
  log(`   Conflicts resolved: ${conflicts.length}`, colors.yellow);
  log(`   Dependencies skipped: ${skipped.length}`, colors.blue);
  
  if (added.length > 0) {
    log('', colors.reset);
    log('✅ Added dependencies:', colors.green);
    added.forEach(dep => {
      log(`   • ${dep.name} (${dep.version})`, colors.green);
    });
  }
  
  if (conflicts.length > 0) {
    log('', colors.reset);
    log('⚠️  Resolved conflicts (template version used):', colors.yellow);
    conflicts.forEach(conflict => {
      log(`   • ${conflict.name}: ${conflict.sourceVersion} → ${conflict.templateVersion}`, colors.yellow);
    });
  }
  
  if (skipped.length > 0) {
    log('', colors.reset);
    log('ℹ️  Skipped dependencies (template only):', colors.blue);
    skipped.forEach(dep => {
      log(`   • ${dep.name}`, colors.blue);
    });
  }
  
  log('', colors.reset);
  log('✅ Package.json merge complete!', colors.green);
}

function mergeDependencies(templateDeps, sourceDeps, type, conflicts, added, skipped) {
  const merged = { ...templateDeps };
  
  Object.entries(sourceDeps).forEach(([name, version]) => {
    if (TEMPLATE_ONLY_DEPS.includes(name)) {
      // Skip dependencies that should only use template version
      skipped.push({ name, type });
      return;
    }
    
    if (templateDeps[name]) {
      // Conflict - both have this dependency
      if (TEMPLATE_PRIORITY_DEPS.includes(name)) {
        // Use template version for priority dependencies
        conflicts.push({
          name,
          type,
          sourceVersion: version,
          templateVersion: templateDeps[name]
        });
        // Keep template version (already in merged)
      } else {
        // Use source version for non-priority dependencies
        merged[name] = version;
        conflicts.push({
          name,
          type,
          sourceVersion: version,
          templateVersion: templateDeps[name]
        });
      }
    } else {
      // New dependency from source
      merged[name] = version;
      added.push({ name, version, type });
    }
  });
  
  return merged;
}

// Main execution
function main() {
  const sourcePackageJsonPath = process.argv[2];
  
  if (!sourcePackageJsonPath) {
    log('❌ Error: Source package.json path required', colors.red);
    log('   Usage: node merge-package-json.js <source-package-json-path>', colors.red);
    process.exit(1);
  }
  
  log('🚀 Node Vercel Template - Package.json Merger', colors.bright);
  log('============================================', colors.bright);
  log('');
  
  mergePackageJson(sourcePackageJsonPath);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { mergePackageJson };
