import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your-project-id') && 
    supabaseUrl !== ''
);

if (!isSupabaseConfigured) {
    console.warn(
        'SakuPintar: Supabase belum terkonfigurasi. Berjalan dalam mode LocalStorage offline.'
    );
}

export const supabase = createClient(
    isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
    isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);
