# Repository Setup Instructions

## Initial Setup

1. **Clone this repository:**
   ```bash
   git clone https://github.com/novecomdigital/node-vercel-template.git
   cd node-vercel-template
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install --with-deps
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Run tests to verify everything works:**
   ```bash
   npm run test:ci
   npm run test:e2e:ci
   ```

## Repository Information

- **Repository**: `novecomdigital/node-vercel-template`
- **Package Name**: `node-vercel-template`
- **Node Version**: 18.0.0+
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS
- **Testing**: Jest + Playwright
- **CI/CD**: GitHub Actions

## Next Steps

1. Update the README.md with your specific project details
2. Modify the homepage content in `src/app/page.tsx`
3. Add your own components in `src/components/`
4. Configure your deployment settings
5. Push to your GitHub repository
