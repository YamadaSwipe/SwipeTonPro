import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/router';

interface NotificationBellProps {
  userId: string;
  className?: string;
  onNotificationClick?: () => void;
}

/**
 * Composant de cloche de notifications avec pastille rouge
 * Affiche le nombre de notifications non lues en temps réel
 */
export function NotificationBell({ userId, className = '', onNotificationClick }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Charger le nombre de notifications non lues
  const loadUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Erreur chargement notifications:', error);
        return;
      }

      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    if (userId) {
      loadUnreadCount();
    }
  }, [userId]);

  // S'abonner aux nouvelles notifications en temps réel
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Nouvelle notification reçue:', payload);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Si une notification est marquée comme lue
          const newNotif = payload.new as any;
          const oldNotif = payload.old as any;
          
          if (newNotif.is_read && !oldNotif.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      // Navigation par défaut vers la page des notifications
      router.push('/notifications');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
      aria-label={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
      title={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
    >
      <Bell className="h-6 w-6 text-gray-700" />
      
      {/* Pastille rouge avec le nombre de notifications */}
      {!isLoading && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
