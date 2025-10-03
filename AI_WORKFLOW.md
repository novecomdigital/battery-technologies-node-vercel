# AI-First Development Workflow

This template is designed for **AI-assisted development** using Cursor IDE and follows the [AI Delivery Framework](https://github.com/your-org/software-development-processes).

## 🎯 Overview

This workflow maximizes AI automation while maintaining human oversight at critical decision points. You'll use Cursor AI to generate code, run gap scans, and implement features—with clear classification of what AI can fix automatically vs. what needs human decisions.

## 🚀 Two Development Phases

### Phase 1: Bootstrap (Initial App Setup)
Create the baseline application with all foundational features

### Phase 2: Feature Development (Iterative)
Build features one at a time using the established baseline

---

## 📋 Prerequisites

Before starting development:

### 1. Requirements & Design Ready
- ✅ Requirements approved in Notion "Ready for Development" table
- ✅ Architecture documented with ADRs in `/docs/architecture.md`
- ✅ Designs approved with UAT scripts in `/docs/designs.md`
- ✅ Test specifications complete

### 2. Environment Setup
- ✅ Cursor IDE installed with AI capabilities
- ✅ GitHub repository created with branch protection
- ✅ Neon Postgres database set up (staging & production branches)
- ✅ Vercel project connected
- ✅ Environment variables configured (see `ENV_SETUP.md`)

### 3. Documentation Populated
- ✅ `/docs/requirements.md` - Exported from Notion
- ✅ `/docs/architecture.md` - System design and ADRs
- ✅ `/docs/designs.md` - Figma links and screenshots
- ✅ `/docs/uat-scripts.md` - Test scenarios

---

## 🔧 Phase 1: Bootstrap (One-Time Setup)

### Step 1: Create Bootstrap Branch

```bash
git checkout -b bootstrap
git push -u origin bootstrap
```

### Step 2: Tell Cursor to Index Documentation

**Cursor Prompt:**
```
Use /docs/requirements.md, /docs/architecture.md, /docs/designs.md and /docs/adrs/ 
as authoritative context for this project.

Acknowledge once indexed, then proceed with the requested implementation.
```

### Step 3: Generate Baseline Application

**Cursor Prompt:**
```
Context: We are bootstrapping a new app from approved requirements, architecture, and designs.

Act as a senior full-stack engineer. Generate a production-ready baseline:

Stack & Requirements:
- Next.js (App Router) + Node API routes, TypeScript (strict mode)
- Tailwind v4 (latest beta) only - no v3 syntax
- Neon Postgres with Prisma
- Authentication: [specify your auth approach]
- Testing: Jest (unit/integration) + Playwright (key user flows), target ≥90% coverage
- Tooling: ESLint, Prettier configured
- CI/CD: GitHub Actions workflows present
- Documentation: README with setup/run/test/deploy instructions

Implementation Rules:
- Use Tailwind v4 (latest beta) only. No v3.x classes or config.
- Output code changes only (no placeholders).
- Apply changes directly on the current branch.
- Follow WCAG AA for accessibility
- Follow OWASP security best practices
- Include comprehensive error handling

Use /docs/requirements.md, /docs/architecture.md, /docs/designs.md and /docs/adrs/ 
as authoritative context.
```

### Step 4: Verify Tailwind v4

```bash
# Check version
npx tailwindcss --version
# Should show: tailwindcss 4.x.x-beta

# Check package.json
grep "tailwindcss" package.json
# Should show: "tailwindcss": "^4.0.0-beta.7"
```

If v3 detected, run:

**Cursor Prompt:**
```
Refactor all Tailwind code to Tailwind v4 (latest beta).
Remove v3-specific utilities/config. Follow official v4 migration guide.
```

### Step 5: Run AI Gap Scan

**Cursor Prompt:**
```
Compare the implementation against requirements + architecture + designs.

List gaps by category:
- Functionality (missing features from requirements)
- Tests (unit/integration/E2E, coverage ≥90%)
- Security (OWASP compliance, input validation, auth)
- Performance (optimization opportunities)
- Accessibility (WCAG AA compliance)
- Documentation (README, API docs, comments)

Mark each gap as:
- [AUTO-FIX] → AI can safely implement the fix now with no further input
- [DECISION NEEDED] → Requires human/customer clarification, prioritization, or approval

Format as structured list.
```

### Step 6: Apply Auto-Fixes

**Cursor Prompt:**
```
Apply all items marked [AUTO-FIX] from the gap scan.

Do not attempt items marked [DECISION NEEDED].

For each fix:
- Implement the solution
- Add/update tests to maintain ≥90% coverage
- Update documentation if needed
- Follow established patterns

Summarize changes made at the end.
```

### Step 7: Handle [DECISION NEEDED] Items

For each [DECISION NEEDED] item, create a GitHub Issue:

**Cursor Prompt:**
```
Generate GitHub Issues for all [DECISION NEEDED] items from the gap scan.

Each Issue must include:
- Title (clear and descriptive)
- Description (context + problem statement)
- Options considered (if applicable)
- Recommendation (if safe to suggest)
- Acceptance Criteria (how we'll know it's done)
- Labels: decision-needed, feature/bug, P1/P2/P3
- Story Points: S/M/L

Format as markdown for easy copy-paste to GitHub.
```

Create issues manually or use GitHub CLI:

```bash
gh issue create \
  --title "Title" \
  --body "Description" \
  --label "decision-needed,P2,feature"
```

### Step 8: Commit and Create PR

```bash
git add -A
git commit -m "Bootstrap baseline app (AI-generated, Tailwind v4) + tests + CI"
git push

gh pr create \
  --base main \
  --head bootstrap \
  --title "Bootstrap: AI-generated baseline app (Tailwind v4)" \
  --body "AI-generated baseline app using Tailwind v4, CI/CD configured, tests included. All [AUTO-FIX] items applied. [DECISION NEEDED] items tracked in Issues."
```

### Step 9: Review, CI, UAT, Merge

1. **Maintainer Review**: Code quality, security, architecture alignment
2. **CI Checks**: All must pass (lint, typecheck, tests, coverage, CodeQL)
3. **Customer UAT**: Run UAT scripts from `/docs/uat-scripts.md` on preview
4. **Merge**: Squash & merge to `main` when all ✅

---

## 🔄 Phase 2: Feature Development (Iterative Loop)

After bootstrap is merged, follow this process for every new feature:

### Step 1: Create Feature Branch

```bash
git checkout main
git pull
git checkout -b feat/short-feature-name
git push -u origin feat/short-feature-name
```

### Step 2: Implement Feature with Cursor

**Cursor Prompt:**
```
Implement feature "[FEATURE NAME]" using approved requirement + architecture + design.

Stack & Rules:
- Next.js (App Router) + Node API routes
- TypeScript (strict mode)
- Tailwind v4 (latest beta) only. No v3 utilities or config.
- Neon Postgres (via Prisma)
- Include unit + integration tests (Jest)
- Include Playwright E2E tests for this feature's user flows
- Maintain global coverage ≥90%
- Follow WCAG AA accessibility standards
- Follow OWASP security practices
- Update README/ADRs if architectural decisions are made

Implementation:
- Output code changes only (no placeholders)
- Apply changes directly on the current branch
- Follow established patterns from existing code
- Add comprehensive error handling
- Include loading and error states in UI

Use /docs/requirements.md (section X), /docs/architecture.md (Y), 
/docs/designs.md (screens Z) for this specific feature.
```

### Step 3: Run AI Gap Scan

**Cursor Prompt:**
```
Compare the implementation of "[FEATURE NAME]" against the approved requirement, 
architecture, and design.

List gaps by category:
- Functionality (missing requirements)
- Tests (unit/integration/E2E, coverage ≥90%)
- Security (vulnerabilities, input validation)
- Performance (optimization opportunities)
- Accessibility (WCAG AA compliance)
- Documentation (API docs, README updates)

Mark each gap as:
- [AUTO-FIX] → AI can safely resolve now
- [DECISION NEEDED] → Requires customer input, product clarification, or architectural approval

Format as structured list.
```

### Step 4: Apply Auto-Fixes

**Cursor Prompt:**
```
Apply all items marked [AUTO-FIX] from the gap scan.

Do not attempt [DECISION NEEDED] items.

For each fix:
- Implement the solution
- Add/update tests to keep overall coverage ≥90%
- Update documentation as needed

Summarize the changes made.
```

### Step 5: Handle [DECISION NEEDED] Items

Same process as Bootstrap Step 7 - create GitHub Issues for each item.

### Step 6: Generate UAT Script

**Cursor Prompt:**
```
Generate a UAT script for "[FEATURE NAME]" based on:
- Requirements from /docs/requirements.md
- Designs from /docs/designs.md

Include:
- Test Case ID
- Priority (P1/P2/P3)
- Preconditions
- Test Data needed
- Step-by-step actions (numbered)
- Expected result for each step
- Table format for easy copy-paste

Save to /docs/uat-scripts.md
```

### Step 7: Commit and Create PR

```bash
git add -A
git commit -m "feat: [feature name] - complete implementation + tests"
git push

gh pr create \
  --base main \
  --head feat/short-feature-name \
  --title "feat: [Human-readable title]" \
  --body "Implements [FEATURE]. All [AUTO-FIX] applied. [DECISION NEEDED] items logged as Issues. UAT script ready."
```

### Step 8: CI/CD Quality Gates

PR must pass:
- ✅ ESLint + Prettier
- ✅ TypeScript compilation
- ✅ Jest tests (≥90% coverage)
- ✅ Playwright E2E tests
- ✅ CodeQL security scan (no high-severity issues)
- ✅ Vercel preview build
- ✅ At least 1 maintainer approval

### Step 9: Customer UAT

1. Share Vercel preview URL with customer
2. Customer follows UAT script from `/docs/uat-scripts.md`
3. Document results (pass/fail for each step)
4. If fail → fix issues and repeat UAT
5. If pass → proceed to merge

### Step 10: Merge and Release

```bash
# After PR approval and UAT pass
git checkout main
git pull

# Tag release (semantic versioning)
git tag -a v1.0.0 -m "Release: [Feature Name]"
git push origin v1.0.0
```

Vercel automatically deploys to production.

---

## 🎯 Key Concepts

### [AUTO-FIX] vs [DECISION NEEDED]

**[AUTO-FIX]** - AI can resolve immediately:
- Code formatting and linting
- Missing tests (when requirements are clear)
- Documentation gaps
- Simple performance optimizations
- Accessibility fixes (known patterns)
- Security fixes (known vulnerabilities)

**[DECISION NEEDED]** - Requires human judgment:
- Unclear or ambiguous requirements
- Architecture decisions (new patterns)
- Performance vs. complexity trade-offs
- Security policy interpretations
- UX/design ambiguities
- Third-party service choices
- Database schema changes

### Test Coverage Standards

- **Unit Tests**: Individual functions and components
- **Integration Tests**: API routes, database interactions
- **E2E Tests**: Critical user journeys
- **Target**: ≥90% code coverage
- **Focus**: High-value, high-risk code paths

### Quality Standards

- **TypeScript**: Strict mode, no `any`
- **Linting**: ESLint + Prettier enforced
- **Security**: CodeQL + OWASP compliance
- **Accessibility**: WCAG AA level
- **Performance**: <2s page load, <100ms API response
- **Documentation**: All public APIs documented

---

## 🛠️ Common Cursor Prompts

### Code Generation

```
Generate [COMPONENT_TYPE] component:
- Requirements: [SPECIFIC_REQUIREMENTS]
- Design: See /docs/designs.md [SECTION]
- Props: [PROP_INTERFACE]
- Styling: Tailwind v4 only
- Accessibility: WCAG AA compliant
- Tests: Unit + integration tests included

Output: Complete React/TypeScript component with tests
```

### API Endpoint

```
Generate API endpoint:
- Route: /api/[ROUTE]
- Method: [GET|POST|PUT|DELETE]
- Schema: [REQUEST_RESPONSE_SCHEMA]
- Authentication: [AUTH_REQUIREMENTS]
- Validation: [INPUT_VALIDATION_RULES]
- Error Handling: Comprehensive error responses

Output: Complete API route with error handling and tests
```

### Database Model

```
Generate Prisma model for [ENTITY]:
- Fields: [FIELD_DEFINITIONS]
- Relationships: [RELATIONSHIP_MAP]
- Constraints: [DATABASE_CONSTRAINTS]
- Indexes: [INDEX_REQUIREMENTS]

Output: Prisma schema + migration + seed data
```

### Test Generation

```
Generate comprehensive test suite:
- Target: [COMPONENT/FUNCTION/API]
- Test Types: Unit + Integration
- Coverage Target: ≥90%
- Edge Cases: [EDGE_CASE_SCENARIOS]
- Mock Requirements: [DEPENDENCIES_TO_MOCK]

Output: Complete test implementation
```

### Documentation

```
Generate API documentation:
- Endpoints: [API_ENDPOINTS]
- Schema: [REQUEST_RESPONSE_SCHEMAS]
- Examples: [USAGE_EXAMPLES]
- Authentication: [AUTH_FLOW]
- Error Codes: [ERROR_RESPONSES]

Output: OpenAPI/Markdown documentation
```

### Code Review

```
Review this code for:
- Code quality and standards compliance
- Security vulnerabilities
- Performance issues
- Accessibility compliance (WCAG AA)
- Test coverage gaps
- Documentation completeness

Provide specific recommendations with [AUTO-FIX] or [DECISION NEEDED] classification.
```

---

## 📊 Success Metrics

### Development Velocity
- **Bootstrap Time**: < 1 week from requirements to baseline
- **Feature Time**: < 5 days from requirements to production
- **AI Automation**: ≥80% of code generated by AI

### Quality Metrics
- **Test Coverage**: ≥90% maintained
- **CI Success Rate**: ≥95% on first attempt
- **UAT Pass Rate**: ≥90% on first customer test
- **Security Issues**: 0 high-severity in production

### Process Metrics
- **Requirements Complete**: 100% before development starts
- **Documentation Updated**: Within 24 hours of changes
- **[DECISION NEEDED] Resolution**: < 48 hours average

---

## 🔧 Troubleshooting

### Cursor not using documentation

**Solution**: Re-index documentation:
```
Re-index the updated /docs files and continue with [TASK].
```

### AI generating v3 Tailwind code

**Solution**: Specify v4 explicitly:
```
IMPORTANT: Use Tailwind v4 (latest beta) only. 
No v3 syntax. Check all generated code for v3 classes.
```

### Test coverage dropping below 90%

**Solution**: Generate additional tests:
```
Analyze test coverage gaps and generate tests to bring coverage to ≥90%.
Focus on [SPECIFIC_FILES] if needed.
```

### CI/CD failing

**Solution**: Check specific failure and ask Cursor:
```
CI is failing with error: [ERROR_MESSAGE]
Diagnose the issue and provide fix with [AUTO-FIX] or [DECISION NEEDED] classification.
```

---

## 📚 Additional Resources

- [AI Delivery Framework](link-to-framework)
- [Process Library](link-to-processes)
- [Common AI Prompts](link-to-prompts)
- [Quality Gates Checklist](link-to-quality-gates)
- [Cursor IDE Documentation](https://cursor.sh/docs)

---

**Last Updated**: 2024-01-01
**Framework Version**: 1.0
**Template Version**: 0.1.0

