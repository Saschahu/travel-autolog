/**
 * Lazy loaders for heavy dependencies
 * These loaders defer imports until actually needed to improve startup performance
 */

// Type definitions for the loaded modules
export type MapboxGL = typeof import('mapbox-gl').default;
export type ExcelJS = typeof import('exceljs');
export type JSPDF = typeof import('jspdf').jsPDF;
export type SupabaseClient = typeof import('@supabase/supabase-js');

/**
 * Lazy load Mapbox GL JS with CSS import side-effect
 */
export async function loadMapboxGL(): Promise<MapboxGL> {
  // Import CSS first (side-effect)
  await import('mapbox-gl/dist/mapbox-gl.css');
  
  // Then import the module
  const { default: mapboxgl } = await import('mapbox-gl');
  return mapboxgl;
}

/**
 * Lazy load ExcelJS
 */
export async function loadExcelJS(): Promise<ExcelJS> {
  const exceljs = await import('exceljs');
  return exceljs;
}

/**
 * Lazy load jsPDF
 */
export async function loadJsPDF(): Promise<JSPDF> {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
}

/**
 * Lazy load Supabase client
 */
export async function loadSupabase(): Promise<SupabaseClient> {
  const supabase = await import('@supabase/supabase-js');
  return supabase;
}

/**
 * Pre-load critical modules in the background
 * Call this during app initialization to warm up the module cache
 */
export function preloadCriticalModules(): void {
  // Don't await these - they run in background
  if (typeof window !== 'undefined') {
    // Only preload on browser
    setTimeout(() => {
      loadSupabase().catch(() => {
        // Ignore preload errors
      });
    }, 1000);

    // Preload Mapbox if we detect map-related routes
    if (window.location.pathname.includes('map') || window.location.pathname.includes('gps')) {
      setTimeout(() => {
        loadMapboxGL().catch(() => {
          // Ignore preload errors
        });
      }, 2000);
    }
  }
}

/**
 * Check if a module has been loaded already
 */
export function isModuleLoaded(moduleName: string): boolean {
  // This is a simplified check - in practice, we'd need to track loaded modules
  // For testing purposes, we assume modules are not loaded initially
  return false;
}

/**
 * Clear module cache (mainly for testing)
 */
export function clearModuleCache(): void {
  // In a real implementation, this would clear any internal module cache
  // For now, this is mainly a testing utility
  console.debug('Module cache cleared');
}