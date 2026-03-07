import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn(
        '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Auth and data will fail. Add them to .env (and to Vercel Environment Variables for production).'
    );
}

// All app tables (including admin portal: activity_logs, documents, subscription_plans, etc.) live in schema "app".
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'app' },
});
