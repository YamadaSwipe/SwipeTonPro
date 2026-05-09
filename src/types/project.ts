import { Database } from '@/integrations/supabase/types';

// Type de base depuis Supabase
type BaseProject = Database['public']['Tables']['projects']['Row'];

// Type étendu avec les propriétés manquantes utilisées dans le code
export type Project = BaseProject & {
  // Propriétés utilisées dans le code mais manquantes dans les types Supabase
  payment_security_option?: string;
  accord_status?: string;

  // Alias pour éviter les confusions
  work_type?: string[] | string; // Alias de work_types pour compatibilité
};

// Type pour les formulaires de création de projet
export type CreateProjectForm = {
  title: string;
  description: string;
  category: string;
  city: string;
  postal_code: string;
  estimated_budget_min: string;
  estimated_budget_max: string;
  desired_start_period: string;
  urgency: 'high' | 'medium' | 'low';
  surface: string;
  property_type: string;
  project_type: 'estimation' | 'firm_project';
  stripe_escrow_enabled: boolean;
  payment_security_option?: string;
};

// Helper pour convertir un projet Supabase en Project étendu
export const toExtendedProject = (project: any): Project => {
  return {
    ...project,
    payment_security_option: project.payment_security_option,
    accord_status: project.accord_status,
    work_type: project.work_types, // Alias pour compatibilité
  };
};
