/**
 * @fileoverview Core Database Layer - Single Point of Truth for Database Operations
 * @author Senior Architect
 * @version 1.0.0
 *
 * This file centralizes all database operations and provides a stable abstraction layer
 * to prevent performance issues and maintain consistency across the application.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Singleton instance for better performance
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get optimized Supabase client instance
 * Uses singleton pattern to prevent multiple connections
 */
export function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      // Performance optimizations
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'swipetonpro/1.0.0',
        },
      },
    });
  }

  return supabaseInstance;
}

/**
 * Type-safe database query builder
 * Prevents runtime errors and ensures consistency
 */
export class DatabaseQuery<T extends keyof Database['public']['Tables']> {
  private tableName: T;
  private client = getSupabaseClient();

  constructor(table: T) {
    this.tableName = table;
  }

  /**
   * Execute query with error handling and logging
   */
  async execute<R = Database['public']['Tables'][T]['Row']>(
    query: any
  ): Promise<{ data: R | null; error: Error | null }> {
    try {
      const { data, error } = await query;

      if (error) {
        console.error(`Database error on table ${this.tableName}:`, error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (err) {
      console.error(`Unexpected error on table ${this.tableName}:`, err);
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get all records with optional filters
   */
  async select<R = Database['public']['Tables'][T]['Row']>(
    columns?: string,
    filters?: Record<string, any>
  ) {
    let query = this.client.from(this.tableName).select(columns || '*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    return this.execute<R[]>(query);
  }

  /**
   * Get single record by ID
   */
  async findById<R = Database['public']['Tables'][T]['Row']>(id: string) {
    return this.execute<R>(
      this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id as any)
        .single()
    );
  }

  /**
   * Insert new record
   */
  async insert<I = Database['public']['Tables'][T]['Insert']>(data: I) {
    return this.execute<Database['public']['Tables'][T]['Row']>(
      this.client
        .from(this.tableName)
        .insert(data as any)
        .select()
        .single()
    );
  }

  /**
   * Update existing record
   */
  async update<U = Database['public']['Tables'][T]['Update']>(
    id: string,
    data: U
  ) {
    return this.execute<Database['public']['Tables'][T]['Row']>(
      this.client
        .from(this.tableName)
        .update(data as any)
        .eq('id', id as any)
        .select()
        .single()
    );
  }

  /**
   * Delete record
   */
  async delete(id: string) {
    return this.execute(
      this.client
        .from(this.tableName)
        .delete()
        .eq('id', id as any)
    );
  }
}

/**
 * Factory function for creating typed queries
 */
export function createQuery<T extends keyof Database['public']['Tables']>(
  table: T
) {
  return new DatabaseQuery(table);
}

/**
 * Common table queries with proper typing
 */
export const db = {
  profiles: createQuery('profiles'),
  projects: createQuery('projects'),
  professionals: createQuery('professionals'),
  conversations: createQuery('conversations'),
  messages: createQuery('messages'),
  notifications: createQuery('notifications'),
  project_interests: createQuery('project_interests'),
  reviews: createQuery('reviews'),
  bids: createQuery('bids'),
} as const;

/**
 * Database health check
 */
export async function checkDatabaseHealth() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('profiles')
      .select('count')
      .limit(1);

    return {
      healthy: !error,
      error: error?.message || null,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      healthy: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    };
  }
}
