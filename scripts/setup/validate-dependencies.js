#!/usr/bin/env node

/**
 * Dependency Validation Script
 * 
 * This script validates that all required dependencies are installed
 * and checks for common missing dependencies that cause build failures.
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

// Required dependencies for the template
const REQUIRED_DEPENDENCIES = [
  'next',
  'react',
  'react-dom',
  'typescript',
  '@types/node',
  '@types/react',
  '@types/react-dom',
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

const REQUIRED_DEV_DEPENDENCIES = [
  'jest',
  'jest-environment-jsdom',
  '@testing-library/react',
  '@testing-library/jest-dom',
  'playwright',
  '@playwright/test',
  '@types/jest'
];

// Optional but recommended dependencies
const RECOMMENDED_DEPENDENCIES = [
  'bcryptjs',
  '@types/bcryptjs',
  'nodemailer',
  '@types/nodemailer',
  'sharp',
  'lucide-react',
  '@headlessui/react',
  '@heroicons/react'
];

function validateDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ Error: package.json not found', colors.red);
    log('   Please run this script from your project root directory.', colors.red);
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  log('🔍 Validating dependencies...', colors.cyan);
  log('', colors.reset);
  
  const missing = [];
  const recommended = [];
  
  // Check required dependencies
  log('📦 Checking required dependencies:', colors.blue);
  [...REQUIRED_DEPENDENCIES, ...REQUIRED_DEV_DEPENDENCIES].forEach(dep => {
    if (!dependencies[dep]) {
      missing.push(dep);
      log(`   ❌ Missing: ${dep}`, colors.red);
    } else {
      log(`   ✅ Found: ${dep} (${dependencies[dep]})`, colors.green);
    }
  });
  
  log('', colors.reset);
  
  // Check recommended dependencies
  log('💡 Checking recommended dependencies:', colors.blue);
  RECOMMENDED_DEPENDENCIES.forEach(dep => {
    if (!dependencies[dep]) {
      recommended.push(dep);
      log(`   ⚠️  Recommended: ${dep}`, colors.yellow);
    } else {
      log(`   ✅ Found: ${dep} (${dependencies[dep]})`, colors.green);
    }
  });
  
  log('', colors.reset);
  
  // Summary
  log(`📊 Dependency Summary:`, colors.bright);
  log(`   Required dependencies: ${REQUIRED_DEPENDENCIES.length + REQUIRED_DEV_DEPENDENCIES.length}`, colors.reset);
  log(`   Missing required: ${missing.length}`, missing.length > 0 ? colors.red : colors.green);
  log(`   Recommended missing: ${recommended.length}`, recommended.length > 0 ? colors.yellow : colors.green);
  
  if (missing.length > 0) {
    log('', colors.reset);
    log('❌ Missing required dependencies detected!', colors.red);
    log('', colors.reset);
    log('To install missing dependencies, run:', colors.bright);
    log(`   npm install ${missing.join(' ')}`, colors.cyan);
    log('', colors.reset);
    process.exit(1);
  }
  
  if (recommended.length > 0) {
    log('', colors.reset);
    log('💡 Consider installing recommended dependencies:', colors.yellow);
    log(`   npm install ${recommended.join(' ')}`, colors.cyan);
    log('', colors.reset);
  }
  
  log('✅ All required dependencies are installed!', colors.green);
  
  // Additional checks
  log('', colors.reset);
  log('🔍 Running additional validation checks...', colors.cyan);
  
  // Check for common configuration issues
  const issues = [];
  
  // Check Tailwind CSS configuration
  const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
  if (!fs.existsSync(tailwindConfigPath)) {
    issues.push('Tailwind config file not found');
  }
  
  // Check PostCSS configuration
  const postcssConfigPath = path.join(process.cwd(), 'postcss.config.js');
  if (!fs.existsSync(postcssConfigPath)) {
    issues.push('PostCSS config file not found');
  }
  
  // Check TypeScript configuration
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    issues.push('TypeScript config file not found');
  }
  
  // Check Prisma schema
  const prismaSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (!fs.existsSync(prismaSchemaPath)) {
    issues.push('Prisma schema file not found');
  }
  
  if (issues.length > 0) {
    log('', colors.reset);
    log('⚠️  Configuration issues detected:', colors.yellow);
    issues.forEach(issue => {
      log(`   • ${issue}`, colors.yellow);
    });
  } else {
    log('✅ All configuration files are present', colors.green);
  }
  
  log('', colors.reset);
  log('🎉 Dependency validation complete!', colors.green);
}

// Main execution
function main() {
  log('🚀 Node Vercel Template - Dependency Validation', colors.bright);
  log('==============================================', colors.bright);
  log('');
  
  validateDependencies();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateDependencies };
