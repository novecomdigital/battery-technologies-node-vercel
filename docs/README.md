# Project Documentation

This folder contains authoritative project documentation for AI-assisted development with Cursor.

## 📁 Structure

- **`requirements.md`** - Approved requirements (export from Notion)
- **`architecture.md`** - System architecture and design decisions
- **`designs.md`** - UI/UX designs (Figma links + screenshots)
- **`uat-scripts.md`** - User Acceptance Testing scripts
- **`adrs/`** - Architecture Decision Records

## 🤖 Usage with Cursor AI

When implementing features, tell Cursor to use this documentation as context:

```
Use /docs/requirements.md, /docs/architecture.md, and /docs/designs.md 
as authoritative context for this project. Implement [FEATURE] according 
to these specifications.
```

### For Bootstrap (Initial App Setup)

```
Context: We are bootstrapping a new app from approved requirements, architecture, and designs.

Use /docs/requirements.md, /docs/architecture.md, /docs/designs.md and /docs/adrs/ 
as authoritative context.

Act as a senior full-stack engineer. Generate a production-ready baseline following
the specifications in the documentation.
```

### For Feature Development

```
Implement feature "[FEATURE NAME]" using approved requirement + architecture + design.

Use /docs/requirements.md (section X), /docs/architecture.md (Y), 
/docs/designs.md (screens Z) for this specific feature.
```

## 📝 Maintaining Documentation

### When Requirements Change
1. Update requirements in Notion
2. Export updated Notion page as Markdown
3. Replace content in `requirements.md`
4. Tell Cursor: `Re-index the updated /docs files and continue`

### When Architecture Changes
1. Document decision in new ADR in `adrs/` folder
2. Update `architecture.md` with the change
3. Commit and push documentation updates
4. Inform team of architectural changes

### When Designs Change
1. Update Figma designs
2. Update `designs.md` with new links and screenshots
3. Regenerate design tokens if using a design system
4. Update components to match new designs

## 📋 Documentation Standards

### Requirements (requirements.md)
- Export directly from Notion "Ready for Development" table
- Include all acceptance criteria
- Link to original Notion pages
- Keep synchronized with Notion

### Architecture (architecture.md)
- System components and their responsibilities
- Data flow diagrams
- API contracts and schemas
- Database schema (Prisma models)
- Technology stack decisions
- Integration points
- Performance considerations
- Security architecture

### Designs (designs.md)
- Figma share links (with proper permissions)
- Screenshots of key states
- Design tokens and variables
- Accessibility requirements (WCAG AA)
- Responsive breakpoints
- Component specifications

### UAT Scripts (uat-scripts.md)
- Generated from requirements and designs
- Step-by-step testing instructions
- Expected vs actual results
- Test data requirements
- Preconditions for each test

### ADRs (adrs/)
- Follow ADR template format
- One decision per file
- Numbered sequentially (001-xxx.md)
- Include context, decision, consequences
- Never delete old ADRs (they're historical record)

## 🔗 Integration with Process Framework

This documentation structure supports the AI Delivery Framework:

- **P01 - Specification Development** → `requirements.md`
- **P02 - Architecture** → `architecture.md` + `adrs/`
- **P03 - Design** → `designs.md`
- **P11 - Test Specification** → `uat-scripts.md`
- **P05 - Development Process** → All docs as AI context

## 📚 Additional Resources

- [AI Delivery Framework Documentation](../AI_WORKFLOW.md)
- [Process Quick Reference](link-to-process-framework)
- [Common Cursor Prompts](link-to-prompts-library)

---

**Remember**: This documentation is the **single source of truth** for AI-assisted development. Keep it up to date and synchronized with Notion.

