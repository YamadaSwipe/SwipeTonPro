import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Coins, Plus, Edit2, Trash2, ArrowLeft, Sparkles, Save, X, Loader2, Package, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { CreditPackage } from '@/services/creditPackageService';

interface CreditStats { totalCreditsInCirculation: number; totalPurchases: number; totalRevenue: number; activeProfessionals: number; avgBalance: number; }

export default function AdminCreditPackagesPage() {
  const router = useRouter(); const { toast } = useToast();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [loading, setLoading] = useState(true), [isAdmin, setIsAdmin] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null), [isCreating, setIsCreating] = useState(false), [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', credits_amount: 10, price_euros: 50, bonus_credits: 0, is_promotional: false, promotion_label: '', is_active: true, sort_order: 0 });

  useEffect(() => { checkAdminAndLoad(); }, []);

  const checkAdminAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!['admin', 'super_admin'].includes(profile?.role)) { router.push('/'); return; }
      setIsAdmin(true); await loadData();
    } catch (error) { router.push('/'); }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const [packagesRes, statsRes] = await Promise.all([
        fetch('/api/credits/packages', { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
        fetch('/api/credits/stats', { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
      ]);
      if (packagesRes.ok) { const d = await packagesRes.json(); setPackages(d.packages || []); }
      if (statsRes.ok) { const d = await statsRes.json(); setStats(d.stats); }
    } catch (error) { toast({ title: 'Erreur', description: 'Chargement impossible', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/credits/packages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` }, body: JSON.stringify(formData) });
      if (!response.ok) throw new Error('Failed');
      toast({ title: 'Succès', description: 'Package créé' }); setIsCreating(false); resetForm(); await loadData();
    } catch (error) { toast({ title: 'Erreur', description: 'Création impossible', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingPackage) return; setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/credits/packages', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` }, body: JSON.stringify({ id: editingPackage.id, ...formData }) });
      if (!response.ok) throw new Error('Failed');
      toast({ title: 'Succès', description: 'Package mis à jour' }); setEditingPackage(null); resetForm(); await loadData();
    } catch (error) { toast({ title: 'Erreur', description: 'Mise à jour impossible', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (pkg: CreditPackage) => {
    if (!confirm(`Supprimer "${pkg.name}" ?`)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/credits/packages?id=${pkg.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${session?.access_token}` } });
      if (!response.ok) throw new Error('Failed');
      toast({ title: 'Succès', description: 'Package supprimé' }); await loadData();
    } catch (error) { toast({ title: 'Erreur', description: 'Suppression impossible', variant: 'destructive' }); }
  };

  const resetForm = () => { setFormData({ name: '', credits_amount: 10, price_euros: 50, bonus_credits: 0, is_promotional: false, promotion_label: '', is_active: true, sort_order: 0 }); };
  const openEdit = (pkg: CreditPackage) => { setEditingPackage(pkg); setFormData({ name: pkg.name, credits_amount: pkg.credits_amount, price_euros: pkg.price_euros, bonus_credits: pkg.bonus_credits || 0, is_promotional: pkg.is_promotional, promotion_label: pkg.promotion_label || '', is_active: pkg.is_active, sort_order: pkg.sort_order }); };
  const openCreate = () => { setIsCreating(true); resetForm(); };
  const totalCredits = formData.credits_amount + formData.bonus_credits;
  const pricePerCredit = totalCredits > 0 ? formData.price_euros / totalCredits : 0;

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl font-bold">Accès réservé</h1></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div><Link href="/admin/dashboard"><Button variant="ghost" className="mb-2 pl-0"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button></Link><h1 className="text-3xl font-bold">Gestion des Crédits</h1></div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nouveau Package</Button>
        </div>
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-lg"><Coins className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{stats.totalCreditsInCirculation}</p><p className="text-xs text-slate-500">Crédits en circulation</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-green-100 p-2 rounded-lg"><Package className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{stats.totalPurchases}</p><p className="text-xs text-slate-500">Achats total</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-purple-100 p-2 rounded-lg"><TrendingUp className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{stats.totalRevenue.toFixed(0)}€</p><p className="text-xs text-slate-500">Revenu estimé</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-orange-100 p-2 rounded-lg"><Coins className="h-5 w-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{stats.activeProfessionals}</p><p className="text-xs text-slate-500">Pros actifs</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-pink-100 p-2 rounded-lg"><Coins className="h-5 w-5 text-pink-600" /></div><div><p className="text-2xl font-bold">{stats.avgBalance}</p><p className="text-xs text-slate-500">Solde moyen</p></div></div></CardContent></Card>
          </div>
        )}
        <Card>
          <CardHeader><CardTitle>Liste des Packages</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full">
              <thead><tr className="border-b"><th className="text-left py-3 px-4">Nom</th><th className="text-left py-3 px-4">Crédits</th><th className="text-left py-3 px-4">Bonus</th><th className="text-left py-3 px-4">Total</th><th className="text-left py-3 px-4">Prix</th><th className="text-left py-3 px-4">Actions</th></tr></thead>
              <tbody>
                {packages.map((pkg) => {
                  const total = pkg.credits_amount + (pkg.bonus_credits || 0);
                  return (
                    <tr key={pkg.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4"><div className="flex items-center gap-2"><span className="font-medium">{pkg.name}</span>{pkg.is_promotional && <Badge className="bg-orange-100 text-orange-800"><Sparkles className="h-3 w-3 mr-1" />{pkg.promotion_label || 'Promo'}</Badge>}</div></td>
                      <td className="py-3 px-4">{pkg.credits_amount}</td>
                      <td className="py-3 px-4">{pkg.bonus_credits > 0 ? <span className="text-green-600">+{pkg.bonus_credits}</span> : <span className="text-slate-400">-</span>}</td>
                      <td className="py-3 px-4 font-semibold">{total}</td>
                      <td className="py-3 px-4">{pkg.price_euros}€</td>
                      <td className="py-3 px-4"><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}><Edit2 className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(pkg)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Dialog open={isCreating || !!editingPackage} onOpenChange={() => { setIsCreating(false); setEditingPackage(null); resetForm(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingPackage ? 'Modifier' : 'Nouveau'} Package</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Nom</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Pack Pro 50 crédits" /></div>
              <div className="grid grid-cols-2 gap-4"><div><Label>Crédits base</Label><Input type="number" value={formData.credits_amount} onChange={(e) => setFormData({ ...formData, credits_amount: parseInt(e.target.value) || 0 })} /></div><div><Label>Crédits bonus</Label><Input type="number" value={formData.bonus_credits} onChange={(e) => setFormData({ ...formData, bonus_credits: parseInt(e.target.value) || 0 })} /></div></div>
              <div><Label>Prix (€)</Label><Input type="number" value={formData.price_euros} onChange={(e) => setFormData({ ...formData, price_euros: parseFloat(e.target.value) || 0 })} /></div>
              <div className="bg-slate-50 p-3 rounded-lg"><p className="text-sm text-slate-600"><strong>Total:</strong> {totalCredits} crédits</p><p className="text-sm text-slate-500">~{pricePerCredit.toFixed(2)}€/crédit</p></div>
              <div className="flex items-center gap-2"><Switch checked={formData.is_promotional} onCheckedChange={(checked) => setFormData({ ...formData, is_promotional: checked })} /><Label>Promotionnel</Label></div>
              {formData.is_promotional && <div><Label>Label promo</Label><Input value={formData.promotion_label} onChange={(e) => setFormData({ ...formData, promotion_label: e.target.value })} placeholder="+10 gratuits" /></div>}
              <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} /><Label>Actif</Label></div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => { setIsCreating(false); setEditingPackage(null); resetForm(); }} className="flex-1"><X className="h-4 w-4 mr-2" />Annuler</Button>
                <Button onClick={editingPackage ? handleUpdate : handleCreate} disabled={saving || !formData.name} className="flex-1">{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}{editingPackage ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
