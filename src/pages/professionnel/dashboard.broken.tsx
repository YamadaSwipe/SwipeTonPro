import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfessionalGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';

// Désactiver SSR pour cette page
export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  };
}
import {
  FileText,
  Activity,
  Wallet,
  Receipt,
  TrendingUp,
  Calendar,
  Shield,
  CreditCard as CreditCardIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/services/authService';
import { projectService } from '@/services/projectService';
import { ProjectCard } from '@/components/professional/ProjectCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PlanningCard } from '@/components/planning/PlanningCard';
import { RatingModal } from '@/components/rating/RatingModal';
import type { Database } from '@/integrations/supabase/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getProfessionalDashboardStats,
  ProfessionalStats,
} from '@/services/analyticsService';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import ProfessionalDocuments from '@/components/professional/ProfessionalDocuments';
import { NotificationCenter } from '@/components/notifications/NotificationCenterDashboard';
import { ActivityChart } from '@/components/professional/ActivityChart';

type Project = Database['public']['Tables']['projects']['Row'];
type Professional = Database['public']['Tables']['professionals']['Row'] & {
  phone?: string;
  city?: string;
  is_verified?: boolean;
};

export default function ProfessionalDashboard() {
  return (
    <ProfessionalGuard>
      <ProfessionalDashboardContent />
    </ProfessionalGuard>
  );
}

function ProfessionalDashboardContent() {
  const router = useRouter();
  const { user, profile, professional, logout, initialized, loading } =
    useAuth(); // Utiliser le contexte unique
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingInterests, setPendingInterests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfessionalStats | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false); // VERROU POUR ÉVITER LES APPELS MULTIPLES
  const platformSettings = usePlatformSettings();

  // ANTI-BUG REACT: Ne pas render tant que l'authentification n'est pas initialisée
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'authentification...</p>
        </div>
      </div>
    );
  }

  // DÉBOGAGE CRITIQUE - Vérification comptes mélangés
  useEffect(() => {
    // DÉSACTIVÉ - ÉVITER LES LOCKS SUPABASE
    console.log(
      'checkAuthConsistency désactivé pour éviter les erreurs de lock'
    );
  }, [router]);

  const [filters, setFilters] = useState({
    location: '',
    budgetMin: '',
    budgetMax: '',
    category: '',
  });
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fonction pour récupérer les conversations
  const getConversations = async () => {
    try {
      // DÉSACTIVÉ COMPLÈTEMENT - ÉVITER LA BOUCLE INFINIE
      console.log('Conversations désactivées pour corriger les erreurs 400');
      setConversations([]);
      setUnreadCount(0);
      return [];
    } catch (err) {
      console.error('Error fetching conversations:', err);
      return [];
    }
  };
  const [pendingMatches, setPendingMatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    if (!authChecked) {
      checkAuth();
      setAuthChecked(true);
    }
  }, [authChecked]);

  // SEUL ET UNIQUE useEffect pour charger les données du dashboard
  useEffect(() => {
    // Charger les données SEULEMENT quand :
    // 1. Le professionnel est disponible
    // 2. L'authentification est vérifiée
    // 3. Les données n'ont pas encore été chargées (verrou)
    if (professional && authChecked && !dataLoaded) {
      console.log('🚀 Chargement initial des données du dashboard...');
      loadDashboardData();
      setDataLoaded(true);
    }
  }, [professional, authChecked, dataLoaded]);

  useEffect(() => {
    if (router.query.payment_success === 'true') {
      // Show success message
      setTimeout(() => {
        router.replace('/professionnel/dashboard', undefined, {
          shallow: true,
        });
      }, 3000);
    }
  }, [router.query]);

  const checkAuth = async () => {
    try {
      console.log('🔍 Vérification authentification professionnel');

      // Vérifier l'authentification (sans délai artificiel)
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.log('🔄 Redirection vers login - utilisateur non authentifié');
        router.replace('/auth/login');
        return;
      }

      console.log('✅ Utilisateur authentifié:', authUser.email);

      // VÉRIFICATION DE SÉCURITÉ CRITIQUE : S'assurer que c'est bien un professionnel
      const { data: professionalData, error: professionalError } =
        await supabase
          .from('professionals')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

      if (professionalError) {
        console.error('Erreur professionnel:', professionalError);
        if (professionalError.code === 'PGRST116') {
          console.log(
            '🔄 PAS DE PROFIL PROFESSIONNEL - Redirection vers inscription'
          );
          router.replace('/professionnel/inscription');
          return;
        }
        setError('Erreur de chargement des données professionnelles');
        setIsLoading(false);
        setInitialLoad(false);
        return;
      }

      // VÉRIFICATION DU STATUT : Seuls les professionnels vérifiés peuvent accéder
      if (!professionalData || professionalData.status !== 'verified') {
        console.log(
          '🔄 Professionnel non vérifié, statut:',
          professionalData?.status
        );
        if (professionalData?.status === 'pending') {
          router.replace('/professionnel/validation-en-cours');
        } else {
          router.replace('/professionnel/inscription');
        }
        return;
      }

      // SÉCURITÉ : Vérifier qu'il n'y a pas de confusion de compte
      console.log('🛡️ Vérification sécurité - Type de compte:', {
        userId: authUser.id,
        email: authUser.email,
        professionalId: professionalData.id,
        professionalStatus: professionalData.status,
        companyName: professionalData.company_name,
      });

      console.log(
        '✅ Données chargées avec succès - COMPTE PROFESSIONNEL CONFIRMÉ'
      );
      setUser(authUser);
      setProfessional(professionalData);
      setIsLoading(false);
      setInitialLoad(false);
    } catch (error) {
      console.error('❌ Erreur checkAuth:', error);
      setError("Erreur d'authentification");
      setIsLoading(false);
      setInitialLoad(false);
    }
  };

  const loadDashboardData = async () => {
    if (!professional) {
      console.log('❌ loadDashboardData: Pas de professionnel disponible');
      return;
    }

    // Éviter les appels multiples
    if (authLoading || isLoading) {
      console.log('⏳ loadDashboardData: Déjà en cours de chargement');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 Chargement données dashboard pour:', professional.id);

      // Charger les projets disponibles
      const { data: projectsData, error: projectsError } =
        await projectService.getAvailableProjects({ limit: 5 });

      if (projectsError) {
        console.error('Erreur projets:', projectsError);
      } else {
        setProjects(projectsData || []);
      }

      // Charger les statistiques
      try {
        const statsData = await getProfessionalDashboardStats(professional.id);
        setStats(statsData);
      } catch (statsError) {
        console.error('Erreur stats:', statsError);
        setStats(null);
      }

      // Charger les conversations (désactivé pour éviter les erreurs)
      setConversations([]);
      setUnreadCount(0);

      // Charger les intérêts en attente de paiement
      const { data: professionalInterests, error: interestsError } =
        await supabase
          .from('project_interests')
          .select(
            `
          *,
          project:projects!project_interests_project_id_fkey(
            title,
            budget_min,
            budget_max,
            client_id
          )
        `
          )
          .eq('professional_id', professional.id)
          .in('status', ['payment_pending', 'interested']);

      if (!interestsError && professionalInterests) {
        const pending = professionalInterests.filter(
          (i: any) =>
            i.status === 'payment_pending' && i.payment_status === 'pending'
        );
        setPendingInterests(pending);
      }

      setIsLoading(false);
      console.log('✅ Données dashboard chargées');
    } catch (error) {
      console.error('❌ Erreur loadDashboardData:', error);
      setError('Erreur de chargement des données');
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    const filterParams = {
      location: filters.location || undefined,
      budgetMin: filters.budgetMin ? parseInt(filters.budgetMin) : undefined,
      budgetMax: filters.budgetMax ? parseInt(filters.budgetMax) : undefined,
      category: filters.category || undefined,
    };

    const { data: projectsData } =
      await projectService.getAvailableProjects(filterParams);
    setProjects(projectsData || []);
  };

  const handleLogout = async () => {
    await logout();
  };

  const loadStats = async () => {
    try {
      if (!professional) return;
      const data = await getProfessionalDashboardStats(professional.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading || initialLoad) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary">
            {initialLoad
              ? 'Initialisation du tableau de bord...'
              : 'Chargement des données...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Dashboard Professionnel - SwipeTonPro"
        description="Gérez vos chantiers et candidatures"
      />

      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface">
        {/* Header */}
        <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Dashboard Pro</h1>
                <p className="text-sm text-text-secondary">
                  Bienvenue,{' '}
                  {user?.full_name ||
                    user?.email?.split('@')[0] ||
                    'Professionnel'}{' '}
                  "{professional?.company_name || 'Entreprise'}"
                  {professional?.is_verified && (
                    <Badge className="ml-2 bg-success/10 text-success border-success/20">
                      ✓ Certifié
                    </Badge>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Messages */}
                <Link href="/professionnel/messages">
                  <Button variant="outline" className="relative">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Centre de notifications */}
                {user && <NotificationCenter userId={user.id} />}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Payment Success Alert */}
          {router.query.payment_success === 'true' && (
            <Alert className="border-success bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
              <AlertDescription>
                <strong>Paiement réussi !</strong> Les coordonnées du client
                sont maintenant disponibles dans vos messages.
              </AlertDescription>
            </Alert>
          )}

          {/* Pending Matches Alert */}
          {pendingMatches.length > 0 && (
            <Alert className="border-warning bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Action requise :</strong> Vous avez{' '}
                    {pendingMatches.length} match(s) en attente de validation.
                    Payez 15€ pour débloquer les coordonnées.
                  </span>
                  <Link
                    href={`/professionnel/match-payment?project_id=${pendingMatches[0].project_id}&professional_id=${professional?.id}`}
                  >
                    <Button size="sm" className="ml-4">
                      Payer maintenant
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Tableau de Bord Professionnel
              </h1>
              <p className="text-text-secondary">
                Bienvenue,{' '}
                {user?.full_name ||
                  user?.email?.split('@')[0] ||
                  'Professionnel'}{' '}
                "{professional?.company_name || 'Entreprise'}"
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/professionnel/swipe-matching">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                >
                  <Briefcase className="w-5 h-5 mr-2" />
                  Matching Intelligent
                </Button>
              </Link>
              <Link href="/professionnel/browse-projects">
                <Button size="lg" variant="outline">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Parcourir les chantiers
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">
                    Chantiers actifs
                  </p>
                  <p className="text-2xl font-bold">
                    {stats?.activeProjects || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-full text-success">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Clients gagnés</p>
                  <p className="text-2xl font-bold">
                    {stats?.completedProjects || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-full text-warning">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Note moyenne</p>
                  <p className="text-2xl font-bold">
                    {stats?.averageRating || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-full text-purple-500">
                  <Euro className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Revenus estimés</p>
                  <p className="text-2xl font-bold">
                    {stats?.totalRevenue || 0}€
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Planning Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Planning des Projets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects
                      .filter(
                        (p) =>
                          p.status === 'in_progress' || p.status === 'completed'
                      )
                      .slice(0, 3)
                      .map((project) => (
                        <PlanningCard
                          key={project.id}
                          project={project}
                          professionalView={true}
                        />
                      ))}
                    {projects.filter(
                      (p) =>
                        p.status === 'in_progress' || p.status === 'completed'
                    ).length === 0 && (
                      <p className="text-center text-text-secondary py-8">
                        Aucun projet en cours ou terminé
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Charts Section */}
              {/* Quick Actions */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Link href="/professionnel/profile">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Mon profil</h3>
                        <p className="text-sm text-gray-600">
                          Modifier mes informations
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/professionnel/projects">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Mes projets</h3>
                        <p className="text-sm text-gray-600">
                          Gérer mes chantiers
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/professionnel/documents">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Documents</h3>
                        <p className="text-sm text-gray-600">
                          Mes certificats et attestations
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {professional && (
                <ActivityChart professionalId={professional.id} />
              )}

              {/* Main Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                  <TabsTrigger value="available" className="gap-2">
                    <Briefcase className="w-4 h-4" />
                    Chantiers disponibles
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Mes documents
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="gap-2">
                    <Users className="w-4 h-4" />
                    Mon profil
                  </TabsTrigger>
                </TabsList>

                {/* Available Projects Tab */}
                <TabsContent value="available" className="space-y-6">
                  {/* Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Filtres de recherche
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Localisation
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                              type="text"
                              placeholder="Ville..."
                              value={filters.location}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  location: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Budget min
                          </label>
                          <div className="relative">
                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                              type="number"
                              placeholder="Min..."
                              value={filters.budgetMin}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  budgetMin: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Budget max
                          </label>
                          <div className="relative">
                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                              type="number"
                              placeholder="Max..."
                              value={filters.budgetMax}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  budgetMax: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button onClick={loadProjects} className="w-full">
                            Rechercher
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Projects Grid */}
                  {projects.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Briefcase className="w-16 h-16 text-text-muted mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">
                          Aucun chantier disponible
                        </h3>
                        <p className="text-text-secondary">
                          Modifiez vos filtres ou revenez plus tard pour
                          découvrir de nouveaux chantiers.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {projects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onBidSubmitted={loadDashboardData}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                  <ProfessionalDocuments />
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Mon profil professionnel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {professional?.company_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              SIRET: {professional?.siret}
                            </p>
                          </div>
                          <Link href="/professionnel/profile">
                            <Button variant="outline">
                              Modifier mon profil
                            </Button>
                          </Link>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Spécialités</h4>
                          <div className="flex flex-wrap gap-2">
                            {professional?.specialites?.map((spec: string) => (
                              <Badge key={spec} variant="secondary">
                                {spec}
                              </Badge>
                            )) || (
                              <Badge variant="outline">
                                Aucune spécialité définie
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Carte Solde de Crédits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5 text-primary" />
                    Solde de Crédits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {professional?.credits_balance || 0}
                        </p>
                        <p className="text-sm text-text-secondary">
                          crédits disponibles
                        </p>
                      </div>
                      <div className="text-right">
                        <Link href="/professionnel/buy-credits-new">
                          <Button size="sm" className="w-full">
                            <CreditCardIcon className="w-4 h-4 mr-2" />
                            Acheter
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="text-xs text-text-secondary bg-gray-50 p-2 rounded">
                      💡 1 crédit = 1 déverrouillage de coordonnées client
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages récents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Messages récents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {conversations && conversations.length > 0 ? (
                      conversations.slice(0, 3).map((conv: any) => {
                        const otherUser =
                          conv.client_id === user?.id
                            ? conv.professional
                            : conv.client;
                        return (
                          <Link key={conv.id} href={`/chat/${conv.id}`}>
                            <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {otherUser?.full_name || 'Utilisateur'}
                                </p>
                                <p className="text-xs text-text-secondary">
                                  {conv.messages?.length || 0} messages
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <MessageSquare className="w-8 h-8 text-text-muted mx-auto mb-2" />
                        <p className="text-sm text-text-secondary">
                          Aucun message
                        </p>
                      </div>
                    )}
                    {conversations && conversations.length > 0 && (
                      <Link href="/professionnel/messages">
                        <Button variant="outline" size="sm" className="w-full">
                          Voir tous les messages
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Conseils
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Complétez votre profil</p>
                    <p>
                      Un profil complet avec photos augmente vos chances de 50%.
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-700 dark:text-green-300">
                    <p className="font-semibold mb-1">Répondez vite</p>
                    <p>
                      Les clients choisissent souvent le premier pro qui répond.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
