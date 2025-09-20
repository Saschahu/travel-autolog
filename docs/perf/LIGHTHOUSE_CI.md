# Lighthouse CI Documentation

This document explains the Lighthouse CI setup for measuring and enforcing Core Web Vitals in the Travel AutoLog application.

## What is Measured

Lighthouse CI measures the following performance metrics:

- **Performance Score**: Overall performance score (threshold: ≥90%)
- **First Contentful Paint (FCP)**: Time when first content appears (threshold: ≤1800ms)
- **Largest Contentful Paint (LCP)**: Time when largest content loads (threshold: ≤2500ms)
- **Total Blocking Time (TBT)**: Total time main thread is blocked (threshold: ≤200ms)
- **Cumulative Layout Shift (CLS)**: Visual stability metric (threshold: ≤0.10)

## Thresholds & Responsible Tuning

Current thresholds are set conservatively for initial implementation:

| Metric | Threshold | Type |
|--------|-----------|------|
| Performance Score | ≥90% | Error |
| First Contentful Paint | ≤1800ms | Error |
| Largest Contentful Paint | ≤2500ms | Error |
| Total Blocking Time | ≤200ms | Error |
| Cumulative Layout Shift | ≤0.10 | Error |

### Tuning Guidelines

- **Start Conservative**: Begin with achievable thresholds and tighten over time
- **Monitor Trends**: Track performance over multiple PRs before making changes
- **Environment Consistency**: Ensure CI environment matches production characteristics
- **Gradual Improvement**: Improve thresholds incrementally (e.g., 5-10% at a time)

## Running Locally

To run Lighthouse CI on your local machine:

```bash
# Build the production version
pnpm build:ci

# Run Lighthouse CI
npx lhci autorun
```

This will:
1. Start a local server serving the `dist/` directory on port 4173
2. Run Lighthouse 3 times against the homepage
3. Generate results in the `lhci-results/` directory

## Debugging Failures

When Lighthouse CI fails:

1. **Check the console output** for specific metric failures
2. **Open HTML reports** in `lhci-results/*.html` for detailed analysis
3. **Review network conditions** - ensure no external dependencies are failing
4. **Verify build output** - check that `dist/` contains expected assets

### Common Issues

- **External API failures**: The app uses lazy loading to prevent Mapbox API calls on initial load
- **Bundle size**: Large JavaScript bundles can impact TBT and LCP
- **Render blocking**: CSS or JavaScript blocking the critical render path
- **Layout shifts**: Dynamic content causing unexpected shifts

## CI Integration

Lighthouse CI runs automatically on every pull request to `main` or `develop` branches. The workflow:

1. Builds the production application
2. Runs Lighthouse CI with desktop profile
3. Uploads results as GitHub Actions artifacts
4. Fails the CI if any assertion thresholds are not met

## Configuration

The configuration is stored in `lighthouserc.json`:

- **Desktop profile**: Tests desktop performance characteristics
- **3 runs**: Takes median of 3 runs for reliability
- **Static serving**: Uses `serve` to host the built application
- **Filesystem upload**: Stores results as artifacts in CI