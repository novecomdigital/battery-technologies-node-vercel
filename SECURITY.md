# Security Policy

## Supported Versions

We actively support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

### Email
Send details to: **security@novecomdigital.com**

### GitHub Security Advisories
Use GitHub's [private vulnerability reporting](https://github.com/novecomdigital/node-vercel-template/security/advisories/new)

## What to Include

When reporting a vulnerability, please include:

- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
- Full paths of affected source files
- Location of the affected code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability
- Suggested fix (if known)

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

## Security Best Practices

When using this template, follow these security practices:

### Environment Variables
- Never commit `.env` files containing secrets
- Use `.env.example` for documentation only
- Store production secrets in Vercel/GitHub Secrets
- Rotate secrets regularly

### Dependencies
- Enable Dependabot security updates
- Review and merge security patches promptly
- Audit dependencies regularly: `npm audit`
- Keep dependencies up to date

### Authentication & Authorization
- Use strong authentication mechanisms
- Implement proper session management
- Follow principle of least privilege
- Validate all user inputs

### Data Protection
- Encrypt sensitive data at rest and in transit
- Use HTTPS for all connections
- Implement proper CORS policies
- Follow OWASP security guidelines

### Code Quality
- Enable CodeQL security scanning
- Run security linters (ESLint security plugins)
- Conduct regular security code reviews
- Follow secure coding practices

### Database Security
- Use parameterized queries (Prisma does this automatically)
- Implement row-level security where needed
- Regularly backup databases
- Encrypt database connections (SSL/TLS)

### API Security
- Implement rate limiting
- Validate and sanitize all inputs
- Use API authentication (API keys, JWT, OAuth)
- Follow REST/GraphQL security best practices

## Security Tools in This Template

### Automated Scanning
- **CodeQL**: Automated code security analysis
- **Dependabot**: Automated dependency updates
- **npm audit**: Vulnerability scanning for dependencies

### Code Quality
- **ESLint**: Linting with security rules
- **TypeScript**: Type safety to prevent errors
- **Prettier**: Consistent code formatting

### CI/CD Security
- **GitHub Actions**: Secure CI/CD pipeline
- **Branch Protection**: Required reviews and checks
- **Secrets Management**: GitHub Secrets for sensitive data

## Security Compliance

This template is designed to help you meet common security standards:

- **OWASP Top 10**: Protection against common vulnerabilities
- **CWE Top 25**: Common weakness enumeration coverage
- **GDPR**: Data protection best practices
- **SOC 2**: Security and availability controls

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Vercel Security](https://vercel.com/docs/security)

## Disclosure Policy

We follow responsible disclosure principles:

1. Security researchers report vulnerabilities privately
2. We confirm and investigate the issue
3. We develop and test a fix
4. We release the fix and credit the reporter (if desired)
5. We publicly disclose the vulnerability details

## Recognition

We appreciate security researchers who help keep our projects safe. With your permission, we'll acknowledge your contribution in:

- GitHub Security Advisories
- Release notes
- Our security hall of fame (if applicable)

---

**Last Updated**: {{ date }}
**Contact**: security@novecomdigital.com

