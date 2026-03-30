import { useState, useEffect } from 'react';
import { Bell, X, Phone, CheckCircle, AlertCircle, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationService } from '@/services/notificationService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
  projects?: {
    title: string;
    category: string;
    city: string;
    status: string;
  };
}

interface NotificationCenterProps {
  userId: string;
  onNotificationClick?: (notification: Notification) => void;
}

export default function NotificationCenter({ userId, onNotificationClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    const { data: notificationsData, error } = await notificationService.getUserNotifications(userId);
    if (error) {
      console.error('Erreur chargement notifications:', error);
      return;
    }

    setNotifications((notificationsData || []).map(n => ({ ...n, read: n.is_read })));
    
    // Compter les non lues
    const { data: count } = await notificationService.getUnreadCount(userId);
    setUnreadCount(count || 0);
  };

  const markAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_submitted':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'project_validated':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'project_published':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'professional_interested':
        return <Phone className="h-4 w-4 text-orange-600" />;
      case 'professional_selected':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'call_scheduled':
        return <Phone className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'project_submitted':
        return 'border-blue-200 bg-blue-50';
      case 'project_validated':
        return 'border-green-200 bg-green-50';
      case 'project_published':
        return 'border-purple-200 bg-purple-50';
      case 'professional_interested':
        return 'border-orange-200 bg-orange-50';
      case 'professional_selected':
        return 'border-emerald-200 bg-emerald-50';
      case 'call_scheduled':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bouton notifications */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panneau notifications */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <Card className="border-0 shadow-none">
            <CardHeader className="flex items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Tout marquer comme lu
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                          notification.read ? 'bg-white opacity-60' : getNotificationColor(notification.type)
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              {!notification.read && (
                                <Badge variant="secondary" className="text-xs">
                                  Nouveau
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            
                            {/* Détails additionnels */}
                            {notification.data && (
                              <div className="text-xs text-gray-500 space-y-1">
                                {notification.data.project_title && (
                                  <p>Projet: {notification.data.project_title}</p>
                                )}
                                {notification.data.professional_name && (
                                  <p>Professionnel: {notification.data.professional_name}</p>
                                )}
                                {notification.data.next_steps && (
                                  <div>
                                    <p className="font-medium">Prochaines étapes:</p>
                                    <ul className="ml-4 list-disc">
                                      {notification.data.next_steps.map((step: string, index: number) => (
                                        <li key={index}>{step}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {notification.data.contact_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => window.location.href = notification.data.contact_url}
                                  >
                                    Contacter
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-400">
                              {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
