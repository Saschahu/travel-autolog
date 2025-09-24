# Performance Budget Guide

This document explains how to work with the performance budget system in Travel AutoLog.

## What Are Performance Budgets?

Performance budgets are automated guardrails that prevent bundle size regressions. They enforce limits on:

- **Initial JS payload size** (uncompressed bytes)
- **Initial JS payload size** (gzipped bytes)

The "initial payload" includes all JavaScript that must be loaded before the app can start - the entry point and its eager dependencies, excluding dynamically imported code.

## Current Budgets

See `perf/performance-budget.json` for current thresholds:

- Initial bytes: 6MB (≈5.9MB current)
- Initial gzipped bytes: 1.6MB (≈1.4MB current)

Budgets are set ~10-15% above current size to prevent regression while allowing small growth.

## How to Run Locally

```bash
# Build and check performance budget
pnpm build:ci && pnpm perf:check

# Build with bundle analyzer
pnpm perf:analyze
# View dist/stats.html in browser for detailed analysis

# Just check performance (requires existing build)
pnpm perf:check
```

## How It Works

1. **Build Manifest**: Vite generates `dist/.vite/manifest.json` with chunk metadata
2. **Analysis**: `scripts/check-initial-size.mjs` identifies entry chunks and their eager imports
3. **Calculation**: Script sums file sizes and computes gzipped sizes using Node's `zlib`
4. **Budget Check**: Compares against thresholds in `perf/performance-budget.json`
5. **Output**: Creates `dist/perf-summary.json` with results

### Eager vs Dynamic Imports

- **Eager imports**: `import { foo } from './bar'` - included in initial payload
- **Dynamic imports**: `import('./lazy-feature')` - excluded from initial payload, loaded on demand

The script only counts eager dependencies to measure the true "initial" payload users must download.

## Updating Budgets Responsibly

Before increasing budgets, ask:

1. **Is the increase justified?**
   - New critical features that must load initially
   - Updated dependencies with performance benefits
   - Unavoidable technical requirements

2. **Can it be optimized instead?**
   - Dynamic imports for non-critical features
   - Code splitting by route
   - Tree shaking unused code
   - Smaller alternative dependencies

3. **Impact on users?**
   - Consider 3G connections and low-end devices
   - Test on representative network conditions
   - Monitor real user metrics

### To Update Budgets

1. Edit `perf/performance-budget.json`
2. Update the `note` field with rationale
3. Test: `pnpm build:ci && pnpm perf:check`
4. Include justification in PR description

## CI Integration

The `perf-budget.yml` workflow runs on:
- Pull requests to `main`/`develop`
- Pushes to `perf/*`, `feat/*`, `fix/*` branches

**Artifacts uploaded:**
- `dist/perf-summary.json` - Size summary and budget results
- `dist/stats.html` - Interactive bundle analyzer (if built with `ANALYZE=1`)
- `dist/.vite/manifest.json` - Vite build manifest

## Troubleshooting

### Budget Exceeded in CI

1. Review the performance summary in job artifacts
2. Run `pnpm perf:analyze` locally to see bundle composition
3. Consider dynamic imports for large, non-critical features
4. If increase is justified, update budgets with clear rationale

### Script Errors

- **"manifest.json not found"**: Run `pnpm build:ci` first
- **"No entry chunks found"**: Check Vite config has correct entry points
- **Permission errors**: Ensure scripts directory is executable

### Bundle Analysis

Use `pnpm perf:analyze` and open `dist/stats.html` to:
- Identify largest dependencies
- Find duplicate code
- Discover optimization opportunities
- Understand chunk relationships

## Next Steps

Future enhancements to consider:
- Per-route bundle budgets
- Lighthouse CI integration for performance scoring
- Bundle size trending over time
- Automatic optimization suggestions