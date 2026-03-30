"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Target,
  DollarSign,
  Bot,
  Mail,
  Bell
} from 'lucide-react';
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

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<FeatureSettings[]>([
    // Monétisation
    {
      id: 'lead_packs',
      name: 'Packs de Leads',
      description: 'Permettre l\'achat de packs de leads (5, 15, 50 leads)',
      enabled: false,
      category: 'monetization',
      icon: <DollarSign className="w-5 h-5" />,
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
      icon: <Target className="w-5 h-5" />,
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
      icon: <DollarSign className="w-5 h-5" />,
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
      icon: <Bot className="w-5 h-5" />,
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
      icon: <Target className="w-5 h-5" />,
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
      icon: <DollarSign className="w-5 h-5" />,
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
      icon: <Mail className="w-5 h-5" />,
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
      icon: <Bell className="w-5 h-5" />,
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
      icon: <Bot className="w-5 h-5" />,
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
      icon: <Target className="w-5 h-5" />,
    },
    {
      id: 'lead_management',
      name: 'Gestion des Leads',
      description: 'CRM basique pour gérer les leads',
      enabled: true,
      category: 'core',
      icon: <Zap className="w-5 h-5" />,
    },
    {
      id: 'professional_validation',
      name: 'Validation des Professionnels',
      description: 'Processus de validation des professionnels',
      enabled: true,
      category: 'core',
      icon: <CheckCircle className="w-5 h-5" />,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data: savedSettings } = await (supabase as any)
        .from('admin_settings')
        .select('*');

      if (savedSettings && savedSettings.length > 0) {
        // Mettre à jour les settings avec les valeurs sauvegardées
        const updatedSettings = settings.map(setting => {
          const saved = savedSettings.find(s => s.feature_id === setting.id);
          if (saved) {
            return {
              ...setting,
              enabled: saved.enabled,
              config: saved.config || setting.config,
            };
          }
          return setting;
        });
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Erreur chargement settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureId: string, enabled: boolean) => {
    // Mettre à jour l'état local
    setSettings(prev => prev.map(setting => 
      setting.id === featureId ? { ...setting, enabled } : setting
    ));

    // Sauvegarder en base
    try {
      await (supabase as any)
        .from('admin_settings')
        .upsert({
          feature_id: featureId,
          enabled,
          config: settings.find(s => s.id === featureId)?.config,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Erreur mise à jour feature:', error);
      // Revenir à l'état précédent en cas d'erreur
      setSettings(prev => prev.map(setting => 
        setting.id === featureId ? { ...setting, enabled: !enabled } : setting
      ));
    }
  };

  const updateConfig = async (featureId: string, config: Record<string, any>) => {
    setSettings(prev => prev.map(setting => 
      setting.id === featureId ? { ...setting, config } : setting
    ));

    try {
      await (supabase as any)
        .from('admin_settings')
        .upsert({
          feature_id: featureId,
          enabled: settings.find(s => s.id === featureId)?.enabled,
          config,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Erreur mise à jour config:', error);
    }
  };

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      const upsertData = settings.map(setting => ({
        feature_id: setting.id,
        enabled: setting.enabled,
        config: setting.config,
        updated_at: new Date().toISOString(),
      }));

      await (supabase as any)
        .from('admin_settings')
        .upsert(upsertData);

      // Afficher un message de succès
      alert('Paramètres sauvegardés avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde settings:', error);
      alert('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      monetization: 'bg-green-100 text-green-800 border-green-200',
      ai: 'bg-purple-100 text-purple-800 border-purple-200',
      automation: 'bg-blue-100 text-blue-800 border-blue-200',
      core: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[category as keyof typeof colors] || colors.core;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      monetization: 'Monétisation',
      ai: 'Intelligence Artificielle',
      automation: 'Automatisation',
      core: 'Fonctionnalités Core',
    };
    return labels[category as keyof typeof labels] || category;
  };

  // Explication de l'IA Matching
  const renderIAMatchingExplanation = () => (
    <Card className="mb-6 border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-800">
          <Info className="w-5 h-5 mr-2" />
          Comment fonctionne l'IA Matching ?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-purple-700">
          <p className="mb-2">
            <strong>L'IA Matching</strong> est un système intelligent qui analyse automatiquement 
            les projets et trouve les meilleurs professionnels correspondants.
          </p>
          
          <h4 className="font-semibold mt-3 mb-1">🔍 **Comment ça marche :**</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Analyse du projet :</strong> L'IA lit la description et extrait les compétences requises</li>
            <li><strong>Calcul de score :</strong> Évalue 7 critères (compétences, localisation, budget, etc.)</li>
            <li><strong>Matching :</strong> Compare avec tous les professionnels vérifiés</li>
            <li><strong>Classement :</strong> Fournit une liste des meilleurs matches avec score 0-100</li>
          </ul>

          <h4 className="font-semibold mt-3 mb-1">📊 **Les 7 critères analysés :**</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Compétences (30%) :</strong> Correspondance des spécialités</li>
            <li><strong>Localisation (25%) :</strong> Distance et zone de service</li>
            <li><strong>Budget (15%) :</strong> Adéquation prix/projet</li>
            <li><strong>Disponibilité (15%) :</strong> Rapidité d'intervention</li>
            <li><strong>Expérience (10%) :</strong> Années d'expérience</li>
            <li><strong>Note (5%) :</strong> Évaluation des clients</li>
            <li><strong>Temps de réponse (5%) :</strong> Rapidité de contact</li>
          </ul>

          <h4 className="font-semibold mt-3 mb-1">🎯 **Avantages :**</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Matching plus précis que le filtrage manuel</li>
            <li>Gagne du temps pour les clients</li>
            <li>Meilleure qualité des correspondances</li>
            <li>Apprentissage continu avec les feedbacks</li>
          </ul>

          <div className="mt-3 p-3 bg-purple-100 rounded-lg">
            <p className="text-xs text-purple-600">
              <strong>Note :</strong> Vous pouvez l'activer/désactiver selon vos besoins. 
              Désactivé, le système utilisera le matching manuel classique.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderConfigForm = (setting: FeatureSettings) => {
    if (!setting.config) return null;

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
        <Label className="text-sm font-medium">Configuration</Label>
        
        {Object.entries(setting.config).map(([key, value]) => (
          <div key={key} className="flex items-center space-x-2">
            <Label className="text-xs text-gray-600 w-32">
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
            </Label>
            {typeof value === 'boolean' ? (
              <Switch
                checked={value}
                onCheckedChange={(checked) => 
                  updateConfig(setting.id, { ...setting.config, [key]: checked })
                }
              />
            ) : typeof value === 'number' ? (
              <Input
                type="number"
                value={value}
                onChange={(e) => 
                  updateConfig(setting.id, { ...setting.config, [key]: Number(e.target.value) })
                }
                className="w-24 h-8"
              />
            ) : (
              <Input
                value={value}
                onChange={(e) => 
                  updateConfig(setting.id, { ...setting.config, [key]: e.target.value })
                }
                className="w-32 h-8"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Paramètres Admin
            </h1>
            <p className="text-gray-600 mt-1">
              Activez/désactivez les fonctionnalités selon vos besoins
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button variant="outline" onClick={loadSettings}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recharger
            </Button>
            <Button onClick={saveAllSettings} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Tout Sauvegarder'}
            </Button>
          </div>
        </div>

        {/* Explication IA Matching */}
        {renderIAMatchingExplanation()}

        {/* Stats globales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fonctionnalités actives</p>
                  <p className="text-2xl font-bold text-green-600">
                    {settings.filter(s => s.enabled).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monétisation</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {settings.filter(s => s.category === 'monetization' && s.enabled).length}/3
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">IA & Automatisation</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {settings.filter(s => (s.category === 'ai' || s.category === 'automation') && s.enabled).length}/6
                  </p>
                </div>
                <Bot className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Core Features</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {settings.filter(s => s.category === 'core' && s.enabled).length}/3
                  </p>
                </div>
                <Settings className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features par catégorie */}
        {['monetization', 'ai', 'automation', 'core'].map(category => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Badge className={getCategoryColor(category)} variant="outline">
                  {getCategoryLabel(category)}
                </Badge>
                <span className="ml-2 text-sm text-gray-500">
                  ({settings.filter(s => s.category === category && s.enabled).length}/{settings.filter(s => s.category === category).length} actives)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings
                .filter(setting => setting.category === category)
                .map(setting => (
                  <div key={setting.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {setting.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{setting.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                          </div>
                        </div>
                        
                        {renderConfigForm(setting)}
                      </div>
                      
                      <div className="ml-4">
                        <Switch
                          checked={setting.enabled}
                          onCheckedChange={(enabled) => toggleFeature(setting.id, enabled)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}

        {/* Alertes */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-semibold mb-1">⚠️ Important</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Les changements sont sauvegardés automatiquement</li>
                  <li>Désactiver une fonctionnalité n'affecte pas les données existantes</li>
                  <li>Les fonctionnalités IA nécessitent plus de ressources serveur</li>
                  <li>La monétisation nécessite une configuration Stripe</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
