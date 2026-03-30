"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Calendar,
  Download,
  CreditCard,
  Award,
  Zap,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { commissionService } from '@/services/commissionService';
import { supabase } from '@/integrations/supabase/client';

interface CommissionDashboard {
  currentPeriod: any;
  commissionHistory: any[];
  payoutRequests: any[];
  projections: any;
  currentTier: any;
  nextTier: any;
  summary: any;
}

export default function CommissionDashboard() {
  const [dashboard, setDashboard] = useState<CommissionDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await commissionService.getCommissionDashboard(user.id);
      setDashboard(data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const csv = await commissionService.exportCommissionsCSV(user.id);
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commissions-${user.id}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export CSV:', error);
    }
  };

  const getTierColor = (tierId: string) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800 border-orange-200',
      silver: 'bg-gray-100 text-gray-800 border-gray-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      platinum: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[tierId as keyof typeof colors] || colors.bronze;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Erreur de chargement du dashboard</p>
          <Button onClick={loadDashboard} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Dashboard Commissions
            </h1>
            <p className="text-gray-600 mt-1">
              Suivez vos revenus et performances
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
            <Button>
              <CreditCard className="w-4 h-4 mr-2" />
              Demander Paiement
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenu Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{dashboard.summary.totalEarned.toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg text-white">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Leads Vendus</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard.summary.totalLeads}
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg text-white">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Commission Moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{dashboard.summary.averageCommission.toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paiements en Attente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{dashboard.summary.pendingPayouts.toFixed(2)}
                  </p>
                </div>
                <div className="bg-orange-500 p-3 rounded-lg text-white">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Period & Tier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Period */}
          <Card>
            <CardHeader>
              <CardTitle>Période Actuelle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboard.currentPeriod ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Leads vendus</span>
                    <Badge variant="outline">
                      {dashboard.currentPeriod.totalLeads}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenu généré</span>
                    <span className="font-medium">
                      €{dashboard.currentPeriod.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Commission totale</span>
                    <span className="font-bold text-green-600">
                      €{dashboard.currentPeriod.totalCommission.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Commission base</span>
                      <span className="text-sm">
                        €{dashboard.currentPeriod.baseCommission.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bonus tier</span>
                      <span className="text-sm text-green-600">
                        +€{dashboard.currentPeriod.tierBonus.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bonus performance</span>
                      <span className="text-sm text-green-600">
                        +€{dashboard.currentPeriod.performanceBonus.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Aucune donnée pour la période actuelle</p>
              )}
            </CardContent>
          </Card>

          {/* Tier Status */}
          <Card>
            <CardHeader>
              <CardTitle>Votre Tier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg border ${getTierColor(dashboard.currentTier.id)}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{dashboard.currentTier.name}</h3>
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Taux de commission:</span>
                    <span className="font-medium">
                      {(dashboard.currentTier.commissionRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission par lead:</span>
                    <span className="font-medium">
                      €{dashboard.currentTier.baseCommission}
                    </span>
                  </div>
                </div>
              </div>

              {dashboard.nextTier && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Zap className="w-4 h-4 mr-1" />
                    Prochain tier: {dashboard.nextTier.name}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Leads manquants:</span>
                    <Badge variant="outline">
                      {dashboard.nextTier.minLeads - dashboard.currentPeriod.totalLeads} leads
                    </Badge>
                  </div>
                  <Progress 
                    value={(dashboard.currentPeriod.totalLeads / dashboard.nextTier.minLeads) * 100}
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="payouts">Paiements</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.commissionHistory.map((commission, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{commission.period}</span>
                          <Badge className={getTierColor(commission.tier.id)}>
                            {commission.tier.name}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {commission.totalLeads} leads • €{commission.totalRevenue.toFixed(2)} revenu
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          €{commission.totalCommission.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          +€{commission.tierBonus.toFixed(2)} bonus
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Demandes de Paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.payoutRequests.map((payout, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{payout.period}</span>
                          <Badge className={getStatusColor(payout.status)}>
                            {payout.status === 'pending' && 'En attente'}
                            {payout.status === 'approved' && 'Approuvé'}
                            {payout.status === 'paid' && 'Payé'}
                            {payout.status === 'rejected' && 'Rejeté'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Créée le {new Date(payout.createdAt).toLocaleDateString()}
                        </div>
                        {payout.rejectedReason && (
                          <div className="text-sm text-red-600 mt-1">
                            Raison: {payout.rejectedReason}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          €{payout.amount.toFixed(2)}
                        </div>
                        {payout.paidAt && (
                          <div className="text-xs text-green-600">
                            Payé le {new Date(payout.paidAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projections" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Projections Mensuelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tendance mensuelle</span>
                    <div className="flex items-center">
                      {dashboard.projections.monthlyTrend >= 0 ? (
                        <ChevronUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`font-medium ${
                        dashboard.projections.monthlyTrend >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(dashboard.projections.monthlyTrend * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prochain mois</span>
                    <span className="font-bold">
                      €{dashboard.projections.projectedMonthly.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Projection annuelle</span>
                    <span className="font-bold text-green-600">
                      €{dashboard.projections.projectedYearly.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Objectifs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tier suivant</span>
                      <Badge variant="outline">
                        {dashboard.nextTier?.name || 'Maximum'}
                      </Badge>
                    </div>
                    {dashboard.nextTier && (
                      <Progress 
                        value={(dashboard.currentPeriod.totalLeads / dashboard.nextTier.minLeads) * 100}
                        className="h-2"
                      />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {dashboard.nextTier 
                      ? `${dashboard.nextTier.minLeads - dashboard.currentPeriod.totalLeads} leads manquants pour le tier ${dashboard.nextTier.name}`
                      : 'Vous avez atteint le tier maximum!'
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
