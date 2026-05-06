import { supabase } from '@/integrations/supabase/client';

interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  category: string;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}

interface SettingsCache {
  [key: string]: {
    value: any;
    timestamp: number;
    ttl: number;
  };
}

// Cache mémoire pour les settings (5 minutes par défaut)
const settingsCache: SettingsCache = {};
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const appSettingsService = {
  /**
   * Récupère une valeur de setting avec cache
   */
  async getSetting(key: string, useCache: boolean = true): Promise<any> {
    const now = Date.now();

    // Vérifier le cache
    if (
      useCache &&
      settingsCache[key] &&
      now - settingsCache[key].timestamp < settingsCache[key].ttl
    ) {
      console.log('⚡ Setting from cache:', key);
      return settingsCache[key].value;
    }

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value, setting_key')
        .eq('setting_key', key)
        .single();

      if (error) {
        console.error('❌ Erreur récupération setting:', error);
        return null;
      }

      // Mettre en cache
      if (useCache) {
        settingsCache[key] = {
          value: data?.setting_value,
          timestamp: now,
          ttl: DEFAULT_CACHE_TTL,
        };
      }

      return data?.setting_value;
    } catch (error) {
      console.error('❌ Erreur service getSetting:', error);
      return null;
    }
  },

  /**
   * Récupère plusieurs settings en une requête
   */
  async getMultipleSettings(keys: string[]): Promise<{ [key: string]: any }> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', keys);

      if (error) {
        console.error('❌ Erreur récupération settings:', error);
        return {};
      }

      const result: { [key: string]: any } = {};
      data?.forEach((item) => {
        result[item.setting_key] = item.setting_value;
        // Mettre en cache
        settingsCache[item.setting_key] = {
          value: item.setting_value,
          timestamp: Date.now(),
          ttl: DEFAULT_CACHE_TTL,
        };
      });

      return result;
    } catch (error) {
      console.error('❌ Erreur service getMultipleSettings:', error);
      return {};
    }
  },

  /**
   * Récupère tous les settings par catégorie
   */
  async getSettingsByCategory(category: string): Promise<AppSetting[]> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('category', category)
        .order('setting_key');

      if (error) {
        console.error('❌ Erreur récupération settings par catégorie:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur service getSettingsByCategory:', error);
      return [];
    }
  },

  /**
   * Met à jour un setting (admin uniquement)
   */
  async updateSetting(
    key: string,
    value: any,
    updatedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier si le setting est editable
      const { data: existing } = await supabase
        .from('app_settings')
        .select('is_editable')
        .eq('setting_key', key)
        .single();

      if (!existing) {
        return { success: false, error: 'Setting non trouvé' };
      }

      if (!existing.is_editable) {
        return { success: false, error: 'Ce setting ne peut pas être modifié' };
      }

      const { error } = await supabase
        .from('app_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', key);

      if (error) {
        console.error('❌ Erreur mise à jour setting:', error);
        return { success: false, error: 'Erreur lors de la mise à jour' };
      }

      // Invalider le cache
      delete settingsCache[key];

      // Logger l'action admin
      await this.logAdminAction('update_setting', key, value, updatedBy);

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur service updateSetting:', error);
      return { success: false, error: 'Erreur serveur' };
    }
  },

  /**
   * Crée un nouveau setting (admin uniquement)
   */
  async createSetting(
    key: string,
    value: any,
    description: string,
    category: string = 'general',
    createdBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('app_settings').insert({
        setting_key: key,
        setting_value: value,
        description,
        category,
        is_editable: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === '23505') {
          // Unique violation
          return { success: false, error: 'Ce setting existe déjà' };
        }
        console.error('❌ Erreur création setting:', error);
        return { success: false, error: 'Erreur lors de la création' };
      }

      await this.logAdminAction('create_setting', key, value, createdBy);

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur service createSetting:', error);
      return { success: false, error: 'Erreur serveur' };
    }
  },

  /**
   * Récupère les quotas actuels (cas d'usage fréquent)
   */
  async getQuotaSettings(): Promise<{
    maxProEstimatesDaily: number;
    maxUserEstimatesPerProject: number;
    maxClientEstimatesWeekly: number;
    anonymousMessageLimit: number;
  }> {
    const defaults = {
      maxProEstimatesDaily: 5,
      maxUserEstimatesPerProject: 3,
      maxClientEstimatesWeekly: 2,
      anonymousMessageLimit: 3,
    };

    try {
      const settings = await this.getMultipleSettings([
        'max_pro_estimates_daily',
        'max_user_estimates_per_project',
        'max_client_estimates_weekly',
        'anonymous_message_limit',
      ]);

      return {
        maxProEstimatesDaily:
          settings.max_pro_estimates_daily?.value ??
          defaults.maxProEstimatesDaily,
        maxUserEstimatesPerProject:
          settings.max_user_estimates_per_project?.value ??
          defaults.maxUserEstimatesPerProject,
        maxClientEstimatesWeekly:
          settings.max_client_estimates_weekly?.value ??
          defaults.maxClientEstimatesWeekly,
        anonymousMessageLimit:
          settings.anonymous_message_limit?.value ??
          defaults.anonymousMessageLimit,
      };
    } catch (error) {
      console.error('❌ Erreur récupération quotas:', error);
      return defaults;
    }
  },

  /**
   * Vérifie si une fonctionnalité est activée
   */
  async isFeatureEnabled(featureKey: string): Promise<boolean> {
    const setting = await this.getSetting(featureKey);
    return setting?.enabled ?? false;
  },

  /**
   * Invalide le cache pour un setting spécifique
   */
  invalidateCache(key?: string): void {
    if (key) {
      delete settingsCache[key];
      console.log('🗑️ Cache invalidé pour:', key);
    } else {
      Object.keys(settingsCache).forEach((k) => delete settingsCache[k]);
      console.log('🗑️ Cache settings complet invalidé');
    }
  },

  /**
   * Logger les actions admin
   */
  async logAdminAction(
    action: string,
    key: string,
    value: any,
    userId: string
  ): Promise<void> {
    console.log('📝 ADMIN ACTION:', {
      action,
      key,
      value,
      userId,
      timestamp: new Date().toISOString(),
    });
    // TODO: Implémenter l'insertion dans une table d'audit si nécessaire
  },
};

export type { AppSetting };
