# Migration Guide

This guide provides comprehensive instructions for migrating legacy Next.js projects to the `node-vercel-template` standard.

## 🚀 Quick Migration

For a fully automated migration, use the provided migration script:

```bash
# Clone the template
git clone https://github.com/novecomdigital/node-vercel-template.git my-new-project
cd my-new-project

# Run automated migration
./scripts/migrate/migrate-from-legacy.sh ../my-old-project my-new-project
```

## 📋 Prerequisites

### System Requirements
- Node.js 18+ (recommended: Node.js 24+)
- npm 9+ or yarn 1.22+
- Git configured
- Database access (if applicable)
- Environment variable documentation

### Pre-Migration Checklist
- [ ] Source project is backed up
- [ ] All dependencies documented
- [ ] Environment variables documented
- [ ] Database schema exported
- [ ] Custom configurations noted
- [ ] Test cases identified

## 🔧 Manual Migration Steps

### Step 1: Project Setup

```bash
# Clone the template
git clone https://github.com/novecomdigital/node-vercel-template.git [NEW-PROJECT-NAME]
cd [NEW-PROJECT-NAME]

# Remove template git history
rm -rf .git
git init
git add .
git commit -m "Initial commit from node-vercel-template"
```

### Step 2: Dependency Management

```bash
# Analyze source dependencies
node scripts/migrate/analyze-source.js ../[SOURCE-PROJECT]

# Merge package.json files
node scripts/migrate/merge-package-json.js ../[SOURCE-PROJECT]/package.json

# Install dependencies
npm install

# Validate installation
node scripts/setup/validate-dependencies.js
```

### Step 3: Configuration Migration

```bash
# Use migration-friendly TypeScript config
cp tsconfig.migration.json tsconfig.json

# Copy environment variables
cp ../[SOURCE-PROJECT]/.env .env

# Copy Prisma schema and seed files
cp ../[SOURCE-PROJECT]/prisma/schema.prisma prisma/schema.prisma
cp ../[SOURCE-PROJECT]/prisma/seed.ts prisma/seed.ts
cp ../[SOURCE-PROJECT]/prisma/seed-uat.ts prisma/seed-uat.ts

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npm run db:seed
```

### Step 4: Source Code Migration

```bash
# Copy source code
node scripts/migrate/copy-source-code.js ../[SOURCE-PROJECT]

# Fix common issues
node scripts/setup/fix-variable-refs.js

# Configure runtime
node scripts/setup/fix-runtime-config.js
```

### Step 5: Validation and Testing

```bash
# Validate migration
node scripts/setup/validate-migration.js

# Test build process
npm run build

# Run tests
npm test
```

## 🛠️ Migration Tools

### Automated Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `migrate-from-legacy.sh` | Complete automated migration | `./scripts/migrate/migrate-from-legacy.sh <source> <target>` |
| `analyze-source.js` | Analyze source project structure | `node scripts/migrate/analyze-source.js <source-path>` |
| `merge-package-json.js` | Merge dependencies intelligently | `node scripts/migrate/merge-package-json.js <source-package-json>` |
| `copy-source-code.js` | Copy source code with structure handling | `node scripts/migrate/copy-source-code.js <source-path>` |

### Setup Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `fix-runtime-config.js` | Add Node.js runtime to API routes | `node scripts/setup/fix-runtime-config.js` |
| `fix-variable-refs.js` | Fix variable reference errors | `node scripts/setup/fix-variable-refs.js` |
| `validate-dependencies.js` | Validate all dependencies | `node scripts/setup/validate-dependencies.js` |
| `validate-migration.js` | Validate migration success | `node scripts/setup/validate-migration.js` |

## 🔍 Common Issues and Solutions

### Edge Runtime Errors

**Error**: `PrismaClientValidationError: PrismaClient failed to initialize`

**Solution**:
```bash
# Add runtime configuration to all API routes
node scripts/setup/fix-runtime-config.js
```

### Variable Reference Errors

**Error**: `ReferenceError: error is not defined`

**Solution**:
```bash
# Fix variable references in catch blocks
node scripts/setup/fix-variable-refs.js
```

### TypeScript Compilation Errors

**Error**: Strict TypeScript settings incompatible

**Solution**:
```bash
# Use migration-friendly TypeScript config
cp tsconfig.migration.json tsconfig.json
```

### Missing Dependencies

**Error**: `Cannot find module 'autoprefixer'`

**Solution**:
```bash
# Install missing dependencies
npm install autoprefixer @tailwindcss/postcss

# Validate all dependencies
node scripts/setup/validate-dependencies.js
```

### Authentication Issues

**Error**: NextAuth configuration problems

**Solution**:
```bash
# Update authentication configuration
# Verify environment variables
# Test authentication flow
```

## 📊 Migration Validation

### Health Checks

```bash
# Check project structure
node scripts/setup/validate-migration.js

# Test build process
npm run build

# Test TypeScript compilation
npx tsc --noEmit

# Run tests
npm test
```

### Runtime Validation

```bash
# Start development server
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health

# Test authentication
curl http://localhost:3000/api/auth/session
```

## 🎯 Best Practices

### 1. Incremental Migration
- Migrate in small, testable chunks
- Validate each phase before proceeding
- Keep source project as reference

### 2. Automated Fixes
- Use scripts for repetitive tasks
- Automate common issue resolution
- Validate fixes automatically

### 3. Testing Strategy
- Test early and often
- Use health checks for validation
- Implement comprehensive test coverage

### 4. Documentation
- Document all changes
- Keep migration notes current
- Update troubleshooting guides

### 5. Rollback Plan
- Maintain source project backup
- Document rollback procedures
- Test rollback scenarios

## 📈 Success Metrics

### Time Metrics
- Migration completion time
- Time to first successful build
- Time to first successful test run
- Time to production deployment

### Quality Metrics
- Number of build errors
- Number of runtime errors
- Test coverage percentage
- Performance benchmarks

### Developer Experience
- Number of manual fixes required
- Time spent on troubleshooting
- Developer satisfaction score
- Documentation completeness

## 🆘 Troubleshooting

### Migration Fails

1. **Check prerequisites**: Ensure all system requirements are met
2. **Review logs**: Check script output for specific error messages
3. **Validate source**: Ensure source project is valid and accessible
4. **Manual steps**: Try running individual migration steps manually

### Build Errors

1. **Dependencies**: Run `npm install` and validate dependencies
2. **TypeScript**: Use migration-friendly TypeScript configuration
3. **Runtime**: Ensure all API routes have proper runtime configuration
4. **Environment**: Verify all environment variables are set

### Runtime Errors

1. **Variable references**: Run variable reference fix script
2. **Runtime configuration**: Ensure Prisma routes use Node.js runtime
3. **Authentication**: Verify NextAuth configuration
4. **Database**: Check database connectivity and schema

## 📚 Additional Resources

- [Template Documentation](./README.md)
- [Development Process](./AI_WORKFLOW.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Environment Setup](./ENV_SETUP.md)
- [Examples](./EXAMPLES.md)

## 🤝 Support

For additional support or questions:

1. Check the troubleshooting section above
2. Review the migration analysis output
3. Consult the template documentation
4. Contact the development team

## 🎉 Success!

Once your migration is complete, you'll have:

- ✅ A modern, standardized Next.js project
- ✅ Automated CI/CD pipeline
- ✅ Comprehensive testing setup
- ✅ Production-ready configuration
- ✅ AI-assisted development workflow
- ✅ Full documentation and support

Welcome to the `node-vercel-template`! 🚀
