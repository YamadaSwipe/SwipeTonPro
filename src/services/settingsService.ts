import { supabase } from '@/integrations/supabase/client';

interface FeatureSettings {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'monetization' | 'ai' | 'automation' | 'core';
  icon: React.ReactNode;
  config?: Record<string, any>;
}

export const settingsService = {
  /**
   * Récupérer tous les paramètres
   */
  async getAllSettings(): Promise<FeatureSettings[] | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('admin_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération settings:', error);
      return null;
    }
  },

  /**
   * Récupérer un paramètre spécifique
   */
  async getSetting(featureId: string): Promise<FeatureSettings | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('admin_settings')
        .select('*')
        .eq('feature_id', featureId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur récupération setting:', error);
      return null;
    }
  },

  /**
   * Mettre à jour un paramètre
   */
  async updateSetting(
    featureId: string, 
    updates: Partial<FeatureSettings>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('admin_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('feature_id', featureId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour setting:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Activer/désactiver une fonctionnalité
   */
  async toggleFeature(featureId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    return this.updateSetting(featureId, { enabled });
  },

  /**
   * Mettre à jour la configuration d'une fonctionnalité
   */
  async updateConfig(
    featureId: string, 
    config: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateSetting(featureId, { config });
  },

  /**
   * Vérifier si une fonctionnalité est active
   */
  async isFeatureEnabled(featureId: string): Promise<boolean> {
    try {
      const setting = await this.getSetting(featureId);
      return setting?.enabled || false;
    } catch (error) {
      console.error('Erreur vérification feature:', error);
      return false;
    }
  },

  /**
   * Récupérer les fonctionnalités actives par catégorie
   */
  async getEnabledFeatures(category?: string): Promise<FeatureSettings[]> {
    try {
      let query = (supabase as any)
        .from('admin_settings')
        .select('*')
        .eq('enabled', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération features actives:', error);
      return [];
    }
  },

  /**
   * Récupérer les paramètres par défaut
   */
  getDefaultSettings(): FeatureSettings[] {
    return [
      // Monétisation
      {
        id: 'lead_packs',
        name: 'Packs de Leads',
        description: 'Permettre l\'achat de packs de leads (5, 15, 50 leads)',
        enabled: false,
        category: 'monetization',
        icon: null, // Sera défini dans le composant
        config: {
          pack_discovery_price: 199,
          pack_professional_price: 499,
          pack_premium_price: 999,
        },
      },
      {
        id: 'subscriptions',
        name: 'Abonnements Mensuels',
        description: 'Activer les abonnements Basic/Pro/Enterprise',
        enabled: false,
        category: 'monetization',
        icon: null,
        config: {
          basic_monthly_price: 99,
          pro_monthly_price: 249,
          enterprise_monthly_price: 499,
        },
      },
      {
        id: 'commissions',
        name: 'Système de Commissions',
        description: 'Payer les commissions aux vendeurs de leads',
        enabled: false,
        category: 'monetization',
        icon: null,
        config: {
          bronze_rate: 10,
          silver_rate: 12,
          gold_rate: 15,
          platinum_rate: 20,
        },
      },
      // IA et Matching
      {
        id: 'ai_matching',
        name: 'IA Matching Intelligent',
        description: 'Système IA pour matcher les meilleurs professionnels avec les projets',
        enabled: false,
        category: 'ai',
        icon: null,
        config: {
          min_score_threshold: 40,
          max_matches_per_project: 10,
          auto_match_enabled: false,
        },
      },
      {
        id: 'conversion_prediction',
        name: 'Prédiction de Conversion',
        description: 'IA pour prédire la probabilité de conversion des leads',
        enabled: false,
        category: 'ai',
        icon: null,
        config: {
          prediction_threshold: 0.5,
          auto_categorization_enabled: false,
        },
      },
      {
        id: 'dynamic_pricing',
        name: 'Prix Dynamique',
        description: 'Ajustement automatique des prix selon la demande et le marché',
        enabled: false,
        category: 'ai',
        icon: null,
        config: {
          base_price_multiplier: 1.0,
          demand_factor_weight: 0.3,
          seasonality_factor_weight: 0.2,
        },
      },
      // Automatisations
      {
        id: 'email_sequences',
        name: 'Séquences Email Automatiques',
        description: 'Envoyer des emails automatiques aux leads',
        enabled: false,
        category: 'automation',
        icon: null,
        config: {
          welcome_sequence_enabled: false,
          followup_sequence_enabled: false,
          re_engagement_enabled: false,
        },
      },
      {
        id: 'push_notifications',
        name: 'Notifications Push',
        description: 'Notifications push pour les utilisateurs',
        enabled: false,
        category: 'automation',
        icon: null,
        config: {
          new_lead_notifications: false,
          match_notifications: false,
          message_notifications: false,
        },
      },
      {
        id: 'chatbot_qualification',
        name: 'Chatbot de Qualification',
        description: 'Bot conversationnel pour qualifier les leads',
        enabled: false,
        category: 'automation',
        icon: null,
        config: {
          auto_qualification_enabled: false,
          qualification_threshold: 40,
        },
      },
      // Fonctionnalités Core
      {
        id: 'project_matching',
        name: 'Matching Manuel',
        description: 'Matching basique des projets avec les professionnels',
        enabled: true,
        category: 'core',
        icon: null,
      },
      {
        id: 'lead_management',
        name: 'Gestion des Leads',
        description: 'CRM basique pour gérer les leads',
        enabled: true,
        category: 'core',
        icon: null,
      },
      {
        id: 'professional_validation',
        name: 'Validation des Professionnels',
        description: 'Processus de validation des professionnels',
        enabled: true,
        category: 'core',
        icon: null,
      },
    ];
  },

  /**
   * Initialiser les paramètres par défaut
   */
  async initializeDefaultSettings(): Promise<{ success: boolean; error?: string }> {
    try {
      const defaultSettings = this.getDefaultSettings();
      
      for (const setting of defaultSettings) {
        const { error } = await (supabase as any)
          .from('admin_settings')
          .upsert({
            feature_id: setting.id,
            name: setting.name,
            enabled: setting.enabled,
            config: setting.config || {},
            category: setting.category,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error(`Erreur initialisation setting ${setting.id}:`, error);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur initialisation settings:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Récupérer l'historique des changements
   */
  async getSettingsHistory(featureId?: string): Promise<any[]> {
    try {
      let query = (supabase as any)
        .from('admin_settings_history')
        .select(`
          *,
          profiles!inner(email, full_name)
        `)
        .order('changed_at', { ascending: false });

      if (featureId) {
        query = query.eq('setting_id', featureId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur historique settings:', error);
      return [];
    }
  },

  /**
   * Récupérer les logs d'utilisation
   */
  async getUsageLogs(
    featureId?: string, 
    action?: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      let query = (supabase as any)
        .from('feature_usage_logs')
        .select(`
          *,
          profiles!inner(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (featureId) {
        query = query.eq('feature_id', featureId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur logs utilisation:', error);
      return [];
    }
  },

  /**
   * Obtenir les statistiques d'utilisation
   */
  async getUsageStats(): Promise<any> {
    try {
      const { data: settings } = await (supabase as any)
        .from('admin_settings')
        .select('category, enabled');

      const stats = {
        total: settings?.length || 0,
        enabled: settings?.filter(s => s.enabled).length || 0,
        byCategory: {} as Record<string, { total: number; enabled: number }>,
      };

      // Calculer par catégorie
      settings?.forEach(setting => {
        if (!stats.byCategory[setting.category]) {
          stats.byCategory[setting.category] = { total: 0, enabled: 0 };
        }
        stats.byCategory[setting.category].total++;
        if (setting.enabled) {
          stats.byCategory[setting.category].enabled++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erreur stats utilisation:', error);
      return null;
    }
  },

  /**
   * Exporter les paramètres en JSON
   */
  async exportSettings(): Promise<string> {
    try {
      const settings = await this.getAllSettings();
      if (!settings) return '';

      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Erreur export settings:', error);
      return '';
    }
  },

  /**
   * Importer les paramètres depuis JSON
   */
  async importSettings(jsonData: string): Promise<{ success: boolean; error?: string; imported?: number }> {
    try {
      const settings = JSON.parse(jsonData);
      let imported = 0;

      for (const setting of settings) {
        const { error } = await (supabase as any)
          .from('admin_settings')
          .upsert({
            feature_id: setting.id,
            name: setting.name,
            enabled: setting.enabled,
            config: setting.config || {},
            category: setting.category,
            updated_at: new Date().toISOString(),
          });

        if (!error) {
          imported++;
        }
      }

      return { success: true, imported };
    } catch (error) {
      console.error('Erreur import settings:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Réinitialiser les paramètres par défaut
   */
  async resetToDefaults(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('admin_settings')
        .update({ 
          enabled: false,
          config: {},
          updated_at: new Date().toISOString(),
        })
        .neq('category', 'core'); // Ne pas réinitialiser les features core

      // Réactiver les features core
      await (supabase as any)
        .from('admin_settings')
        .update({ 
          enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('category', 'core');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur réinitialisation settings:', error);
      return { success: false, error: (error as Error).message };
    }
  },
};

export default settingsService;
