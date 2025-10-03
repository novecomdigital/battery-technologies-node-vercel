#!/usr/bin/env node

/**
 * Source Project Analysis Tool
 * 
 * This script analyzes a legacy project to understand its structure,
 * dependencies, and configuration for migration planning.
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

function analyzeSource(sourcePath) {
  const analysis = {
    projectInfo: {},
    dependencies: {
      production: {},
      development: {}
    },
    scripts: {},
    configuration: {
      hasPrisma: false,
      hasNextAuth: false,
      hasTailwind: false,
      hasTypeScript: false,
      hasJest: false,
      hasPlaywright: false
    },
    structure: {
      apiRoutes: [],
      components: [],
      pages: [],
      services: [],
      lib: [],
      types: []
    },
    issues: [],
    recommendations: []
  };
  
  log('🔍 Analyzing source project...', colors.cyan);
  log('', colors.reset);
  
  // Analyze package.json
  const packageJsonPath = path.join(sourcePath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    log('📦 Analyzing package.json...', colors.blue);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    analysis.projectInfo = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      main: packageJson.main,
      scripts: packageJson.scripts || {}
    };
    
    analysis.dependencies.production = packageJson.dependencies || {};
    analysis.dependencies.development = packageJson.devDependencies || {};
    analysis.scripts = packageJson.scripts || {};
    
    // Check for key technologies
    analysis.configuration.hasPrisma = !!(
      analysis.dependencies.production.prisma || 
      analysis.dependencies.development.prisma ||
      analysis.dependencies.production['@prisma/client']
    );
    
    analysis.configuration.hasNextAuth = !!(
      analysis.dependencies.production['next-auth'] ||
      analysis.dependencies.production['@auth/core']
    );
    
    analysis.configuration.hasTailwind = !!(
      analysis.dependencies.production.tailwindcss ||
      analysis.dependencies.development.tailwindcss
    );
    
    analysis.configuration.hasTypeScript = !!(
      analysis.dependencies.development.typescript ||
      analysis.dependencies.development['@types/node']
    );
    
    analysis.configuration.hasJest = !!(
      analysis.dependencies.development.jest ||
      analysis.dependencies.development['@testing-library/react']
    );
    
    analysis.configuration.hasPlaywright = !!(
      analysis.dependencies.development.playwright ||
      analysis.dependencies.development['@playwright/test']
    );
    
    log(`   Project: ${analysis.projectInfo.name} v${analysis.projectInfo.version}`, colors.green);
    log(`   Dependencies: ${Object.keys(analysis.dependencies.production).length} production, ${Object.keys(analysis.dependencies.development).length} development`, colors.green);
  } else {
    analysis.issues.push('package.json not found');
  }
  
  // Analyze source structure
  const srcPath = path.join(sourcePath, 'src');
  if (fs.existsSync(srcPath)) {
    log('📁 Analyzing source structure...', colors.blue);
    analyzeDirectory(srcPath, analysis.structure, 'src');
  } else {
    analysis.issues.push('src directory not found');
  }
  
  // Analyze configuration files
  log('⚙️  Analyzing configuration files...', colors.blue);
  const configFiles = [
    'next.config.js',
    'next.config.ts',
    'tailwind.config.js',
    'tsconfig.json',
    'jest.config.js',
    'playwright.config.ts',
    'postcss.config.js',
    '.env.example',
    '.env.local'
  ];
  
  configFiles.forEach(file => {
    const filePath = path.join(sourcePath, file);
    if (fs.existsSync(filePath)) {
      log(`   ✅ Found: ${file}`, colors.green);
    } else {
      log(`   ⚠️  Missing: ${file}`, colors.yellow);
    }
  });
  
  // Analyze Prisma setup
  if (analysis.configuration.hasPrisma) {
    const prismaPath = path.join(sourcePath, 'prisma');
    if (fs.existsSync(prismaPath)) {
      log('🗄️  Analyzing Prisma setup...', colors.blue);
      
      const schemaPath = path.join(prismaPath, 'schema.prisma');
      if (fs.existsSync(schemaPath)) {
        log('   ✅ Prisma schema found', colors.green);
      } else {
        analysis.issues.push('Prisma schema not found');
      }
      
      const seedPath = path.join(prismaPath, 'seed.ts');
      if (fs.existsSync(seedPath)) {
        log('   ✅ Prisma seed file found', colors.green);
      }
    } else {
      analysis.issues.push('Prisma directory not found');
    }
  }
  
  // Generate recommendations
  log('💡 Generating recommendations...', colors.blue);
  
  if (!analysis.configuration.hasTailwind) {
    analysis.recommendations.push('Add Tailwind CSS for styling');
  }
  
  if (!analysis.configuration.hasTypeScript) {
    analysis.recommendations.push('Consider migrating to TypeScript');
  }
  
  if (!analysis.configuration.hasJest) {
    analysis.recommendations.push('Add Jest for unit testing');
  }
  
  if (!analysis.configuration.hasPlaywright) {
    analysis.recommendations.push('Add Playwright for E2E testing');
  }
  
  if (analysis.structure.apiRoutes.length === 0) {
    analysis.recommendations.push('No API routes found - verify this is a Next.js project');
  }
  
  // Save analysis
  const outputPath = path.join(process.cwd(), 'migration-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  
  // Display summary
  log('', colors.reset);
  log('📊 Analysis Summary:', colors.bright);
  log(`   Project: ${analysis.projectInfo.name || 'Unknown'}`, colors.reset);
  log(`   API Routes: ${analysis.structure.apiRoutes.length}`, colors.reset);
  log(`   Components: ${analysis.structure.components.length}`, colors.reset);
  log(`   Services: ${analysis.structure.services.length}`, colors.reset);
  log(`   Issues: ${analysis.issues.length}`, analysis.issues.length > 0 ? colors.red : colors.green);
  log(`   Recommendations: ${analysis.recommendations.length}`, colors.yellow);
  
  if (analysis.issues.length > 0) {
    log('', colors.reset);
    log('⚠️  Issues found:', colors.red);
    analysis.issues.forEach(issue => {
      log(`   • ${issue}`, colors.red);
    });
  }
  
  if (analysis.recommendations.length > 0) {
    log('', colors.reset);
    log('💡 Recommendations:', colors.yellow);
    analysis.recommendations.forEach(rec => {
      log(`   • ${rec}`, colors.yellow);
    });
  }
  
  log('', colors.reset);
  log(`📄 Detailed analysis saved to: ${outputPath}`, colors.green);
  
  return analysis;
}

function analyzeDirectory(dir, structure, basePath = '') {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relativePath = path.relative(basePath, filePath);
    
    if (stat.isDirectory()) {
      analyzeDirectory(filePath, structure, basePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      if (filePath.includes('/api/') && (file.includes('route') || file.includes('api'))) {
        structure.apiRoutes.push(relativePath);
      } else if (filePath.includes('/components/')) {
        structure.components.push(relativePath);
      } else if (filePath.includes('/pages/') || filePath.includes('/app/')) {
        structure.pages.push(relativePath);
      } else if (filePath.includes('/services/')) {
        structure.services.push(relativePath);
      } else if (filePath.includes('/lib/')) {
        structure.lib.push(relativePath);
      } else if (filePath.includes('/types/')) {
        structure.types.push(relativePath);
      }
    }
  });
}

// Main execution
function main() {
  const sourcePath = process.argv[2];
  
  if (!sourcePath) {
    log('❌ Error: Source project path required', colors.red);
    log('   Usage: node analyze-source.js <source-project-path>', colors.red);
    process.exit(1);
  }
  
  if (!fs.existsSync(sourcePath)) {
    log(`❌ Error: Source path does not exist: ${sourcePath}`, colors.red);
    process.exit(1);
  }
  
  log('🚀 Node Vercel Template - Source Project Analysis', colors.bright);
  log('================================================', colors.bright);
  log('');
  log(`📁 Analyzing: ${sourcePath}`, colors.cyan);
  log('');
  
  const analysis = analyzeSource(sourcePath);
  
  log('', colors.reset);
  log('🎉 Analysis complete!', colors.green);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzeSource };
