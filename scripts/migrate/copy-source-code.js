#!/usr/bin/env node

/**
 * Source Code Copier
 * 
 * This script copies source code from a legacy project to the template,
 * handling file structure differences and common issues.
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

// Files and directories to copy
const COPY_PATTERNS = [
  { source: 'src', target: 'src', type: 'directory' },
  { source: 'public', target: 'public', type: 'directory' },
  { source: 'prisma', target: 'prisma', type: 'directory' },
  { source: 'scripts', target: 'scripts', type: 'directory' },
  { source: 'tests', target: 'tests', type: 'directory' },
  { source: 'e2e', target: 'e2e', type: 'directory' },
  { source: 'next.config.js', target: 'next.config.js', type: 'file' },
  { source: 'next.config.ts', target: 'next.config.ts', type: 'file' },
  { source: 'tailwind.config.js', target: 'tailwind.config.js', type: 'file' },
  { source: 'postcss.config.js', target: 'postcss.config.js', type: 'file' },
  { source: 'postcss.config.mjs', target: 'postcss.config.js', type: 'file' },
  { source: '.env.example', target: '.env.example', type: 'file' },
  { source: '.env.local', target: '.env.local', type: 'file' }
];

// Files to skip
const SKIP_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  '.env',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

function copySourceCode(sourcePath) {
  const targetPath = process.cwd();
  
  if (!fs.existsSync(sourcePath)) {
    log(`❌ Error: Source path does not exist: ${sourcePath}`, colors.red);
    process.exit(1);
  }
  
  log('📋 Copying source code...', colors.cyan);
  log('', colors.reset);
  
  let filesCopied = 0;
  let directoriesCopied = 0;
  let filesSkipped = 0;
  
  // Copy files and directories
  COPY_PATTERNS.forEach(pattern => {
    const sourceFullPath = path.join(sourcePath, pattern.source);
    const targetFullPath = path.join(targetPath, pattern.target);
    
    if (fs.existsSync(sourceFullPath)) {
      if (pattern.type === 'directory') {
        copyDirectory(sourceFullPath, targetFullPath, filesCopied, directoriesCopied, filesSkipped);
      } else if (pattern.type === 'file') {
        copyFile(sourceFullPath, targetFullPath, filesCopied, filesSkipped);
      }
    } else {
      log(`⚠️  Source not found: ${pattern.source}`, colors.yellow);
    }
  });
  
  // Copy additional configuration files
  log('⚙️  Copying additional configuration files...', colors.blue);
  const additionalFiles = [
    'vercel.json',
    'netlify.toml',
    'docker-compose.yml',
    'Dockerfile',
    '.dockerignore',
    '.gitignore',
    '.eslintrc.json',
    '.eslintrc.js',
    '.prettierrc',
    '.prettierrc.json',
    'jest.config.js',
    'jest.config.ts',
    'playwright.config.ts',
    'playwright.config.js'
  ];
  
  additionalFiles.forEach(file => {
    const sourceFullPath = path.join(sourcePath, file);
    const targetFullPath = path.join(targetPath, file);
    
    if (fs.existsSync(sourceFullPath)) {
      copyFile(sourceFullPath, targetFullPath, filesCopied, filesSkipped);
    }
  });
  
  // Display summary
  log('', colors.reset);
  log('📊 Copy Summary:', colors.bright);
  log(`   Files copied: ${filesCopied}`, colors.green);
  log(`   Directories copied: ${directoriesCopied}`, colors.green);
  log(`   Files skipped: ${filesSkipped}`, colors.blue);
  
  log('', colors.reset);
  log('✅ Source code copy complete!', colors.green);
}

function copyDirectory(sourceDir, targetDir, filesCopied, directoriesCopied, filesSkipped) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    directoriesCopied++;
    log(`📁 Created directory: ${path.relative(process.cwd(), targetDir)}`, colors.green);
  }
  
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    const stat = fs.statSync(sourcePath);
    
    // Skip files matching skip patterns
    if (SKIP_PATTERNS.some(pattern => file.includes(pattern))) {
      filesSkipped++;
      return;
    }
    
    if (stat.isDirectory()) {
      copyDirectory(sourcePath, targetPath, filesCopied, directoriesCopied, filesSkipped);
    } else {
      copyFile(sourcePath, targetPath, filesCopied, filesSkipped);
    }
  });
}

function copyFile(sourcePath, targetPath, filesCopied, filesSkipped) {
  if (!fs.existsSync(sourcePath)) {
    return;
  }
  
  // Skip files matching skip patterns
  const fileName = path.basename(sourcePath);
  if (SKIP_PATTERNS.some(pattern => fileName.includes(pattern))) {
    filesSkipped++;
    return;
  }
  
  // Create target directory if it doesn't exist
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Copy file
  fs.copyFileSync(sourcePath, targetPath);
  filesCopied++;
  log(`📄 Copied: ${path.relative(process.cwd(), targetPath)}`, colors.green);
}

// Main execution
function main() {
  const sourcePath = process.argv[2];
  
  if (!sourcePath) {
    log('❌ Error: Source path required', colors.red);
    log('   Usage: node copy-source-code.js <source-path>', colors.red);
    process.exit(1);
  }
  
  log('🚀 Node Vercel Template - Source Code Copier', colors.bright);
  log('==========================================', colors.bright);
  log('');
  log(`📁 Copying from: ${sourcePath}`, colors.cyan);
  log('');
  
  copySourceCode(sourcePath);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { copySourceCode };
