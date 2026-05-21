import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

let _instance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  if (!_instance) {
    _instance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return _instance;
}

export const supabase = getSupabaseClient();
