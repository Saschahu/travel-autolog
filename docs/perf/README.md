# Performance Budget Guide

## What it enforces

The performance budget system automatically checks the **initial bundle size** of the Travel AutoLog application to prevent performance regressions. It analyzes the entry chunks and their eager dependencies to calculate the JavaScript and CSS payload that users must download on first visit.

## Current Budgets

- **Bundle Size**: 5.25 MB (raw)
- **Gzipped Size**: 1.38 MB (compressed)

These budgets are configured in `perf/performance-budget.json`.

## How to run locally

```bash
# Build the application
npm run build:ci

# Check performance budget
npm run perf:check

# Build with bundle analyzer (generates dist/stats.html)
npm run perf:analyze
```

## Understanding the analysis

The system:
1. Reads the Vite build manifest (`dist/.vite/manifest.json`)
2. Identifies entry points (where `isEntry: true`)
3. Recursively collects **eager imports only** (excludes dynamic imports)
4. Calculates total file sizes from the `dist/` directory
5. Computes gzipped sizes using Node's built-in `zlib`
6. Outputs a detailed summary to `dist/perf-summary.json`

## How to adjust thresholds responsibly

1. **Before increasing budgets**: Investigate why the bundle grew
   - Run `npm run perf:analyze` to see the visual breakdown
   - Check if new dependencies were added
   - Consider code-splitting opportunities

2. **Update budgets**: Edit `perf/performance-budget.json`
   ```json
   {
     "initialBytes": 5500000,     // ~5.5 MB
     "initialGzipBytes": 1450000, // ~1.45 MB gzipped
     "note": "Updated after optimization effort on YYYY-MM-DD"
   }
   ```

3. **Rationale for changes**: Always document why budgets were increased
   - New feature requirements
   - Target market changes (better connectivity)
   - Acceptable performance trade-offs

## CI Integration

The performance budget is enforced in CI via `.github/workflows/perf-budget.yml`:

- **Triggers**: PRs to main/develop, pushes to perf/*/feat/*/fix/* branches
- **Failure**: Build fails if either raw or gzipped size exceeds budget
- **Artifacts**: Uploads performance summary, manifest, and stats for analysis

## Performance Tips

- Use dynamic imports for route-level code splitting
- Avoid importing entire libraries when only small parts are needed
- Consider bundle optimization with Vite's `build.rollupOptions.output.manualChunks`
- Monitor the impact of adding new dependencies

## Next Steps

Future enhancements may include:
- Per-route bundle budgets
- Lighthouse CI integration for runtime performance metrics
- Progressive performance targets based on connection speed