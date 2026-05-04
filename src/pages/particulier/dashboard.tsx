/**
 * @fileoverview Dashboard Particulier sécurisé et optimisé
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
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClientGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  LogOut,
  Plus,
  Clock,
  CheckCircle,
  Image as ImageIcon,
  MapPin,
  Euro,
  Users,
  ArrowLeft,
  Briefcase,
  XCircle,
  MessageSquare,
  Star,
  Phone,
  Mail,
  User,
  Home,
  Bell,
  AlertTriangle,
  FileText,
  Download,
  Edit,
} from 'lucide-react';
// import { authService } from "@/services/authService"; // Plus utilisé
import { projectService } from '@/services/projectService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PlanningCard } from '@/components/planning/PlanningCard';
import { RatingModal } from '@/components/rating/RatingModal';
import { NotificationCenter } from '@/components/notifications/NotificationCenterDashboard';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface DashboardStats {
  totalProjects: number;
  draftProjects: number;
  pendingProjects: number;
  publishedProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  totalSpent: number;
  totalAIBudget: number;
}

export default function ParticulierDashboard() {
  return (
    <ClientGuard>
      <ParticulierDashboardContent />
    </ClientGuard>
  );
}

function ParticulierDashboardContent() {
  // Protection SSR
  if (typeof window === 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '🛡️ ParticulierDashboard: SSR detected, returning loading state'
      );
    }
    return <LoadingSpinner />;
  }

  const router = useRouter();
  const { user, profile, logout, initialized, loading } = useAuth();

  // Service centralisé pour les appels Supabase
  const clientDataService = useMemo(
    () => ({
      async loadProjects(userId: string) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '📋 ParticulierDashboard: Loading projects via secure service'
          );
        }

        const { supabase } = await import('@/integrations/supabase/client');

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              '❌ ParticulierDashboard: Error loading projects:',
              error
            );
          }
          throw error;
        }

        return data || [];
      },
    }),
    []
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    draftProjects: 0,
    pendingProjects: 0,
    publishedProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalSpent: 0,
    totalAIBudget: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!initialized || !user || !profile) return;

    const loadUserData = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '� ParticulierDashboard: Loading user data via secure service'
          );
        }

        // SÉCURITÉ CRITIQUE : Utiliser profile.role pour la redirection
        if (profile?.role === 'professional') {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              '🚨 SÉCURITÉ : Utilisateur est un professionnel, redirection vers dashboard pro'
            );
          }
          router.replace('/professionnel/dashboard');
          return;
        }

        if (profile?.role === 'admin' || profile?.role === 'super_admin') {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              '🚨 SÉCURITÉ : Utilisateur est un admin, redirection vers dashboard admin'
            );
          }
          router.replace('/admin/dashboard');
          return;
        }

        if (!profile) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('❌ Profil non trouvé dans auth context');
          }
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(
            '✅ Utilisateur PARTICULIER confirmé:',
            user.email,
            'role:',
            profile.role
          );
        }

        // Utiliser le service centralisé
        const projectsArray = await clientDataService.loadProjects(user.id);

        if (process.env.NODE_ENV === 'development') {
          console.log('� Projects loaded:', { count: projectsArray.length });
        }

        // Calculer les statistiques
        const calculatedStats: DashboardStats = {
          totalProjects: projectsArray?.length || 0,
          draftProjects:
            projectsArray?.filter((p: Project) => p.status === 'draft')
              .length || 0,
          pendingProjects:
            projectsArray?.filter((p: Project) => p.status === 'pending')
              .length || 0,
          publishedProjects:
            projectsArray?.filter((p: Project) => p.status === 'published')
              .length || 0,
          inProgressProjects:
            projectsArray?.filter((p: Project) => p.status === 'in_progress')
              .length || 0,
          completedProjects:
            projectsArray?.filter((p: Project) => p.status === 'completed')
              .length || 0,
          totalSpent:
            projectsArray?.reduce(
              (sum: number, p: Project) => sum + ((p as any).budget || 0),
              0
            ) || 0,
          totalAIBudget:
            projectsArray?.reduce(
              (sum: number, p: Project) => sum + ((p as any).ai_budget || 0),
              0
            ) || 0,
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Stats calculated:', calculatedStats);
        }

        // Mettre à jour l'état
        setProjects(projectsArray);
        setStats(calculatedStats);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ ParticulierDashboard: Error loading data:', error);
        }
      }
    };

    loadUserData();
  }, [initialized, user, profile, clientDataService]);

  // Optimiser les handlers avec useCallback
  const handleLogout = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚪 ParticulierDashboard: Logout triggered');
    }
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ ParticulierDashboard: Error during logout:', error);
      }
    }
  }, [logout, router]);

  // Optimiser les fonctions de rendu avec useMemo
  const welcomeMessage = useMemo(() => {
    return `👋 Bienvenue, ${profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur'} !`;
  }, [profile, user]);

  const getStatusColor = useMemo(
    () => (status: string) => {
      switch (status) {
        case 'completed':
          return 'default';
        case 'in_progress':
          return 'secondary';
        case 'pending':
          return 'outline';
        default:
          return 'outline';
      }
    },
    []
  );

  const getStatusLabel = useMemo(
    () => (status: string) => {
      switch (status) {
        case 'completed':
          return 'Terminé';
        case 'in_progress':
          return 'En cours';
        case 'pending':
          return 'En attente';
        default:
          return status;
      }
    },
    []
  );

  const totalDevisAmount = useMemo(() => {
    return projects && projects.length > 0
      ? projects.reduce((sum: number, p: any) => {
          const devisAmount = p.devis_amount || 0;
          return sum + devisAmount;
        }, 0)
      : 0;
  }, [projects]);

  // PROBLÈME DE FLICKER / CHARGEMENT LONG - Contrôle réel
  if (!initialized || loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <SEO
        title="Dashboard Particulier - SwipeTonPro"
        description="Gérez vos projets de travaux"
      />

      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface">
        {/* Header */}
        <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <Link href="/" className="flex items-center space-x-2">
                  <Home className="w-5 h-5 text-primary" />
                  <span className="font-bold text-xl">SwipeTonPro</span>
                </Link>
                <nav className="hidden md:flex items-center space-x-6">
                  <Link
                    href="/particulier/projects"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                  >
                    <Briefcase className="w-5 h-5" />
                    <span className="font-medium">Mes Projets</span>
                  </Link>
                  <Link
                    href="/particulier/planning"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Planning</span>
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                {/* Messages */}
                <Link href="/particulier/messages">
                  <Button variant="outline" className="relative">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Messages
                  </Button>
                </Link>

                <NotificationCenter userId={user?.id} />
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Section d'accueil avec informations propriétaire */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-foreground mb-4">
                    {welcomeMessage}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-6">
                    Nous sommes ravis de vous accompagner dans vos projets de
                    travaux.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Votre compte</p>
                        <p className="text-sm text-muted-foreground">
                          {profile?.full_name ||
                            user?.email?.split('@')[0] ||
                            'Utilisateur'}{' '}
                          "Particulier"
                        </p>
                      </div>
                    </div>

                    {profile?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Téléphone</p>
                          <p className="text-sm text-muted-foreground">
                            {profile.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                    <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
                    {/* LIGNE 1 : STATISTIQUES PROJETS */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        📊 ÉTAT DES PROJETS
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-orange-100 border border-orange-300 rounded-lg">
                          <div className="text-2xl font-bold text-orange-700">
                            {stats.pendingProjects}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            En attente
                          </div>
                        </div>
                        <div className="text-center p-3 bg-green-100 border border-green-300 rounded-lg">
                          <div className="text-2xl font-bold text-green-700">
                            {stats.publishedProjects}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Publiés
                          </div>
                        </div>
                        <div className="text-center p-3 bg-blue-100 border border-blue-300 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {stats.inProgressProjects}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            En cours
                          </div>
                        </div>
                        <div className="text-center p-3 bg-purple-100 border border-purple-300 rounded-lg">
                          <div className="text-2xl font-bold text-purple-700">
                            {stats.completedProjects}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Réalisés
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LIGNE 2 : STATISTIQUES BUDGETS */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        💰 BUDGETS & COÛTS
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-100 border border-gray-300 rounded-lg">
                          <div className="text-2xl font-bold text-gray-700">
                            {stats.totalSpent.toLocaleString()}€
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Budget prévu
                          </div>
                        </div>
                        <div className="text-center p-3 bg-blue-100 border border-blue-300 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {stats.totalAIBudget?.toLocaleString() || 0}€
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Budget IA
                          </div>
                        </div>
                        <div className="text-center p-3 bg-green-100 border border-green-300 rounded-lg">
                          <div className="text-2xl font-bold text-green-700">
                            {totalDevisAmount.toLocaleString()}€
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Devis Pro
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statistiques IA */}
                    <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                        <span className="text-sm text-blue-900">
                          {stats.totalAIBudget > 0
                            ? `${Math.round(stats.totalAIBudget / 1000)}k€`
                            : '0€'}{' '}
                          estimé par IA
                        </span>
                      </div>
                    </div>

                    {/* Alertes pour projets en attente */}
                    {stats.pendingProjects > 0 && (
                      <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 text-orange-700 mr-2" />
                          <span className="text-sm text-orange-900">
                            {stats.pendingProjects} projet
                            {stats.pendingProjects > 1 ? 's' : ''} en attente de
                            validation
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Alertes pour brouillons */}
                    {stats.draftProjects > 0 && (
                      <div className="mt-2 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-700 mr-2" />
                          <span className="text-sm text-gray-900">
                            {stats.draftProjects} brouillon
                            {stats.draftProjects > 1 ? 's' : ''} à compléter
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Messages récents avec professionnels */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Messages avec les professionnels
              </h2>
              <Link href="/particulier/messages">
                <Button variant="outline">Voir tout</Button>
              </Link>
            </div>

            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucune conversation
              </h3>
              <p className="text-muted-foreground mb-6">
                Vous n'avez pas encore de conversations avec des professionnels.
              </p>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Actions rapides</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/particulier/new-project">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Nouveau projet</h3>
                        <p className="text-sm text-muted-foreground">
                          Créer une demande de travaux
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/particulier/projects">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Briefcase className="w-6 h-6 text-blue-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Mes projets</h3>
                        <p className="text-sm text-muted-foreground">
                          Voir tous mes projets
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/professionnels">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 rounded-full">
                        <Users className="w-6 h-6 text-green-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Trouver un pro</h3>
                        <p className="text-sm text-muted-foreground">
                          Parcourir les professionnels
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </div>

          {/* Projets récents */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Projets récents</h2>
              <Link href="/particulier/projects">
                <Button variant="outline">Voir tout</Button>
              </Link>
            </div>

            {projects.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun projet</h3>
                    <p className="text-muted-foreground mb-6">
                      Vous n'avez pas encore créé de projet de travaux.
                    </p>
                    <Link href="/particulier/new-project">
                      <Button>Créer mon premier projet</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 6).map((project) => (
                  <Card
                    key={project.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {project.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {project.category}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2" />
                          {project.city}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Euro className="w-4 h-4 mr-2" />
                          {project.ai_analysis ? (
                            <span className="text-blue-600 font-semibold">
                              🤖 Estimation IA disponible
                            </span>
                          ) : (
                            <span>
                              {project.budget_max
                                ? project.budget_max.toLocaleString()
                                : 'N/A'}
                              €
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Actions pour l'accord mutuel si le projet est matché */}
                        {project.status === 'matched' && (
                          <div className="flex gap-2">
                            {project.accord_status === 'generated' ? (
                              <div className="flex gap-2 w-full">
                                <Link
                                  href={`/particulier/accord-mutuel/${project.id}`}
                                  className="flex-1"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Modifier
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      `/api/download-accord-pdf?projectId=${project.id}`
                                    )
                                  }
                                  className="flex-1"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  PDF
                                </Button>
                              </div>
                            ) : (
                              <Link
                                href={`/particulier/accord-mutuel/${project.id}`}
                                className="w-full"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  Créer l'accord
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}

                        <Link href={`/particulier/projects/${project.id}`}>
                          <Button variant="outline" className="w-full">
                            Voir les détails
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
