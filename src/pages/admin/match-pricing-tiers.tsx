import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Euro, Plus, Edit2, Trash2, ArrowLeft, Save, X, Loader2, 
  Layers, TrendingUp, CreditCard, Package
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface PricingTier {
  id: string;
  key: string;
  label: string;
  description: string;
  budget_min: number;
  budget_max: number | null;
  credits_cost: number;
  price_cents: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TierStats {
  totalTiers: number;
  activeTiers: number;
  avgPrice: number;
}

export default function MatchPricingTiersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [stats, setStats] = useState<TierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    label: '',
    description: '',
    budget_min: 0,
    budget_max: 0,
    credits_cost: 1,
    price_cents: 500,
    sort_order: 1,
    is_active: true
  });

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!['admin', 'super_admin'].includes(profile?.role)) {
        router.push('/');
        return;
      }
      setIsAdmin(true);
      await loadData();
    } catch (error) {
      router.push('/');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/match-pricing-tiers', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTiers(data.tiers || []);
        calculateStats(data.tiers || []);
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Chargement impossible', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tierData: PricingTier[]) => {
    const active = tierData.filter(t => t.is_active);
    const avgPrice = tierData.length > 0
      ? Math.round(tierData.reduce((sum, t) => sum + t.price_cents, 0) / tierData.length)
      : 0;
    setStats({
      totalTiers: tierData.length,
      activeTiers: active.length,
      avgPrice
    });
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/match-pricing-tiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          budget_max: formData.budget_max === 0 ? null : formData.budget_max
        })
      });
      if (!response.ok) throw new Error('Failed');
      toast({ title: 'Succès', description: 'Palier créé' });
      setIsCreating(false);
      resetForm();
      await loadData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Création impossible', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTier) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/match-pricing-tiers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          id: editingTier.id,
          ...formData,
          budget_max: formData.budget_max === 0 ? null : formData.budget_max
        })
      });
      if (!response.ok) throw new Error('Failed');
      toast({ title: 'Succès', description: 'Palier mis à jour' });
      setEditingTier(null);
      resetForm();
      await loadData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Mise à jour impossible', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tier: PricingTier) => {
    if (!confirm(`Supprimer "${tier.label}" ?`)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/admin/match-pricing-tiers?id=${tier.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (!response.ok) throw new Error('Failed');
      toast({ title: 'Succès', description: 'Palier supprimé' });
      await loadData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Suppression impossible', variant: 'destructive' });
    }
  };

  const openEdit = (tier: PricingTier) => {
    setEditingTier(tier);
    setFormData({
      key: tier.key,
      label: tier.label,
      description: tier.description,
      budget_min: tier.budget_min,
      budget_max: tier.budget_max || 0,
      credits_cost: tier.credits_cost,
      price_cents: tier.price_cents,
      sort_order: tier.sort_order,
      is_active: tier.is_active
    });
  };

  const openCreate = () => {
    setIsCreating(true);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      key: '',
      label: '',
      description: '',
      budget_min: 0,
      budget_max: 0,
      credits_cost: 1,
      price_cents: 500,
      sort_order: tiers.length + 1,
      is_active: true
    });
  };

  const formatBudget = (min: number, max: number | null) => {
    const minEuros = min / 100;
    if (!max) return `> ${formatCurrency(minEuros)}`;
    const maxEuros = max / 100;
    return `${formatCurrency(minEuros)} - ${formatCurrency(maxEuros)}`;
  };

  if (!isAdmin && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Vérification...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Paliers tarifaires des Matchs</h1>
              <p className="text-sm text-gray-500">Gérez les prix des matchs basés sur l'estimation IA</p>
            </div>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau palier
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500">Total paliers</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.totalTiers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500">Actifs</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.activeTiers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-500">Prix moyen</span>
                </div>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.avgPrice / 100)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Euro className="h-5 w-5 text-orange-500" />
              Liste des paliers
            </CardTitle>
            <CardDescription>
              Chaque palier correspond à une fourchette de budget estimé par l'IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : tiers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun palier configuré</p>
                <Button onClick={openCreate} variant="outline" className="mt-4">
                  Créer un palier
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      tier.is_active ? 'bg-white' : 'bg-gray-50 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">{tier.sort_order}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tier.label}</span>
                          {!tier.is_active && (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {tier.description}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span>Budget: {formatBudget(tier.budget_min, tier.budget_max)}</span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {tier.credits_cost} crédit{tier.credits_cost > 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            {formatCurrency(tier.price_cents / 100)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(tier)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tier)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreating || !!editingTier} onOpenChange={() => { setIsCreating(false); setEditingTier(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Modifier le palier' : 'Nouveau palier tarifaire'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clé (identifiant)</Label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="ex: small"
                  disabled={!!editingTier}
                />
              </div>
              <div className="space-y-2">
                <Label>Ordre d'affichage</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nom du palier</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="ex: Petit projet"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ex: Projets jusqu a 1000 euros"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget min (centimes)</Label>
                <Input
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => setFormData({ ...formData, budget_min: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-400">{formatCurrency(formData.budget_min / 100)}</p>
              </div>
              <div className="space-y-2">
                <Label>Budget max (centimes, 0 = illimité)</Label>
                <Input
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) || 0 })}
                  placeholder="100000"
                />
                <p className="text-xs text-gray-400">
                  {formData.budget_max === 0 ? 'Illimité' : formatCurrency(formData.budget_max / 100)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coût en crédits</Label>
                <Input
                  type="number"
                  value={formData.credits_cost}
                  onChange={(e) => setFormData({ ...formData, credits_cost: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prix en centimes</Label>
                <Input
                  type="number"
                  value={formData.price_cents}
                  onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-400">{formatCurrency(formData.price_cents / 100)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Palier actif</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => { setIsCreating(false); setEditingTier(null); }}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={editingTier ? handleUpdate : handleCreate}
              disabled={saving || !formData.key || !formData.label}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {editingTier ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
