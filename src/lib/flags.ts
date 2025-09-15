/**
 * Feature flags configuration
 * Controls which features are enabled in the application
 */

// Enable XLSX import functionality (can be disabled for security reasons)
export const ENABLE_XLSX = import.meta.env.VITE_ENABLE_XLSX_IMPORT !== 'false';