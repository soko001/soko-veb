import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Globe, LogOut, Shield, Map } from 'lucide-react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-navy flex text-mist font-body">
      {/* Left Sidebar */}
      <aside className="w-56 shrink-0 bg-navy-light border-r border-border flex flex-col sticky top-0 h-screen">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-teal/15 border border-teal/30 flex items-center justify-center group-hover:bg-teal/25 transition-colors">
              <Globe className="w-4 h-4 text-teal" />
            </div>
            <div>
              <span className="font-display text-base font-bold text-snow leading-none tracking-tight">Columbo</span>
              <span className="font-mono text-[9px] tracking-widest text-slate/60 block">TRAVEL PLANNER</span>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-label font-medium tracking-wide transition-all ${
              location.pathname === '/dashboard'
                ? 'bg-teal text-navy border-teal/30 shadow-[0_0_10px_rgba(14,165,176,0.3)]'
                : 'bg-transparent border-transparent text-slate hover:text-mist hover:bg-surface hover:border-border'
            }`}
          >
            <Map className="w-4 h-4" />
            My Plans
          </Link>

          {isAdmin() && (
            <Link
              to="/admin"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-label font-medium tracking-wide transition-all ${
                location.pathname.startsWith('/admin')
                  ? 'bg-teal text-navy border-teal/30 shadow-[0_0_10px_rgba(14,165,176,0.3)]'
                  : 'bg-transparent border-transparent text-slate hover:text-mist hover:bg-surface hover:border-border'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* User + Logout at bottom */}
        <div className="px-4 py-4 border-t border-border space-y-3">
          {user && (
            <div>
              <span className="font-label font-semibold text-sm text-snow block">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate/60">
                {user.role}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-2 w-full px-3 py-2 bg-surface text-slate border border-border rounded-lg hover:text-danger hover:border-danger/40 transition-all cursor-pointer text-xs font-label"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-10 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-3 text-center text-xs font-mono text-slate/40 border-t border-border/50">
          © {new Date().getFullYear()} Columbo Travel Planner · Service Fabric
        </footer>
      </div>
    </div>
  );
};