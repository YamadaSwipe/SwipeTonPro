// Central platform configuration that can be updated by admin
import { cache } from './cache';

interface PlatformConfig {
  features: {
    realtimeMessaging: boolean;
    availabilityManagement: boolean;
    emergencySystem: boolean;
    analytics: boolean;
    loyaltyProgram: boolean;
    publicApi: boolean;
    twoFactorAuth: boolean;
    darkMode: boolean;
    moderation: boolean;
  };
  pricing: {
    emergencyMultiplier: number;
    subscriptionPlans: Array<{
      id: string;
      name: string;
      price: number;
      credits: number;
      features: string[];
      popular?: boolean;
    }>;
    leadPacks: Array<{
      id: string;
      name: string;
      price: number;
      credits: number;
      discount?: number;
    }>;
    loyaltyPoints: {
      perProject: number;
      perReview: number;
      perReferral: number;
      perDailyLogin: number;
    };
  };
  content: {
    welcomeText: string;
    emergencyDescription: string;
    loyaltyDescription: string;
    supportEmail: string;
    supportPhone: string;
  };
  limits: {
    maxProjectsPerClient: number;
    maxPhotosPerProject: number;
    maxMessageLength: number;
    apiRateLimit: number;
  };
}

const defaultConfig: PlatformConfig = {
  features: {
    realtimeMessaging: true,
    availabilityManagement: true,
    emergencySystem: true,
    analytics: true,
    loyaltyProgram: true,
    publicApi: true,
    twoFactorAuth: true,
    darkMode: true,
    moderation: true
  },
  pricing: {
    emergencyMultiplier: 1.5,
    subscriptionPlans: [
      {
        id: 'starter',
        name: 'Starter',
        price: 29,
        credits: 50,
        features: ['Accès basic', '5 projets/mois', 'Support email']
      },
      {
        id: 'pro',
        name: 'Professional',
        price: 79,
        credits: 200,
        features: ['Accès complet', 'Projets illimités', 'Support prioritaire', 'Analytics'],
        popular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199,
        credits: 1000,
        features: ['API complète', 'White label', 'Dédié support', 'Custom features']
      }
    ],
    leadPacks: [
      { id: 'pack1', name: 'Pack Découverte', price: 19, credits: 10 },
      { id: 'pack2', name: 'Pack Croissance', price: 49, credits: 30, discount: 15 },
      { id: 'pack3', name: 'Pack Pro', price: 99, credits: 70, discount: 25 }
    ],
    loyaltyPoints: {
      perProject: 15,
      perReview: 10,
      perReferral: 100,
      perDailyLogin: 5
    }
  },
  content: {
    welcomeText: 'Bienvenue sur SwipeTonPro - La plateforme moderne pour vos projets',
    emergencyDescription: 'Service d\'urgence disponible 24h/24 et 7j/7 avec majoration de 50%',
    loyaltyDescription: 'Cumulez des points et débloquez des avantages exclusifs',
    supportEmail: 'support@swipetonpro.fr',
    supportPhone: '09 72 58 45 12'
  },
  limits: {
    maxProjectsPerClient: 10,
    maxPhotosPerProject: 5,
    maxMessageLength: 1000,
    apiRateLimit: 100
  }
};

class PlatformConfigManager {
  private config: PlatformConfig | null = null;
  private lastFetch = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getConfig(): Promise<PlatformConfig> {
    const now = Date.now();
    
    // Return cached config if still valid
    if (this.config && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.config;
    }

    try {
      // Try to get from cache first
      const cachedConfig = await cache.get('platform_config');
      if (cachedConfig) {
        this.config = cachedConfig;
        this.lastFetch = now;
        return this.config;
      }

      // Fetch from API
      const response = await fetch('/api/admin/platform-settings');
      if (response.ok) {
        const config = await response.json();
        this.config = config;
        this.lastFetch = now;
        
        // Cache the config
        await cache.set('platform_config', config, this.CACHE_DURATION);
        
        return this.config;
      }
    } catch (error) {
      console.error('Error fetching platform config:', error);
    }

    // Return default config if all else fails
    this.config = defaultConfig;
    return this.config;
  }

  async updateConfig(updates: Partial<PlatformConfig>): Promise<void> {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...updates };
    
    this.config = newConfig;
    this.lastFetch = Date.now();
    
    // Update cache
    await cache.set('platform_config', newConfig, this.CACHE_DURATION);
    
    // Trigger config update event
    window.dispatchEvent(new CustomEvent('platformConfigUpdated', { 
      detail: newConfig 
    }));
  }

  // Convenience methods for specific config sections
  async getFeatures() {
    const config = await this.getConfig();
    return config.features;
  }

  async getPricing() {
    const config = await this.getConfig();
    return config.pricing;
  }

  async getContent() {
    const config = await this.getConfig();
    return config.content;
  }

  async getLimits() {
    const config = await this.getConfig();
    return config.limits;
  }

  // Feature flags
  async isFeatureEnabled(feature: keyof PlatformConfig['features']): Promise<boolean> {
    const features = await this.getFeatures();
    return features[feature] || false;
  }

  // Pricing helpers
  async getEmergencyMultiplier(): Promise<number> {
    const pricing = await this.getPricing();
    return pricing.emergencyMultiplier;
  }

  async getSubscriptionPlans() {
    const pricing = await this.getPricing();
    return pricing.subscriptionPlans;
  }

  async getLeadPacks() {
    const pricing = await this.getPricing();
    return pricing.leadPacks;
  }

  async getLoyaltyPoints() {
    const pricing = await this.getPricing();
    return pricing.loyaltyPoints;
  }

  // Content helpers
  async getWelcomeText(): Promise<string> {
    const content = await this.getContent();
    return content.welcomeText;
  }

  async getEmergencyDescription(): Promise<string> {
    const content = await this.getContent();
    return content.emergencyDescription;
  }

  async getSupportInfo() {
    const content = await this.getContent();
    return {
      email: content.supportEmail,
      phone: content.supportPhone
    };
  }

  // Limit helpers
  async getMaxProjectsPerClient(): Promise<number> {
    const limits = await this.getLimits();
    return limits.maxProjectsPerClient;
  }

  async getMaxPhotosPerProject(): Promise<number> {
    const limits = await this.getLimits();
    return limits.maxPhotosPerProject;
  }

  async getMaxMessageLength(): Promise<number> {
    const limits = await this.getLimits();
    return limits.maxMessageLength;
  }

  // Refresh config (force fetch from server)
  async refreshConfig(): Promise<PlatformConfig> {
    this.lastFetch = 0; // Force fetch
    await cache.del('platform_config'); // Clear cache
    return this.getConfig();
  }

  // Reset to defaults
  async resetToDefaults(): Promise<void> {
    this.config = defaultConfig;
    this.lastFetch = Date.now();
    await cache.set('platform_config', defaultConfig, this.CACHE_DURATION);
    
    window.dispatchEvent(new CustomEvent('platformConfigUpdated', { 
      detail: defaultConfig 
    }));
  }
}

export const platformConfig = new PlatformConfigManager();

// React hook for platform config
import { useState, useEffect } from 'react';

export function usePlatformConfig() {
  const [config, setConfig] = useState<PlatformConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configData = await platformConfig.getConfig();
        setConfig(configData);
      } catch (error) {
        console.error('Error loading platform config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();

    // Listen for config updates
    const handleConfigUpdate = (event: CustomEvent) => {
      setConfig(event.detail);
    };

    window.addEventListener('platformConfigUpdated', handleConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('platformConfigUpdated', handleConfigUpdate as EventListener);
    };
  }, []);

  return { config, loading };
}

// Feature flag hook
export function useFeatureFlag(feature: keyof PlatformConfig['features']) {
  const { config, loading } = usePlatformConfig();
  
  return {
    enabled: !loading && config.features[feature],
    loading
  };
}

// Pricing hook
export function usePricing() {
  const { config, loading } = usePlatformConfig();
  
  return {
    pricing: config.pricing,
    loading,
    emergencyMultiplier: config.pricing.emergencyMultiplier,
    subscriptionPlans: config.pricing.subscriptionPlans,
    leadPacks: config.pricing.leadPacks,
    loyaltyPoints: config.pricing.loyaltyPoints
  };
}

// Content hook
export function useContent() {
  const { config, loading } = usePlatformConfig();
  
  return {
    content: config.content,
    loading,
    welcomeText: config.content.welcomeText,
    emergencyDescription: config.content.emergencyDescription,
    loyaltyDescription: config.content.loyaltyDescription,
    supportInfo: {
      email: config.content.supportEmail,
      phone: config.content.supportPhone
    }
  };
}

// Limits hook
export function useLimits() {
  const { config, loading } = usePlatformConfig();
  
  return {
    limits: config.limits,
    loading,
    maxProjectsPerClient: config.limits.maxProjectsPerClient,
    maxPhotosPerProject: config.limits.maxPhotosPerProject,
    maxMessageLength: config.limits.maxMessageLength,
    apiRateLimit: config.limits.apiRateLimit
  };
}
