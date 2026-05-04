/**
 * Hook sécurisé pour l'admin fantôme - ISOLATION TOTALE
 * Empêche tout mélange entre comptes et protège les données privées
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
  isolation_key: string; // Clé d'isolation unique
}

const ADMIN_GHOST_KEY = 'adminGhostSession_secure_v3';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24h
const ISOLATION_KEY = 'EDSWIPE_ADMIN_ISOLATION_2024';

export function useAdminGhostSecure() {
  const router = useRouter();
  const [isAdminGhost, setIsAdminGhost] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminGhostUser | null>(null);
  const [isolationVerified, setIsolationVerified] = useState(false);

  // Vérification stricte de la session admin fantôme (COOKIES)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Utiliser les cookies pour compatibilité avec middleware
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue ? decodeURIComponent(cookieValue) : null;
      }
      return null;
    };

    const session = getCookie(ADMIN_GHOST_KEY);
    if (!session) {
      setIsAdminGhost(false);
      setAdminUser(null);
      setIsolationVerified(false);
      return;
    }

    try {
      const parsed: AdminGhostSession = JSON.parse(session);
      const now = Date.now();

      // Vérification stricte de l'isolation
      if (parsed.isolation_key !== ISOLATION_KEY) {
        console.error("🚨 VIOLATION ISOLATION: Clé d'isolation invalide");
        // Supprimer le cookie invalide
        document.cookie = `${ADMIN_GHOST_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        // Nettoyer tout ce qui pourrait contaminer
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        sessionStorage.clear();
        setIsAdminGhost(false);
        setAdminUser(null);
        setIsolationVerified(false);
        return;
      }

      // Vérification expiration
      if (now - parsed.timestamp > SESSION_TIMEOUT) {
        console.log('⏰ Session admin fantôme expirée');
        document.cookie = `${ADMIN_GHOST_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        setIsAdminGhost(false);
        setAdminUser(null);
        setIsolationVerified(false);
        return;
      }

      // Vérification que c'est bien l'admin (tout ID UUID valide accepté)
      if (
        parsed.user?.email === 'admin@swipotonpro.fr' &&
        parsed.user?.role === 'super_admin'
      ) {
        setIsAdminGhost(true);
        setAdminUser(parsed.user);
        setIsolationVerified(true);
        console.log('✅ Session admin fantôme sécurisée vérifiée');

        // Nettoyer toute trace d'autres comptes
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
      } else {
        console.error('🚨 SÉCURITÉ: Session admin fantôme invalide');
        document.cookie = `${ADMIN_GHOST_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        setIsAdminGhost(false);
        setAdminUser(null);
        setIsolationVerified(false);
      }
    } catch (e) {
      console.error('❌ Erreur critique session admin:', e);
      document.cookie = `${ADMIN_GHOST_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      setIsAdminGhost(false);
      setAdminUser(null);
      setIsolationVerified(false);
    }
  }, []);

  // Login admin fantôme sécurisé
  const loginAdminGhost = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (email !== 'admin@swipotonpro.fr' || password !== 'Admin123!') {
        return false;
      }

      try {
        console.log('🔐 Tentative login admin fantôme sécurisé...');

        // Nettoyer toute session existante avant login
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        sessionStorage.clear();

        const response = await fetch('/api/admin-ghost-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secure': 'true',
            'x-isolation-key': ISOLATION_KEY,
          },
          body: JSON.stringify({ email, password, secure: true }),
        });

        if (!response.ok) {
          console.error('❌ Erreur API admin fantôme:', response.status);
          return false;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
          console.error('❌ Login admin fantôme échoué:', data.error);
          return false;
        }

        // Vérification de sécurité stricte
        if (
          data.user.id !== '00000000-0000-0000-0000-000000000001' ||
          data.user.email !== 'admin@swipotonpro.fr' ||
          data.user.role !== 'super_admin'
        ) {
          console.error('🚨 VIOLATION SÉCURITÉ: Données admin invalides');
          return false;
        }

        // Créer session isolée avec cookies
        const session: AdminGhostSession = {
          user: data.user,
          timestamp: Date.now(),
          isolation_key: ISOLATION_KEY,
        };

        // Stocker dans les cookies pour compatibilité middleware
        const sessionJSON = JSON.stringify(session);
        const expires = new Date(Date.now() + SESSION_TIMEOUT);
        document.cookie = `${ADMIN_GHOST_KEY}=${encodeURIComponent(sessionJSON)}; expires=${expires.toUTCString()}; path=/;`;

        // Nettoyer complètement les autres sessions
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        sessionStorage.clear();

        setIsAdminGhost(true);
        setAdminUser(data.user);
        setIsolationVerified(true);

        console.log('✅ Login admin fantôme sécurisé réussi');
        return true;
      } catch (error) {
        console.error('❌ Erreur login admin fantôme:', error);
        return false;
      }
    },
    []
  );

  // Logout sécurisé
  const logoutAdminGhost = useCallback(() => {
    console.log('🚪 Logout admin fantôme sécurisé');

    // Nettoyer TOUTES les sessions
    document.cookie = `${ADMIN_GHOST_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    sessionStorage.clear();

    setIsAdminGhost(false);
    setAdminUser(null);
    setIsolationVerified(false);

    // Redirection forcée
    router.push('/auth/login');
  }, [router]);

  // Vérification continue de l'isolation (COOKIES)
  useEffect(() => {
    if (!isAdminGhost || !isolationVerified) return;

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue ? decodeURIComponent(cookieValue) : null;
      }
      return null;
    };

    const checkIsolation = () => {
      const session = getCookie(ADMIN_GHOST_KEY);
      if (!session) {
        console.error('🚨 Session perdue, logout forcé');
        logoutAdminGhost();
        return;
      }

      try {
        const parsed: AdminGhostSession = JSON.parse(session);
        if (parsed.isolation_key !== ISOLATION_KEY) {
          console.error('🚨 Violation isolation détectée');
          logoutAdminGhost();
          return;
        }
      } catch (e) {
        console.error('🚨 Erreur isolation, logout forcé');
        logoutAdminGhost();
      }
    };

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkIsolation, 30000);
    return () => clearInterval(interval);
  }, [isAdminGhost, isolationVerified, logoutAdminGhost]);

  return {
    isAdminGhost,
    adminUser,
    isolationVerified,
    loginAdminGhost,
    logoutAdminGhost,
  };
}

// Helper pour vérifier si une route est admin uniquement
export function isAdminOnlyRoute(path: string): boolean {
  return path.startsWith('/admin') && !path.includes('/login');
}

// Guard de sécurité pour les composants
export function useSecurityGuard() {
  const { isAdminGhost, isolationVerified } = useAdminGhostSecure();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPath = window.location.pathname;

    // Si on est sur une route admin mais pas admin fantôme vérifié
    if (
      isAdminOnlyRoute(currentPath) &&
      (!isAdminGhost || !isolationVerified)
    ) {
      console.warn("🚨 ACCÈS INTERDIT: Tentative d'accès admin non autorisée");
      router.push('/auth/login');
      return;
    }

    // Si on est admin fantôme sur une route non-admin
    if (isAdminGhost && isolationVerified && !isAdminOnlyRoute(currentPath)) {
      console.warn('⚠️ Admin fantôme sur route non-admin:', currentPath);
      // On autorise mais on log
    }
  }, [isAdminGhost, isolationVerified, router]);

  return { isAdminGhost, isolationVerified };
}
