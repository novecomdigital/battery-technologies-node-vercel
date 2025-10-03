# Design Specifications

> **Note**: This is a template file. Update with your project's actual designs.

## 🎨 Design System

### Figma Files
- **Main Design File**: [Figma Link](url)
- **Component Library**: [Figma Link](url)
- **Design Tokens**: [Figma Link](url)

### Design Principles
1. **Principle 1**: Description
2. **Principle 2**: Description
3. **Principle 3**: Description

## 🎯 Key Screens

### Homepage
**Figma Link**: [Link](url)

**Description**: Brief description of the screen

**Key Components**:
- Hero section with CTA
- Feature showcase
- Footer

**Responsive Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Screenshots**:
![Homepage Desktop](path/to/screenshot.png)
![Homepage Mobile](path/to/screenshot-mobile.png)

**Interactions**:
- Hover states on buttons
- Smooth scroll to sections
- Mobile menu animation

---

### [Screen Name]
**Figma Link**: [Link](url)

**Description**: 

**Key States**:
- Default state
- Loading state
- Error state
- Empty state
- Success state

**Screenshots**:
[Add screenshots here]

---

## 🎨 Design Tokens

### Colors

#### Primary Palette
```css
--color-primary-50: #...;
--color-primary-100: #...;
--color-primary-500: #...;
--color-primary-900: #...;
```

#### Semantic Colors
```css
--color-success: #...;
--color-warning: #...;
--color-error: #...;
--color-info: #...;
```

### Typography

#### Font Families
```css
--font-sans: Inter, system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

#### Font Sizes
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
```

### Spacing
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-4: 1rem;     /* 16px */
--space-8: 2rem;     /* 32px */
```

### Border Radius
```css
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.5rem;   /* 8px */
--radius-lg: 1rem;     /* 16px */
--radius-full: 9999px;
```

## 📦 Component Specifications

### Button Component

**Variants**:
- Primary
- Secondary
- Outline
- Ghost
- Danger

**Sizes**:
- Small (sm)
- Medium (md - default)
- Large (lg)

**States**:
- Default
- Hover
- Active
- Disabled
- Loading

**Figma Component**: [Link](url)

**Implementation**:
```tsx
<Button variant="primary" size="md">
  Click me
</Button>
```

---

### [Component Name]

[Add your components here]

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Medium devices */
--breakpoint-lg: 1024px;  /* Large devices */
--breakpoint-xl: 1280px;  /* Extra large devices */
--breakpoint-2xl: 1536px; /* 2X large devices */
```

### Grid System
- **Mobile**: 4 columns, 16px gutters
- **Tablet**: 8 columns, 24px gutters
- **Desktop**: 12 columns, 24px gutters

## ♿ Accessibility Requirements

### WCAG AA Compliance
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Focus Indicators**: Clear focus states for all interactive elements

### Testing Checklist
- [ ] Color contrast checked with tool
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (NVDA/JAWS)
- [ ] Focus indicators visible
- [ ] Alt text for all images
- [ ] Form labels properly associated

## 🎭 Animation & Interactions

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Durations
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

### Common Animations
- **Fade in**: opacity 0 → 1
- **Slide in**: transform translateY(10px) → 0
- **Scale**: transform scale(0.95) → 1

## 📸 Design Assets

### Icons
- **Icon Library**: [Heroicons / Lucide / Custom]
- **Size**: 16px, 20px, 24px
- **Stroke Width**: 1.5px

### Images
- **Format**: WebP with PNG fallback
- **Optimization**: Next.js Image component
- **Lazy Loading**: Enabled for below-fold images

### Illustrations
- **Style**: [Your style]
- **Format**: SVG
- **Location**: `/public/illustrations/`

## 🔄 Design Update Process

1. Designer updates Figma files
2. Export updated screenshots
3. Update this `designs.md` file
4. Export design tokens (if changed)
5. Commit changes to repository
6. Notify development team
7. Update Cursor context: "Re-index /docs files"

## 🔗 Additional Resources

- **Design System Documentation**: [Link]
- **Brand Guidelines**: [Link]
- **Figma Best Practices**: [Link]
- **Component Storybook**: [Link] (if applicable)

---

**Last Updated**: [Date]
**Design Owner**: [Name/Team]
**Figma Access**: Request from [email/team]

