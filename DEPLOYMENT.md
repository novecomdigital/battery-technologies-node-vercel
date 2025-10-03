# Deployment Guide

This guide covers deploying your application to staging and production environments using Vercel and Neon Postgres.

## 🎯 Deployment Strategy

### Environments

1. **Development** - Local machine (`npm run dev`)
2. **Preview** - Automatic PR deployments on Vercel
3. **Staging** - `staging` branch deployments (optional)
4. **Production** - `main` branch deployments

### Deployment Flow

```
Feature Branch → PR → Preview Deploy → UAT → Merge to Main → Production Deploy
```

---

## 🚀 Initial Setup

### 1. Neon Postgres Setup

Create database branches for each environment:

```bash
# In Neon Console (neon.tech):
# 1. Create project
# 2. Create branches:
#    - staging (from main)
#    - production (from main)
# 3. Get connection strings for each
```

**Database Branch Mapping:**
- Local Development → `main` branch (or local Postgres)
- Preview Deployments → `staging` branch
- Production → `production` branch

### 2. Vercel Project Setup

Connect your GitHub repository to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Login and connect
vercel login
vercel link

# Or use Vercel dashboard:
# 1. Go to vercel.com
# 2. "Add New Project"
# 3. Import from GitHub
# 4. Select repository
# 5. Configure settings
```

### 3. Configure Environment Variables

#### In Vercel Dashboard

Go to **Project Settings → Environment Variables**

**Preview Environment:**
```env
NODE_ENV=production
APP_URL=https://your-app-git-{branch}-{team}.vercel.app
DATABASE_URL=postgresql://...  # Neon staging branch (pooled)
DIRECT_DATABASE_URL=postgresql://...  # Neon staging branch (direct)
NEXTAUTH_URL=https://your-app-git-{branch}-{team}.vercel.app
NEXTAUTH_SECRET=staging-secret-strong-and-unique
```

**Production Environment:**
```env
NODE_ENV=production
APP_URL=https://yourdomain.com
DATABASE_URL=postgresql://...  # Neon production branch (pooled)
DIRECT_DATABASE_URL=postgresql://...  # Neon production branch (direct)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=production-secret-different-from-staging
SENTRY_DSN=https://...  # If using Sentry
```

**Important**: 
- Use different secrets for each environment
- Use pooled connection for `DATABASE_URL`
- Use direct connection for `DIRECT_DATABASE_URL` (for migrations)

---

## 📋 Pre-Deployment Checklist

Before deploying to production, verify:

### Code Quality
- [ ] All tests passing (`npm run test:ci`)
- [ ] E2E tests passing (`npm run test:e2e:ci`)
- [ ] Linting passing (`npm run lint`)
- [ ] Type checking passing (`npm run typecheck`)
- [ ] Test coverage ≥90%
- [ ] No console.log statements
- [ ] No commented-out code

### Security
- [ ] No secrets in code or .env files committed
- [ ] CodeQL security scan passing
- [ ] Dependencies updated (no high-severity vulnerabilities)
- [ ] Authentication working correctly
- [ ] Authorization rules tested
- [ ] Input validation implemented
- [ ] CORS configured correctly

### Database
- [ ] Migrations tested in staging
- [ ] Seed data prepared (if needed)
- [ ] Database backup taken (production)
- [ ] No destructive migrations without approval
- [ ] Indexes created for performance

### Documentation
- [ ] README updated
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] ADRs created for architectural decisions
- [ ] CHANGELOG updated

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring enabled
- [ ] Health check endpoint working
- [ ] Alerting rules configured

---

## 🔄 Deployment Process

### Preview Deployments (Automatic)

Every PR automatically creates a preview deployment:

1. **Push to Feature Branch**
   ```bash
   git push origin feat/your-feature
   ```

2. **Open Pull Request**
   ```bash
   gh pr create \
     --base main \
     --head feat/your-feature \
     --title "feat: Your Feature" \
     --body "Description"
   ```

3. **Automatic Preview Deploy**
   - Vercel bot comments on PR with preview URL
   - Preview uses staging database
   - Perfect for UAT and stakeholder review

4. **Run UAT**
   - Share preview URL with customer
   - Execute UAT scripts from `/docs/uat-scripts.md`
   - Document results

### Production Deployment (Merge to Main)

1. **Ensure PR is Ready**
   - All CI checks passing ✅
   - Code review approved ✅
   - UAT completed successfully ✅
   - No [DECISION NEEDED] items blocking

2. **Merge Pull Request**
   ```bash
   # Squash and merge via GitHub UI
   # Or via CLI:
   gh pr merge [PR_NUMBER] --squash
   ```

3. **Automatic Production Deploy**
   - Vercel detects merge to `main`
   - Builds and deploys automatically
   - Uses production database
   - Runs on your production domain

4. **Verify Deployment**
   - Check Vercel deployment logs
   - Test production URL
   - Run smoke tests
   - Monitor error rates

5. **Tag Release**
   ```bash
   git checkout main
   git pull
   git tag -a v1.0.0 -m "Release: Feature Name"
   git push origin v1.0.0
   ```

---

## 🔧 Database Migrations

### Development

```bash
# Create migration
npm run db:migrate:dev

# Apply changes and update Prisma Client
# Migration files in prisma/migrations/
```

### Staging/Production

**Option 1: Automatic (Recommended for Staging)**

Add to `package.json`:
```json
{
  "scripts": {
    "vercel-build": "prisma migrate deploy && next build"
  }
}
```

**Option 2: Manual (Recommended for Production)**

```bash
# Before deployment
npx prisma migrate deploy --preview-feature

# Or use Vercel CLI
vercel env pull
npx prisma migrate deploy
vercel --prod
```

### Migration Best Practices

✅ **DO:**
- Test migrations in staging first
- Back up production database before migrations
- Use transactions for data migrations
- Add indexes in separate migrations
- Document breaking changes

❌ **DON'T:**
- Run destructive migrations without backup
- Deploy schema and data migrations together
- Remove columns without deprecation period
- Change production schema without ADR

---

## 🏥 Health Checks

### Health Check Endpoint

Create a health check API route:

**`src/app/api/health/route.ts`:**
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 503 }
    )
  }
}
```

### Monitoring Health Checks

Configure uptime monitoring:
- **Vercel**: Built-in health checks
- **UptimeRobot**: External monitoring
- **Ping URL**: `/api/health` every 5 minutes

---

## 🔄 Rollback Procedures

### Quick Rollback (Vercel)

**Via Dashboard:**
1. Go to Vercel project
2. Click "Deployments"
3. Find last working deployment
4. Click "..." → "Promote to Production"

**Via CLI:**
```bash
# List recent deployments
vercel ls

# Promote previous deployment
vercel promote [DEPLOYMENT_URL]
```

### Database Rollback

If migration caused issues:

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back [MIGRATION_NAME]

# Restore from backup
# (Neon provides point-in-time recovery)
```

### Git Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or revert to specific commit
git revert [COMMIT_HASH]
git push origin main
```

---

## 📊 Deployment Verification

### Post-Deployment Checks

After production deployment:

1. **Smoke Tests**
   ```bash
   # Homepage loads
   curl https://yourdomain.com
   
   # Health check passes
   curl https://yourdomain.com/api/health
   
   # API endpoints respond
   curl https://yourdomain.com/api/users
   ```

2. **Critical User Flows**
   - User registration
   - Login/logout
   - Key features from release
   - Payment flow (if applicable)

3. **Performance**
   - Page load times <2s
   - API response times <100ms
   - No JavaScript errors in console
   - Lighthouse score >90

4. **Monitoring**
   - No spike in error rates
   - Response times normal
   - No memory leaks
   - Database queries performing well

---

## 🚨 Troubleshooting

### Build Failures

**Error: "Module not found"**
```bash
# Solution: Ensure all dependencies in package.json
npm install
vercel --prod
```

**Error: "Environment variable missing"**
```bash
# Solution: Add to Vercel dashboard
# Project Settings → Environment Variables
```

**Error: "Build timeout"**
```bash
# Solution: Optimize build
# - Use ISR instead of SSG for large sites
# - Split code more aggressively
# - Check for slow API calls during build
```

### Database Connection Issues

**Error: "Can't reach database"**
```bash
# Solution 1: Check connection string
# Ensure using pooled connection in Vercel

# Solution 2: Check Neon status
# Visit neon.tech status page

# Solution 3: Verify environment variables
vercel env ls
```

**Error: "Too many connections"**
```bash
# Solution: Use connection pooling
# DATABASE_URL should use pooled endpoint (default in Neon)
```

### Deployment Not Updating

**Issue: Changes not reflecting**
```bash
# Solution 1: Check deployment logs
vercel logs [DEPLOYMENT_URL]

# Solution 2: Force rebuild
vercel --prod --force

# Solution 3: Clear cache
# Vercel Dashboard → Deployment → "Redeploy"
```

---

## 📈 Performance Optimization

### Build Performance

- Use `next.config.js` optimizations
- Enable SWC minification (default in Next.js 14)
- Optimize images with Next.js Image component
- Use dynamic imports for large components
- Enable experimental features carefully

### Runtime Performance

- Use ISR for dynamic content
- Implement proper caching headers
- Use Edge Runtime where possible
- Optimize database queries (indexes)
- Monitor bundle size

---

## 🔒 Security Checklist

Before production deployment:

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] API authentication working
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React handles this)
- [ ] CSRF tokens for forms
- [ ] Content Security Policy configured
- [ ] Secrets not in code/logs

---

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [Neon Branching Guide](https://neon.tech/docs/guides/branching)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

**Last Updated**: 2024-01-01
**Maintained By**: Development Team

