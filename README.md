# node-vercel-template

A modern, production-ready Next.js template designed for **AI-assisted development** with Cursor IDE. Follows the [AI Delivery Framework](https://github.com/your-org/software-development-processes) for rapid, high-quality software delivery.

## ✨ Features

### Core Stack
- ⚡ **Next.js 14+** with App Router
- 🔷 **TypeScript** in strict mode
- 🎨 **Tailwind CSS v4** (latest beta)
- 🗄️ **Prisma** + **Neon Postgres**
- 🧪 **Jest** for unit/integration testing (≥90% coverage)
- 🎭 **Playwright** for end-to-end testing

### 🚀 Migration Support
- 🔄 **Automated legacy project migration** tools
- 🛠️ **Runtime configuration** automation for Prisma compatibility
- 🔧 **Variable reference fixes** for common migration issues
- 📦 **Dependency validation** and conflict resolution
- ✅ **Migration validation** and health checks

### AI-First Development
- 🤖 **Cursor AI** optimized workflow
- 📋 **Bootstrap + Feature Development** process
- 🔍 **[AUTO-FIX] vs [DECISION NEEDED]** classification
- 📝 **Documentation-driven** development

### Quality & Security
- 📏 **ESLint** + **Prettier** for code quality
- 🔒 **CodeQL** security scanning
- 🤖 **Dependabot** for dependency updates
- 🛡️ **OWASP** + **WCAG AA** compliance

### DevOps & Monitoring
- 🚀 **GitHub Actions** CI/CD
- ☁️ **Vercel** deployment ready
- 📊 **Error tracking** (Sentry setup guide)
- 🔍 **Performance monitoring** (Vercel Analytics)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.0.0 or higher
- **npm** (comes with Node.js)
- **Cursor IDE** (recommended) or VS Code
- **Neon** account ([neon.tech](https://neon.tech)) for Postgres database
- **Vercel** account ([vercel.com](https://vercel.com)) for deployment

### Option 1: Use as Template (Recommended)

1. **Click "Use this template"** on GitHub
2. **Clone your new repository:**
   ```bash
   git clone https://github.com/your-org/your-project.git
   cd your-project
   ```

### Option 2: Migrate Legacy Project

For migrating existing Next.js projects to this template:

```bash
# Clone the template
git clone https://github.com/novecomdigital/node-vercel-template.git my-new-project
cd my-new-project

# Run automated migration
./scripts/migrate/migrate-from-legacy.sh ../my-old-project my-new-project
```

**Migration Features:**
- 🔄 **Automated dependency merging** with conflict resolution
- 🛠️ **Runtime configuration** for Prisma compatibility
- 🔧 **Variable reference fixes** for common issues
- 📦 **Dependency validation** and missing package detection
- ✅ **Migration validation** and health checks

### Option 3: Clone Directly

```bash
git clone https://github.com/novecomdigital/node-vercel-template.git
cd node-vercel-template
```

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy environment template
   cp ENV_SETUP.md .env.local
   # Edit .env.local with your actual values
   ```

3. **Set up database:**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate:dev
   
   # Seed database (optional)
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

### First-Time Setup Checklist

- [ ] Environment variables configured (see `ENV_SETUP.md`)
- [ ] Neon Postgres database created
- [ ] GitHub repository created with branch protection
- [ ] Vercel project connected
- [ ] Documentation populated in `/docs` folder
- [ ] Read `AI_WORKFLOW.md` for development process

## 📝 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Database
```bash
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema changes (dev)
npm run db:migrate:dev   # Create and apply migration
npm run db:migrate:deploy # Deploy migrations (production)
npm run db:seed          # Seed database with test data
npm run db:studio        # Open Prisma Studio
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
npm run typecheck        # Run TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

### Testing
```bash
npm run test             # Run Jest tests
npm run test:ci          # Run Jest with coverage (CI mode)
npm run test:watch       # Run Jest in watch mode
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ci      # Run Playwright (CI mode)
npm run test:e2e:ui      # Run Playwright with UI
```

## 📁 Project Structure

```
├── .github/                    # GitHub configuration
│   ├── ISSUE_TEMPLATE/        # Issue templates (feature, bug, decision)
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/             # GitHub Actions
│       ├── ci.yml            # Main CI workflow
│       └── codeql.yml        # Security scanning
├── docs/                      # Project documentation (AI context)
│   ├── requirements.md        # Approved requirements (from Notion)
│   ├── architecture.md        # System architecture
│   ├── designs.md             # UI/UX designs (Figma links)
│   ├── uat-scripts.md         # UAT test scenarios
│   └── adrs/                  # Architecture Decision Records
├── prisma/                    # Database
│   ├── schema.prisma         # Prisma schema
│   └── seed.ts               # Database seed data
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API routes
│   │   ├── globals.css      # Global styles (Tailwind v4)
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Homepage
│   │   └── __tests__/       # Page tests
│   ├── components/          # React components
│   ├── lib/                 # Utility functions
│   │   ├── prisma.ts       # Prisma client
│   │   └── __tests__/      # Utility tests
│   └── types/              # TypeScript type definitions
├── e2e/                     # Playwright E2E tests
├── AI_WORKFLOW.md          # AI-first development guide ⭐
├── DEPLOYMENT.md           # Deployment guide
├── ENV_SETUP.md            # Environment variables guide
├── MONITORING.md           # Monitoring & observability
├── SECURITY.md             # Security policy
├── TAILWIND_V4.md         # Tailwind v4 migration guide
└── Configuration files...
```

## 🤖 AI-First Development Workflow

This template follows the **AI Delivery Framework** for maximum productivity:

### 1. Bootstrap Phase (One-Time)
Create baseline application with all foundational features using Cursor AI:
```bash
git checkout -b bootstrap
# Follow AI_WORKFLOW.md for prompts
```

### 2. Feature Development (Iterative)
Build features one at a time with AI assistance:
```bash
git checkout -b feat/your-feature
# Use Cursor prompts from AI_WORKFLOW.md
```

### 3. Gap Scanning
AI identifies gaps and classifies as:
- **[AUTO-FIX]** → AI implements immediately
- **[DECISION NEEDED]** → Human review required

### 4. Quality Gates
- ✅ Tests (≥90% coverage)
- ✅ Linting & type checking
- ✅ Security scanning (CodeQL)
- ✅ Customer UAT

📖 **Full guide**: See [`AI_WORKFLOW.md`](./AI_WORKFLOW.md)

## 📚 Documentation Guides

| Guide | Description |
|-------|-------------|
| [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) | **START HERE** - AI-assisted development process |
| [`ENV_SETUP.md`](./ENV_SETUP.md) | Environment variables configuration |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Deployment to Vercel + Neon setup |
| [`MONITORING.md`](./MONITORING.md) | Error tracking & performance monitoring |
| [`SECURITY.md`](./SECURITY.md) | Security policy & best practices |
| [`TAILWIND_V4.md`](./TAILWIND_V4.md) | Tailwind v4 migration guide |
| [`/docs`](./docs) | Project-specific documentation (AI context) |

## ⚙️ Configuration

### TypeScript
- ✅ Strict mode enabled
- ✅ Path aliases (`@/*` → `./src/*`)
- ✅ Comprehensive type checking

### Tailwind CSS v4
- ✅ Latest beta version
- ✅ CSS-first configuration
- ✅ Optimized for production

### Database (Prisma + Neon)
- ✅ Type-safe database client
- ✅ Migration system
- ✅ Connection pooling
- ✅ Branch-based development

### Testing
- ✅ **Jest**: Unit/integration (≥90% coverage)
- ✅ **Playwright**: E2E tests
- ✅ Coverage reports (HTML + LCOV)

### Code Quality
- ✅ **ESLint**: Next.js + TypeScript rules
- ✅ **Prettier**: Consistent formatting
- ✅ **TypeScript**: Strict mode
- ✅ **CodeQL**: Security scanning

## 🚀 Deployment

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Production Deployment Process

1. **Create PR** → Automatic preview deployment
2. **Run UAT** on preview URL
3. **Merge to main** → Automatic production deployment
4. **Monitor** via Vercel dashboard

📖 **Full guide**: See [`DEPLOYMENT.md`](./DEPLOYMENT.md)

### Environment Setup

Each environment needs separate configuration:

| Environment | Database | URL | Purpose |
|-------------|----------|-----|---------|
| Local | Neon staging or local | localhost:3000 | Development |
| Preview | Neon staging | vercel-preview-url | UAT |
| Production | Neon production | yourdomain.com | Live |

## 🔐 Security

### Built-in Security Features

- ✅ **CodeQL** security scanning
- ✅ **Dependabot** automated updates
- ✅ **Branch protection** rules
- ✅ **Secret scanning** enabled
- ✅ **HTTPS** enforced

### Security Best Practices

- Never commit secrets (use `.env.local`)
- Rotate secrets regularly
- Review dependency updates promptly
- Follow OWASP guidelines
- Implement proper authentication

📖 **Security policy**: See [`SECURITY.md`](./SECURITY.md)

## 📊 Monitoring & Observability

### Included Monitoring

- ✅ **Vercel Analytics** (automatic)
- ✅ **CodeQL** security scanning
- ✅ **GitHub Actions** CI/CD logs

### Recommended Setup

- **Sentry** - Error tracking
- **PostHog** - User analytics
- **UptimeRobot** - Uptime monitoring

📖 **Setup guide**: See [`MONITORING.md`](./MONITORING.md)

## 🧪 Testing Strategy

### Test Coverage

- **Unit Tests**: Components, utilities, functions
- **Integration Tests**: API routes, database operations
- **E2E Tests**: Critical user journeys
- **Target**: ≥90% code coverage

### Running Tests

```bash
# Run all tests with coverage
npm run test:ci

# Run E2E tests
npm run test:e2e

# Watch mode for development
npm run test:watch
```

## 🤝 Contributing

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feat/your-feature
   ```

2. **Follow AI workflow**
   - Use Cursor AI for development
   - Run gap scans
   - Apply auto-fixes
   - Create issues for decisions

3. **Ensure quality**
   ```bash
   npm run lint
   npm run typecheck
   npm run test:ci
   npm run test:e2e:ci
   ```

4. **Create Pull Request**
   - Use PR template
   - Link related issues
   - Request review from maintainers

### Code Standards

- ✅ TypeScript strict mode
- ✅ ESLint + Prettier compliant
- ✅ ≥90% test coverage
- ✅ Tailwind v4 only (no v3 syntax)
- ✅ WCAG AA accessibility
- ✅ OWASP security practices

## 🆘 Getting Help

### Documentation
- **AI Workflow**: [`AI_WORKFLOW.md`](./AI_WORKFLOW.md)
- **Deployment**: [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- **Environment Setup**: [`ENV_SETUP.md`](./ENV_SETUP.md)
- **Process Framework**: [Link to your process docs]

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Cursor not using docs | Re-index with prompt from `AI_WORKFLOW.md` |
| Database connection fails | Check `ENV_SETUP.md` for connection string format |
| Tests failing | Ensure coverage ≥90%, check test setup |
| Tailwind v3 detected | See `TAILWIND_V4.md` for migration |

### Support Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community support
- **Security Issues**: See [`SECURITY.md`](./SECURITY.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Neon](https://neon.tech/) - Serverless Postgres
- [Vercel](https://vercel.com/) - Deployment platform
- [Cursor](https://cursor.sh/) - AI-powered IDE

---

**Made with ❤️ for AI-assisted development**
