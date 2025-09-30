# GPS to Manual Route Input Migration

## Overview
This migration removes all GPS/Geolocation functionality and replaces it with manual start/destination address input.

## Changes Made

### 1. Removed GPS/Geolocation Code

#### Deleted Services
- `src/services/geolocation.ts` - Capacitor/browser geolocation wrapper
- `src/services/geolocationService.ts` - GPS location service
- `src/services/gpsTrackingService.ts` - GPS tracking service
- `src/services/gpsStateMachine.ts` - GPS state machine (FSM)
- `src/services/gpsSessionCalculator.ts` - Session timing calculator

#### Deleted State Management
- `src/state/trackingStore.ts` - IndexedDB tracking store

#### Deleted Libraries & Utilities
- `src/lib/geo.ts` - Geofencing logic
- `src/lib/trackingGeo.ts` - Haversine distance calculations
- `src/lib/export/geojson.ts` - GeoJSON export
- `src/lib/export/gpx.ts` - GPX export

#### Deleted Hooks
- `src/hooks/useRouteTracking.tsx` - Route tracking hook
- `src/hooks/useLocation.tsx` - Location hook
- `src/hooks/useGPSTracking.tsx` - GPS tracking hook
- `src/hooks/useSupabaseGPS.tsx` - Supabase GPS session hook

#### Deleted Components
- `src/components/gps/GPSPage.tsx` - GPS tracking page
- `src/components/gps/GPSStatus.tsx` - GPS status display
- `src/components/gps/GPSMap.tsx` - Mapbox map component
- `src/components/gps/GPSEventLog.tsx` - Event log display
- `src/components/gps/JobLinkDialog.tsx` - Job linking dialog
- `src/components/gps/GPSTrackingSettings.tsx` - GPS settings
- `src/components/location/LocationTracker.tsx` - Location tracker
- `src/components/location/LocationSettings.tsx` - Location settings
- `src/components/location/LeavingHomeDialog.tsx` - Home departure dialog
- `src/components/location/LocationMap.tsx` - Location map
- `src/components/MapView.tsx` - Map view component

#### Deleted Types
- `src/types/tracking.ts` - GPS tracking types
- `src/types/gps-events.ts` - GPS event types
- `src/types/gps.ts` - GPS settings types
- `src/gps/fsm/core.ts` - FSM core types

#### Deleted i18n
- `src/i18n/locales/de/gps.ts`
- `src/i18n/locales/en/gps.ts`
- `src/i18n/locales/nb/gps.ts`

### 2. New Manual Route Input System

#### New Types
- `src/types/trip.ts` - Manual trip input types
  - `TripInput` - User input (start, destination, date, time, vehicle)
  - `TripQuote` - Route calculation result (distance, toll costs)
  - `TripDraft` - Saved trip with quote

#### New Components
- `src/components/trip/ManualTripInput.tsx` - Manual route input form
  - Address fields with debounce (300ms)
  - Date/time pickers (defaults: today, now)
  - Vehicle type selection (Benzin, Diesel, EV, PHEV)
  - Vehicle size selection (1-4)
  - Optional vehicle length
  - Validation (start/destination required)
  - Actions: "Calculate Route" and "Save Draft"

#### New Pages
- `src/pages/TripCalculator.tsx` - Trip calculator page with alert for manual input

#### New i18n
- `src/i18n/locales/de/trip.ts` - German translations
- `src/i18n/locales/en/trip.ts` - English translations
- `src/i18n/locales/nb/trip.ts` - Norwegian translations

### 3. Feature Flag
- Added `DEFAULT_ROUTE_SOURCE: 'manual'` in `src/flags/remoteConfig.ts`
- Future: Can switch to 'gps' if GPS functionality is re-added

### 4. Configuration Changes

#### Capacitor Config
- Removed Geolocation plugin permissions from `capacitor.config.ts`

#### Dependencies Removed
- `@capacitor/geolocation` - GPS access
- `mapbox-gl` - Map rendering
- `react-map-gl` - React map wrapper

### 5. UI Changes

#### Updated Pages
- `src/pages/Index.tsx`
  - Removed "Location" tab
  - Removed GPS page reference
  - Removed `useLocation` hook usage
  - Removed home departure detection
  - Changed tabs from 3 to 2 (Dashboard, Export)

### 6. Tests
- `src/__tests__/trip/ManualTripInput.test.tsx`
  - Test 1: Renders all form fields
  - Test 2: Validates required fields (start/destination)

## Migration Checklist

- [x] Remove all GPS/geolocation code
- [x] Remove GPS-related components
- [x] Remove GPS-related hooks
- [x] Remove GPS-related types
- [x] Remove GPS-related i18n
- [x] Create new trip types
- [x] Create manual input component
- [x] Add trip i18n (de, en, nb)
- [x] Add feature flag
- [x] Remove Capacitor geolocation permissions
- [x] Remove GPS dependencies (geolocation, mapbox)
- [x] Update Index.tsx (remove location tab)
- [x] Add basic tests
- [ ] TODO: Implement route calculation (scraper integration)
- [ ] TODO: Implement draft saving to Supabase
- [ ] TODO: Android Manifest cleanup (location permissions)
- [ ] TODO: iOS Info.plist cleanup (NSLocationWhenInUseUsageDescription)

## Next Steps

1. **Scraper Integration**: Implement route calculation by calling the scraper service
2. **Draft Management**: Save trip drafts to Supabase with user association
3. **Job Linking**: Link calculated trips to jobs
4. **Android/iOS Cleanup**: 
   - Remove `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` from Android manifest
   - Remove `NSLocationWhenInUseUsageDescription` from iOS Info.plist
5. **CI/CD**: Ensure `pnpm lint` and `pnpm test:smoke` pass

## Breaking Changes

⚠️ **This is a breaking change** - All existing GPS functionality is removed:
- No more automatic route tracking
- No more geofence detection
- No more GPS session storage
- Users must manually enter routes

## Validation

All routes now require:
- ✅ Start address (required)
- ✅ Destination address (required)
- ✅ Date (default: today)
- ✅ Time (default: now)
- ✅ Vehicle type (default: Benzin)
- ✅ Vehicle size (default: 1)

## Data Model

```typescript
interface TripInput {
  fromAddress: string;
  toAddress: string;
  dateYmd: string;      // YYYY-MM-DD
  timeHm: string;       // HH:MM
  vehicle: {
    type: 'benzin' | 'diesel' | 'ev' | 'phev';
    size: 1 | 2 | 3 | 4;
    length?: string;    // optional
  };
}
```
