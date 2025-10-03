# Tailwind CSS v4 Migration Guide

This project uses **Tailwind CSS v4 (beta)**. This document explains what's different and how to work with v4.

## What's New in v4

### 1. CSS-First Configuration
Tailwind v4 uses native CSS for configuration instead of JavaScript:

```css
/* src/app/globals.css */
@theme {
  --color-primary: #3b82f6;
  --font-display: 'Inter', sans-serif;
}
```

### 2. Simplified Setup
- No more `content` configuration (auto-detects files)
- CSS imports instead of PostCSS plugin (in many cases)
- Better performance and faster builds

### 3. New Utilities
- New color functions
- Improved typography utilities
- Better container queries
- Enhanced dark mode support

## Current Setup

This template is configured for Tailwind v4:

### `package.json`
```json
{
  "devDependencies": {
    "tailwindcss": "^4.0.0-beta.7"
  }
}
```

### `tailwind.config.js`
Kept for compatibility, but most configuration moves to CSS in v4.

### `src/app/globals.css`
Main CSS file with Tailwind directives and theme configuration.

## Migration from v3

If you see any v3 code, update it:

### ❌ v3 Syntax (Remove)
```jsx
// Old spacing utilities
<div className="gap-x-4 gap-y-2" />

// Old color syntax
<div className="bg-blue-500" />
```

### ✅ v4 Syntax (Use)
```jsx
// New spacing utilities
<div className="gap-4" />

// New color syntax (still works, but can use CSS vars)
<div className="bg-primary" />
```

## Cursor Prompts for v4

When using Cursor AI, always specify Tailwind v4:

```
Generate a [component] using:
- Tailwind v4 (latest beta) utilities only
- No v3 syntax or deprecated classes
- Use CSS custom properties for theming
- Follow v4 best practices
```

## Common v4 Patterns

### Custom Colors
```css
/* src/app/globals.css */
@theme {
  --color-primary-50: oklch(97% 0.01 250);
  --color-primary-500: oklch(60% 0.2 250);
  --color-primary-900: oklch(30% 0.15 250);
}
```

```jsx
<button className="bg-primary-500 hover:bg-primary-600">
  Button
</button>
```

### Dark Mode
```css
@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: oklch(20% 0 0);
    --color-foreground: oklch(98% 0 0);
  }
}
```

```jsx
<div className="bg-background text-foreground">
  Auto dark mode
</div>
```

### Custom Utilities
```css
@utility {
  .text-balance {
    text-wrap: balance;
  }
}
```

## Verification

Check your Tailwind version:

```bash
npx tailwindcss --version
# Should output: tailwindcss 4.x.x-beta
```

Test build:

```bash
npm run build
# Should build without v3-related warnings
```

## Resources

- [Tailwind v4 Beta Docs](https://tailwindcss.com/docs/v4-beta)
- [v4 Migration Guide](https://tailwindcss.com/docs/v4-beta/migration-guide)
- [v4 Announcement](https://tailwindcss.com/blog/tailwindcss-v4-beta)

## Troubleshooting

### "Unknown utility class" errors

**Solution**: The class might be deprecated in v4. Check the v4 docs for the new syntax.

### Build performance issues

**Solution**: v4 is faster than v3. If you see slowness, check for:
- Old PostCSS plugins
- Incorrect v4 configuration
- Large CSS files

### Dark mode not working

**Solution**: v4 uses CSS `prefers-color-scheme` by default. For manual dark mode:

```css
@media (prefers-color-scheme: dark) {
  /* dark mode styles */
}
```

Or use the `dark:` variant:

```jsx
<div className="bg-white dark:bg-gray-900">
  Content
</div>
```

## AI Development with v4

When using Cursor for development:

1. **Always specify v4**:
   ```
   Use Tailwind v4 (latest beta) only. No v3 syntax.
   ```

2. **Verify generated code**:
   ```
   Check this code for Tailwind v3 syntax and upgrade to v4.
   ```

3. **CSS-first approach**:
   ```
   Generate Tailwind v4 theme configuration in CSS format.
   ```

---

**Last Updated**: 2024-01-01
**Tailwind Version**: 4.0.0-beta.7

