// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

interface ImportMetaEnv {
  [x: string]: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

declare global {
  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,   // ⭐ Keeps user logged in forever
    persistSession: true,     // ⭐ Save session in localStorage
    detectSessionInUrl: true,
  },
});