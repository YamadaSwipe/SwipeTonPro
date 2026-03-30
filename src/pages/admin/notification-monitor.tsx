/**
 * @fileoverview Dashboard de Monitoring des Notifications
 * @author Senior Security Architect
 * @version 1.0.0
 * 
 * Interface d'administration pour surveiller les notifications
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface NotificationLog {
  id: string;
  type: string;
  recipients: string[];
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  user_id?: string;
  priority: string;
  created_at: string;
}

interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: Record<string, number>;
  successRate: number;
}

export default function NotificationMonitor() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    type: 'all',
    dateRange: '24h'
  });

  useEffect(() => {
    loadNotificationLogs();
    loadNotificationStats();
  }, [filter]);

  const loadNotificationLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter.type !== 'all') {
        query = query.eq('type', filter.type);
      }

      // Filtrage par date
      const now = new Date();
      let dateFilter: string;
      switch (filter.dateRange) {
        case '1h':
          dateFilter = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
          break;
        case '24h':
          dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7d':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      }

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('❌ Erreur chargement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationStats = async () => {
    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Stats des dernières 24h
      const { data: logs, error } = await supabase
        .from('notification_logs')
        .select('status, type')
        .gte('created_at', dayAgo);

      if (error) throw error;

      const stats: NotificationStats = {
        total: logs?.length || 0,
        sent: logs?.filter(l => l.status === 'sent').length || 0,
        failed: logs?.filter(l => l.status === 'failed').length || 0,
        pending: logs?.filter(l => l.status === 'pending').length || 0,
        byType: {},
        successRate: 0
      };

      // Calcul par type
      logs?.forEach(log => {
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      });

      // Calcul taux de succès
      if (stats.total > 0) {
        stats.successRate = Math.round((stats.sent / stats.total) * 100);
      }

      setStats(stats);
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
      urgent: 'bg-purple-100 text-purple-800'
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🔔 Monitoring des Notifications</h1>
        <Button onClick={() => window.location.reload()}>
          🔄 Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select 
                className="w-full p-2 border rounded"
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
              >
                <option value="all">Tous</option>
                <option value="sent">Envoyés</option>
                <option value="failed">Échoués</option>
                <option value="pending">En attente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select 
                className="w-full p-2 border rounded"
                value={filter.type}
                onChange={(e) => setFilter({...filter, type: e.target.value})}
              >
                <option value="all">Tous</option>
                <option value="professional_interested">Intérêt Pro</option>
                <option value="new_project_admin">Nouveau Projet</option>
                <option value="new_professional_admin">Nouveau Pro</option>
                <option value="match_completed">Match Complété</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Période</label>
              <select 
                className="w-full p-2 border rounded"
                value={filter.dateRange}
                onChange={(e) => setFilter({...filter, dateRange: e.target.value})}
              >
                <option value="1h">Dernière heure</option>
                <option value="24h">Dernières 24h</option>
                <option value="7d">Derniers 7 jours</option>
                <option value="30d">Derniers 30 jours</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Notifications</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
              <div className="text-sm text-gray-600">Envoyées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-600">Échouées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.successRate}%</div>
              <div className="text-sm text-gray-600">Taux de Succès</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs des Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">🔄 Chargement...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune notification trouvée pour les filtres sélectionnés
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Date</th>
                    <th className="border p-2 text-left">Type</th>
                    <th className="border p-2 text-left">Destinataires</th>
                    <th className="border p-2 text-left">Priorité</th>
                    <th className="border p-2 text-left">Statut</th>
                    <th className="border p-2 text-left">Erreur</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {log.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="max-w-xs truncate">
                          {log.recipients.join(', ')}
                        </div>
                      </td>
                      <td className="p-2">
                        {getPriorityBadge(log.priority)}
                      </td>
                      <td className="p-2">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="p-2 text-red-600 text-sm max-w-xs truncate">
                        {log.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
