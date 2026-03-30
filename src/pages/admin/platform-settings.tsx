'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Shield, 
  CreditCard, 
  MessageSquare, 
  Calendar,
  Star,
  Zap,
  Globe,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlatformSettings {
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

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
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
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/platform-settings');
      const data = await response.json();
      
      if (response.ok) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erreur chargement settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "✅ Paramètres sauvegardés",
          description: "Les paramètres de la plateforme ont été mis à jour",
        });
      } else {
        throw new Error('Erreur sauvegarde');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (feature: keyof PlatformSettings['features'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value
      }
    }));
  };

  const updatePricing = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings.pricing;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i] as keyof typeof current];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const addSubscriptionPlan = () => {
    const newPlan = {
      id: `plan_${Date.now()}`,
      name: 'Nouveau Plan',
      price: 49,
      credits: 100,
      features: ['Nouveau plan']
    };
    
    setSettings(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        subscriptionPlans: [...prev.pricing.subscriptionPlans, newPlan]
      }
    }));
  };

  const removeSubscriptionPlan = (id: string) => {
    setSettings(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        subscriptionPlans: prev.pricing.subscriptionPlans.filter(plan => plan.id !== id)
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paramètres de la Plateforme</h1>
          <p className="text-gray-600">Configurez les fonctionnalités et tarifs</p>
        </div>
        
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="features" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="pricing">Tarification</TabsTrigger>
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="limits">Limites</TabsTrigger>
          <TabsTrigger value="credits">Crédits</TabsTrigger>
        </TabsList>

        {/* Features */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Fonctionnalités Actives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(settings.features).map(([key, value]) => {
                  const featureInfo: Record<string, { icon: any; label: string; description: string }> = {
                    realtimeMessaging: { icon: MessageSquare, label: 'Messagerie Temps Réel', description: 'Chat instantané avec notifications' },
                    availabilityManagement: { icon: Calendar, label: 'Gestion Disponibilités', description: 'Calendrier et rendez-vous' },
                    emergencySystem: { icon: Zap, label: 'Système d\'Urgence', description: 'Interventions urgentes 24h/24' },
                    analytics: { icon: Globe, label: 'Analytics', description: 'Tableaux de bord avancés' },
                    loyaltyProgram: { icon: Star, label: 'Programme Fidélité', description: 'Points et récompenses' },
                    publicApi: { icon: Globe, label: 'API Publique', description: 'Endpoints REST et webhooks' },
                    twoFactorAuth: { icon: Shield, label: 'Auth 2 Facteurs', description: 'Sécurité renforcée' },
                    darkMode: { icon: Settings, label: 'Mode Sombre', description: 'Thème sombre de l\'interface' },
                    moderation: { icon: Shield, label: 'Modération IA', description: 'Modération automatique' }
                  };

                  const info = featureInfo[key];
                  const Icon = info.icon;

                  return (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="font-medium">{info.label}</div>
                          <div className="text-sm text-gray-600">{info.description}</div>
                        </div>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => updateFeature(key as keyof PlatformSettings['features'], checked)}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing">
          <div className="space-y-6">
            {/* Emergency Multiplier */}
            <Card>
              <CardHeader>
                <CardTitle>Majoration Urgence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label htmlFor="emergency-multiplier">Multiplicateur:</Label>
                  <Input
                    id="emergency-multiplier"
                    type="number"
                    step="0.1"
                    min="1"
                    max="3"
                    value={settings.pricing.emergencyMultiplier}
                    onChange={(e) => updatePricing('emergencyMultiplier', parseFloat(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">
                    = {(settings.pricing.emergencyMultiplier * 100 - 100).toFixed(0)}% de majoration
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Plans */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Plans d'Abonnement</CardTitle>
                  <Button onClick={addSubscriptionPlan}>Ajouter un plan</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {settings.pricing.subscriptionPlans.map((plan, index) => (
                    <div key={plan.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Input
                        value={plan.name}
                        onChange={(e) => {
                          const plans = [...settings.pricing.subscriptionPlans];
                          plans[index].name = e.target.value;
                          updatePricing('subscriptionPlans', plans);
                        }}
                        className="flex-1"
                        placeholder="Nom du plan"
                      />
                      <Input
                        type="number"
                        value={plan.price}
                        onChange={(e) => {
                          const plans = [...settings.pricing.subscriptionPlans];
                          plans[index].price = parseFloat(e.target.value);
                          updatePricing('subscriptionPlans', plans);
                        }}
                        className="w-24"
                        placeholder="Prix"
                      />
                      <span>€</span>
                      <Input
                        type="number"
                        value={plan.credits}
                        onChange={(e) => {
                          const plans = [...settings.pricing.subscriptionPlans];
                          plans[index].credits = parseInt(e.target.value);
                          updatePricing('subscriptionPlans', plans);
                        }}
                        className="w-24"
                        placeholder="Crédits"
                      />
                      <Badge variant={plan.popular ? 'default' : 'secondary'}>
                        {plan.popular ? 'Populaire' : 'Standard'}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSubscriptionPlan(plan.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lead Packs */}
            <Card>
              <CardHeader>
                <CardTitle>Packs de Crédits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {settings.pricing.leadPacks.map((pack, index) => (
                    <div key={pack.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Input
                        value={pack.name}
                        onChange={(e) => {
                          const packs = [...settings.pricing.leadPacks];
                          packs[index].name = e.target.value;
                          updatePricing('leadPacks', packs);
                        }}
                        className="flex-1"
                        placeholder="Nom du pack"
                      />
                      <Input
                        type="number"
                        value={pack.price}
                        onChange={(e) => {
                          const packs = [...settings.pricing.leadPacks];
                          packs[index].price = parseFloat(e.target.value);
                          updatePricing('leadPacks', packs);
                        }}
                        className="w-24"
                        placeholder="Prix"
                      />
                      <span>€</span>
                      <Input
                        type="number"
                        value={pack.credits}
                        onChange={(e) => {
                          const packs = [...settings.pricing.leadPacks];
                          packs[index].credits = parseInt(e.target.value);
                          updatePricing('leadPacks', packs);
                        }}
                        className="w-24"
                        placeholder="Crédits"
                      />
                      {pack.discount && (
                        <Badge variant="secondary">-{pack.discount}%</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Textes et Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="welcome-text">Message de bienvenue</Label>
                <Textarea
                  id="welcome-text"
                  value={settings.content.welcomeText}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    content: { ...prev.content, welcomeText: e.target.value }
                  }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="emergency-desc">Description urgence</Label>
                <Textarea
                  id="emergency-desc"
                  value={settings.content.emergencyDescription}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    content: { ...prev.content, emergencyDescription: e.target.value }
                  }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="loyalty-desc">Description fidélité</Label>
                <Textarea
                  id="loyalty-desc"
                  value={settings.content.loyaltyDescription}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    content: { ...prev.content, loyaltyDescription: e.target.value }
                  }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="support-email">Email support</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={settings.content.supportEmail}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      content: { ...prev.content, supportEmail: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="support-phone">Téléphone support</Label>
                  <Input
                    id="support-phone"
                    value={settings.content.supportPhone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      content: { ...prev.content, supportPhone: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Limites et Restrictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="max-projects">Projets max par client</Label>
                  <Input
                    id="max-projects"
                    type="number"
                    value={settings.limits.maxProjectsPerClient}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      limits: { ...prev.limits, maxProjectsPerClient: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="max-photos">Photos max par projet</Label>
                  <Input
                    id="max-photos"
                    type="number"
                    value={settings.limits.maxPhotosPerProject}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      limits: { ...prev.limits, maxPhotosPerProject: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="max-message">Longueur max message</Label>
                  <Input
                    id="max-message"
                    type="number"
                    value={settings.limits.maxMessageLength}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      limits: { ...prev.limits, maxMessageLength: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="api-rate">Rate limit API (/15min)</Label>
                  <Input
                    id="api-rate"
                    type="number"
                    value={settings.limits.apiRateLimit}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      limits: { ...prev.limits, apiRateLimit: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits */}
        <TabsContent value="credits">
          <Card>
            <CardHeader>
              <CardTitle>Points de Fidélité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="points-project">Points par projet</Label>
                  <Input
                    id="points-project"
                    type="number"
                    value={settings.pricing.loyaltyPoints.perProject}
                    onChange={(e) => updatePricing('loyaltyPoints.perProject', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="points-review">Points par avis</Label>
                  <Input
                    id="points-review"
                    type="number"
                    value={settings.pricing.loyaltyPoints.perReview}
                    onChange={(e) => updatePricing('loyaltyPoints.perReview', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="points-referral">Points par parrainage</Label>
                  <Input
                    id="points-referral"
                    type="number"
                    value={settings.pricing.loyaltyPoints.perReferral}
                    onChange={(e) => updatePricing('loyaltyPoints.perReferral', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="points-login">Points par connexion</Label>
                  <Input
                    id="points-login"
                    type="number"
                    value={settings.pricing.loyaltyPoints.perDailyLogin}
                    onChange={(e) => updatePricing('loyaltyPoints.perDailyLogin', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Les modifications seront appliquées immédiatement sur la plateforme.
          Certaines fonctionnalités peuvent nécessiter un redémarrage du serveur.
        </AlertDescription>
      </Alert>
    </div>
  );
}
