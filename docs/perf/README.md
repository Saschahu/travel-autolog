# Performance Monitoring

## Scripts

- `npm run perf:check` - Validate initial bundle size budgets
- `npm run perf:routes` - Check route-specific performance budgets  
- `npm run lhci:desktop` - Run Lighthouse CI for desktop
- `npm run lhci:mobile` - Run Lighthouse CI for mobile
- `npm run lhci:all` - Run complete Lighthouse CI suite

## Setup Required

Performance monitoring scripts require additional tooling:

```bash
npm install --save-dev scripts/check-initial-size.mjs scripts/route-budgets.mjs
npm install --save-dev @lhci/cli
```

Configure `lighthouserc.json` and `lighthouserc.mobile.json` for LHCI.