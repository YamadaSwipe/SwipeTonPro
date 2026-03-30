import { useEffect, useState } from "react";
import { notificationService } from "@/services/notificationService";
import { Bell, MessageSquare, CheckCircle, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await notificationService.getUserNotifications(user.id);
      const { data: count } = await notificationService.getUnreadCount(user.id);
      if (data) setNotifications(data);
      if (count !== null) setUnreadCount(count);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
    const subscription = notificationService.subscribeToNotifications((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const handleClick = async (notif: any) => {
    // Marquer comme lu
    await notificationService.markAsRead(notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Navigation selon le type
    const data = notif.data || {};
    switch (notif.type) {
      case "new_interest":
        // Pro intéressé → particulier voit les intérêts du projet
        if (data.project_id) {
          router.push(`/particulier/projects/${data.project_id}/interests`);
        }
        break;
      case "project_validated":
      case "project_rejected":
      case "project_info_needed":
        if (data.project_id) {
          router.push(`/particulier/projects`);
        }
        break;
      case "match_confirmed":
        // Match → pro voit la page de paiement
        if (data.interest_id) {
          router.push(`/professionnel/matches`);
        }
        break;
      case "payment_confirmed":
        if (data.project_id) {
          router.push(`/particulier/projects/${data.project_id}/interests`);
        }
        break;
      case "new_message":
        if (data.conversation_id) {
          router.push(`/chat/${data.conversation_id}`);
        }
        break;
      default:
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_interest": return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "match_confirmed":
      case "payment_confirmed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "new_review": return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto px-2 py-0.5 text-xs">
              Tout lire
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notif.is_read ? "bg-muted/50" : ""
                )}
                onClick={() => handleClick(notif)}
              >
                <div className="mt-0.5 flex-shrink-0">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <span className={cn("text-sm leading-tight", !notif.is_read && "font-semibold")}>
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
