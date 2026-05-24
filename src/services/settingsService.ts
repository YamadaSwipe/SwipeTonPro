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
    const defaults = this.getDefaultSettings();
    try {
      const featureKeys = defaults.map(setting => setting.id);
      const { data, error } = await (supabase as any)
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', featureKeys);

      if (error?.code === 'PGRST116' || error?.status === 404 || error?.code === 'PGRST205') {
        return defaults;
      }

      if (error) throw error;
      if (!data) return defaults;

      return defaults.map(setting => {
        const saved = data.find((row: any) => row.setting_key === setting.id);
        const savedValue = saved?.setting_value || {};
        return {
          ...setting,
          enabled: savedValue.enabled ?? setting.enabled,
          config: savedValue.config ?? setting.config,
        };
      });
    } catch (error) {
      console.error('Erreur récupération settings:', error);
      return defaults;
    }
  },

  /**
   * Obtenir les paramètres par défaut
   */

  /**
   * Récupérer un paramètre spécifique
   */
  async getSetting(featureId: string): Promise<FeatureSettings | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('app_settings')
        .select('setting_key, setting_value, description, category')
        .eq('setting_key', featureId)
        .single();

      if (error?.code === 'PGRST116' || error?.status === 404 || error?.code === 'PGRST205') {
        const defaults = this.getDefaultSettings();
        return defaults.find(s => s.id === featureId) || null;
      }

      if (error) throw error;
      if (!data) {
        const defaults = this.getDefaultSettings();
        return defaults.find(s => s.id === featureId) || null;
      }

      const settingValue = data.setting_value || {};
      return {
        id: data.setting_key,
        name: settingValue.name ?? featureId,
        description: data.description ?? '',
        enabled: settingValue.enabled ?? false,
        category: data.category ?? 'core',
        icon: null,
        config: settingValue.config || {},
      };
    } catch (error) {
      console.error('Erreur récupération setting:', error);
      const defaults = this.getDefaultSettings();
      return defaults.find(s => s.id === featureId) || null;
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
      const { data: existing, error: selectError } = await (supabase as any)
        .from('app_settings')
        .select('setting_value, description, category')
        .eq('setting_key', featureId)
        .single();

      if (selectError && selectError.code !== 'PGRST116' && selectError.status !== 404 && selectError.code !== 'PGRST205') {
        throw selectError;
      }

      const existingValue = existing?.setting_value || {};
      const updatedValue = {
        ...existingValue,
        ...(updates.enabled !== undefined ? { enabled: updates.enabled } : {}),
        ...(updates.config !== undefined ? { config: updates.config } : {}),
      };

      const { error } = await (supabase as any)
        .from('app_settings')
        .upsert({
          setting_key: featureId,
          setting_value: updatedValue,
          description: existing?.description ?? updates.description ?? null,
          category: existing?.category ?? updates.category ?? 'features',
          is_editable: true,
          updated_at: new Date().toISOString(),
        });

      if (error?.code === 'PGRST116' || error?.status === 404 || error?.code === 'PGRST205') {
        return { success: true };
      }

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour setting:', error);
      return { success: false, error: String(error) };
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
   * Mettre à jour plusieurs paramètres en une seule requête
   */
  async bulkUpdateSettings(
    updates: Array<{
      featureId: string;
      enabled?: boolean;
      config?: Record<string, any>;
      description?: string;
      category?: string;
    }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const upsertData = updates.map(update => ({
        setting_key: update.featureId,
        setting_value: {
          ...(update.enabled !== undefined ? { enabled: update.enabled } : {}),
          ...(update.config !== undefined ? { config: update.config } : {}),
        },
        description: update.description || null,
        category: update.category || 'features',
        is_editable: true,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await (supabase as any)
        .from('app_settings')
        .upsert(upsertData);

      if (error?.code === 'PGRST116' || error?.status === 404 || error?.code === 'PGRST205') {
        return { success: true };
      }

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour bulk settings:', error);
      return { success: false, error: String(error) };
    }
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
        .from('app_settings')
        .select('*')
        .eq('enabled', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('name');

      // Si la table n'existe pas, retourner les features activées par défaut
      if (error?.code === 'PGRST116' || error?.status === 404 || error?.code === 'PGRST205') {
        const defaults = this.getDefaultSettings();
        let filtered = defaults.filter(s => s.enabled);
        if (category) {
          filtered = filtered.filter(s => s.category === category);
        }
        return filtered;
      }

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération features actives:', error);
      // Retourner les features activées par défaut en cas d'erreur
      const defaults = this.getDefaultSettings();
      let filtered = defaults.filter(s => s.enabled);
      if (category) {
        filtered = filtered.filter(s => s.category === category);
      }
      return filtered;
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
          .from('app_settings')
          .upsert({
            setting_key: setting.id,
            setting_value: {
              enabled: setting.enabled,
              config: setting.config || {},
            },
            description: setting.description,
            category: setting.category,
            is_editable: true,
            updated_at: new Date().toISOString(),
          });

        if (error && error.code !== 'PGRST116' && error.status !== 404 && error.code !== 'PGRST205') {
          console.error(`Erreur initialisation setting ${setting.id}:`, error);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur initialisation settings:', error);
      return { success: true };
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

      // Si la table n'existe pas, retourner un historique vide
      if (error?.code === 'PGRST116' || error?.status === 404 || error?.code === 'PGRST205') {
        return [];
      }

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

      // Si la table n'existe pas, retourner un tableau vide
      if (error?.code === 'PGRST116' || error?.status === 404 || error?.code === 'PGRST205') {
        return [];
      }

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
      const { data: settings, error } = await (supabase as any)
        .from('app_settings')
        .select('category, setting_value');

      if (error?.code === 'PGRST116' || error?.status === 404 || error?.code === 'PGRST205') {
        const defaults = this.getDefaultSettings();
        const stats = {
          total: defaults.length,
          enabled: defaults.filter(s => s.enabled).length,
          byCategory: {} as Record<string, { total: number; enabled: number }>,
        };

        defaults.forEach(setting => {
          if (!stats.byCategory[setting.category]) {
            stats.byCategory[setting.category] = { total: 0, enabled: 0 };
          }
          stats.byCategory[setting.category].total++;
          if (setting.enabled) {
            stats.byCategory[setting.category].enabled++;
          }
        });
        return stats;
      }

      if (error) throw error;

      const stats = {
        total: settings?.length || 0,
        enabled: settings?.filter(s => s.setting_value?.enabled).length || 0,
        byCategory: {} as Record<string, { total: number; enabled: number }>,
      };

      settings?.forEach((setting: any) => {
        const category = setting.category;
        const enabled = setting.setting_value?.enabled;
        if (!stats.byCategory[category]) {
          stats.byCategory[category] = { total: 0, enabled: 0 };
        }
        stats.byCategory[category].total++;
        if (enabled) {
          stats.byCategory[category].enabled++;
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
          .from('app_settings')
          .upsert({
            setting_key: setting.id,
            setting_value: {
              enabled: setting.enabled,
              config: setting.config || {},
            },
            description: setting.description,
            category: setting.category,
            is_editable: true,
            updated_at: new Date().toISOString(),
          });

        if (!error || error.code === 'PGRST116' || error.status === 404 || error.code === 'PGRST205') {
          imported++;
        }
      }

      return { success: true, imported };
    } catch (error) {
      console.error('Erreur import settings:', error);
      return { success: false, error: "Impossible d'importer les paramètres." };
    }
  },

  /**
   * Réinitialiser les paramètres par défaut
   */
  async resetToDefaults(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: error1 } = await (supabase as any)
        .from('app_settings')
        .update({ 
          setting_value: {
            enabled: false,
            config: {},
          },
          updated_at: new Date().toISOString(),
        })
        .neq('category', 'core'); // Ne pas réinitialiser les features core

      const { error: error2 } = await (supabase as any)
        .from('app_settings')
        .update({ 
          setting_value: {
            enabled: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('category', 'core');

      if ((error1 && error1.code !== 'PGRST116' && error1.status !== 404 && error1.code !== 'PGRST205') ||
          (error2 && error2.code !== 'PGRST116' && error2.status !== 404 && error2.code !== 'PGRST205')) {
        throw error1 || error2;
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur réinitialisation settings:', error);
      return { success: true }; // Accepter même si la table n'existe pas
    }
  },
};

export default settingsService;
