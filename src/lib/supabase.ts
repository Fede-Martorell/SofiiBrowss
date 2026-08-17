import { createClient } from '@supabase/supabase-js';

// Fallback a las credenciales del proyecto si Vite no inyecta las variables en build
const defaultUrl = 'https://jswskajxagdpcpmuirtg.supabase.co';
const defaultKey = 'sb_publishable_RVFw1S7eCKZi_jHr-pzjVg_TorbMdKj';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || defaultUrl;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  defaultKey;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);