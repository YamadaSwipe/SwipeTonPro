/**
 * @fileoverview Dashboard Utilisateur Amélioré avec Historique Complet
 * @description Dashboard regroupant l'activité par projet avec:
 * - Historique complet des messages échangés
 * - Suivi des actions (match validé, rendez-vous, devis signé)
 * - Statut financier Stripe
 * - Activation paiement séquestré pour particuliers
 * @author Senior Architect
 * @version 1.0.0
 */

import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import {
  LogOut,
  Home,
  MessageSquare,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  CreditCard,
  Shield,
  Activity,
  Calendar,
  User,
  Bell,
} from 'lucide-react';
import { userDashboardService, type DashboardData, type StripeStats } from '@/services/userDashboardService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export default function DashboardEnhanced() {
  return (
    <ClientGuard>
      <DashboardEnhancedContent />
    </ClientGuard>
  );
}

function DashboardEnhancedContent() {
  const router = useRouter();
  const { user, profile, logout, initialized, loading } = useAuth();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [stripeStats, setStripeStats] = useState<StripeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized || !user) return;

    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Charger les données du dashboard
        const { data: dashData, error: dashError } = await userDashboardService.getDashboardData(user.id);
        
        if (dashError) {
          throw dashError;
        }

        setDashboardData(dashData);

        // Charger les statistiques Stripe
        const { data: stripeData, error: stripeError } = await userDashboardService.getStripeStats(user.id);
        
        if (stripeError) {
          console.warn('⚠️ Erreur chargement stats Stripe:', stripeError);
        } else {
          setStripeStats(stripeData);
        }

      } catch (err) {
        console.error('❌ Erreur chargement dashboard:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [initialized, user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  };

  if (!initialized || loading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const projects = dashboardData?.projects || [];
  const messagesHistory = dashboardData?.messages_history || [];
  const actionsTimeline = dashboardData?.actions_timeline || [];
  const financialStatus = dashboardData?.financial_status || [];

  return (
    <>
      <SEO
        title="Dashboard Amélioré - SwipeTonPro"
        description="Tableau de bord complet avec historique des messages, suivi des actions et statut financier"
      />

      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface">
        {/* Header */}
        <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2">
                  <Home className="w-5 h-5 text-primary" />
                  <span className="font-bold text-xl">SwipeTonPro</span>
                </Link>
                <Badge variant="secondary">Dashboard Amélioré</Badge>
              </div>
              <div className="flex items-center space-x-4">
                {user && <NotificationBell userId={user.id} />}
                <Link href="/particulier/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard Classique
                  </Button>
                </Link>
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
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              👋 Bienvenue, {profile?.full_name || user?.email?.split('@')[0]} !
            </h1>
            <p className="text-muted-foreground">
              Vue d'ensemble complète de vos projets et activités
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Projets</p>
                    <p className="text-2xl font-bold">{stats?.total_projects || 0}</p>
                  </div>
                  <Activity className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Matchs Validés</p>
                    <p className="text-2xl font-bold">{stats?.total_matches || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                    <p className="text-2xl font-bold">{stats?.total_conversations || 0}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Budget Total</p>
                    <p className="text-2xl font-bold">
                      {userDashboardService.formatCurrency(stats?.total_spent || 0)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stripe Stats */}
          {stripeStats && (
            <Card className="mb-8 border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Statut Financier Stripe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Paiements Réussis</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stripeStats.successful_payments}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total: {userDashboardService.formatCurrency(stripeStats.total_amount_paid)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Séquestres Actifs</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stripeStats.active_escrows}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Montant: {userDashboardService.formatCurrency(stripeStats.total_escrow_amount)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">En Attente</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stripeStats.pending_payments}
                    </p>
                    {stripeStats.failed_payments > 0 && (
                      <p className="text-sm text-red-600">
                        {stripeStats.failed_payments} échoué(s)
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs pour différentes vues */}
          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="projects">Projets</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="financial">Financier</TabsTrigger>
            </TabsList>

            {/* Onglet Projets */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mes Projets ({projects.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun projet pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedProject(project.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{project.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {project.category} • {project.city}
                              </p>
                            </div>
                            <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Budget: {userDashboardService.formatCurrency(project.budget_max || 0)}
                            </span>
                            <span>
                              Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Timeline */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Timeline des Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {actionsTimeline.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune action enregistrée</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {actionsTimeline.slice(0, 20).map((action, index) => (
                        <div key={index} className="flex items-start gap-4 border-l-2 border-primary pl-4 py-2">
                          <div className="flex-shrink-0 mt-1">
                            {action.action_type === 'match_paid' && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {action.action_type === 'bid_received' && <FileText className="w-5 h-5 text-blue-500" />}
                            {action.action_type === 'conversation_started' && <MessageSquare className="w-5 h-5 text-purple-500" />}
                            {action.action_type === 'interest_signaled' && <TrendingUp className="w-5 h-5 text-yellow-500" />}
                            {action.action_type === 'project_created' && <Activity className="w-5 h-5 text-gray-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {userDashboardService.getActionLabel(action.action_type)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {action.project_title}
                              {action.professional_name && ` • ${action.professional_name}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {userDashboardService.formatDate(action.action_date)}
                            </p>
                          </div>
                          {action.payment_amount && (
                            <div className="text-right">
                              <p className="font-semibold text-green-600">
                                {userDashboardService.formatCurrency(action.payment_amount)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Messages */}
            <TabsContent value="messages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Historique des Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {messagesHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun message échangé</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messagesHistory.slice(0, 20).map((msg, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 ${
                            msg.sender_type === 'client' ? 'bg-blue-50' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{msg.project_title}</p>
                              <p className="text-sm text-muted-foreground">
                                {msg.professional_name || 'Professionnel'}
                              </p>
                            </div>
                            <Badge variant={msg.sender_type === 'client' ? 'default' : 'secondary'}>
                              {msg.sender_type === 'client' ? 'Vous' : 'Pro'}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">
                            {msg.message_content || msg.mini_message_content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {userDashboardService.formatDate(msg.message_date || msg.mini_message_date || '')}
                            </span>
                            {msg.is_pre_match && (
                              <Badge variant="outline" className="text-xs">
                                Pré-match
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Financier */}
            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Statut Financier par Projet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {financialStatus.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune transaction financière</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {financialStatus.map((finance, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">{finance.project_title}</h3>
                              {finance.professional_name && (
                                <p className="text-sm text-muted-foreground">
                                  {finance.professional_name}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant={
                                finance.overall_payment_status === 'fully_paid' ||
                                finance.overall_payment_status === 'match_paid'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {userDashboardService.getPaymentStatusLabel(finance.overall_payment_status)}
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Budget Projet</p>
                              <p className="text-lg font-semibold">
                                {userDashboardService.formatCurrency(finance.budget_max || 0)}
                              </p>
                            </div>

                            {finance.match_fee_amount && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Frais de Match</p>
                                <p className="text-lg font-semibold text-green-600">
                                  {userDashboardService.formatCurrency(finance.match_fee_amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {userDashboardService.getPaymentStatusLabel(finance.match_payment_status || '')}
                                </p>
                              </div>
                            )}

                            {finance.escrow_enabled && (
                              <div className="space-y-2 col-span-2 bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-blue-600" />
                                  <p className="text-sm font-medium text-blue-900">
                                    Paiement Séquestré Activé
                                  </p>
                                </div>
                                <p className="text-lg font-semibold text-blue-600">
                                  {userDashboardService.formatCurrency(finance.escrow_amount || 0)}
                                </p>
                                <p className="text-xs text-blue-700">
                                  Statut: {finance.escrow_status || 'En attente'}
                                </p>
                              </div>
                            )}

                            {finance.bid_amount && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Devis Professionnel</p>
                                <p className="text-lg font-semibold">
                                  {userDashboardService.formatCurrency(finance.bid_amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {finance.bid_status}
                                </p>
                              </div>
                            )}
                          </div>

                          {finance.stripe_payment_intent_id && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-muted-foreground">
                                ID Stripe: {finance.stripe_payment_intent_id}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
