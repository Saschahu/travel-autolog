/**
 * Dynamic Supabase loader  
 * Keeps Supabase client out of initial bundle for better performance
 */

let supabasePromise: Promise<any> | null = null;

export async function loadSupabase() {
  if (supabasePromise) {
    return supabasePromise;
  }

  supabasePromise = import('@supabase/supabase-js').then((supabaseModule) => {
    return supabaseModule;
  });

  return supabasePromise;
}
