# Testing Strategy

## Scripts

- `npm test` - Run test suite  
- `npm run coverage` - Generate coverage reports

## Setup Required

Testing infrastructure requires Vitest configuration:

```bash
npm install --save-dev vitest @vitest/coverage-v8
```

Create `vitest.config.ts` and add test files in `src/**/*.test.ts`.