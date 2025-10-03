# Environment Variables Setup

This document explains how to configure environment variables for local development, CI/CD, and deployment.

## Quick Start

### 1. Create Local Environment File

Create a `.env.local` file in the project root (this file is gitignored):

```bash
cp .env.example .env.local  # If .env.example exists
# OR create manually
touch .env.local
```

### 2. Required Variables

Add these essential variables to `.env.local`:

```env
# Application
NODE_ENV=development
APP_NAME=node-vercel-template
APP_URL=http://localhost:3000

# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Authentication (if using NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

### 3. Generate Secrets

Generate secure secrets for authentication:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Environment Variable Reference

### Core Application

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `development`, `production` |
| `APP_NAME` | No | Application name | `my-app` |
| `APP_URL` | Yes | Application URL | `http://localhost:3000` |

### Database (Neon Postgres)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Postgres connection string (pooled) | `postgresql://user:pass@host/db` |
| `DIRECT_DATABASE_URL` | For migrations | Direct connection (non-pooled) | `postgresql://user:pass@host/db` |

**Neon Setup:**
1. Create project at [neon.tech](https://neon.tech)
2. Create branches: `staging`, `production`
3. Copy connection strings
4. Use pooled connection for `DATABASE_URL`
5. Use direct connection for `DIRECT_DATABASE_URL`

### Authentication (NextAuth.js)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXTAUTH_URL` | Yes | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Yes | Secret for JWT signing | Generate with OpenSSL |

### OAuth Providers (Optional)

**GitHub OAuth:**
```env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

**Google OAuth:**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Email (Optional)

**Resend (Recommended):**
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

**SMTP:**
```env
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-username
EMAIL_SERVER_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

### Monitoring & Error Tracking

**Sentry:**
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your-auth-token  # For releases
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Payments (Stripe - Optional)

```env
STRIPE_SECRET_KEY=sk_test_xxx  # Use sk_live_xxx in production
STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # Use pk_live_xxx in production
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### AI Services (Optional)

**OpenAI:**
```env
OPENAI_API_KEY=sk-proj-xxx
```

**Anthropic Claude:**
```env
ANTHROPIC_API_KEY=sk-ant-xxx
```

## Environment-Specific Configuration

### Local Development

**File**: `.env.local` (gitignored)

```env
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/app_dev
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-dev-secret-change-me
```

**Optional: Using direnv**

Install direnv for automatic environment loading:

```bash
# macOS
brew install direnv

# Add to ~/.zshrc or ~/.bashrc
eval "$(direnv hook zsh)"  # or bash

# Create .envrc in project root
echo 'dotenv .env.local' > .envrc
direnv allow
```

### GitHub Actions (CI)

**Location**: Repository Settings → Secrets and variables → Actions

Required secrets:
```
DATABASE_URL=postgresql://...  # Test database
NEXTAUTH_SECRET=test-secret
```

Add to `.github/workflows/ci.yml`:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

### Vercel Deployment

**Location**: Project Settings → Environment Variables

Configure separately for each environment:

#### Preview Environment (PR deployments)
```env
NODE_ENV=production
APP_URL=https://your-app-git-{branch}-{team}.vercel.app
DATABASE_URL=postgresql://...  # Neon staging branch
NEXTAUTH_URL=https://your-app-git-{branch}-{team}.vercel.app
NEXTAUTH_SECRET=staging-secret-different-from-prod
```

#### Production Environment
```env
NODE_ENV=production
APP_URL=https://yourdomain.com
DATABASE_URL=postgresql://...  # Neon production branch
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=production-secret-strong-and-unique
```

**Vercel Setup Steps:**
1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select environment: Production, Preview, or Development
4. Save and redeploy

## Security Best Practices

### ✅ DO

- ✅ Use different secrets for each environment
- ✅ Generate strong, random secrets
- ✅ Store production secrets in secure vault (Vercel, 1Password, etc.)
- ✅ Rotate secrets regularly
- ✅ Use `.env.local` for local development (gitignored)
- ✅ Document all required environment variables
- ✅ Use read-only database credentials where possible
- ✅ Enable SSL/TLS for all database connections

### ❌ DON'T

- ❌ Commit `.env`, `.env.local`, or `.env.production` to git
- ❌ Share secrets in Slack, email, or other insecure channels
- ❌ Use the same secrets across environments
- ❌ Use weak or default secrets in production
- ❌ Hardcode secrets in source code
- ❌ Give developers production database access
- ❌ Log environment variables

## Verification

### Check Local Setup

```bash
# Verify environment variables are loaded
npm run dev

# Check database connection
npm run db:generate
npm run db:migrate:dev
```

### Check CI Setup

```bash
# Push to a branch and open PR
# GitHub Actions should run successfully
```

### Check Vercel Setup

```bash
# Deploy to Vercel
vercel

# Or push to GitHub (auto-deploys)
git push origin main
```

## Troubleshooting

### "Missing environment variables" error

**Solution**: Ensure all required variables are set in `.env.local`

### Database connection fails

**Solutions**:
1. Verify `DATABASE_URL` is correct
2. Check Neon database is running
3. Verify SSL mode is correct (`sslmode=require` for Neon)
4. Test connection with `psql`:
   ```bash
   psql "postgresql://user:pass@host/db?sslmode=require"
   ```

### NextAuth errors

**Solutions**:
1. Verify `NEXTAUTH_URL` matches your app URL
2. Generate new `NEXTAUTH_SECRET` with OpenSSL
3. Check OAuth provider credentials are correct
4. Verify callback URLs in OAuth provider settings

### Vercel deployment fails

**Solutions**:
1. Check all required variables are set in Vercel dashboard
2. Verify database is accessible from Vercel
3. Check build logs for specific error messages
4. Ensure `DATABASE_URL` uses connection pooling for Neon

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Neon Connection Strings](https://neon.tech/docs/connect/connect-from-any-app)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Last Updated**: 2024-01-01
**Maintained By**: Development Team

