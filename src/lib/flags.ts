/**
 * Feature flags for the application
 */

/**
 * Check if smart GPS feature is enabled via environment variable
 * @returns {boolean} true if VITE_ENABLE_SMART_GPS is set to 'true', false otherwise
 */
export function isSmartGpsEnabled(): boolean {
  const flag = import.meta.env.VITE_ENABLE_SMART_GPS;
  return flag === 'true';
}