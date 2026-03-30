import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { getAllPricingTiers, updatePricingTier, PricingTier } from "@/services/matchPaymentService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Euro,
  Save,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit3,
  X,
} from "lucide-react";

export default function AdminPricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ price_euros: string; label: string; description: string }>({
    price_euros: "",
    label: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      router.push("/");
      return;
    }

    loadTiers();
  }

  async function loadTiers() {
    setLoading(true);
    const data = await getAllPricingTiers();
    setTiers(data);
    setLoading(false);
  }

  function startEdit(tier: PricingTier) {
    setEditingId(tier.id);
    setEditValues({
      price_euros: tier.price_euros.toString(),
      label: tier.label,
      description: tier.description || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({ price_euros: "", label: "", description: "" });
  }

  async function saveEdit(tierId: string) {
    const priceEuros = parseFloat(editValues.price_euros);
    if (isNaN(priceEuros) || priceEuros <= 0) {
      toast({ title: "Erreur", description: "Le prix doit être un nombre positif", variant: "destructive" });
      return;
    }

    setSaving(true);
    const result = await updatePricingTier(tierId, {
      price_cents: Math.round(priceEuros * 100),
      label: editValues.label,
      description: editValues.description,
    });

    if (result.success) {
      toast({ title: "✅ Tarif mis à jour", description: "La grille tarifaire est active immédiatement." });
      cancelEdit();
      loadTiers();
    } else {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
    }
    setSaving(false);
  }

  async function toggleActive(tier: PricingTier) {
    const result = await updatePricingTier(tier.id, { is_active: !tier.is_active });
    if (result.success) {
      toast({
        title: tier.is_active ? "Palier désactivé" : "Palier activé",
        description: `${tier.label} est maintenant ${tier.is_active ? "inactif" : "actif"}.`,
      });
      loadTiers();
    }
  }

  function formatBudget(min: number, max: number | null) {
    const formatNum = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(0)}k€` : `${n}€`;
    if (!max) return `${formatNum(min)}+`;
    return `${formatNum(min)} — ${formatNum(max)}`;
  }

  const totalActiveRevenue = tiers
    .filter((t) => t.is_active)
    .reduce((acc, t) => acc + t.price_euros, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Grille Tarifaire</h1>
              <p className="text-sm text-gray-400">Gestion des paliers de mise en relation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Paliers actifs</p>
              <p className="text-lg font-bold text-emerald-400">
                {tiers.filter((t) => t.is_active).length} / {tiers.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">Modifications en temps réel</p>
            <p className="text-sm text-blue-400/80 mt-1">
              Tout changement est appliqué immédiatement. Les nouveaux matchs utiliseront le prix mis à jour. Les paiements déjà en cours ne sont pas affectés.
            </p>
          </div>
        </div>

        {/* Grille des paliers */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {tiers.map((tier, index) => (
              <Card
                key={tier.id}
                className={`border transition-all duration-200 ${
                  tier.is_active
                    ? "bg-gray-900 border-white/10 hover:border-white/20"
                    : "bg-gray-900/40 border-white/5 opacity-60"
                }`}
              >
                <CardContent className="p-6">
                  {editingId === tier.id ? (
                    /* Mode édition */
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                          Mode édition
                        </Badge>
                        <span className="text-sm text-gray-400">{formatBudget(tier.budget_min, tier.budget_max)}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Libellé</label>
                          <input
                            type="text"
                            value={editValues.label}
                            onChange={(e) => setEditValues({ ...editValues, label: e.target.value })}
                            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Prix (€)</label>
                          <div className="relative">
                            <Euro className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editValues.price_euros}
                              onChange={(e) => setEditValues({ ...editValues, price_euros: e.target.value })}
                              className="w-full bg-gray-800 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Description</label>
                          <input
                            type="text"
                            value={editValues.description}
                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => saveEdit(tier.id)}
                          disabled={saving}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                          size="sm"
                        >
                          <Save className="h-4 w-4" />
                          {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white gap-2"
                        >
                          <X className="h-4 w-4" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Mode affichage */
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Numéro palier */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          tier.is_active
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-gray-700 text-gray-500"
                        }`}>
                          {index + 1}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">{tier.label}</span>
                            {!tier.is_active && (
                              <Badge className="bg-gray-700 text-gray-400 border-gray-600 text-xs">
                                Inactif
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            Budget projet : <span className="text-gray-300 font-medium">{formatBudget(tier.budget_min, tier.budget_max)}</span>
                          </p>
                          {tier.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Prix + Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">{tier.price_euros}€</p>
                          <p className="text-xs text-gray-500">mise en relation</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(tier)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                            title="Modifier"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(tier)}
                            className={`p-2 rounded-lg transition-colors ${
                              tier.is_active
                                ? "hover:bg-red-500/10 text-emerald-400 hover:text-red-400"
                                : "hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400"
                            }`}
                            title={tier.is_active ? "Désactiver" : "Activer"}
                          >
                            {tier.is_active ? (
                              <ToggleRight className="h-5 w-5" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Résumé */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900 border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Paliers actifs</p>
              <p className="text-2xl font-bold text-emerald-400">
                {tiers.filter((t) => t.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Prix minimum</p>
              <p className="text-2xl font-bold text-white">
                {Math.min(...tiers.filter(t => t.is_active).map(t => t.price_euros))}€
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Prix maximum</p>
              <p className="text-2xl font-bold text-white">
                {Math.max(...tiers.filter(t => t.is_active).map(t => t.price_euros))}€
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
