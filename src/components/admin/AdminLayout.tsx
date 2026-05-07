import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Gift,
  Settings,
  BarChart3,
  Bell,
  LogOut,
  Shield,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useAdminGhostSecure,
  useSecurityGuard,
} from '@/hooks/useAdminGhostSecure';
import { useAuth } from '@/context/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  {
    name: 'Navigation',
    href: '/admin/navigation-simple',
    icon: LayoutDashboard,
  },
  { name: 'Gestion Comptes', href: '/admin/account-management', icon: Users },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'CRM Leads', href: '/admin/crm', icon: Users },
  { name: 'Créer Projet', href: '/admin/create-project', icon: PlusCircle },
  {
    name: 'Valider Projets',
    href: '/admin/projects-validation',
    icon: Settings,
  },
  {
    name: 'Validation Pros',
    href: '/admin/professionals-validation',
    icon: Shield,
  },
  { name: 'Finances', href: '/admin/finances', icon: CreditCard },
  {
    name: 'Commissions',
    href: '/admin/commission-dashboard',
    icon: CreditCard,
  },
  { name: 'Promotions', href: '/admin/promotions', icon: Gift },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  {
    name: 'Dashboard Graphiques',
    href: '/admin/dashboard-enhanced',
    icon: BarChart3,
  },
  { name: 'Paramètres', href: '/admin/settings-page', icon: Settings },
  { name: 'Notifications', href: '/admin/notification-settings', icon: Bell },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();
  const { isAdminGhost, isolationVerified, logoutAdminGhost } =
    useAdminGhostSecure();
  const {} = useSecurityGuard(); // Guard de sécurité automatique
  const { user: supabaseUser, logout: supabaseLogout } = useAuth();

  // SÉCURITÉ RENFORCÉE: Vérification stricte de l'accès admin
  useEffect(() => {
    // Vérifier si c'est un admin Supabase valide
    // @ts-ignore - role n'est pas typé sur User de Supabase
    const isSupabaseAdmin =
      supabaseUser &&
      ((supabaseUser as any).role === 'admin' ||
        (supabaseUser as any).role === 'super_admin');

    // Conditions d'accès:
    // - Admin fantôme avec isolation vérifiée
    // - OU admin Supabase valide
    if ((!isAdminGhost || !isolationVerified) && !isSupabaseAdmin) {
      console.error(' ACCÈS REFUSÉ: Session admin non valide ou non isolée');
      // Nettoyer toute session invalide
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminGhostSession_secure_v3');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        sessionStorage.clear();
      }
      router.push('/auth/login');
      return;
    }

    if (isAdminGhost && isolationVerified) {
      console.log(' Admin fantôme sécurisé accédé');
      // S'assurer qu'aucune session Supabase n'est active
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
      }
    }
  }, [isAdminGhost, isolationVerified, supabaseUser, router]);

  // Handler logout sécurisé
  const handleLogout = async () => {
    if (isAdminGhost) {
      logoutAdminGhost();
    } else {
      await supabaseLogout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-construction-orange" />
            <div>
              <h1 className="text-xl font-black">ADMIN</h1>
              <p className="text-xs text-slate-400">EDSwipe</p>
            </div>
          </div>
        </div>

        {/* Navigation principale */}
        <nav className="p-4 space-y-2">
          <div className="mb-4">
            <p className="text-xs text-slate-400 font-semibold mb-2 px-4">
              PRINCIPAL
            </p>
            {navigation.slice(0, 2).map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-construction-orange text-white shadow-lg'
                      : 'hover:bg-slate-800 text-slate-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="mb-4">
            <p className="text-xs text-slate-400 font-semibold mb-2 px-4">
              GESTION
            </p>
            {navigation.slice(2, 7).map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-construction-orange text-white shadow-lg'
                      : 'hover:bg-slate-800 text-slate-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="mb-4">
            <p className="text-xs text-slate-400 font-semibold mb-2 px-4">
              ANALYTICS & FINANCE
            </p>
            {navigation.slice(7, 11).map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-construction-orange text-white shadow-lg'
                      : 'hover:bg-slate-800 text-slate-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div>
            <p className="text-xs text-slate-400 font-semibold mb-2 px-4">
              SYSTÈME
            </p>
            {navigation.slice(11).map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-construction-orange text-white shadow-lg'
                      : 'hover:bg-slate-800 text-slate-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bouton retour - séparé en bas avec marge */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push('/')}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Retour au site
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">{title}</h1>
          <p className="text-slate-600">
            Gestion et administration de la plateforme
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}
