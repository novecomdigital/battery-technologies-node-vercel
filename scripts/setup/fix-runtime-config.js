#!/usr/bin/env node

/**
 * Automated Runtime Configuration Script
 * 
 * This script automatically adds `export const runtime = 'nodejs';` to API routes
 * that use Prisma or other Node.js-specific features to prevent Edge Runtime errors.
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

function addRuntimeConfig(dir) {
  let filesProcessed = 0;
  let filesUpdated = 0;
  
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
      } else if (file.endsWith('.ts') && (file.includes('route') || file.includes('api'))) {
        filesProcessed++;
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if file needs runtime configuration
        const needsRuntimeConfig = (
          content.includes('@/lib/prisma') ||
          content.includes('prisma') ||
          content.includes('PrismaClient') ||
          content.includes('fs.') ||
          content.includes('path.') ||
          content.includes('crypto.') ||
          content.includes('process.env')
        );
        
        // Check if runtime config already exists
        const hasRuntimeConfig = content.includes("export const runtime = 'nodejs'");
        
        if (needsRuntimeConfig && !hasRuntimeConfig) {
          // Add runtime configuration after imports
          const importRegex = /(import.*from.*['"]next\/server['"];?\s*)/;
          const match = content.match(importRegex);
          
          if (match) {
            const updatedContent = content.replace(
              importRegex,
              `$1\n// Force Node.js runtime for Prisma compatibility\nexport const runtime = 'nodejs';\n`
            );
            
            fs.writeFileSync(filePath, updatedContent);
            log(`✅ Added runtime config to ${path.relative(process.cwd(), filePath)}`, colors.green);
            filesUpdated++;
          } else {
            // Add at the top of the file if no Next.js imports found
            const updatedContent = `// Force Node.js runtime for Prisma compatibility\nexport const runtime = 'nodejs';\n\n${content}`;
            fs.writeFileSync(filePath, updatedContent);
            log(`✅ Added runtime config to ${path.relative(process.cwd(), filePath)}`, colors.green);
            filesUpdated++;
          }
        } else if (needsRuntimeConfig && hasRuntimeConfig) {
          log(`ℹ️  Runtime config already exists in ${path.relative(process.cwd(), filePath)}`, colors.blue);
        }
      }
    });
  }
  
  log('🔧 Starting runtime configuration setup...', colors.cyan);
  log('', colors.reset);
  
  // Process API routes directory
  const apiDir = path.join(dir, 'src', 'app', 'api');
  if (fs.existsSync(apiDir)) {
    log('📁 Processing API routes...', colors.blue);
    processDirectory(apiDir);
  }
  
  // Process middleware
  const middlewarePath = path.join(dir, 'src', 'middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    filesProcessed++;
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    if (content.includes('prisma') && !content.includes("export const runtime = 'nodejs'")) {
      const updatedContent = `// Force Node.js runtime to avoid Edge Runtime issues with Prisma\nexport const runtime = 'nodejs';\n\n${content}`;
      fs.writeFileSync(middlewarePath, updatedContent);
      log(`✅ Added runtime config to middleware.ts`, colors.green);
      filesUpdated++;
    }
  }
  
  log('', colors.reset);
  log(`📊 Summary:`, colors.bright);
  log(`   Files processed: ${filesProcessed}`, colors.reset);
  log(`   Files updated: ${filesUpdated}`, colors.green);
  log(`   Files already configured: ${filesProcessed - filesUpdated}`, colors.blue);
  
  if (filesUpdated > 0) {
    log('', colors.reset);
    log('🎉 Runtime configuration setup complete!', colors.green);
    log('   All API routes using Prisma are now configured for Node.js runtime.', colors.reset);
  } else {
    log('', colors.reset);
    log('✅ No files needed runtime configuration updates.', colors.green);
  }
}

// Main execution
function main() {
  const targetDir = process.argv[2] || process.cwd();
  
  log('🚀 Node Vercel Template - Runtime Configuration Setup', colors.bright);
  log('====================================================', colors.bright);
  log('');
  
  if (!fs.existsSync(path.join(targetDir, 'src'))) {
    log('❌ Error: This doesn\'t appear to be a Next.js project (no src directory found)', colors.red);
    log('   Please run this script from your project root directory.', colors.red);
    process.exit(1);
  }
  
  addRuntimeConfig(targetDir);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { addRuntimeConfig };
