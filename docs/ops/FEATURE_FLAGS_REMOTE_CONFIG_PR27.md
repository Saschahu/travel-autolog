# Feature Flags & Remote Config System (PR27)

**Date:** 2024-09-20  
**Status:** Implemented  
**Version:** 1.0

## Overview

This document describes the implementation of a privacy-safe feature flag and remote configuration system for the Travel AutoLog application. The system enables controlled feature rollouts, A/B testing, and dynamic configuration without compromising user privacy.

## Architecture

### Core Components

#### 1. **Flag Registry (`src/flags/flags.ts`)**
- Centralized registry of all feature flags
- Type-safe flag definitions with metadata
- Triple fallback storage system (IndexedDB → Capacitor Preferences → localStorage)
- Local override system for development and user customization

#### 2. **Remote Config (`src/flags/remoteConfig.ts`)**
- Privacy-safe remote configuration fetching
- Schema validation and security checks
- Caching with staleness detection
- Graceful error handling and offline support

#### 3. **App Integration (`src/boot/flagsBoot.ts`)**
- Automatic initialization during app startup
- Opportunistic remote config fetching
- Respects network status and caching policies

#### 4. **Settings UI (`src/components/settings/FeatureFlagsPanel.tsx`)**
- User-friendly interface for flag management
- Real-time toggle controls
- Server sync functionality
- Source indication (default/remote/local)

### Initial Flag Registry

The system launches with 5 carefully chosen flags:

```typescript
{
  'gps.enhancedTelemetry': {
    default: false,
    description: 'Enable enhanced GPS telemetry collection'
  },
  'ui.experimentalPdf': {
    default: false,
    description: 'Enable experimental PDF generation features'
  },
  'perf.deferHeavyImports': {
    default: true,
    description: 'Defer heavy module imports for better performance'
  },
  'security.strictCSP': {
    default: true,
    description: 'Enable strict Content Security Policy'
  },
  'export.excelV2': {
    default: false,
    description: 'Use new Excel export engine (v2)'
  }
}
```

## Privacy Model

### Zero-Identifier Approach
- **No user IDs, no device IDs, no cookies**
- **No authentication required** for config endpoint
- **Pure public JSON** - anyone can access the same config
- **No telemetry consent interaction** - system doesn't collect or send any user data

### Data Flow
```
1. App starts → Load cached flags from local storage
2. Check if remote config is stale (default: 24 hours)
3. If stale and online → Fetch public config JSON
4. Validate and merge with local cache
5. Local overrides always win
```

### Security Measures
- Content Security Policy integration
- Schema validation prevents malicious payloads
- Unknown flags are ignored
- Type checking ensures data integrity
- No eval() or dynamic script execution

## Configuration

### Remote Configuration Setup

#### 1. **Environment Variable**
```bash
# .env or deployment environment
VITE_CONFIG_URL=https://your-cdn.com/travel-autolog/config.json
```

#### 2. **Content Security Policy**
If using remote config, add the origin to your CSP:
```html
<meta http-equiv="Content-Security-Policy" 
      content="connect-src 'self' https://your-cdn.com">
```

#### 3. **Example Config JSON**
```json
{
  "version": "1.0",
  "timestamp": 1640995200000,
  "flags": {
    "gps.enhancedTelemetry": false,
    "ui.experimentalPdf": true,
    "perf.deferHeavyImports": true,
    "security.strictCSP": true,
    "export.excelV2": false
  }
}
```

### Configuration Validation
- Only known flag keys are accepted
- Type validation ensures boolean/number/string consistency
- Unknown properties are logged and ignored
- Malicious content (scripts, HTML) is rejected

## Operational Playbook

### Adding a New Flag

#### 1. **Update Registry**
```typescript
// src/flags/flags.ts
export const FLAG_REGISTRY: Record<FlagKey, FlagDef> = {
  // ... existing flags
  'feature.newAwesomeThing': {
    key: 'feature.newAwesomeThing',
    default: false,
    description: 'Enable the new awesome feature',
    since: '2024-09-20'
  }
};
```

#### 2. **Use in Code**
```typescript
import { getFlag } from '@/flags/flags';

function MyComponent() {
  const isAwesome = getFlag('feature.newAwesomeThing');
  
  if (isAwesome) {
    return <AwesomeNewFeature />;
  }
  return <OldBoringFeature />;
}
```

#### 3. **CI Validation**
The GitHub Action automatically validates:
- All flags used in code exist in registry
- No unused registry entries (warning only)
- No dangerous content in descriptions

### Rollout Strategy

#### Phase 1: Default Off (Development)
```json
{
  "flags": {
    "feature.newAwesomeThing": false
  }
}
```

#### Phase 2: Gradual Rollout
Since we don't use user IDs, gradual rollout is done via time-based or manual toggles:
```json
{
  "flags": {
    "feature.newAwesomeThing": true  // 100% rollout
  }
}
```

#### Phase 3: Full Release
Update default in registry to `true` and remove from remote config.

### Rollback Procedure

#### Emergency Rollback
```json
{
  "flags": {
    "feature.problematicThing": false
  }
}
```
Changes take effect within 24 hours (or when users refresh manually).

#### Immediate Rollback
For critical issues, consider:
1. Update remote config
2. Coordinate user communication to refresh settings
3. Or deploy a new app version with updated defaults

### Monitoring and Debugging

#### Local Development
```bash
# Test with local config
export VITE_CONFIG_URL=http://localhost:3000/config.json

# Or use the example config
export VITE_CONFIG_URL=/config.example.json
```

#### Production Monitoring
- Monitor CDN logs for config fetch patterns
- Watch for 404s or parsing errors in app logs
- Track flag usage via existing analytics (no new tracking needed)

## CI Guard System

### Validation Script (`scripts/validate-flags.cjs`)
Automatically runs on every PR and checks:

1. **Registry Consistency**
   - All flags used in code exist in registry
   - Type safety and completeness

2. **Security Validation**
   - No `dangerouslySetInnerHTML` in descriptions
   - No script injection attempts
   - No eval() or similar dangerous patterns

3. **Code Quality**
   - Warns about unused registry entries
   - Ensures proper flag naming conventions

### GitHub Workflow (`.github/workflows/flags-lint.yml`)
```yaml
name: Feature Flags Validation
on: [pull_request, push]
jobs:
  validate-flags:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm ci
    - run: node scripts/validate-flags.cjs
```

## API Reference

### Core Functions

#### `getFlag(key: FlagKey): FlagValue`
Retrieves the current value of a flag, respecting the priority order:
1. Local override
2. Remote config value
3. Registry default

#### `setLocalOverride(key: FlagKey, value: FlagValue): void`
Sets a local override for a flag. Useful for development and user preferences.

#### `clearLocalOverride(key: FlagKey): void`
Removes a local override, falling back to remote/default value.

#### `getAllFlags(): Record<FlagKey, FlagValue>`
Returns all flags with their current effective values.

#### `getFlagSource(key: FlagKey): 'default' | 'remote' | 'local'`
Indicates where the current flag value comes from.

#### `subscribe(listener: (flags: Record<FlagKey, FlagValue>) => void): () => void`
Subscribe to flag changes. Returns unsubscribe function.

### Remote Config Functions

#### `fetchRemoteConfig(): Promise<boolean>`
Manually fetch remote configuration. Returns true if successful.

#### `isStale(maxAgeMs?: number): boolean`
Check if cached remote config is stale. Default: 24 hours.

## Storage Architecture

### Triple Fallback System
1. **IndexedDB** (primary)
   - Persistent across sessions
   - Large storage capacity
   - Structured data support

2. **Capacitor Preferences** (mobile fallback)
   - Native mobile storage
   - Secure and persistent
   - Cross-platform compatibility

3. **localStorage** (web fallback)
   - Universal browser support
   - Simple key-value storage
   - Always available

### Storage Keys
```typescript
// IndexedDB
'config.flags' -> { flags: {...}, updatedAt: number }

// Capacitor Preferences  
'flags_gps.enhancedTelemetry' -> "true"

// localStorage
'travel_flags_gps.enhancedTelemetry' -> "true"
'travel_flags_last_fetch' -> "1640995200000"
```

## Performance Considerations

### Bundle Size Impact
- Core flags module: ~3KB gzipped
- Remote config module: ~1KB gzipped
- UI components: ~2KB gzipped
- **Total overhead: ~6KB gzipped**

### Runtime Performance
- Flag lookups are O(1) Map operations
- Local overrides are kept in memory
- Storage operations are async and non-blocking
- Startup impact: ~5ms for cache loading

### Network Impact
- Remote config fetched at most once per 24 hours
- Typical config size: <1KB
- Uses CDN caching headers
- No impact on page load (async fetch)

## Limitations & Future Enhancements

### Current Limitations
1. **No percentage-based rollouts** - All users get same config
2. **No user segmentation** - Privacy-first approach prevents targeting
3. **No real-time updates** - Changes require cache refresh
4. **No server-side targeting** - All logic is client-side

### Potential Future Enhancements
1. **Percentage Rollouts**
   - Use deterministic hash of device timestamp
   - Enable gradual rollouts without user tracking

2. **Geographic Targeting**
   - Use timezone or browser language
   - Privacy-safe location-based features

3. **A/B Testing Framework**
   - Structured experiment definitions
   - Statistical significance tracking

4. **Real-time Updates**
   - WebSocket or Server-Sent Events
   - Push notifications for critical flags

5. **Advanced Validation**
   - JSON Schema validation
   - Flag dependency checking
   - Automated testing integration

## Migration Guide

### From Manual Feature Toggles
```typescript
// Before
const EXPERIMENTAL_PDF = true;

// After
import { getFlag } from '@/flags/flags';
const experimentalPdf = getFlag('ui.experimentalPdf');
```

### From Environment Variables
```typescript
// Before
const STRICT_CSP = process.env.VITE_STRICT_CSP === 'true';

// After
import { getFlag } from '@/flags/flags';
const strictCSP = getFlag('security.strictCSP');
```

## Testing Strategy

### Unit Tests
- Flag registry validation
- Storage fallback behavior
- Remote config parsing
- Error handling scenarios

### Integration Tests
- End-to-end flag lifecycle
- UI component behavior
- Cache invalidation logic

### Manual Testing
```bash
# Test remote config
npm run dev
# Navigate to Settings → Experiments
# Toggle flags and verify behavior
```

## Security Considerations

### Threat Model
- **Malicious config injection**: Prevented by schema validation
- **XSS via flag values**: Type checking prevents script injection
- **Privacy leakage**: Zero-identifier design eliminates tracking
- **Supply chain attacks**: CI validation prevents malicious flags

### Security Best Practices
1. Always validate remote config schema
2. Never use flag values in eval() or similar
3. Keep CSP strict when using remote config
4. Monitor config endpoint for suspicious activity
5. Use HTTPS for all remote config URLs

## Conclusion

The Feature Flags & Remote Config system provides a robust, privacy-safe foundation for controlled feature rollouts in Travel AutoLog. The system balances functionality with simplicity, ensuring that new features can be deployed safely while maintaining the application's commitment to user privacy.

The implementation is production-ready with comprehensive error handling, offline support, and developer-friendly tooling. The CI validation system prevents common mistakes, while the triple-fallback storage ensures reliability across all platforms.

---

**Next Steps:**
1. Monitor system performance in production
2. Gather developer feedback on API ergonomics  
3. Consider advanced features based on usage patterns
4. Expand flag registry as new features are developed