import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface KPIData {
  projects: {
    totalProjects: number;
    projectsWithAIEstimation: number;
    realisticEstimationRate: number;
    byStatus: Record<string, number>;
  };
  professionals: {
    totalProfessionals: number;
    professionalsWithBids: number;
    applicationRate: number;
    avgBidsPerPro: number;
    totalBids: number;
  };
  clients: {
    totalClients: number;
    clientsWithProjects: number;
    clientsWhoAccepted: number;
    acceptanceRate: number;
    avgResponseTime: number;
  };
  matches: {
    totalMatches: number;
    matchesWithQuote: number;
    quoteSentRate: number;
    matchesWithContract: number;
    contractSignedRate: number;
    rejectedMatches: number;
    rejectionRate: number;
    funnel: Record<string, number>;
  };
  conversionFunnel: Array<{
    stage: string;
    count: number;
    percentage: number;
    dropOff: number;
  }>;
  lastUpdated: string;
}

const TIME_RANGES = [
  { label: '7 jours', value: '7' },
  { label: '30 jours', value: '30' },
  { label: '90 jours', value: '90' },
  { label: '6 mois', value: '180' },
  { label: '1 an', value: '365' },
];

export default function KPIDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('30');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, [selectedRange]);

  const checkAdminAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!['admin', 'super_admin'].includes(profile?.role)) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      await loadKPIData();
    } catch (error) {
      console.error('Error:', error);
      router.push('/');
    }
  };

  const loadKPIData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/kpi/dashboard?days=${selectedRange}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load KPI data');
      }

      const result = await response.json();
      setKpiData(result.data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les KPIs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Accès réservé</h1>
          <p className="text-slate-600 mt-2">Cette page est réservée aux administrateurs</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Erreur</h1>
          <p className="text-slate-600 mt-2">Impossible de charger les données KPI</p>
          <Button onClick={loadKPIData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="mb-2 pl-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Tableau de bord KPI</h1>
            <p className="text-slate-600">
              Dernière mise à jour: {format(new Date(kpiData.lastUpdated), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
              <Calendar className="h-4 w-4 text-slate-500" />
              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="border-none outline-none bg-transparent text-sm"
              >
                {TIME_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={loadKPIData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <KPICard
            title="Estimations réalistes"
            value={`${kpiData.projects.realisticEstimationRate}%`}
            subtitle={`${kpiData.projects.projectsWithAIEstimation} / ${kpiData.projects.totalProjects}`}
            icon={CheckCircle2}
            color="bg-blue-500"
            trend={kpiData.projects.realisticEstimationRate > 50 ? 'up' : 'down'}
          />
          <KPICard
            title="Artisans postulent"
            value={`${kpiData.professionals.applicationRate}%`}
            subtitle={`${kpiData.professionals.professionalsWithBids} pros actifs`}
            icon={Users}
            color="bg-green-500"
            trend={kpiData.professionals.applicationRate > 30 ? 'up' : 'down'}
          />
          <KPICard
            title="Particuliers acceptent"
            value={`${kpiData.clients.acceptanceRate}%`}
            subtitle={`${kpiData.clients.clientsWhoAccepted} acceptations`}
            icon={Briefcase}
            color="bg-purple-500"
            trend={kpiData.clients.acceptanceRate > 40 ? 'up' : 'down'}
          />
          <KPICard
            title="Devis envoyés"
            value={`${kpiData.matches.quoteSentRate}%`}
            subtitle={`${kpiData.matches.matchesWithQuote} matchs`}
            icon={TrendingUp}
            color="bg-orange-500"
            trend={kpiData.matches.quoteSentRate > 60 ? 'up' : 'down'}
          />
          <KPICard
            title="Chantiers signés"
            value={`${kpiData.matches.contractSignedRate}%`}
            subtitle={`${kpiData.matches.matchesWithContract} contrats`}
            icon={CheckCircle2}
            color="bg-emerald-500"
            trend={kpiData.matches.contractSignedRate > 20 ? 'up' : 'down'}
          />
          <KPICard
            title="Taux de refus"
            value={`${kpiData.matches.rejectionRate}%`}
            subtitle={`${kpiData.matches.rejectedMatches} refus`}
            icon={XCircle}
            color="bg-red-500"
            trend={kpiData.matches.rejectionRate > 30 ? 'down' : 'up'}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="funnel" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="funnel">Funnel Conversion</TabsTrigger>
            <TabsTrigger value="projects">Projets</TabsTrigger>
            <TabsTrigger value="professionals">Professionnels</TabsTrigger>
            <TabsTrigger value="matches">Matchs</TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="space-y-6">
            <FunnelVisualization funnel={kpiData.conversionFunnel} />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <ProjectDetails data={kpiData.projects} />
          </TabsContent>

          <TabsContent value="professionals" className="space-y-6">
            <ProfessionalDetails data={kpiData.professionals} />
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <MatchDetails data={kpiData.matches} />
          </TabsContent>
        </Tabs>

        {/* Alerts */}
        <AlertsSection kpiData={kpiData} />
      </div>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: string;
  trend: 'up' | 'down';
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`${color} p-2 rounded-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-slate-500">{title}</p>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelVisualization({ funnel }: { funnel: KPIData['conversionFunnel'] }) {
  const maxCount = Math.max(...funnel.map(f => f.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Funnel de Conversion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnel.map((stage, index) => (
            <div key={stage.stage} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{stage.stage}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">{stage.count}</span>
                  <Badge variant={stage.percentage > 50 ? 'default' : 'secondary'}>
                    {stage.percentage}%
                  </Badge>
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-blue-400' :
                    index === 2 ? 'bg-blue-300' :
                    index === 3 ? 'bg-green-400' :
                    index === 4 ? 'bg-green-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${(stage.count / maxCount) * 100}%` }}
                />
              </div>
              {stage.dropOff > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  -{stage.dropOff}% d'abandon
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectDetails({ data }: { data: KPIData['projects'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails des Projets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(data.byStatus).map(([status, count]) => (
            <div key={status} className="bg-slate-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-slate-500 capitalize">{status.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <p className="text-sm text-slate-600">
            <strong>{data.realisticEstimationRate}%</strong> des projets ont une estimation IA réaliste
            (écart budget &lt; 50%)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfessionalDetails({ data }: { data: KPIData['professionals'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails des Professionnels</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold">{data.totalProfessionals}</p>
            <p className="text-xs text-slate-500">Total pros</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold">{data.professionalsWithBids}</p>
            <p className="text-xs text-slate-500">Pros actifs</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold">{data.totalBids}</p>
            <p className="text-xs text-slate-500">Total postulations</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold">{data.avgBidsPerPro}</p>
            <p className="text-xs text-slate-500">Moyenne/pro</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchDetails({ data }: { data: KPIData['matches'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails des Matchs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold">{data.totalMatches}</p>
            <p className="text-xs text-slate-500">Total matchs</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-600">{data.quoteSentRate}%</p>
            <p className="text-xs text-slate-500">Devis envoyés</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{data.contractSignedRate}%</p>
            <p className="text-xs text-slate-500">Contrats signés</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{data.rejectionRate}%</p>
            <p className="text-xs text-slate-500">Taux de refus</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsSection({ kpiData }: { kpiData: KPIData }) {
  const alerts = [];

  if (kpiData.projects.realisticEstimationRate < 30) {
    alerts.push({
      type: 'warning',
      message: `Taux d'estimation IA faible: ${kpiData.projects.realisticEstimationRate}%`,
      recommendation: 'Vérifier la qualité des estimations générées',
    });
  }

  if (kpiData.professionals.applicationRate < 20) {
    alerts.push({
      type: 'warning',
      message: `Taux de postulation faible: ${kpiData.professionals.applicationRate}%`,
      recommendation: 'Inciter les professionnels à postuler plus activement',
    });
  }

  if (kpiData.matches.rejectionRate > 40) {
    alerts.push({
      type: 'error',
      message: `Taux de refus élevé: ${kpiData.matches.rejectionRate}%`,
      recommendation: 'Analyser les causes des refus et améliorer le matching',
    });
  }

  if (kpiData.matches.contractSignedRate < 15) {
    alerts.push({
      type: 'warning',
      message: `Taux de conversion faible: ${kpiData.matches.contractSignedRate}%`,
      recommendation: 'Optimiser le funnel de conversion',
    });
  }

  if (alerts.length === 0) {
    return (
      <Card className="mt-6 bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-green-800">Tous les indicateurs sont dans les seuils normaux</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        Alertes et Recommandations
      </h3>
      {alerts.map((alert, index) => (
        <Card key={index} className={`${alert.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
          <CardContent className="p-4">
            <p className={`font-medium ${alert.type === 'error' ? 'text-red-800' : 'text-orange-800'}`}>
              {alert.message}
            </p>
            <p className={`text-sm mt-1 ${alert.type === 'error' ? 'text-red-600' : 'text-orange-600'}`}>
              {alert.recommendation}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
