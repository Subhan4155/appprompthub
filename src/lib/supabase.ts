import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use placeholder fallback values during compilation/build if env vars are unset
const supabaseUrl = rawUrl || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder-anon-key';

if (!rawUrl || !rawKey) {
  // Graceful fallback warning
  if (typeof window !== 'undefined') {
    console.warn(
      "Supabase credentials missing. AppPromptHub is running on local mockData fallback. " +
      "Create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to connect to your database."
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const hasSupabaseCredentials = !!(rawUrl && rawKey);
