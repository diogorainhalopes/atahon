# Contributing to Atahon

Thank you for your interest in contributing to Atahon! This document provides guidelines and instructions for contributing code, documentation, and bug reports.

## Code of Conduct

Be respectful and professional. We aim to maintain a welcoming community for all contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```sh
   git clone https://github.com/YOUR_USERNAME/atahon.git
   cd atahon
   ```
3. **Set up development environment:**
   ```sh
   make setup
   ```
4. **Create a feature branch:**
   ```sh
   git checkout -b feature/my-feature-name
   ```

## Development Setup

### Requirements
- Node.js 20+
- JDK 21 (JDK 17+ minimum)
- Android SDK with API level 24+ installed

### Quick Start
```sh
make setup      # Install deps + verify environment
make android    # Build and run on device/emulator
make lint       # Check code quality
```

## Code Style

### TypeScript/JavaScript
- **TypeScript** is strictly required — no plain JavaScript
- Use path aliases (`@/*`, `@components/*`, etc.) for imports
- Prefix unused variables with `_` to suppress linting warnings
- Use `const` by default, `let` if reassignment needed

### Components
```tsx
import Screen from '@components/Screen';
import { useState } from 'react';

export default function MyScreen() {
  const [state, setState] = useState(false);

  return (
    <Screen className="flex-1 gap-4">
      {/* NativeWind classes, not style objects */}
    </Screen>
  );
}
```

### Styling
- **NativeWind v4** with Tailwind CSS v3.4 (not v4)
- Use `className` props, never `style` objects
- All color tokens defined in `tailwind.config.js`
- Dark theme by default (#0A0A0F base)

### Database
- Use Drizzle ORM for schema changes
- Add migrations to `src/db/migrations/migrations.ts` (inline SQL, not drizzle-kit)
- Timestamps: Unix seconds (`Math.floor(Date.now() / 1000)`), not milliseconds

### State Management
Choose the right layer:
- **Settings** (persisted) → `settingsStore.ts` (Zustand + AsyncStorage)
- **Database** (persistent data) → `src/db/schema.ts` + Drizzle
- **Runtime** (transient) → in-memory Zustand stores (`downloadStore.ts`)
- **Async/remote** (server state) → TanStack Query v5 hooks (`queries/*.ts`)

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add reader brightness control
fix: Correct manga list pagination bug
docs: Update README with architecture section
refactor: Extract reader gesture logic to separate module
test: Add unit tests for download queue
chore: Update dependencies
```

## Testing

```sh
make test       # Run Jest test suite (--passWithNoTests)
make lint       # ESLint + TypeScript type check
```

All code must pass linting before merging.

## Pull Requests

1. **Keep PRs focused** — one feature or bug fix per PR
2. **Write a clear title and description**
3. **Link related issues** — "Closes #123"
4. **Ensure CI passes** — linting and tests must pass
5. **Keep commits clean** — squash if needed, avoid merge commits

### PR Template
```markdown
## Description
Brief description of what this PR does.

## Related Issue
Closes #123

## Changes
- Change 1
- Change 2

## Testing
How to test these changes locally.

## Checklist
- [ ] Code follows style guidelines
- [ ] `make lint` passes
- [ ] `make test` passes
- [ ] Documentation updated (if needed)
```

## Reporting Bugs

Use the GitHub Issues page. Include:

- **Device/OS:** e.g., "Pixel 7, Android 14"
- **Atahon version:** e.g., "v1.2.3"
- **Steps to reproduce:** Clear reproduction steps
- **Expected behavior:** What should happen
- **Actual behavior:** What actually happens
- **Screenshots/logs:** Helpful for UI bugs

Example:
```
Device: Samsung Galaxy S24, Android 15
Atahon version: v1.3.0

Steps to reproduce:
1. Open Library tab
2. Select a manga with 100+ chapters
3. Scroll to bottom
4. Press "Load More"

Expected: Next batch of chapters loads
Actual: App crashes with blank error

Logs: ...
```

## Feature Requests

Use GitHub Discussions or Issues with a clear description:
- **Use case:** Why is this feature needed?
- **Proposed solution:** How should it work?
- **Alternatives:** Other possible approaches?

## Documentation

- **README.md** — High-level project overview and setup
- **CLAUDE.md** — Detailed developer reference (project conventions, architecture)
- **docs/src/** — User-facing documentation (Astro site)
- **Inline comments** — Complex logic needs comments explaining "why", not "what"

When adding features, update relevant docs!

## Architecture Notes

### Extension Bridge
The `modules/extension-bridge/` Kotlin module handles extension loading:
- Extensions are signature-verified APKs
- Loaded with `ChildFirstPathClassLoader` (Mihon-compatible)
- See `CLAUDE.md` for detailed constraints and implementation notes

### Reader System
The reader in `src/reader/` supports 4 modes with gesture handling and overlay UI:
- Webtoon (vertical scroll)
- Left-to-Right (LTR)
- Right-to-Left (RTL)
- Vertical Paged

Add new reader features to `src/reader/` and test on multiple device sizes.

### Downloads
- Files stored at `documentDirectory/manga/<mangaId>/<chapterId>/`
- Completion sentinel: `pages.json` written last
- Dual-tracked in DB + Zustand store
- Worker respects `concurrentDownloads` setting

## Performance Considerations

- **Flash Lists** — Use `@shopify/flash-list` for long lists, not FlatList
- **Reanimated** — Use Reanimated 4 for smooth animations (not JS-driven)
- **Query caching** — TanStack Query handles cache invalidation
- **Image loading** — Use `expo-image` with progressive loading

## Common Tasks

### Adding a new setting
1. Add field to `readerStore.ts` or `settingsStore.ts`
2. Create UI toggle/input in `app/(tabs)/more/settings/`
3. Persist automatically via AsyncStorage

### Adding a database table
1. Add schema to `src/db/schema.ts`
2. Create migration in `src/db/migrations/migrations.ts`
3. Add query functions to `src/db/queries/`
4. Create TanStack Query hook if needed in `src/queries/`

### Adding a new reader mode
1. Create viewer component in `src/reader/viewers/`
2. Register in reader mode selector
3. Add gesture handlers if needed
4. Test on both portrait and landscape

## Questions?

Open a Discussion on GitHub or check `CLAUDE.md` for detailed architecture docs.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
