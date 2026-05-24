import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowDownLeft, ArrowUpRight, ShoppingCart, RotateCcw, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  balance_after: number;
  created_at: string | null;
  created_by: string | null;
  description: string;
  metadata: Json | null;
  professional_id: string;
  reference_id: string | null;
  reference_type: string | null;
  credits_amount: number;
  status: string;
  amount_euros?: number;
}

export default function CreditTransactions() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  useEffect(() => {
    loadProfessionalAndTransactions();
  }, []);

  const loadProfessionalAndTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pro } = await supabase.from('professionals').select('id').eq('user_id', user.id).single();
      if (!pro) return;

      setProfessionalId(pro.id);

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('professional_id', pro.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions((data || []) as CreditTransaction[]);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ShoppingCart className="h-4 w-4" />;
      case 'usage': return <ArrowUpRight className="h-4 w-4" />;
      case 'refund': return <RotateCcw className="h-4 w-4" />;
      case 'bonus': return <ArrowDownLeft className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-blue-100 text-blue-600';
      case 'usage': return 'bg-red-100 text-red-600';
      case 'refund': return 'bg-green-100 text-green-600';
      case 'bonus': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Achat';
      case 'usage': return 'Utilisation';
      case 'refund': return 'Remboursement';
      case 'bonus': return 'Bonus';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Complété</Badge>;
      case 'pending': return <Badge variant="secondary">En attente</Badge>;
      case 'failed': return <Badge variant="destructive">Échoué</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique des transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Aucune transaction</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTransactionColor(tx.type)}`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{getTransactionLabel(tx.type)}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </p>
                    {tx.description && <p className="text-xs text-slate-400">{tx.description}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.type === 'usage' ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.type === 'usage' ? '-' : '+'}{tx.credits_amount} crédits
                  </p>
                  {tx.amount_euros && (
                    <p className="text-xs text-slate-500">{tx.amount_euros}€</p>
                  )}
                  <div className="mt-1">{getStatusBadge(tx.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
