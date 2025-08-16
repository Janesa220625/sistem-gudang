import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Kunci dari environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Membuat dan mengekspor client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);