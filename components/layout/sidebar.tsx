'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/lib/types';
import {
  LayoutDashboard, User, FileText, Briefcase, MessageSquare, Bell,
  ClipboardCheck, Building2, Users, Shield, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, Building, UserCheck, ScrollText,
  Home, X, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  CITTADINO: [
    { label: 'Dashboard', href: '/cittadino', icon: LayoutDashboard },
    { label: 'Il Mio Profilo', href: '/cittadino/profilo', icon: User },
    { label: 'Il Mio Curriculum', href: '/cittadino/curriculum', icon: FileText },
    { label: 'Candidature', href: '/cittadino/candidature', icon: Briefcase },
    { label: 'Messaggi', href: '/cittadino/messaggi', icon: MessageSquare },
    { label: 'Notifiche', href: '/cittadino/notifiche', icon: Bell },
  ],
  DIPENDENTE: [
    { label: 'Dashboard', href: '/dipendente', icon: LayoutDashboard },
    { label: 'Verifiche', href: '/dipendente/verifiche', icon: ClipboardCheck },
  ],
  DIREZIONE: [
    { label: 'Dashboard', href: '/direzione', icon: LayoutDashboard },
    { label: 'Candidature', href: '/direzione/candidature', icon: Briefcase },
    { label: 'Comunicazioni', href: '/direzione/messaggi', icon: MessageSquare },
    { label: 'Le Mie Aziende', href: '/direzione/aziende', icon: Building2 },
  ],
  AMMINISTRATORE: [
    { label: 'Dashboard', href: '/amministratore', icon: LayoutDashboard },
    { label: 'Utenti', href: '/amministratore/utenti', icon: Users },
    { label: 'Aziende', href: '/amministratore/aziende', icon: Building },
    { label: 'Dipendenti', href: '/amministratore/dipendenti', icon: UserCheck },
    { label: 'Direzione', href: '/amministratore/direzione', icon: Building2 },
    { label: 'Candidature', href: '/amministratore/candidature', icon: Briefcase },
    { label: 'Audit Log', href: '/amministratore/audit', icon: ScrollText },
  ],
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!profile) return null;

  const navItems = NAV_ITEMS[profile.role] || [];

  const handleSignOut = async () => {
    await signOut();
    toast.success('Disconnessione effettuata');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === `/cittadino` || href === `/dipendente` || href === `/direzione` || href === `/amministratore`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const roleColor: Record<UserRole, string> = {
    CITTADINO: 'bg-slate-500',
    DIPENDENTE: 'bg-blue-600',
    DIREZIONE: 'bg-amber-600',
    AMMINISTRATORE: 'bg-red-600',
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-white/10',
        collapsed && 'justify-center'
      )}>
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">SL</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-white font-semibold text-sm truncate block">Sistema Lavoro</span>
            <span className="text-blue-300 text-xs">Gestione Candidature</span>
          </div>
        )}
      </div>

      {/* User info */}
      <div className={cn('px-3 py-3 border-b border-white/10', collapsed && 'px-2')}>
        {collapsed ? (
          <div className="flex justify-center">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', roleColor[profile.role])}>
              {profile.nome[0]}{profile.cognome[0]}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', roleColor[profile.role])}>
              {profile.nome[0]}{profile.cognome[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{profile.nome} {profile.cognome}</p>
              <Badge className={cn('text-[10px] px-1.5 py-0 h-4 mt-0.5', {
                'bg-slate-500/30 text-slate-200': profile.role === 'CITTADINO',
                'bg-blue-500/30 text-blue-200': profile.role === 'DIPENDENTE',
                'bg-amber-500/30 text-amber-200': profile.role === 'DIREZIONE',
                'bg-red-500/30 text-red-200': profile.role === 'AMMINISTRATORE',
              })}>
                {ROLE_LABELS[profile.role]}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('flex-shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <Badge className="ml-auto bg-blue-500 text-white text-[10px] h-4 px-1.5">
                  {item.badge}
                </Badge>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-white/10 space-y-0.5">
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-300 transition-all w-full',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className={cn('flex-shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
          {!collapsed && <span>Disconnetti</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-slate-900 text-white shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:hidden',
        'bg-gradient-to-b from-slate-900 to-slate-800',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="absolute top-3 right-3">
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 relative',
        'bg-gradient-to-b from-slate-900 to-slate-800',
        collapsed ? 'w-16' : 'w-60',
        className
      )}>
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 text-white flex items-center justify-center hover:bg-slate-600 transition-colors z-10 shadow-md"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>
    </>
  );
}
