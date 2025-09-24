# Per-Route Performance Budgets

## Overview

This system monitors and enforces performance budgets for individual route components in the Travel AutoLog application. It helps prevent performance regressions by measuring the initial JavaScript payload size for each logical route and failing CI builds if any route exceeds its configured budget.

## How Budgets Are Defined

Route budgets are configured in `perf/route-budgets.json`:

```json
{
  "routes": [
    {
      "name": "home",
      "module": "src/pages/Index.tsx",
      "gzipBudget": 1500000
    },
    {
      "name": "gps", 
      "module": "src/components/gps/GPSPage.tsx",
      "gzipBudget": 1500000
    },
    {
      "name": "export",
      "module": "src/components/export/ExportPage.tsx",
      "gzipBudget": 1500000
    },
    {
      "name": "settings",
      "module": "src/components/settings/SettingsDialog.tsx", 
      "gzipBudget": 1500000
    }
  ]
}
```

Each route defines:
- **name**: Human-readable route identifier
- **module**: Entry point module for the route
- **gzipBudget**: Maximum allowed gzipped size in bytes

## How Budgets Are Measured

The measurement process (`scripts/route-budgets.mjs`):

1. **Reads build manifest**: Analyzes `dist/.vite/manifest.json` from Vite build
2. **Traces module graphs**: For each route, follows only **eager imports** (not dynamic imports) to simulate the initial payload after navigation
3. **Calculates sizes**: Sums uncompressed and gzipped sizes of all files in each route's initial graph
4. **Compares with budgets**: Checks each route against its configured limit
5. **Generates report**: Outputs `dist/route-perf-summary.json` with detailed results

## Current Budget Policy

All routes currently share the same budget of **1.5MB gzipped** because the application is currently bundled as a single chunk. This provides some headroom above the current ~1.4MB size while preventing significant regressions.

**Recommended future budgets** (after code-splitting implementation):
- **Home route**: ≤120KB gzipped (core dashboard functionality)
- **GPS route**: ≤300KB gzipped (includes mapping libraries)
- **Export route**: ≤300KB gzipped (includes Excel/PDF generation)
- **Settings route**: ≤150KB gzipped (configuration UI)

## CI Enforcement

The performance budgets run automatically in CI via `.github/workflows/perf-route-budgets.yml`:

1. **Build step**: `npm run build:ci` generates the application bundle
2. **Route analysis**: `npm run perf:routes` analyzes each route and enforces budgets
3. **Artifact upload**: Uploads `route-perf-summary.json` and `manifest.json`
4. **GitHub summary**: Shows a table of current vs budget sizes for each route

The CI build fails if any route exceeds its budget.

## How to Debug a FAIL

When a route exceeds its budget:

1. **Check the CI logs**: The script shows the heaviest files for failing routes
2. **Analyze locally**: 
   ```bash
   npm run build:ci
   npm run perf:routes
   ```
3. **Use bundle analyzer** (optional):
   ```bash
   ANALYZE=1 npm run build:ci
   # Opens dist/stats.html with bundle visualization
   ```

### Common causes of budget failures:

- **New heavy dependencies**: Added large libraries without code-splitting
- **Eager imports**: Libraries that should be lazy-loaded are imported at the top level
- **Duplicated code**: Same functionality bundled in multiple places

### Fixing strategies:

- **Push heavy libs behind user actions**: Move large dependencies to dynamic imports
- **Keep adapters lazy**: Only load platform-specific code when needed
- **Split large components**: Break down oversized components into smaller chunks
- **Review import patterns**: Use tree-shaking friendly imports (`import { x } from 'lib'` not `import lib from 'lib'`)

## Updating Budgets Responsibly

Budget changes should be deliberate and well-justified:

### When to increase budgets:
- Adding essential functionality that genuinely requires more JavaScript
- After measuring that the increase doesn't harm user experience
- When existing budget is proven too restrictive for legitimate use cases

### When to decrease budgets:
- After successful optimization work
- To gradually ratchet down technical debt
- Following removal of unused dependencies

### Process:
1. Update `perf/route-budgets.json`
2. Test locally: `npm run perf:routes`
3. Document the change reasoning in commit message
4. Get team review for budget increases >10%

## Running Locally

```bash
# Full performance check
npm run build:ci && npm run perf:routes

# Just route budgets (assumes dist/ exists)
npm run perf:routes
```

## Next Steps (Optional)

Future enhancements could include:

- **Lighthouse CI integration**: Measure runtime performance metrics
- **Image budgets**: Monitor asset sizes beyond JavaScript
- **Bundle analysis automation**: Automated bundle size visualizations
- **Progressive budgets**: Stricter budgets for critical routes
- **Historical tracking**: Track budget trends over time