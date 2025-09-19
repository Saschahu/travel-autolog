/**
 * Dynamic loader for @supabase/supabase-js to prevent eager loading
 */

let supabaseModule: typeof import('@supabase/supabase-js') | null = null;

export async function loadSupabase() {
  if (!supabaseModule) {
    supabaseModule = await import('@supabase/supabase-js');
  }
  return supabaseModule;
}

export async function createSupabaseClient(url: string, key: string) {
  const module = await loadSupabase();
  return module.createClient(url, key);
}