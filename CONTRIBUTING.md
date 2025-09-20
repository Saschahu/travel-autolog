# Contributing to Travel AutoLog

## Development Setup

### Prerequisites

- Node.js 20.x (use `nvm use` to switch to correct version)
- npm 10.x (comes with Node.js)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/Saschahu/travel-autolog.git
cd travel-autolog

# Use correct Node version
nvm use

# Install dependencies (exact versions from lockfile)
npm ci

# Start development server
npm run dev
```

## Available Scripts

### Core Development
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run build:ci` - CI-optimized build
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking
- `npm test` - Run tests (requires setup)
- `npm run coverage` - Generate coverage reports (requires setup)

### Mobile Development
- `npm run android:run` - Complete Android workflow (build → sync → install → start)
- `npm run android:prep` - Build web + sync to Capacitor
- `npm run verify:local` - Validate local development setup

### Performance & Security
- `npm run perf:check` - Bundle size validation (requires setup)
- `npm run lhci:all` - Lighthouse CI (requires setup)
- `npm run sbom:json` - Generate Software Bill of Materials (requires setup)

## CI Gates

The following checks run in continuous integration:

1. **Build**: `npm run build` must succeed
2. **Type Safety**: `npm run typecheck` must pass
3. **Local Validation**: `npm run verify:local` must pass
4. **Android Build**: Complete APK generation workflow

Note: Lint errors are currently present (133 errors, 29 warnings) but don't block CI.

## Toolchain

- **Package Manager**: npm (declared in package.json)
- **Node Version**: 20.x (enforced by engines field)
- **Lockfile**: package-lock.json (exact dependency versions)
- **Build Tool**: Vite
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with TypeScript rules

## Reproducible Builds

- Use `npm ci` instead of `npm install` for consistent installs
- Node version is enforced via `.nvmrc` and `engines` field
- Dependencies are pinned to exact versions (`save-exact=true`)
- Mixed package managers are not supported

## Mobile Development

This project uses Capacitor for mobile development:

- Web build is synced to native platforms
- Android builds require Android SDK and Java 17
- Use `npm run android:run` for complete build/install/start workflow
- Local development should use `capacitor://localhost` URLs

## Performance Budgets

Performance monitoring is planned but requires additional setup:

- Initial bundle size limits (configure `scripts/check-initial-size.mjs`)
- Route-specific budgets (configure `scripts/route-budgets.mjs`)  
- Lighthouse CI for desktop and mobile (configure `lighthouserc.json`)

## Security & Compliance

- SBOM generation available via CycloneDX (requires setup)
- npm audit runs with `audit-level=high`
- License scanning planned (configure `scripts/license-scan.cjs`)