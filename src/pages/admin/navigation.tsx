"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Target,
  Settings,
  BarChart3,
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  Edit,
  Download,
  Search,
  Filter
} from 'lucide-react';

export default function AdminNavigationPage() {
  const adminPages = [
    // Pages principales
    {
      category: "🏠 Pages Principales",
      pages: [
        {
          title: "Dashboard Admin",
          description: "Vue d'ensemble complète avec stats et accès rapide",
          url: "/admin/index",
          icon: <BarChart3 className="w-5 h-5" />,
          status: "actif",
          features: ["Stats temps réel", "Accès rapide", "Actions recommandées"]
        },
        {
          title: "CRM Leads",
          description: "Gestion complète des leads et qualification",
          url: "/admin/crm",
          icon: <Users className="w-5 h-5" />,
          status: "actif",
          features: ["Filtres avancés", "Export CSV", "Détails lead"]
        },
        {
          title: "Paramètres Admin",
          description: "Activer/désactiver les fonctionnalités",
          url: "/admin/settings-page",
          icon: <Settings className="w-5 h-5" />,
          status: "actif",
          features: ["Features toggle", "Configuration", "IA Matching"]
        }
      ]
    },
    // Gestion utilisateurs
    {
      category: "👥 Gestion Utilisateurs",
      pages: [
        {
          title: "Utilisateurs",
          description: "Créer et gérer tous les comptes utilisateurs",
          url: "/admin/users",
          icon: <Users className="w-5 h-5" />,
          status: "actif",
          features: ["CRUD complet", "Rôles", "Permissions"]
        },
        {
          title: "Validation Professionnels",
          description: "Valider les nouveaux artisans et documents",
          url: "/admin/professionals-validation",
          icon: <CheckCircle className="w-5 h-5" />,
          status: "actif",
          features: ["Documents", "Vérification", "Validation"]
        },
        {
          title: "Rôles et Permissions",
          description: "Gérer les rôles et permissions des utilisateurs",
          url: "/admin/roles",
          icon: <Settings className="w-5 h-5" />,
          status: "actif",
          features: ["Rôles", "Permissions", "Accès"]
        }
      ]
    },
    // Gestion projets
    {
      category: "📋 Gestion Projets",
      pages: [
        {
          title: "Création Projets",
          description: "Créer des projets au nom des clients",
          url: "/admin/create-project",
          icon: <Target className="w-5 h-5" />,
          status: "actif",
          features: ["Formulaire complet", "Client proxy", "Publication"]
        },
        {
          title: "Validation Projets",
          description: "Valider et modérer les projets soumis",
          url: "/admin/validate-projects",
          icon: <CheckCircle className="w-5 h-5" />,
          status: "actif",
          features: ["Modération", "Validation", "Publication"]
        }
      ]
    },
    // Analytics et stats
    {
      category: "📊 Analytics et Statistiques",
      pages: [
        {
          title: "Dashboard Graphiques",
          description: "Visualisations avancées avec Recharts",
          url: "/admin/dashboard-enhanced",
          icon: <BarChart3 className="w-5 h-5" />,
          status: "actif",
          features: ["Charts", "Responsive", "Temps réel"]
        },
        {
          title: "Analytics Général",
          description: "Statistiques détaillées de la plateforme",
          url: "/admin/analytics",
          icon: <TrendingUp className="w-5 h-5" />,
          status: "actif",
          features: ["Metrics", "KPIs", "Tendances"]
        },
        {
          title: "Stats Homepage",
          description: "Statistiques de la page d'accueil",
          url: "/admin/homepage-stats",
          icon: <BarChart3 className="w-5 h-5" />,
          status: "actif",
          features: ["Visites", "Conversions", "Performance"]
        }
      ]
    },
    // Finance et monétisation
    {
      category: "💰 Finance et Monétisation",
      pages: [
        {
          title: "Commission Dashboard",
          description: "Suivi des commissions et paiements",
          url: "/admin/commission-dashboard",
          icon: <DollarSign className="w-5 h-5" />,
          status: "inactif",
          features: ["Commissions", "Paiements", "Tiers"]
        },
        {
          title: "Finances",
          description: "Gestion financière et rapports",
          url: "/admin/finances",
          icon: <DollarSign className="w-5 h-5" />,
          status: "actif",
          features: ["Rapports", "Transactions", "Budget"]
        },
        {
          title: "Pricing",
          description: "Configuration des prix et tarifs",
          url: "/admin/pricing",
          icon: <DollarSign className="w-5 h-5" />,
          status: "actif",
          features: ["Tarifs", "Packs", "Abonnements"]
        }
      ]
    },
    // Communication
    {
      category: "📧 Communication",
      pages: [
        {
          title: "Emails",
          description: "Gestion des templates et envois d'emails",
          url: "/admin/emails",
          icon: <Mail className="w-5 h-5" />,
          status: "actif",
          features: ["Templates", "Envois", "Tracking"]
        },
        {
          title: "Notifications",
          description: "Configuration des notifications système",
          url: "/admin/notification-settings",
          icon: <MessageSquare className="w-5 h-5" />,
          status: "actif",
          features: ["Push", "Email", "SMS"]
        },
        {
          title: "SMTP Config",
          description: "Configuration du serveur SMTP",
          url: "/admin/smtp-config",
          icon: <Settings className="w-5 h-5" />,
          status: "actif",
          features: ["SMTP", "Email", "Configuration"]
        }
      ]
    },
    // Système et logs
    {
      category: "⚙️ Système et Logs",
      pages: [
        {
          title: "Activity Logs",
          description: "Journal d'activité du système",
          url: "/admin/activity-logs",
          icon: <FileText className="w-5 h-5" />,
          status: "actif",
          features: ["Logs", "Audit", "Historique"]
        },
        {
          title: "Audit Test",
          description: "Tests d'audit et vérifications",
          url: "/admin/audit-test",
          icon: <CheckCircle className="w-5 h-5" />,
          status: "actif",
          features: ["Tests", "Vérifications", "Rapports"]
        },
        {
          title: "Setup",
          description: "Configuration initiale du système",
          url: "/admin/setup",
          icon: <Settings className="w-5 h-5" />,
          status: "actif",
          features: ["Setup", "Configuration", "Initialisation"]
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'inactif': return 'bg-gray-100 text-gray-800';
      case 'beta': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'actif': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactif': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      case 'beta': return <AlertCircle className="w-4 h-4 text-purple-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🚀 Navigation Admin EDSwipe
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Accédez à toutes les fonctionnalités administratives
          </p>
          <div className="flex justify-center space-x-4">
            <Badge className="bg-green-100 text-green-800">
              ✅ 25+ pages disponibles
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              📱 Responsive design
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              🤖 Fonctionnalités IA
            </Badge>
          </div>
        </div>

        {/* Quick Access */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">🎯 Accès Rapide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/dashboard">
                <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard Principal
                </Button>
              </Link>
              <Link href="/admin/crm">
                <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                  <Users className="w-4 h-4 mr-2" />
                  CRM Leads
                </Button>
              </Link>
              <Link href="/admin/settings-page">
                <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* All Pages */}
        {adminPages.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">{category.category.split(' ')[0]}</span>
                <span>{category.category.split(' ').slice(1).join(' ')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.pages.map((page, pageIndex) => (
                  <Link key={pageIndex} href={page.url}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {page.icon}
                          </div>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(page.status)}
                            <Badge className={`text-xs ${getStatusColor(page.status)}`}>
                              {page.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {page.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {page.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {page.features.map((feature, featureIndex) => (
                              <Badge key={featureIndex} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-gray-500">
                              {page.url}
                            </span>
                            <Eye className="w-4 h-4 text-blue-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              📋 Comment utiliser cette navigation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">🎯 Pages recommandées pour commencer</h4>
                <ol className="space-y-1 text-sm text-blue-700">
                  <li>1. <strong>/admin/index</strong> - Dashboard principal</li>
                  <li>2. <strong>/admin/settings-page</strong> - Configurer les features</li>
                  <li>3. <strong>/admin/crm</strong> - Gérer les leads</li>
                  <li>4. <strong>/admin/users</strong> - Gérer les utilisateurs</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">⚙️ Pages de configuration</h4>
                <ol className="space-y-1 text-sm text-blue-700">
                  <li>1. <strong>/admin/settings-page</strong> - Features IA/automatisation</li>
                  <li>2. <strong>/admin/pricing</strong> - Tarifs et monétisation</li>
                  <li>3. <strong>/admin/emails</strong> - Templates emails</li>
                  <li>4. <strong>/admin/roles</strong> - Permissions et rôles</li>
                </ol>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Astuce:</strong> Toutes les pages sont déjà créées et fonctionnelles. 
                Cliquez sur les liens pour y accéder directement. Les pages "inactives" nécessitent 
                d'activer les fonctionnalités correspondantes dans les paramètres.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Statistiques des pages admin</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">25+</div>
                <div className="text-sm text-gray-600">Pages admin</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">18</div>
                <div className="text-sm text-gray-600">Pages actives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">7</div>
                <div className="text-sm text-gray-600">Catégories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">100%</div>
                <div className="text-sm text-gray-600">Responsive</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
