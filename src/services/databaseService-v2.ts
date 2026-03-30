/**
 * @fileoverview Simplified Database Service - Performance Optimized
 * @author Senior Architect  
 * @version 2.0.0
 * 
 * Simplified, stable database service that fixes all field mapping issues
 */

import { getSupabaseClient } from '@/lib/database/core';
import { SchemaValidator } from '@/lib/database/schema';

/**
 * Simplified Database Service with proper error handling
 */
export class DatabaseServiceV2 {
  private static instance: DatabaseServiceV2;
  private client = getSupabaseClient();

  static getInstance(): DatabaseServiceV2 {
    if (!DatabaseServiceV2.instance) {
      DatabaseServiceV2.instance = new DatabaseServiceV2();
    }
    return DatabaseServiceV2.instance;
  }

  // ==================== PROFILE OPERATIONS ====================

  /**
   * Get profile by ID (using correct field: id, not user_id)
   */
  async getProfileById(id: string) {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get profile by email
   */
  async getProfileByEmail(email: string) {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('email', email);
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Create or update profile with validation
   */
  async upsertProfile(data: any) {
    const validation = SchemaValidator.validateProfile(data);
    if (!validation.valid) {
      throw new Error(`Profile validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      // Check if profile exists
      const { data: existing } = await this.client
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .single();
      
      if (existing) {
        // Update existing profile
        const { data, error } = await this.client
          .from('profiles')
          .update(data)
          .eq('id', existing.id)
          .select()
          .single();
        
        return { data, error };
      } else {
        // Create new profile
        const { data, error } = await this.client
          .from('profiles')
          .insert(data)
          .select()
          .single();
        
        return { data, error };
      }
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  // ==================== PROJECT OPERATIONS ====================

  /**
   * Get projects with correct field names
   */
  async getProjects(filters?: {
    status?: string;
    client_id?: string;
    assigned_to?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = this.client.from('projects').select('*');
      
      if (filters) {
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.client_id) query = query.eq('client_id', filters.client_id);
        if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.limit) query = query.limit(filters.limit);
        if (filters.offset) query = query.offset(filters.offset);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string) {
    try {
      const { data, error } = await this.client
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Create project with validation and correct field mapping
   */
  async createProject(data: any) {
    const validation = SchemaValidator.validateProject(data);
    if (!validation.valid) {
      throw new Error(`Project validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      // Map fields to correct database names
      const mappedData = {
        ...data,
        estimated_budget_min: data.estimated_budget_min || data.budget_min,
        estimated_budget_max: data.estimated_budget_max || data.budget_max,
      };

      // Remove incorrect field names
      delete mappedData.budget_min;
      delete mappedData.budget_max;

      const { data: result, error } = await this.client
        .from('projects')
        .insert(mappedData)
        .select()
        .single();
      
      return { data: result, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  // ==================== PROFESSIONAL OPERATIONS ====================

  /**
   * Get professional by user_id (correct field for professionals table)
   */
  async getProfessionalByUserId(userId: string) {
    try {
      const { data, error } = await this.client
        .from('professionals')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get professional by ID
   */
  async getProfessionalById(id: string) {
    try {
      const { data, error } = await this.client
        .from('professionals')
        .select('*')
        .eq('id', id)
        .single();
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  // ==================== CONVERSATION OPERATIONS ====================

  /**
   * Get conversations with correct field names (client_id, professional_id)
   */
  async getConversations(userId: string) {
    try {
      const { data, error } = await this.client
        .from('conversations')
        .select(`
          *,
          client:profiles!conversations_client_id_fkey(full_name, avatar_url),
          professional:profiles!conversations_professional_id_fkey(full_name, avatar_url)
        `)
        .or(`client_id.eq.${userId},professional_id.eq.${userId}`)
        .order('updated_at', { ascending: false });
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  // ==================== MESSAGE OPERATIONS ====================

  /**
   * Get unread messages (using read_at field, not read)
   */
  async getUnreadMessages(userId: string) {
    try {
      const { data, error } = await this.client
        .from('messages')
        .select('id')
        .eq('receiver_id', userId)
        .is('read_at', null);
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Mark messages as read (using read_at field)
   */
  async markMessagesAsRead(messageIds: string[]) {
    try {
      const { data, error } = await this.client
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds);
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  // ==================== NOTIFICATION OPERATIONS ====================

  /**
   * Create notification without read field (doesn't exist in schema)
   */
  async createNotification(data: {
    user_id: string;
    title: string;
    message: string;
    type: string;
    data?: any;
  }) {
    try {
      console.log("🔔 Creating notification:", data);
      
      // Remove read field - it doesn't exist in notifications table
      const { read, ...notificationData } = data as any;
      
      const { result, error } = await this.client
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();
      
      if (error) {
        console.error("❌ Error creating notification:", error);
        return { data: null, error };
      }
      
      console.log("✅ Notification created successfully:", result);
      return { data: result, error: null };
    } catch (err) {
      console.error("❌ Exception creating notification:", err);
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit?: number) {
    try {
      let query = this.client
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  // ==================== PROJECT INTERESTS ====================

  /**
   * Signal interest in a project
   */
  async signalInterest(data: {
    project_id: string;
    professional_id: string;
    status?: string;
  }) {
    try {
      // Check if interest already exists
      const { data: existing } = await this.client
        .from('project_interests')
        .select('id')
        .eq('project_id', data.project_id)
        .eq('professional_id', data.professional_id)
        .single();

      if (existing) {
        throw new Error('Interest already recorded for this project');
      }

      const { result, error } = await this.client
        .from('project_interests')
        .insert({
          ...data,
          status: data.status || 'interested',
        })
        .select()
        .single();
      
      return { data: result, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get project interests
   */
  async getProjectInterests(projectId: string) {
    try {
      const { data, error } = await this.client
        .from('project_interests')
        .select('*')
        .eq('project_id', projectId);
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseServiceV2.getInstance();

// Export default for easier imports
export default databaseService;
