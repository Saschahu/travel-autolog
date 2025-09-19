# E2E Testing with Playwright

This document describes the Playwright E2E testing setup for Travel AutoLog.

## Overview

The E2E test suite covers three core workflows:
- Authentication and session management
- GPS/Map functionality with lazy loading
- Export workflows (Excel/PDF)

## Setup and Configuration

### Prerequisites
- Node.js 18+
- Playwright browsers (chromium, webkit)

### Installation
```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium webkit
```

### Configuration
The Playwright configuration is in `playwright.config.ts`:
- **Browsers**: Chromium and WebKit (headless)
- **Viewport**: 1280x800
- **Base URL**: http://localhost:4173 (built app served via serve)
- **Web Server**: Automatically builds and serves the app before tests

## Running Tests

### Local Development
```bash
# Run all E2E tests
npm run e2e

# Run with UI mode for debugging
npm run e2e:ui

# Run specific test file
npx playwright test e2e/auth-session.spec.ts

# Run with headed browsers (for debugging)
npx playwright test --headed
```

### Build and Serve Setup
Tests run against the production build:
```bash
npm run build
npx serve -s dist -l 4173
```

## Test Files

### e2e/auth-session.spec.ts
Tests authentication flows and session management:
- Guest state verification (redirect to /auth)
- Authenticated state (shows app shell)
- Auth state transitions
- Form interaction without real submission

**Mocking Strategy**:
- Supabase auth endpoints mocked to return controlled responses
- localStorage mocked for session persistence
- No real authentication requests made

### e2e/gps-map-shell.spec.ts
Tests GPS and mapping functionality:
- Navigation to GPS/Map section
- Lazy loading verification for Mapbox components
- Map initialization and container rendering
- GPS settings interaction

**Mocking Strategy**:
- Mapbox API requests intercepted and mocked
- Geolocation API mocked with test coordinates
- Map tiles and style requests return minimal payloads
- Dynamic imports tracked to verify lazy loading

### e2e/export-workflows.spec.ts
Tests data export functionality:
- Excel export workflow with mock data
- PDF export using jsPDF
- Export with filtered data
- File download simulation and error handling

**Mocking Strategy**:
- ExcelJS and jsPDF libraries mocked
- File download triggers intercepted
- Export functions return mock success/error states
- No real files created or downloaded

## Network Mocking Strategy

All external network requests are blocked and mocked:

### Supabase Requests
```javascript
await page.route('**/*supabase*/**', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: null, error: null })
  });
});
```

### Mapbox Requests
```javascript
await page.route('**/*mapbox*/**', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ version: 8, sources: {}, layers: [] })
  });
});
```

### Library Mocking
External libraries are mocked via page scripts:
```javascript
await page.addInitScript(() => {
  window.mapboxgl = { /* mock implementation */ };
  window.jsPDF = class MockJsPDF { /* mock methods */ };
});
```

## Test Data Contracts

### Authentication Mock Data
```json
{
  "session": {
    "access_token": "mock-token",
    "user": {
      "id": "mock-user-id",
      "email": "test@example.com"
    }
  }
}
```

### GPS Mock Data
```json
{
  "coords": {
    "latitude": 47.3769,
    "longitude": 8.5417,
    "accuracy": 10
  }
}
```

### Job/Export Mock Data
```json
{
  "id": "1",
  "customerName": "Test Customer",
  "description": "Test Job",
  "status": "completed",
  "startTime": "2023-01-01T00:00:00.000Z",
  "endTime": "2023-01-01T08:00:00.000Z"
}
```

## Debugging

### Screenshots and Videos
- Screenshots taken on failure automatically
- Videos available in headed mode

### Trace Viewer
```bash
# Generate traces on failure
npx playwright test --trace on-first-retry

# View traces
npx playwright show-trace trace.zip
```

### Debug Mode
```bash
# Run in debug mode
npx playwright test --debug

# Debug specific test
npx playwright test e2e/auth-session.spec.ts --debug
```

### Browser Developer Tools
```bash
# Run with browser dev tools
npx playwright test --headed --slowMo=1000
```

## CI Integration

Tests run in CI with:
- Chromium and WebKit browsers
- Headless mode
- Artifacts uploaded on failure (reports, traces, screenshots)
- Coverage reports combined with unit tests

## Troubleshooting

### Common Issues

1. **Timeout errors**: Increase timeout in test or add explicit waits
2. **Element not found**: Use more flexible selectors or wait for content
3. **Network requests failing**: Check route mocking patterns
4. **Flaky tests**: Add proper waits and make tests more deterministic

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Reset state between tests
3. **Mocking**: Mock external dependencies consistently
4. **Selectors**: Use stable selectors (data-testid preferred)
5. **Waits**: Use explicit waits instead of hard timeouts

## Future Enhancements

- Add mobile viewport testing
- Extend coverage to more user workflows
- Add visual regression testing
- Performance testing integration
- Cross-browser testing (Firefox, Safari)