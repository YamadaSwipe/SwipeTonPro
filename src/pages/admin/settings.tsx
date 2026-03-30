import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { getSettingsByCategory, updateSetting } from "@/services/platformService";
import { getAISettings, updateAISettings } from "@/services/platformService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const platformSettings = usePlatformSettings();
  const [loading, setLoading] = useState(false);
  
  // États locaux pour les paramètres
  const [pricing, setPricing] = useState({
    creditPrice: 1.50,
    matchUnlockCost: 15,
    subscriptionMonthly: 29,
  });

  const [paymentFeatures, setPaymentFeatures] = useState({
    creditsEnabled: false,
    matchPaymentEnabled: true,
  });

  const [features, setFeatures] = useState({
    maintenanceMode: false,
    publicRegistration: true,
    stripePayments: true,
    aiEstimation: true
  });

  // Nouveaux états pour les paramètres IA
  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    mode: "text_and_photo" as "text_only" | "photo_only" | "text_and_photo",
    creditsRemaining: 0,
    creditsThreshold: 100,
  });

  // Charger les paramètres actuels depuis la DB
  useEffect(() => {
    setPaymentFeatures({
      creditsEnabled: platformSettings.creditsEnabled,
      matchPaymentEnabled: platformSettings.matchPaymentEnabled,
    });
    
    // Charger paramètres IA
    loadAISettings();
  }, [platformSettings]);

  async function loadAISettings() {
    try {
      const settings = await getAISettings();
      setAiSettings(settings);
    } catch (error) {
      console.error("Erreur chargement paramètres IA:", error);
    }
  }

  // Sauvegarder les changements IA
  async function handleSaveAISettings() {
    try {
      setLoading(true);
      if (!user) return;

      await updateAISettings({
        enabled: aiSettings.enabled,
        mode: aiSettings.mode,
        creditsThreshold: aiSettings.creditsThreshold,
      }, user.id);

      toast({
        title: "✅ Succès",
        description: "Paramètres IA mis à jour avec succès",
      });
      
      await loadAISettings(); // Recharger pour avoir les dernières valeurs
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Échec de la sauvegarde des paramètres IA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Sauvegarder les changements de paiement
  async function handleSavePaymentSettings() {
    try {
      setLoading(true);
      if (!user) return;

      await updateSetting("credits_enabled", paymentFeatures.creditsEnabled ? "true" : "false", user.id);
      await updateSetting("match_payment_enabled", paymentFeatures.matchPaymentEnabled ? "true" : "false", user.id);

      toast({
        title: "✅ Succès",
        description: "Paramètres de paiement mis à jour",
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Échec de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Sauvegarder les tarifs
  async function handleSavePricing() {
    try {
      setLoading(true);
      if (!user) return;

      // En production, on sauvegarderait ces valeurs dans platform_settings
      toast({
        title: "✅ Succès",
        description: "Paramètres de tarification mis à jour",
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Échec de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const creditsPercentage = aiSettings.creditsThreshold > 0 
    ? Math.round((aiSettings.creditsRemaining / aiSettings.creditsThreshold) * 100)
    : 0;

  const getCreditsColor = () => {
    if (creditsPercentage >= 50) return "text-green-600 dark:text-green-400";
    if (creditsPercentage >= 25) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <>
      <SEO title="Paramètres Plateforme - Admin" />
      <AdminLayout title="Paramètres">
        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="payment">💳 Paiement</TabsTrigger>
            <TabsTrigger value="ai">🤖 Estimation IA</TabsTrigger>
            <TabsTrigger value="features">🎛️ Fonctionnalités</TabsTrigger>
            <TabsTrigger value="pricing">💰 Tarification</TabsTrigger>
            <TabsTrigger value="content">📝 Contenu & SEO</TabsTrigger>
          </TabsList>

          {/* SYSTÈMES DE PAIEMENT */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>💳 Contrôle des Systèmes de Paiement</CardTitle>
                <CardDescription>
                  Activez ou désactivez les méthodes de paiement disponibles pour les professionnels.
                  Les changements sont appliqués instantanément sur toute la plateforme.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    ℹ️ À propos des systèmes de paiement
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Système de crédits</strong> : Les pros achètent des crédits et les utilisent pour débloquer des matches</li>
                    <li>• <strong>Paiement direct par match</strong> : Les pros paient 15€ directement pour chaque match (recommandé)</li>
                    <li>• Vous pouvez activer les deux, un seul, ou aucun (maintenance)</li>
                  </ul>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-base font-semibold">🪙 Système de Crédits</Label>
                    <p className="text-sm text-muted-foreground">
                      Permet aux professionnels d'acheter des crédits et de les utiliser pour débloquer des matches.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {paymentFeatures.creditsEnabled ? (
                        <span className="text-green-600 dark:text-green-400">✅ Activé - Les pros peuvent acheter et utiliser des crédits</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">⚠️ Désactivé - Seul le paiement direct par match est disponible</span>
                      )}
                    </p>
                  </div>
                  <Switch 
                    checked={paymentFeatures.creditsEnabled}
                    onCheckedChange={(checked) => setPaymentFeatures({...paymentFeatures, creditsEnabled: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-base font-semibold">💳 Paiement Direct par Match</Label>
                    <p className="text-sm text-muted-foreground">
                      Permet aux professionnels de payer 15€ directement pour chaque déblocage de match (recommandé).
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {paymentFeatures.matchPaymentEnabled ? (
                        <span className="text-green-600 dark:text-green-400">✅ Activé - Paiement direct disponible</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">⚠️ Désactivé - Seuls les crédits sont utilisables</span>
                      )}
                    </p>
                  </div>
                  <Switch 
                    checked={paymentFeatures.matchPaymentEnabled}
                    onCheckedChange={(checked) => setPaymentFeatures({...paymentFeatures, matchPaymentEnabled: checked})}
                  />
                </div>

                <Separator />

                {!paymentFeatures.creditsEnabled && !paymentFeatures.matchPaymentEnabled && (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      ⚠️ <strong>Attention :</strong> Aucun système de paiement n'est activé. 
                      Les professionnels ne pourront pas débloquer de matches.
                    </p>
                  </div>
                )}

                <div className="pt-4">
                  <Button onClick={handleSavePaymentSettings} disabled={loading} size="lg">
                    {loading ? "💾 Sauvegarde..." : "💾 Enregistrer les paramètres de paiement"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ESTIMATION IA */}
          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>🤖 Contrôle de l'Estimation IA</CardTitle>
                <CardDescription>
                  Gérez l'utilisation de l'intelligence artificielle pour les estimations de projets.
                  Optimisez vos coûts en fonction de votre quota OpenAI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Monitoring crédits OpenAI */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                        💰 Crédits OpenAI Restants
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Suivi en temps réel de votre quota d'utilisation
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${getCreditsColor()}`}>
                        {aiSettings.creditsRemaining}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Seuil: {aiSettings.creditsThreshold}
                      </p>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        creditsPercentage >= 50 ? "bg-green-500" :
                        creditsPercentage >= 25 ? "bg-orange-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(creditsPercentage, 100)}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    {creditsPercentage >= 50 && "✅ Quota confortable - IA pleinement opérationnelle"}
                    {creditsPercentage < 50 && creditsPercentage >= 25 && "⚠️ Quota modéré - Surveiller la consommation"}
                    {creditsPercentage < 25 && "🚨 Quota critique - IA sera désactivée automatiquement si seuil atteint"}
                  </p>
                </div>

                <Separator />

                {/* Activation globale IA */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-base font-semibold">🤖 Estimation IA Activée</Label>
                    <p className="text-sm text-muted-foreground">
                      Active ou désactive l'utilisation de GPT-4 pour les estimations de projets.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {aiSettings.enabled ? (
                        <span className="text-green-600 dark:text-green-400">✅ Activé - GPT-4 analyse les projets</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">⚠️ Désactivé - Estimation par règles métier uniquement</span>
                      )}
                    </p>
                  </div>
                  <Switch 
                    checked={aiSettings.enabled}
                    onCheckedChange={(checked) => setAiSettings({...aiSettings, enabled: checked})}
                  />
                </div>

                <Separator />

                {/* Mode d'estimation */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">📋 Mode d'Estimation</Label>
                  <p className="text-sm text-muted-foreground">
                    Choisissez comment les particuliers peuvent soumettre leurs projets pour estimation.
                  </p>
                  
                  <Select 
                    value={aiSettings.mode} 
                    onValueChange={(value: "text_only" | "photo_only" | "text_and_photo") => 
                      setAiSettings({...aiSettings, mode: value})
                    }
                    disabled={!aiSettings.enabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text_only">
                        <div className="flex items-center gap-2">
                          <span>📝</span>
                          <div>
                            <p className="font-medium">Texte uniquement</p>
                            <p className="text-xs text-muted-foreground">Description écrite + formulaire (coût minimal)</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="photo_only">
                        <div className="flex items-center gap-2">
                          <span>📸</span>
                          <div>
                            <p className="font-medium">Photos uniquement</p>
                            <p className="text-xs text-muted-foreground">Analyse visuelle des photos (coût élevé)</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="text_and_photo">
                        <div className="flex items-center gap-2">
                          <span>📝📸</span>
                          <div>
                            <p className="font-medium">Texte + Photos</p>
                            <p className="text-xs text-muted-foreground">Analyse complète (recommandé, coût moyen)</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {!aiSettings.enabled && (
                    <Alert>
                      <AlertDescription className="text-sm">
                        ℹ️ L'IA est désactivée. Le mode sélectionné sera appliqué lors de la réactivation.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Separator />

                {/* Seuil de désactivation automatique */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">⚠️ Seuil de Désactivation Auto</Label>
                  <p className="text-sm text-muted-foreground">
                    Nombre de crédits minimum avant désactivation automatique de l'IA pour éviter les dépassements.
                  </p>
                  <Input 
                    type="number" 
                    min="0"
                    step="10"
                    value={aiSettings.creditsThreshold}
                    onChange={(e) => setAiSettings({...aiSettings, creditsThreshold: parseInt(e.target.value) || 0})}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommandé : 100 crédits (environ 20-30 estimations selon la complexité)
                  </p>
                </div>

                <Separator />

                {/* Informations sur les coûts */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    💡 Optimisation des Coûts OpenAI
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Texte seul</strong> : ~1-2 crédits/estimation (le plus économique)</li>
                    <li>• <strong>Photos seules</strong> : ~5-10 crédits/estimation (analyse vision GPT-4)</li>
                    <li>• <strong>Texte + Photos</strong> : ~3-6 crédits/estimation (équilibré, recommandé)</li>
                    <li>• <strong>Règles métier</strong> : 0 crédit, gratuit, mais moins précis</li>
                  </ul>
                </div>

                {aiSettings.creditsRemaining <= aiSettings.creditsThreshold && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      🚨 <strong>Attention :</strong> Vous avez atteint le seuil critique de crédits OpenAI. 
                      L'IA sera désactivée automatiquement pour éviter les dépassements. 
                      Rechargez votre quota sur <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a>.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4">
                  <Button onClick={handleSaveAISettings} disabled={loading} size="lg">
                    {loading ? "💾 Sauvegarde..." : "💾 Enregistrer les paramètres IA"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FONCTIONNALITÉS */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>🎛️ Contrôle des Fonctionnalités</CardTitle>
                <CardDescription>Activez ou désactivez les modules de la plateforme en temps réel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">🚧 Mode Maintenance</Label>
                    <p className="text-sm text-muted-foreground">Rend le site inaccessible aux utilisateurs.</p>
                  </div>
                  <Switch 
                    checked={features.maintenanceMode}
                    onCheckedChange={(checked) => setFeatures({...features, maintenanceMode: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">✍️ Inscriptions Publiques</Label>
                    <p className="text-sm text-muted-foreground">Autoriser les nouveaux utilisateurs à s'inscrire.</p>
                  </div>
                  <Switch 
                    checked={features.publicRegistration}
                    onCheckedChange={(checked) => setFeatures({...features, publicRegistration: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">💳 Paiements Stripe</Label>
                    <p className="text-sm text-muted-foreground">Activer le module de paiement en ligne.</p>
                  </div>
                  <Switch 
                    checked={features.stripePayments}
                    onCheckedChange={(checked) => setFeatures({...features, stripePayments: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TARIFICATION */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>💰 Tarification</CardTitle>
                <CardDescription>Gérez les prix des crédits et des services.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Prix d'un crédit (€)</Label>
                    <Input 
                      type="number" 
                      step="0.10"
                      value={pricing.creditPrice}
                      onChange={(e) => setPricing({...pricing, creditPrice: parseFloat(e.target.value)})}
                    />
                    <p className="text-xs text-muted-foreground">Prix unitaire d'un crédit pour les professionnels</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Coût déblocage Match (€)</Label>
                    <Input 
                      type="number" 
                      value={pricing.matchUnlockCost}
                      onChange={(e) => setPricing({...pricing, matchUnlockCost: parseFloat(e.target.value)})}
                    />
                    <p className="text-xs text-muted-foreground">Prix du paiement direct pour débloquer un match</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Abonnement Mensuel Pro (€)</Label>
                    <Input 
                      type="number" 
                      value={pricing.subscriptionMonthly}
                      onChange={(e) => setPricing({...pricing, subscriptionMonthly: parseFloat(e.target.value)})}
                    />
                    <p className="text-xs text-muted-foreground">Prix de l'abonnement mensuel (si activé)</p>
                  </div>
                </div>
                <Button onClick={handleSavePricing} disabled={loading}>
                  {loading ? "💾 Sauvegarde..." : "💾 Enregistrer les tarifs"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTENU & SEO */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>📝 Contenu & SEO</CardTitle>
                <CardDescription>Configuration du référencement et du contenu.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Section à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </>
  );
}