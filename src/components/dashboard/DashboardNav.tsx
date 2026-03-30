'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  Users,
  Settings,
  FileText,
  Calendar,
  BarChart3,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface DashboardNavProps {
  className?: string;
}

export function DashboardNav({ className = '' }: DashboardNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    {
      href: '/dashboard',
      label: 'Accueil',
      icon: Home,
      description: 'Vue d\'ensemble'
    },
    {
      href: '/dashboard/projets',
      label: 'Projets',
      icon: FileText,
      description: 'Gérer les projets'
    },
    {
      href: '/dashboard/messages',
      label: 'Messages',
      icon: Users,
      description: 'Communications'
    },
    {
      href: '/dashboard/calendar',
      label: 'Calendrier',
      icon: Calendar,
      description: 'Planning'
    },
    {
      href: '/dashboard/analytics',
      label: 'Statistiques',
      icon: BarChart3,
      description: 'Performances'
    },
    {
      href: '/dashboard/settings',
      label: 'Paramètres',
      icon: Settings,
      description: 'Configuration'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`w-64 bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tableau de bord</h2>
          <button
            className="md:hidden p-1 rounded-md hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-500" />
            ) : (
              <Menu className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block p-4`}>
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${active 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div>{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Logout */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <Link
            href="/auth/logout"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
