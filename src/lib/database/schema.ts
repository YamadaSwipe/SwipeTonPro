/**
 * @fileoverview Database Schema Validation and Type Definitions
 * @author Senior Architect
 * @version 1.0.0
 * 
 * Centralized schema definitions to prevent runtime errors and ensure consistency
 */

import type { Database } from '@/integrations/supabase/types';

/**
 * Valid table names - prevents typos and ensures consistency
 */
export const VALID_TABLES = [
  'profiles',
  'projects', 
  'professionals',
  'conversations',
  'messages',
  'notifications',
  'project_interests',
  'reviews',
  'bids',
  'subscription_plans',
  'lead_packs',
  'user_subscriptions',
  'user_credits',
] as const;

export type ValidTable = typeof VALID_TABLES[number];

/**
 * Field mappings to prevent column name errors
 */
export const FIELD_MAPPINGS = {
  profiles: {
    id: 'id', // Primary key, not user_id
    email: 'email',
    full_name: 'full_name',
    avatar_url: 'avatar_url',
    phone: 'phone',
    role: 'role',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  projects: {
    id: 'id',
    title: 'title',
    description: 'description',
    category: 'category',
    work_type: 'work_type',
    city: 'city',
    postal_code: 'postal_code',
    estimated_budget_min: 'estimated_budget_min', // Correct field names
    estimated_budget_max: 'estimated_budget_max',
    urgency: 'urgency',
    status: 'status',
    client_id: 'client_id',
    assigned_to: 'assigned_to',
    photos: 'photos',
    ai_analysis: 'ai_analysis',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  professionals: {
    id: 'id',
    user_id: 'user_id', // Uses user_id as foreign key
    company_name: 'company_name',
    description: 'description',
    specialties: 'specialties',
    experience_years: 'experience_years',
    rating: 'rating',
    verified: 'verified',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  conversations: {
    id: 'id',
    project_id: 'project_id',
    client_id: 'client_id', // Uses client_id, not participant1_id
    professional_id: 'professional_id', // Uses professional_id, not participant2_id
    status: 'status',
    phase: 'phase',
    last_message_at: 'last_message_at',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  messages: {
    id: 'id',
    conversation_id: 'conversation_id',
    sender_id: 'sender_id',
    receiver_id: 'receiver_id',
    content: 'content',
    file_attachments: 'file_attachments',
    read_at: 'read_at', // Uses read_at, not read
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  notifications: {
    id: 'id',
    user_id: 'user_id',
    title: 'title',
    message: 'message',
    type: 'type',
    data: 'data',
    // Note: No 'read' field - notifications are read/unread based on UI state
    created_at: 'created_at',
  },
  project_interests: {
    id: 'id',
    project_id: 'project_id',
    professional_id: 'professional_id',
    status: 'status',
    created_at: 'created_at',
  },
} as const;

/**
 * Status enums to prevent invalid values
 */
export const VALID_STATUSES = {
  projects: ['draft', 'published', 'in_progress', 'completed', 'cancelled'] as const,
  conversations: ['anonymous', 'identified', 'active', 'archived'] as const,
  interests: ['interested', 'not_interested', 'maybe'] as const,
  notifications: ['info', 'success', 'warning', 'error'] as const,
} as const;

/**
 * Type-safe field validator
 */
export function validateField(
  table: ValidTable,
  field: string
): boolean {
  const mapping = (FIELD_MAPPINGS as any)[table];
  return mapping && field in mapping;
}

/**
 * Schema validation helpers
 */
export class SchemaValidator {
  /**
   * Validate project data before database operations
   */
  static validateProject(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.title?.trim()) errors.push('Title is required');
    if (!data.description?.trim()) errors.push('Description is required');
    if (!data.category?.trim()) errors.push('Category is required');
    if (!data.city?.trim()) errors.push('City is required');
    
    // Validate budget fields
    if (data.estimated_budget_min && typeof data.estimated_budget_min !== 'number') {
      errors.push('Budget minimum must be a number');
    }
    if (data.estimated_budget_max && typeof data.estimated_budget_max !== 'number') {
      errors.push('Budget maximum must be a number');
    }
    if (data.estimated_budget_min && data.estimated_budget_max && 
        data.estimated_budget_min > data.estimated_budget_max) {
      errors.push('Budget minimum cannot be greater than maximum');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate profile data
   */
  static validateProfile(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.full_name?.trim()) errors.push('Full name is required');
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate conversation data
   */
  static validateConversation(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.project_id?.trim()) errors.push('Project ID is required');
    if (!data.client_id?.trim()) errors.push('Client ID is required');
    if (!data.professional_id?.trim()) errors.push('Professional ID is required');
    
    return { valid: errors.length === 0, errors };
  }
}

/**
 * Database query builder with schema validation
 */
export class ValidatedQuery {
  private table: ValidTable;
  private fields: any;

  constructor(table: ValidTable) {
    this.table = table;
    this.fields = (FIELD_MAPPINGS as any)[table];
  }

  /**
   * Get safe field name
   */
  getField(field: string): string {
    if (!validateField(this.table, field)) {
      console.warn(`Invalid field "${field}" for table "${this.table}"`);
      return field;
    }
    return this.fields[field];
  }

  /**
   * Build safe query filters
   */
  buildFilters(filters: Record<string, any>): Record<string, any> {
    const safeFilters: Record<string, any> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const safeField = this.getField(key);
        safeFilters[safeField] = value;
      }
    });
    
    return safeFilters;
  }
}
