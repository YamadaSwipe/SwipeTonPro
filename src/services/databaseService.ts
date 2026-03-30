/**
 * @fileoverview Centralized Database Service - Single Source of Truth
 * @author Senior Architect  
 * @version 1.0.0
 * 
 * This service replaces all direct Supabase imports and provides
 * a stable, performant, and type-safe database layer.
 */

import { db, checkDatabaseHealth } from '@/lib/database/core';
import { SchemaValidator, FIELD_MAPPINGS, VALID_STATUSES } from '@/lib/database/schema';
import type { Database } from '@/integrations/supabase/types';

/**
 * Database Service - Centralized API for all database operations
 * Replaces scattered Supabase imports throughout the application
 */
export class DatabaseService {
  private static instance: DatabaseService;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Health check for database connectivity
   */
  async checkHealth() {
    return await checkDatabaseHealth();
  }

  // ==================== PROFILE OPERATIONS ====================

  /**
   * Get profile by ID (using correct field: id, not user_id)
   */
  async getProfileById(id: string) {
    return await db.profiles.findById(id);
  }

  /**
   * Get profile by email
   */
  async getProfileByEmail(email: string) {
    return await db.profiles.select('*', { email });
  }

  /**
   * Create or update profile with validation
   */
  async upsertProfile(data: Database['public']['Tables']['profiles']['Insert']) {
    const validation = SchemaValidator.validateProfile(data);
    if (!validation.valid) {
      throw new Error(`Profile validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if profile exists
    const existing = await db.profiles.select('*', { email: data.email });
    
    if (existing.data && existing.data.length > 0) {
      // Update existing profile
      return await db.profiles.update(existing.data[0].id, data);
    } else {
      // Create new profile
      return await db.profiles.insert(data);
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
    let query = db.profiles.select('*');
    
    if (filters) {
      const safeFilters = {
        ...(filters.status && { status: filters.status }),
        ...(filters.client_id && { client_id: filters.client_id }),
        ...(filters.assigned_to && { assigned_to: filters.assigned_to }),
        ...(filters.category && { category: filters.category }),
      };
      
      query = db.projects.select('*', safeFilters);
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.offset(filters.offset);
      }
    }

    return query;
  }

  /**
   * Get project with correct budget fields
   */
  async getProjectById(id: string) {
    return await db.projects.findById(id);
  }

  /**
   * Create project with validation and correct field mapping
   */
  async createProject(data: any) {
    const validation = SchemaValidator.validateProject(data);
    if (!validation.valid) {
      throw new Error(`Project validation failed: ${validation.errors.join(', ')}`);
    }

    // Map fields to correct database names
    const mappedData = {
      ...data,
      estimated_budget_min: data.estimated_budget_min || data.budget_min,
      estimated_budget_max: data.estimated_budget_max || data.budget_max,
      // Remove incorrect field names
      budget_min: undefined,
      budget_max: undefined,
    };

    return await db.projects.insert(mappedData);
  }

  /**
   * Update project with field validation
   */
  async updateProject(id: string, data: any) {
    // Map budget fields if needed
    const mappedData = {
      ...data,
      estimated_budget_min: data.estimated_budget_min || data.budget_min,
      estimated_budget_max: data.estimated_budget_max || data.budget_max,
    };

    return await db.projects.update(id, mappedData);
  }

  // ==================== PROFESSIONAL OPERATIONS ====================

  /**
   * Get professional by user_id (correct field for professionals table)
   */
  async getProfessionalByUserId(userId: string) {
    return await db.professionals.select('*', { user_id: userId });
  }

  /**
   * Get professional by ID
   */
  async getProfessionalById(id: string) {
    return await db.professionals.findById(id);
  }

  /**
   * Create or update professional profile
   */
  async upsertProfessional(data: Database['public']['Tables']['professionals']['Insert']) {
    // Check if professional exists
    const existing = await db.professionals.select('*', { user_id: data.user_id });
    
    if (existing.data && existing.data.length > 0) {
      // Update existing professional
      return await db.professionals.update(existing.data[0].id, data);
    } else {
      // Create new professional
      return await db.professionals.insert(data);
    }
  }

  // ==================== CONVERSATION OPERATIONS ====================

  /**
   * Get conversations with correct field names (client_id, professional_id)
   */
  async getConversations(userId: string) {
    // Use correct field names: client_id and professional_id
    return await db.conversations.select(`
      *,
      client:profiles!conversations_client_id_fkey(full_name, avatar_url),
      professional:profiles!conversations_professional_id_fkey(full_name, avatar_url),
      messages(count)
    `, {
      or: `client_id.eq.${userId},professional_id.eq.${userId}`
    });
  }

  /**
   * Create conversation with correct field validation
   */
  async createConversation(data: any) {
    const validation = SchemaValidator.validateConversation(data);
    if (!validation.valid) {
      throw new Error(`Conversation validation failed: ${validation.errors.join(', ')}`);
    }

    return await db.conversations.insert(data);
  }

  // ==================== MESSAGE OPERATIONS ====================

  /**
   * Get messages with correct read field (read_at, not read)
   */
  async getUnreadMessages(userId: string) {
    return await db.messages.select('id', {
      receiver_id: userId,
      read_at: 'null', // Correct way to check for null values
    });
  }

  /**
   * Mark messages as read (using read_at field)
   */
  async markMessagesAsRead(messageIds: string[]) {
    const client = db['messages']['client'];
    return await client
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds);
  }

  /**
   * Send message with proper field mapping
   */
  async sendMessage(data: {
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    file_attachments?: any[];
  }) {
    return await db.messages.insert(data);
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
    // Remove read field - it doesn't exist in notifications table
    const { read, ...notificationData } = data as any;
    
    return await db.notifications.insert(notificationData);
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit?: number) {
    let query = db.notifications.select('*', { user_id: userId });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
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
    // Check if interest already exists
    const existing = await db.project_interests.select('*', {
      project_id: data.project_id,
      professional_id: data.professional_id,
    });

    if (existing.data && existing.data.length > 0) {
      throw new Error('Interest already recorded for this project');
    }

    return await db.project_interests.insert({
      ...data,
      status: data.status || 'interested',
    });
  }

  /**
   * Get project interests
   */
  async getProjectInterests(projectId: string) {
    return await db.project_interests.select('*', { project_id: projectId });
  }

  /**
   * Get professional interests
   */
  async getProfessionalInterests(professionalId: string) {
    return await db.project_interests.select('*', { professional_id: professionalId });
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();

// Export default for easier imports
export default databaseService;
