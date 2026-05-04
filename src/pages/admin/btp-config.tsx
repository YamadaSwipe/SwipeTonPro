import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  MessageCircle, 
  Shield, 
  DollarSign, 
  RefreshCw, 
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface QuotaSetting {
  key: string;
  value: any;
  description: string;
  category: string;
}

interface MatchingFee {
  id: string;
  min_amount: number;
  max_amount: number | null;
  fee_amount: number;
  is_percentage: boolean;
  percentage_value: number | null;
  is_active: boolean;
}

export default function BTPConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("quotas");

  // États pour les quotas
  const [quotas, setQuotas] = useState<QuotaSetting[]>([
    { key: "max_pro_estimates_daily", value: 5, description: "Max estimations Pro/jour", category: "quotas" },
    { key: "max_user_estimates_per_project", value: 3, description: "Max réponses par projet", category: "quotas" },
    { key: "max_client_estimates_weekly", value: 2, description: "Max estimations Client/semaine", category: "quotas" },
    { key: "anonymous_message_limit", value: 3, description: "Messages anonymes avant révélation", category: "quotas" },
  ]);

  const [features, setFeatures] = useState({
    stripe_escrow_enabled: true,
    ai_qualification_enabled: true,
    moderation_enabled: true,
  });

  // États pour les frais
  const [fees, setFees] = useState<MatchingFee[]>([]);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [editingFee, setEditingFee] = useState<MatchingFee | null>(null);
  const [feeForm, setFeeForm] = useState({
    min_amount: 0,
    max_amount: 0,
    fee_amount: 0,
    is_percentage: false,
    percentage_value: 0,
  });

  // Charger les données
  useEffect(() => {
    loadSettings();
    loadFees();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .in("category", ["quotas", "features"]);

      if (error) throw error;

      if (data) {
        const quotaSettings = data
          .filter(s => s.category === "quotas")
          .map(s => ({
            key: s.setting_key,
            value: s.setting_value?.value ?? s.setting_value,
            description: s.description,
            category: s.category,
          }));

        if (quotaSettings.length > 0) {
          setQuotas(quotaSettings);
        }

        const featureSettings = data.filter(s => s.category === "features");
        const featureMap: any = {};
        featureSettings.forEach(s => {
          featureMap[s.setting_key] = s.setting_value?.enabled ?? s.setting_value;
        });

        setFeatures(prev => ({ ...prev, ...featureMap }));
      }
    } catch (error) {
      console.error("Erreur chargement settings:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      });
    }
  }

  async function loadFees() {
    try {
      const { data, error } = await supabase
        .from("matching_fees")
        .select("*")
        .eq("is_active", true)
        .order("min_amount");

      if (error) throw error;
      setFees(data || []);
    } catch (error) {
      console.error("Erreur chargement frais:", error);
    }
  }

  // Sauvegarder un quota
  async function saveQuota(key: string, value: number) {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("app_settings")
        .update({
          setting_value: { value },
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", key);

      if (error) throw error;

      toast({
        title: "✅ Succès",
        description: "Quota mis à jour",
      });

      // Invalider le cache côté client
      await supabase.rpc("invalidate_settings_cache", { setting_key: key });
    } catch (error) {
      console.error("Erreur sauvegarde quota:", error);
      toast({
        title: "❌ Erreur",
        description: "Échec de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Sauvegarder une feature
  async function saveFeature(key: string, enabled: boolean) {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("app_settings")
        .update({
          setting_value: { enabled },
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", key);

      if (error) throw error;

      toast({
        title: "✅ Succès",
        description: "Fonctionnalité mise à jour",
      });
    } catch (error) {
      console.error("Erreur sauvegarde feature:", error);
      toast({
        title: "❌ Erreur",
        description: "Échec de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Créer/Modifier un palier
  async function saveFee() {
    try {
      setLoading(true);

      const feeData = {
        min_amount: feeForm.min_amount * 100, // Convertir en centimes
        max_amount: feeForm.max_amount > 0 ? feeForm.max_amount * 100 : null,
        fee_amount: feeForm.is_percentage ? 0 : feeForm.fee_amount * 100,
        is_percentage: feeForm.is_percentage,
        percentage_value: feeForm.is_percentage ? feeForm.percentage_value : null,
        is_active: true,
      };

      if (editingFee) {
        // Update
        const { error } = await supabase
          .from("matching_fees")
          .update({
            ...feeData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingFee.id);

        if (error) throw error;

        toast({ title: "✅ Succès", description: "Palier mis à jour" });
      } else {
        // Create
        const { error } = await supabase
          .from("matching_fees")
          .insert({
            ...feeData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;

        toast({ title: "✅ Succès", description: "Palier créé" });
      }

      setShowFeeForm(false);
      setEditingFee(null);
      setFeeForm({ min_amount: 0, max_amount: 0, fee_amount: 0, is_percentage: false, percentage_value: 0 });
      loadFees();
    } catch (error) {
      console.error("Erreur sauvegarde frais:", error);
      toast({
        title: "❌ Erreur",
        description: "Échec de la sauvegarde du palier",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Supprimer un palier
  async function deleteFee(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce palier ?")) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("matching_fees")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "✅ Succès", description: "Palier supprimé" });
      loadFees();
    } catch (error) {
      console.error("Erreur suppression frais:", error);
      toast({
        title: "❌ Erreur",
        description: "Échec de la suppression",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Formater le montant
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);
  };

  return (
    <>
      <SEO title="Configuration BTP - Admin" />
      <AdminLayout title="Configuration BTP">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="quotas">
              <Users className="w-4 h-4 mr-2" />
              Quotas
            </TabsTrigger>
            <TabsTrigger value="fees">
              <DollarSign className="w-4 h-4 mr-2" />
              Frais Matching
            </TabsTrigger>
            <TabsTrigger value="features">
              <Shield className="w-4 h-4 mr-2" />
              Fonctionnalités
            </TabsTrigger>
          </TabsList>

          {/* QUOTAS */}
          <TabsContent value="quotas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestion des Quotas
                </CardTitle>
                <CardDescription>
                  Configurez les limites d'utilisation pour professionnels, clients et projets.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  {quotas.map((quota) => (
                    <div
                      key={quota.key}
                      className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {quota.description}
                          </h3>
                          <code className="text-xs text-muted-foreground bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                            {quota.key}
                          </code>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {quota.category}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label className="text-sm">Valeur actuelle</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              value={quota.value}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value) || 0;
                                setQuotas(quotas.map(q =>
                                  q.key === quota.key ? { ...q, value: newValue } : q
                                ));
                              }}
                              className="w-24"
                              min={1}
                              max={100}
                            />
                            <span className="text-sm text-muted-foreground">
                              {quota.key.includes("message") ? "messages" : 
                               quota.key.includes("weekly") ? "estimations/semaine" :
                               quota.key.includes("daily") ? "estimations/jour" : "estimations"}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => saveQuota(quota.key, quota.value)}
                          disabled={loading}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Sauvegarder
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    ℹ️ Règles de Quotas
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Pro/Jour</strong> : Limitation pour éviter le spam de réponses</li>
                    <li>• <strong>Projet</strong> : Fermeture automatique après 3 réponses (principe de rareté)</li>
                    <li>• <strong>Client/Semaine</strong> : Empêche la création excessive de demandes</li>
                    <li>• <strong>Messages</strong> : 3 messages anonymes avant révélation des coordonnées</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FRAIS MATCHING */}
          <TabsContent value="fees">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Paliers de Frais de Matching
                  </CardTitle>
                  <CardDescription>
                    Configurez les frais selon le montant du projet.
                  </CardDescription>
                </div>
                <Button onClick={() => setShowFeeForm(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Nouveau Palier
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Liste des paliers */}
                <div className="space-y-3">
                  {fees.map((fee) => (
                    <div
                      key={fee.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
                          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {formatAmount(fee.min_amount)} - {fee.max_amount ? formatAmount(fee.max_amount) : "∞"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Frais : {fee.is_percentage
                              ? `${fee.percentage_value}% (${formatAmount(fee.min_amount * (fee.percentage_value! / 100))})`
                              : formatAmount(fee.fee_amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingFee(fee);
                            setFeeForm({
                              min_amount: fee.min_amount / 100,
                              max_amount: fee.max_amount ? fee.max_amount / 100 : 0,
                              fee_amount: fee.fee_amount / 100,
                              is_percentage: fee.is_percentage,
                              percentage_value: fee.percentage_value || 0,
                            });
                            setShowFeeForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFee(fee.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {fees.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Aucun palier configuré</p>
                      <p className="text-sm">Les valeurs par défaut seront utilisées</p>
                    </div>
                  )}
                </div>

                {/* Formulaire */}
                {showFeeForm && (
                  <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-semibold mb-4">
                      {editingFee ? "Modifier le palier" : "Nouveau palier"}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Montant min (€)</Label>
                        <Input
                          type="number"
                          value={feeForm.min_amount}
                          onChange={(e) => setFeeForm({ ...feeForm, min_amount: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Montant max (€) - laisser vide pour ∞</Label>
                        <Input
                          type="number"
                          value={feeForm.max_amount || ""}
                          onChange={(e) => setFeeForm({ ...feeForm, max_amount: parseFloat(e.target.value) || 0 })}
                          placeholder="∞"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type de frais</Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={feeForm.is_percentage}
                            onCheckedChange={(checked) => setFeeForm({ ...feeForm, is_percentage: checked })}
                          />
                          <span className="text-sm">
                            {feeForm.is_percentage ? "Pourcentage (%)" : "Montant fixe (€)"}
                          </span>
                        </div>
                      </div>
                      {feeForm.is_percentage ? (
                        <div className="space-y-2">
                          <Label>Pourcentage (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={feeForm.percentage_value}
                            onChange={(e) => setFeeForm({ ...feeForm, percentage_value: parseFloat(e.target.value) })}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Montant fixe (€)</Label>
                          <Input
                            type="number"
                            value={feeForm.fee_amount}
                            onChange={(e) => setFeeForm({ ...feeForm, fee_amount: parseFloat(e.target.value) })}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowFeeForm(false);
                          setEditingFee(null);
                        }}
                      >
                        Annuler
                      </Button>
                      <Button onClick={saveFee} disabled={loading}>
                        {loading ? "Sauvegarde..." : "Sauvegarder"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Valeurs par défaut
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Si aucun palier n'est configuré, les frais par défaut seront appliqués :
                  </p>
                  <ul className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1">
                    <li>• 0-500€ : 15€</li>
                    <li>• 500-1000€ : 29€</li>
                    <li>• 1000-2000€ : 49€</li>
                    <li>• 2000-5000€ : 99€</li>
                    <li>• 5000-10000€ : 149€</li>
                    <li>• &gt;10000€ : 249€</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FONCTIONNALITÉS */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Fonctionnalités BTP
                </CardTitle>
                <CardDescription>
                  Activez ou désactivez les modules du système BTP.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Stripe Escrow */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">Séquestre Stripe</span>
                        {features.stripe_escrow_enabled && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Active le séquestre de paiement via Stripe pour les projets fermes.
                      </p>
                    </div>
                    <Switch
                      checked={features.stripe_escrow_enabled}
                      onCheckedChange={(checked) => {
                        setFeatures({ ...features, stripe_escrow_enabled: checked });
                        saveFeature("stripe_escrow_enabled", checked);
                      }}
                    />
                  </div>

                  <Separator />

                  {/* AI Qualification */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold">Qualification IA</span>
                        {features.ai_qualification_enabled && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Utilise GPT-4 pour qualifier automatiquement les projets et estimer les budgets.
                      </p>
                    </div>
                    <Switch
                      checked={features.ai_qualification_enabled}
                      onCheckedChange={(checked) => {
                        setFeatures({ ...features, ai_qualification_enabled: checked });
                        saveFeature("ai_qualification_enabled", checked);
                      }}
                    />
                  </div>

                  <Separator />

                  {/* Modération */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold">Modération Automatique</span>
                        {features.moderation_enabled && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Détecte et bloque les coordonnées (email, téléphone) dans les messages anonymes.
                      </p>
                    </div>
                    <Switch
                      checked={features.moderation_enabled}
                      onCheckedChange={(checked) => {
                        setFeatures({ ...features, moderation_enabled: checked });
                        saveFeature("moderation_enabled", checked);
                      }}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    ℹ️ Impact des fonctionnalités
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Séquestre Stripe</strong> : Désactivé = paiements classiques sans escrow</li>
                    <li>• <strong>Qualification IA</strong> : Désactivé = estimation manuelle uniquement</li>
                    <li>• <strong>Modération</strong> : Désactivé = pas de blocage des coordonnées</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </>
  );
}
