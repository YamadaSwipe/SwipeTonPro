import { supabase } from '@/integrations/supabase/client';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'support'
  | 'moderator'
  | 'team'
  | 'professionnel'
  | 'particulier';

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  company_name?: string;
}

interface CreateProjectData {
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  postal_code: string;
  work_type?: string[];
  budget_min?: number;
  budget_max?: number;
  urgency?: string;
  property_type?: string;
  created_on_behalf_of_user_id?: string;
  validate_immediately?: boolean;
}

export const adminService = {
  /**
   * Create a user (API call, backend-only function)
   */
  async createUser(
    userData: CreateUserData
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return { success: true, userId: data.userId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Create a project (API call, backend-only function)
   */
  async createProject(
    projectData: CreateProjectData
  ): Promise<{ success: boolean; projectId?: string; error?: string }> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('/api/admin/manage-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return { success: true, projectId: data.project?.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Validate a project
   */
  async validateProject(
    projectId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('/api/admin/manage-projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          action: 'validate',
          validation_notes: notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Reject a project
   */
  async rejectProject(
    projectId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('/api/admin/manage-projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          action: 'reject',
          validation_notes: reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all staff members with their roles and permissions
   */
  async getStaffMembers(): Promise<{
    data: any[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select(
          `
          id, 
          email, 
          full_name, 
          phone, 
          role, 
          created_at, 
          updated_at
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      // Filter for staff roles
      const staffData = (data || []).filter((user: any) =>
        ['super_admin', 'admin', 'support', 'moderator', 'team'].includes(
          user.role
        )
      );

      return { data: staffData, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get projects pending validation
   */
  async getPendingProjects(): Promise<{
    data: any[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      // Filter for pending validation
      const pendingData = (data || []).filter(
        (project: any) => project.validation_status === 'pending'
      );

      return { data: pendingData, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get validated projects created by admin
   */
  async getAdminCreatedProjects(): Promise<{
    data: any[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      // Filter for admin-created projects
      const adminData = (data || []).filter(
        (project: any) => project.created_by_admin === true
      );

      return { data: adminData, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },
};
