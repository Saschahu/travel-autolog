# Per-Route Performance Budgets

This document explains how to work with per-route performance budgets in Travel AutoLog.

## Overview

Per-route budgets help ensure that each route remains lightweight and loads quickly. Heavy libraries are split into separate vendor chunks that are loaded only when needed.

## Route Structure

- **Home** (`/`): Dashboard with job management - Budget: 120KB gzipped
- **GPS** (`/gps`): GPS tracking and maps - Budget: 300KB gzipped  
- **Export** (`/export`): Report generation and export - Budget: 300KB gzipped
- **Settings** (`/settings`): User preferences and configuration - Budget: 150KB gzipped

## Route Splitting Implementation

Routes are lazy-loaded using `React.lazy()` in `src/App.tsx`:

```tsx
const Index = lazy(() => import("./pages/Index"));
const GpsPage = lazy(() => import("./pages/GpsPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
```

Heavy libraries are automatically split into vendor chunks via `vite.config.ts`:

- `vendor-mapbox`: Mapbox GL JS (maps)
- `vendor-excel`: ExcelJS (Excel export)
- `vendor-pdf`: jsPDF (PDF generation)
- `vendor-canvas`: html2canvas (screenshots)

## Working with Route Budgets

### Checking Budgets

```bash
# Check all route budgets
npm run perf:routes

# Check global bundle budget
npm run perf:check
```

### Common Issues & Solutions

#### Route Keeps Merging into Single Chunk

**Problem**: Your route still shares a chunk with another route.

**Solutions**:
1. Move heavy imports behind user actions:
   ```tsx
   // Bad: Top-level import
   import { exportToExcel } from '@/lib/excel';
   
   // Good: Dynamic import behind user action
   const handleExport = async () => {
     const { exportToExcel } = await import('@/lib/excel');
     exportToExcel(data);
   };
   ```

2. Avoid re-exporting heavy libraries from shared modules:
   ```tsx
   // Bad: Shared barrel export
   export { exportToExcel } from '@/lib/excel';
   
   // Good: Import directly where needed
   const { exportToExcel } = await import('@/lib/excel');
   ```

#### Budget Exceeded

**Solutions**:
1. Move initialization behind user interaction:
   ```tsx
   // Bad: Initialize map immediately
   useEffect(() => {
     initializeMap();
   }, []);
   
   // Good: Initialize when user clicks tab/button
   const handleShowMap = async () => {
     const { initializeMap } = await import('@/lib/map');
     initializeMap();
   };
   ```

2. Use lazy loading for heavy components:
   ```tsx
   const MapView = lazy(() => import('@/components/MapView'));
   
   <Suspense fallback={<div>Loading map...</div>}>
     <MapView />
   </Suspense>
   ```

### Example: Moving Map Behind Button

```tsx
// Before: Map loads immediately
import MapView from '@/components/MapView';

export const GpsPage = () => {
  return (
    <div>
      <h1>GPS Tracking</h1>
      <MapView />
    </div>
  );
};

// After: Map loads when user clicks button
const MapView = lazy(() => import('@/components/MapView'));

export const GpsPage = () => {
  const [showMap, setShowMap] = useState(false);
  
  return (
    <div>
      <h1>GPS Tracking</h1>
      {!showMap && (
        <Button onClick={() => setShowMap(true)}>
          Show Map
        </Button>
      )}
      {showMap && (
        <Suspense fallback={<div>Loading map...</div>}>
          <MapView />
        </Suspense>
      )}
    </div>
  );
};
```

## CI Integration

Performance budgets are enforced in CI via `.github/workflows/performance-budgets.yml`. The workflow:

1. Builds the application
2. Analyzes chunk sizes
3. Fails if any route exceeds its budget
4. Provides diagnostic information about shared chunks

## Budget Configuration

Route budgets are defined in `perf/route-budgets.json`:

```json
{
  "routes": [
    { "name": "home",    "module": "src/pages/Index.tsx",       "gzipBudget": 120000 },
    { "name": "gps",     "module": "src/pages/GpsPage.tsx",     "gzipBudget": 300000 },
    { "name": "export",  "module": "src/pages/ReportPage.tsx",  "gzipBudget": 300000 },
    { "name": "settings","module": "src/pages/SettingsPage.tsx","gzipBudget": 150000 }
  ]
}
```

Global budget is configured in `scripts/global-budget.mjs` (currently 1.5MB gzipped).