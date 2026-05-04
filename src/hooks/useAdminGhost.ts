/**
 * Hook sécurisé pour l'admin fantôme
 * Isolation totale de Supabase Auth pour éviter les locks
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

interface AdminGhostUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface AdminGhostSession {
  user: AdminGhostUser;
  timestamp: number;
}

const ADMIN_GHOST_KEY = 'adminGhostSession_v2';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24h

export function useAdminGhost() {
  const router = useRouter();
  const [isAdminGhost, setIsAdminGhost] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminGhostUser | null>(null);

  // Vérifier si c'est une session admin fantôme valide
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const session = localStorage.getItem(ADMIN_GHOST_KEY);
    if (!session) {
      setIsAdminGhost(false);
      setAdminUser(null);
      return;
    }

    try {
      const parsed: AdminGhostSession = JSON.parse(session);
      const now = Date.now();
      
      // Vérifier expiration
      if (now - parsed.timestamp > SESSION_TIMEOUT) {
        console.log('⏰ Admin ghost session expired');
        localStorage.removeItem(ADMIN_GHOST_KEY);
        setIsAdminGhost(false);
        setAdminUser(null);
        return;
      }

      // Vérifier que c'est bien un admin
      if (parsed.user?.role === 'super_admin' && parsed.user?.id === '00000000-0000-0000-0000-000000000001') {
        setIsAdminGhost(true);
        setAdminUser(parsed.user);
        console.log('✅ Admin ghost session valid');
      } else {
        console.error('❌ Invalid admin ghost session');
        localStorage.removeItem(ADMIN_GHOST_KEY);
        setIsAdminGhost(false);
        setAdminUser(null);
      }
    } catch (e) {
      console.error('❌ Error parsing admin ghost session:', e);
      localStorage.removeItem(ADMIN_GHOST_KEY);
      setIsAdminGhost(false);
      setAdminUser(null);
    }
  }, []);

  // Login admin fantôme (API call isolée)
  const loginAdminGhost = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (email !== 'admin@swipetonpro.fr' || password !== 'Admin123!') {
      return false;
    }

    try {
      console.log('🔧 Admin ghost login attempt...');
      
      const response = await fetch('/api/admin-ghost-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        console.error('❌ Admin ghost API error:', response.status);
        return false;
      }

      const data = await response.json();
      
      if (!data.success || !data.user) {
        console.error('❌ Admin ghost login failed:', data.error);
        return false;
      }

      // Vérifier sécurité
      if (data.user.id !== '00000000-0000-0000-0000-000000000001' || data.user.role !== 'super_admin') {
        console.error('🚨 Security violation: Invalid admin ghost user');
        return false;
      }

      // Stocker session
      const session: AdminGhostSession = {
        user: data.user,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(ADMIN_GHOST_KEY, JSON.stringify(session));
      setIsAdminGhost(true);
      setAdminUser(data.user);
      
      console.log('✅ Admin ghost login successful');
      return true;
    } catch (error) {
      console.error('❌ Admin ghost login error:', error);
      return false;
    }
  }, []);

  // Logout admin fantôme
  const logoutAdminGhost = useCallback(() => {
    console.log('🚪 Admin ghost logout');
    localStorage.removeItem(ADMIN_GHOST_KEY);
    setIsAdminGhost(false);
    setAdminUser(null);
    router.push('/auth/login');
  }, [router]);

  // Forcer cleanup si navigation vers non-admin
  useEffect(() => {
    if (!isAdminGhost || !adminUser) return;

    const handleRouteChange = (url: string) => {
      // Si l'URL ne commence pas par /admin, vérifier si c'est autorisé
      if (!url.startsWith('/admin') && !url.startsWith('/api')) {
        console.warn('⚠️ Admin ghost accessing non-admin route:', url);
        // On laisse passer mais on log
      }
    };

    // Nettoyer si l'utilisateur ferme l'onglet (optionnel)
    const handleBeforeUnload = () => {
      // Ne pas nettoyer - persistance voulue
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAdminGhost, adminUser]);

  return {
    isAdminGhost,
    adminUser,
    loginAdminGhost,
    logoutAdminGhost,
  };
}

// Helper pour vérifier si une route est protégée admin
export function isAdminRoute(path: string): boolean {
  return path.startsWith('/admin') || path.startsWith('/api/admin');
}

// Helper pour sécuriser les composants
export function useRequireAdminGhost() {
  const { isAdminGhost, adminUser } = useAdminGhost();
  const router = useRouter();

  useEffect(() => {
    if (!isAdminGhost && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (isAdminRoute(currentPath)) {
        console.warn('🚨 Non-admin ghost accessing admin route, redirecting...');
        router.push('/auth/login');
      }
    }
  }, [isAdminGhost, router]);

  return { isAdminGhost, adminUser };
}
