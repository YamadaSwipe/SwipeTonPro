/**
 * @fileoverview Dashboard Admin sécurisé et optimisé
 * @author Senior Architect
 * @version 3.0.0
 *
 * Fonctionnalités :
 * - Protection SSR intégrée
 * - Service centralisé pour les appels Supabase
 * - Optimisation des re-renders avec useMemo/useCallback
 * - Logs de débogage uniquement en développement
 * - Gestion centralisée des états
 */

import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Target,
  Settings,
  BarChart3,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Shield,
  CreditCard,
  Bell,
  LogOut,
  FolderOpen,
  FileText,
  Euro,
  ArrowRight,
  RefreshCw,
  Handshake,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';

interface Stats {
  totalUsers: number;
  totalProjects: number;
  activeProfessionals: number;
  pendingProjects: number;
  pendingPros: number;
  totalMatches: number;
  revenueMonth: number;
}

interface RecentProject {
  id: string;
  title: string;
  city: string;
  status: string;
  created_at: string;
  budget_max?: number;
}

const NAV_ITEMS = [
  { label: 'CRM', href: '/admin/crm', icon: Users },
  { label: 'Projets', href: '/admin/projects', icon: FolderOpen },
  { label: 'Utilisateurs', href: '/admin/users', icon: Shield },
  {
    label: 'Validation Pros',
    href: '/admin/professionals-validation',
    icon: CheckCircle,
  },
  { label: 'Tarifs', href: '/admin/pricing', icon: Euro },
  { label: 'Finances', href: '/admin/finances', icon: CreditCard },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Notifications', href: '/admin/notification-settings', icon: Bell },
  { label: 'Paramètres', href: '/admin/settings-page', icon: Settings },
  { label: 'Logs', href: '/admin/activity-logs', icon: FileText },
];

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
  urgent,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  href?: string;
  urgent?: boolean;
}) {
  const inner = (
    <div
      className={`relative group bg-gray-900 border rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
        urgent
          ? 'border-amber-500/50 shadow-amber-500/10 shadow-lg'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {urgent && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
        </span>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {href && (
          <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1 tabular-nums">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}

function AdminDashboardContent() {
  // Protection SSR
  if (typeof window === 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🛡️ AdminDashboard: SSR detected, returning loading state');
    }
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  const router = useRouter();
  const {
    user,
    profile,
    logout,
    initialized,
    loading: authLoading,
  } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProjects: 0,
    activeProfessionals: 0,
    pendingProjects: 0,
    pendingPros: 0,
    totalMatches: 0,
    revenueMonth: 0,
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Service sécurisé pour les appels Supabase
  const adminDataService = useMemo(
    () => ({
      async getStats() {
        if (process.env.NODE_ENV === 'development') {
          console.warn('📊 AdminDashboard: Loading stats via secure service');
        }

        const { supabase } = await import('@/integrations/supabase/client');

        const [
          totalUsers,
          totalProjects,
          activeProfessionals,
          pendingProjects,
          pendingPros,
          totalMatches,
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .in('status', ['published', 'pending']),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'professional'),
          supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'professional')
            .single(),
          supabase
            .from('project_interests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'accepted'),
        ]);

        return {
          totalUsers: totalUsers.count || 0,
          totalProjects: totalProjects.count || 0,
          activeProfessionals: activeProfessionals.count || 0,
          pendingProjects: pendingProjects.count || 0,
          pendingPros: pendingPros.count || 0,
          totalMatches: totalMatches.count || 0,
        };
      },

      async getRecentProjects() {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '📋 AdminDashboard: Loading recent projects via secure service'
          );
        }

        const { supabase } = await import('@/integrations/supabase/client');

        const { data } = await supabase
          .from('projects')
          .select('id, title, city, status, created_at, budget_max')
          .order('created_at', { ascending: false })
          .limit(5);

        return data || [];
      },
    }),
    []
  );

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setDataLoading(true);
      else setRefreshing(true);

      try {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🔄 AdminDashboard: Loading dashboard data');
        }

        // Utiliser le service centralisé
        const [statsData, projectsData] = await Promise.all([
          adminDataService.getStats(),
          adminDataService.getRecentProjects(),
        ]);

        setStats({
          ...statsData,
          revenueMonth: 0,
        });

        setRecentProjects(projectsData);
        setLastUpdated(new Date());

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ AdminDashboard: Data loaded successfully', {
            statsCount: Object.keys(statsData).length,
            projectsCount: projectsData.length,
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ AdminDashboard: Error loading data:', err);
        }
      } finally {
        setDataLoading(false);
        setRefreshing(false);
      }
    },
    [adminDataService]
  );

  useEffect(() => {
    loadData();
    // Rafraîchir toutes les 60 secondes
    const interval = setInterval(() => loadData(true), 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const urgentCount = useMemo(
    () => stats.pendingProjects + stats.pendingPros,
    [stats.pendingProjects, stats.pendingPros]
  );

  const statusColor = useMemo(
    () => (status: string) => {
      switch (status) {
        case 'published':
          return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        case 'pending':
          return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        case 'rejected':
          return 'bg-red-500/15 text-red-400 border-red-500/30';
        default:
          return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
      }
    },
    []
  );

  const statusLabel = useMemo(
    () => (status: string) => {
      switch (status) {
        case 'published':
          return 'En ligne';
        case 'pending':
          return 'En attente';
        case 'rejected':
          return 'Refusé';
        default:
          return status;
      }
    },
    []
  );

  const urgentCount = useMemo(
    () => stats.pendingProjects + stats.pendingPros,
    [stats.pendingProjects, stats.pendingPros]
  );

  // État de chargement combiné optimisé
  const isLoading = useMemo(
    () => authLoading || dataLoading,
    [authLoading, dataLoading]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  const urgentCount = useMemo(
    () => stats.pendingProjects + stats.pendingPros,
    [stats.pendingProjects, stats.pendingPros]
  );

  // Handlers optimisés avec logs de débogage
  const handleRefresh = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔄 AdminDashboard: Manual refresh triggered');
    }
    await loadData(true);
  }, [loadData]);

  const handleLogout = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚪 AdminDashboard: Logout triggered');
    }
    await logout();
    router.push('/auth/login');
  }, [logout, router]);

  return (
    <>
      <SEO title="Dashboard Admin — SwipeTonPro" />
      <div className="min-h-screen bg-gray-950 text-white">
        {/* ── HEADER ── */}
        <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Logo + titre */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  SwipeTonPro
                </span>
                <span className="text-gray-500 text-xs ml-2">Admin</span>
              </div>
              {urgentCount > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                  {urgentCount} action{urgentCount > 1 ? 's' : ''} requise
                  {urgentCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Nav principale */}
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/8 transition-all whitespace-nowrap"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Actions header */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all"
                title="Rafraîchir"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>
              <Link href="/">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/8 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Retour site
                </button>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* ── TITRE ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Mis à jour{' '}
                {lastUpdated.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* ── ALERTES URGENTES ── */}
          {urgentCount > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {stats.pendingProjects > 0 && (
                <Link href="/admin/projects">
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 hover:bg-amber-500/15 transition-colors cursor-pointer">
                    <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-amber-300 text-sm">
                        {stats.pendingProjects} projet
                        {stats.pendingProjects > 1 ? 's' : ''} à valider
                      </p>
                      <p className="text-amber-400/70 text-xs">
                        Cliquez pour traiter
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  </div>
                </Link>
              )}
              {stats.pendingPros > 0 && (
                <Link href="/admin/professionals-validation">
                  <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 hover:bg-blue-500/15 transition-colors cursor-pointer">
                    <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                      <Shield className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-blue-300 text-sm">
                        {stats.pendingPros} professionnel
                        {stats.pendingPros > 1 ? 's' : ''} à valider
                      </p>
                      <p className="text-blue-400/70 text-xs">
                        Cliquez pour traiter
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* ── STATS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Utilisateurs"
              value={stats.totalUsers}
              icon={Users}
              color="bg-blue-500/20 text-blue-400"
              href="/admin/users"
            />
            <StatCard
              label="Projets actifs"
              value={stats.totalProjects}
              icon={FolderOpen}
              color="bg-emerald-500/20 text-emerald-400"
              href="/admin/projects"
            />
            <StatCard
              label="Professionnels"
              value={stats.activeProfessionals}
              icon={CheckCircle}
              color="bg-purple-500/20 text-purple-400"
              href="/admin/professionals-validation"
            />
            <StatCard
              label="Matchs réalisés"
              value={stats.totalMatches}
              icon={Handshake}
              color="bg-orange-500/20 text-orange-400"
            />
          </div>

          {/* ── CONTENU PRINCIPAL ── */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Projets récents */}
            <div className="lg:col-span-2 bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <h2 className="font-semibold text-white text-sm">
                  Derniers projets soumis
                </h2>
                <Link href="/admin/projects">
                  <button className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    Voir tout <ArrowRight className="h-3 w-3" />
                  </button>
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {recentProjects.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 text-sm">
                    Aucun projet pour l'instant
                  </div>
                ) : (
                  recentProjects.map((project) => (
                    <Link key={project.id} href={`/admin/projects`}>
                      <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/4 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {project.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.city}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {project.budget_max && (
                            <span className="text-xs text-gray-400 tabular-nums">
                              {project.budget_max.toLocaleString('fr-FR')}€
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(project.status)}`}
                          >
                            {statusLabel(project.status)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Accès rapide */}
            <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8">
                <h2 className="font-semibold text-white text-sm">
                  Accès rapide
                </h2>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {[
                  {
                    label: 'CRM',
                    href: '/admin/crm',
                    icon: Users,
                    color: 'text-blue-400',
                  },
                  {
                    label: 'Projets',
                    href: '/admin/projects',
                    icon: FolderOpen,
                    color: 'text-emerald-400',
                  },
                  {
                    label: 'Tarifs',
                    href: '/admin/pricing',
                    icon: Euro,
                    color: 'text-orange-400',
                  },
                  {
                    label: 'Pros',
                    href: '/admin/professionals-validation',
                    icon: Shield,
                    color: 'text-purple-400',
                  },
                  {
                    label: 'Finances',
                    href: '/admin/finances',
                    icon: DollarSign,
                    color: 'text-yellow-400',
                  },
                  {
                    label: 'Analytics',
                    href: '/admin/analytics',
                    icon: TrendingUp,
                    color: 'text-pink-400',
                  },
                  {
                    label: 'Paramètres',
                    href: '/admin/settings-page',
                    icon: Settings,
                    color: 'text-gray-400',
                  },
                  {
                    label: 'Logs',
                    href: '/admin/activity-logs',
                    icon: ClipboardList,
                    color: 'text-gray-400',
                  },
                ].map(({ label, href, icon: Icon, color }) => (
                  <Link key={href} href={href}>
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all cursor-pointer group">
                      <Icon
                        className={`h-5 w-5 ${color} group-hover:scale-110 transition-transform`}
                      />
                      <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                        {label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── NAV MOBILE ── */}
          <div className="lg:hidden bg-gray-900 border border-white/10 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-white mb-3">
              Navigation
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all cursor-pointer">
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-400 text-center leading-tight">
                      {label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
