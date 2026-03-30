'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  Download,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Eye,
  MousePointer,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AnalyticsData {
  overview: {
    totalProjects: number;
    totalProfessionals: number;
    totalClients: number;
    totalRevenue: number;
    averageProjectValue: number;
    conversionRate: number;
    growthRate: number;
  };
  projectsByCategory: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    projects: number;
    revenue: number;
    professionals: number;
    clients: number;
  }>;
  topProfessionals: Array<{
    id: string;
    name: string;
    projects: number;
    revenue: number;
    rating: number;
    responseTime: number;
  }>;
  geographicData: Array<{
    city: string;
    projects: number;
    revenue: number;
  }>;
  conversionFunnel: Array<{
    step: string;
    count: number;
    conversionRate: number;
  }>;
}

interface AnalyticsDashboardProps {
  professionalId?: string;
  dateRange?: string;
}

export default function AnalyticsDashboard({ professionalId, dateRange = '30' }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [professionalId, selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(professionalId && { professionalId })
      });

      const response = await fetch(`/api/analytics/dashboard?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Erreur chargement analytics:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'excel') => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        format,
        period: selectedPeriod,
        ...(professionalId && { professionalId })
      });

      const response = await fetch(`/api/analytics/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "✅ Export réussi",
          description: `Les données ont été exportées en ${format.toUpperCase()}`,
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error: any) {
      toast({
        title: "Erreur d'export",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune donnée disponible
          </h3>
          <p className="text-gray-600">
            Les données analytics seront bientôt disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Vue d'ensemble des performances de la plateforme
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
              <SelectItem value="365">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => exportData('csv')}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          
          <Button
            variant="outline"
            onClick={() => exportData('excel')}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Projets totaux</p>
                <p className="text-2xl font-bold">{formatNumber(data.overview.totalProjects)}</p>
                <div className={`flex items-center gap-1 text-sm ${getGrowthColor(data.overview.growthRate)}`}>
                  {getGrowthIcon(data.overview.growthRate)}
                  <span>{Math.abs(data.overview.growthRate)}%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                <p className="text-2xl font-bold">{formatCurrency(data.overview.totalRevenue)}</p>
                <div className={`flex items-center gap-1 text-sm ${getGrowthColor(data.overview.growthRate)}`}>
                  {getGrowthIcon(data.overview.growthRate)}
                  <span>{Math.abs(data.overview.growthRate)}%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de conversion</p>
                <p className="text-2xl font-bold">{data.overview.conversionRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Target className="w-3 h-3" />
                  <span>Objectif: 15%</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valeur moyenne</p>
                <p className="text-2xl font-bold">{formatCurrency(data.overview.averageProjectValue)}</p>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-3 h-3" />
                  <span>Par projet</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Projets par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.projectsByCategory.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-sm font-medium">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{category.count}</div>
                    <div className="text-sm text-gray-600">{formatCurrency(category.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Professionals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top professionnels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProfessionals.map((pro, index) => (
                <div key={pro.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{pro.name}</div>
                      <div className="text-sm text-gray-600">{pro.projects} projets</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(pro.revenue)}</div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-yellow-500">⭐</span>
                      <span>{pro.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tendances mensuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.monthlyTrends.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-gray-600">
                      {month.projects} projets • {month.professionals} pros • {month.clients} clients
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{formatCurrency(month.revenue)}</div>
                  <div className="text-sm text-gray-600">Revenus</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Tunnel de conversion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.conversionFunnel.map((step, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{step.step}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatNumber(step.count)}</span>
                    <Badge variant="secondary">{step.conversionRate.toFixed(1)}%</Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${step.conversionRate * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
