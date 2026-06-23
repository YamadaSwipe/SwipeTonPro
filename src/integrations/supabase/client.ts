import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Custom storage adapter to read from cookies
const cookieStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === key) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=63072000; SameSite=Lax`;
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    document.cookie = `${key}=; path=/; max-age=0`;
  },
};

let _instance: ReturnType<typeof createBrowserClient<any>> | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return {} as any;
  }

  if (!_instance) {
    _instance = createBrowserClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: cookieStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return _instance;
}

export const supabase = getSupabaseClient();
