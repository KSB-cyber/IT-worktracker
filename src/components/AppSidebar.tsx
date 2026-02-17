import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, FileText, AlertCircle, BookOpen, Calendar,
  LogOut, User, Menu, X, Users
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function AppSidebar() {
  const { role, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
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
    { to: '/users', icon: Users, label: 'Users', show: isAdmin },
  ];

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <img src="/logo.jpeg" alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
        <div className="min-w-0">
          <h2 className="font-bold text-base text-white truncate">IT Tracker</h2>
          <p className="text-sm text-white/80 truncate">{isAdmin ? 'Admin' : 'User'} Portal</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.filter(l => l.show).map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-lg font-medium transition-colors",
              isActive
                ? "bg-white/20 text-white"
                : "text-white/90 hover:bg-white/10 hover:text-white"
            )}
          >
            <link.icon className="w-6 h-6 shrink-0" />
            <span className="truncate">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/80">
          <User className="w-4 h-4 shrink-0" />
          <span className="truncate">{user?.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-lg font-medium text-white/90 hover:text-white hover:bg-white/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground border border-sidebar-border shadow-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-40 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
