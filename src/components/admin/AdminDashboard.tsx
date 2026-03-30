'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Utilisateurs Total',
      value: '3,247',
      change: '+12%',
      changeType: 'increase' as const,
      icon: Users
    },
    {
      title: 'Projets Actifs',
      value: '1,892',
      change: '+8%',
      changeType: 'increase' as const,
      icon: FileText
    },
    {
      title: 'Revenu Mensuel',
      value: '€24,567',
      change: '+23%',
      changeType: 'increase' as const,
      icon: CreditCard
    },
    {
      title: 'Taux Conversion',
      value: '4.2%',
      change: '-2%',
      changeType: 'decrease' as const,
      icon: BarChart3
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'project',
      description: 'Nouveau projet "Rénovation Salle de Bain"',
      user: 'Jean Dupont',
      time: 'Il y a 5 min',
      status: 'pending'
    },
    {
      id: 2,
      type: 'user',
      description: 'Nouveau professionnel inscrit',
      user: 'Marie Martin',
      time: 'Il y a 15 min',
      status: 'approved'
    },
    {
      id: 3,
      type: 'emergency',
      description: 'Demande d\'urgence reçue',
      user: 'Pierre Durand',
      time: 'Il y a 30 min',
      status: 'urgent'
    },
    {
      id: 4,
      type: 'payment',
      description: 'Paiement reçu - Pack Pro',
      user: 'Sophie Bernard',
      time: 'Il y a 1h',
      status: 'completed'
    }
  ];

  const systemStatus = [
    {
      name: 'API Serveur',
      status: 'online',
      uptime: '99.9%',
      responseTime: '45ms'
    },
    {
      name: 'Base de données',
      status: 'online',
      uptime: '99.8%',
      responseTime: '12ms'
    },
    {
      name: 'Messagerie Temps Réel',
      status: 'online',
      uptime: '98.5%',
      responseTime: '23ms'
    },
    {
      name: 'Service Email',
      status: 'online',
      uptime: '99.7%',
      responseTime: '156ms'
    }
  ];

  const quickActions = [
    {
      title: 'Gérer Utilisateurs',
      description: 'Voir et gérer tous les utilisateurs',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Voir Projets',
      description: 'Gérer les projets et demandes',
      icon: FileText,
      href: '/admin/projects',
      color: 'bg-green-500'
    },
    {
      title: 'Paramètres',
      description: 'Configurer la plateforme',
      icon: Settings,
      href: '/admin/platform-settings',
      color: 'bg-purple-500'
    },
    {
      title: 'Analytics',
      description: 'Statistiques détaillées',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-600">Vue d'ensemble de la plateforme SwipeTonPro</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-600 ml-1">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activité Récente</h3>
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'urgent' ? 'bg-red-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' :
                    activity.status === 'completed' ? 'bg-green-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-600">{activity.user} • {activity.time}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Système</h3>
              <Badge variant="default" className="bg-green-500">
                En ligne
              </Badge>
            </div>
            <div className="space-y-3">
              {systemStatus.map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">{service.responseTime}</p>
                    <p className="text-xs text-gray-500">{service.uptime}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col gap-3 hover:border-gray-300"
                  asChild
                >
                  <a href={action.href}>
                    <div className={`w-12 h-12 rounded-lg ${action.color} bg-opacity-10 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${action.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{action.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{action.description}</div>
                    </div>
                  </a>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Alertes et Notifications</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">3 demandes d'urgence en attente</p>
                <p className="text-xs text-gray-600">Nécessite une attention immédiate</p>
              </div>
              <Button size="sm" variant="outline">
                Voir
              </Button>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Augmentation de 25% des inscriptions</p>
                <p className="text-xs text-gray-600">Cette semaine comparée à la semaine dernière</p>
              </div>
              <Button size="sm" variant="outline">
                Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
