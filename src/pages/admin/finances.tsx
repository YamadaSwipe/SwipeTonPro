import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Euro, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminFinances() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    creditsSold: 0,
    creditsSpent: 0,
    averageBasket: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  async function loadFinancialData() {
    try {
      setLoading(true);
      
      // Charger les transactions
      const { data, error } = await supabase
        .from("credit_transactions")
        .select(`
          *,
          professional:professionals(company_name, user_id)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculer les stats (sur un plus grand dataset en prod)
      const purchaseTransactions = data?.filter(t => t.type === 'purchase') || [];
      const totalRevenue = purchaseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const creditsSpent = data?.filter(t => t.type === 'spend').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      setStats({
        totalRevenue,
        creditsSold: purchaseTransactions.reduce((sum, t) => sum + t.amount, 0),
        creditsSpent,
        averageBasket: purchaseTransactions.length ? Math.round(totalRevenue / purchaseTransactions.length) : 0
      });

      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading finances:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "spend": return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case "bonus": return <CreditCard className="h-4 w-4 text-blue-600" />;
      default: return <Euro className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <>
      <SEO title="Finances & Revenus - Admin" />
      <AdminLayout title="Finances">
        
        {/* Stats Financières */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Revenu Total"
            value={`${stats.totalRevenue}€`}
            icon={Euro}
            trend={{ value: 15, isPositive: true }}
            description="Ventes de crédits"
          />
          <StatsCard
            title="Crédits Vendus"
            value={stats.creditsSold}
            icon={TrendingUp}
            description="Volume total"
          />
          <StatsCard
            title="Crédits Consommés"
            value={stats.creditsSpent}
            icon={TrendingDown}
            description="Utilisation plateforme"
          />
          <StatsCard
            title="Panier Moyen"
            value={`${stats.averageBasket}€`}
            icon={CreditCard}
            description="Par transaction"
          />
        </div>

        {/* Tableau des Transactions */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold">Dernières Transactions</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Professionnel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(t.created_at), "dd/MM HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {t.professional?.company_name || "Inconnu"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(t.type)}
                        <span className="capitalize">{t.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                      {t.description}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${t.amount > 0 ? "text-green-600" : "text-slate-900"}`}>
                      {t.amount > 0 ? "+" : ""}{t.amount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </AdminLayout>
    </>
  );
}