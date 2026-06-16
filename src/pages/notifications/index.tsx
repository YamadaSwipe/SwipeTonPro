import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/services/authService';
import { notificationService } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Database } from '@/integrations/supabase/types';

type Notification = Database['public']['Tables']['notifications']['Row'];

/**
 * Page de liste des notifications
 * Affiche toutes les notifications avec filtres (toutes, non lues, lues)
 */
export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  // Charger l'utilisateur connecté
  useEffect(() => {
    const loadUser = async () => {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
    };
    loadUser();
  }, [router]);

  // Charger les notifications
  const loadNotifications = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await notificationService.getUserNotifications(userId, 100);
      
      if (error) {
        console.error('Erreur chargement notifications:', error);
        return;
      }

      setNotifications(data || []);
      applyFilter(data || [], currentFilter);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId]);

  // Appliquer le filtre
  const applyFilter = (notifs: Notification[], filter: 'all' | 'unread' | 'read') => {
    let filtered = notifs;
    
    if (filter === 'unread') {
      filtered = notifs.filter(n => !n.is_read);
    } else if (filter === 'read') {
      filtered = notifs.filter(n => n.is_read);
    }
    
    setFilteredNotifications(filtered);
    setCurrentFilter(filter);
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      
      applyFilter(
        notifications.map(n => n.id === notificationId ? { ...n, is_read: true } : n),
        currentFilter
      );
    } catch (err) {
      console.error('Erreur marquage notification:', err);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      await notificationService.markAllAsRead(userId);
      
      const updatedNotifs = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updatedNotifs);
      applyFilter(updatedNotifs, currentFilter);
    } catch (err) {
      console.error('Erreur marquage toutes notifications:', err);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      const updatedNotifs = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifs);
      applyFilter(updatedNotifs, currentFilter);
    } catch (err) {
      console.error('Erreur suppression notification:', err);
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lue
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigation selon le type de notification
    const data = notification.data as any;
    
    if (data?.project_id) {
      router.push(`/projets/${data.project_id}`);
    } else if (data?.professional_id) {
      router.push(`/professionnel/${data.professional_id}`);
    } else if (data?.match_id) {
      router.push(`/matches/${data.match_id}`);
    }
  };

  // Obtenir l'icône selon le type
  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      match_mutual: '🎉',
      mini_message: '💬',
      credit_purchase: '✅',
      credit_purchase_admin: '💰',
      report_signal: '🚨',
      new_project: '📋',
      new_profile_pro: '👷',
      system_activity: '⚙️',
    };
    return icons[type] || '🔔';
  };

  // Obtenir la couleur selon le type
  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      match_mutual: 'bg-green-50 border-l-4 border-green-500',
      mini_message: 'bg-blue-50 border-l-4 border-blue-500',
      credit_purchase: 'bg-purple-50 border-l-4 border-purple-500',
      credit_purchase_admin: 'bg-yellow-50 border-l-4 border-yellow-500',
      report_signal: 'bg-red-50 border-l-4 border-red-500',
      new_project: 'bg-indigo-50 border-l-4 border-indigo-500',
      new_profile_pro: 'bg-teal-50 border-l-4 border-teal-500',
      system_activity: 'bg-gray-50 border-l-4 border-gray-500',
    };
    return colors[type] || 'bg-gray-50 border-l-4 border-gray-400';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  {unreadCount > 0 
                    ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                    : 'Aucune notification non lue'}
                </CardDescription>
              </div>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex items-center gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={currentFilter} onValueChange={(value) => applyFilter(notifications, value as any)}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Toutes ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Non lues ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="read" className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Lues ({notifications.length - unreadCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={currentFilter} className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
                    <p>Chargement des notifications...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>
                      {currentFilter === 'unread' 
                        ? 'Aucune notification non lue' 
                        : currentFilter === 'read'
                        ? 'Aucune notification lue'
                        : 'Aucune notification'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        getNotificationColor(notification.type)
                      } ${!notification.is_read ? 'bg-opacity-100' : 'bg-opacity-50 opacity-75'}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-2xl mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {notification.title}
                              </h3>
                              {!notification.is_read && (
                                <Badge variant="destructive" className="text-xs">
                                  Nouveau
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-2">
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-gray-500">
                              {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              title="Marquer comme lu"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            title="Supprimer"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
