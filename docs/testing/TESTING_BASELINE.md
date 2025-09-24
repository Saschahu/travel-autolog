# Testing Baseline

This document outlines the testing infrastructure and guidelines for the Travel AutoLog project.

## Overview

Our testing setup uses:
- **Vitest** - Fast unit test runner
- **React Testing Library** - React component testing utilities  
- **MSW (Mock Service Worker)** - API mocking
- **jsdom** - Browser environment simulation
- **@vitest/coverage-v8** - Coverage reporting

## Running Tests

### Locally

```bash
# Run all tests once
npm run test

# Run tests in watch mode with UI
npm run test:ui

# Generate coverage report
npm run coverage
```

### CI

Tests run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

Coverage reports are uploaded as artifacts for PRs.

## Test Structure

```
src/
├── security/__tests__/
│   ├── tokenStorage.test.ts
│   └── htmlSanitizer.test.ts
├── lib/__tests__/
│   ├── excelAdapter.test.ts
│   └── loaders.test.ts
└── pages/__tests__/
    └── AppShell.test.tsx

test/
├── setup.ts                    # Global test setup
├── mocks/
│   └── server.ts              # MSW server setup
└── policies/
    └── dangerousInnerHTML.test.ts  # Security policy enforcement
```

## MSW Strategy

We use Mock Service Worker to stub external APIs:

- **Supabase**: Session probes, auth endpoints
- **Mapbox**: Tile requests, style sheets
- **Generic fallback**: 404 for unmocked requests

This ensures:
- Tests are hermetic (no network calls)
- Fast test execution
- Consistent test environment

## Coverage Thresholds

Current minimum coverage requirements:
- **Lines**: 60%
- **Branches**: 50% 
- **Functions**: 60%
- **Statements**: 60%

### Raising Thresholds

To increase coverage thresholds:

1. Update `vite.config.ts`:
   ```typescript
   test: {
     coverage: {
       thresholds: {
         lines: 70,     // Increase gradually
         branches: 60,
         functions: 70,
         statements: 70
       }
     }
   }
   ```

2. Ensure tests pass with new thresholds before committing

## Adding New Tests

### Unit Tests

For utility functions and business logic:

```typescript
// src/lib/__tests__/myUtility.test.ts
import { describe, it, expect } from 'vitest';
import { myUtility } from '../myUtility';

describe('myUtility', () => {
  it('should handle expected input', () => {
    expect(myUtility('input')).toBe('expected');
  });
});
```

### Component Tests

For React components:

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

it('should render correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});
```

### Integration Tests

For testing multiple modules together:

```typescript
import { vi } from 'vitest';

// Mock heavy dependencies
vi.mock('mapbox-gl', () => ({ /* mock */ }));

// Test integrated behavior
it('should integrate modules correctly', async () => {
  // Test implementation
});
```

## Best Practices

### Performance
- Mock heavy libraries (Mapbox, ExcelJS, jsPDF) in tests
- Use `vi.mock()` to prevent actual imports
- Keep tests fast (< 100ms per test ideally)

### Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Mock external dependencies consistently

### Security
- Test sanitization functions thoroughly
- Verify XSS prevention measures
- Use policy tests to enforce security standards

### Maintenance
- Update mocks when APIs change
- Review test coverage regularly
- Remove obsolete tests when refactoring

## Troubleshooting

### Common Issues

**Tests timeout**: Usually caused by unmocked async operations
- Check MSW handlers cover all API calls
- Mock heavy library imports

**Coverage below threshold**: 
- Add tests for uncovered branches
- Consider if 100% coverage is necessary for all code

**Flaky tests**:
- Usually caused by timing issues or shared state
- Use `await waitFor()` for async operations
- Ensure proper cleanup in `afterEach`

### Debug Mode

```bash
# Run specific test file
npm run test -- tokenStorage.test.ts

# Run with verbose output
npm run test -- --reporter=verbose

# Run in watch mode for development
npm run test:ui
```

## Future Enhancements

- Add Playwright E2E tests for critical user flows
- Per-route performance budgets
- Visual regression testing
- A11y testing automation
- Mutation testing for test quality assessment