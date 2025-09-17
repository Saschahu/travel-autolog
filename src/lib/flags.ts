// Feature flags for GPS and other experimental features

export const ENABLE_SMART_GPS: boolean = import.meta.env.VITE_ENABLE_SMART_GPS === 'true';

export function isSmartGpsEnabled(): boolean { 
  return ENABLE_SMART_GPS; 
}

export const DEBUG_GPS: boolean = import.meta.env.VITE_DEBUG_GPS === 'true';

export function isGpsDebugEnabled(): boolean {
  return DEBUG_GPS;
}