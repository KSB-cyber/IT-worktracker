import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, FileText, AlertCircle, BookOpen, Calendar,
  LogOut, ChevronLeft, ChevronRight, Shield, User
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function AppSidebar() {
  const { role, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = role === 'admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/invoices', icon: FileText, label: 'Invoices', show: isAdmin },
    { to: '/issues', icon: AlertCircle, label: isAdmin ? 'Issue Reports' : 'Report Issue', show: true },
    { to: '/ledger', icon: BookOpen, label: 'Digital Ledger', show: isAdmin },
    { to: '/calendar', icon: Calendar, label: 'Calendar', show: isAdmin },
  ];

  return (
    <aside className={cn(
      "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 shrink-0",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary shrink-0">
          <Shield className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="font-semibold text-sm text-sidebar-primary-foreground truncate">IT Tracker</h2>
            <p className="text-xs text-sidebar-foreground/60 truncate">{isAdmin ? 'Admin' : 'User'} Portal</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.filter(l => l.show).map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <link.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground/60">
            <User className="w-3 h-3" />
            <span className="truncate">{user?.email}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Sign Out'}
        </Button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
