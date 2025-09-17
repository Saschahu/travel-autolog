// Feature flags for the application

// Enable XLSX export feature
export const ENABLE_XLSX = import.meta.env.ENABLE_XLSX === 'true';

// Enable Smart GPS Tracking (Beta). Default OFF for safety.
export const ENABLE_SMART_GPS = import.meta.env.VITE_ENABLE_SMART_GPS === 'true';

export function isSmartGpsEnabled(): boolean {
  return ENABLE_SMART_GPS;
}