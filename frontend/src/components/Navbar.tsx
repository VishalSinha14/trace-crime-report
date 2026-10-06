import React from 'react';
import { User } from '../services/api';
import { Shield, Map, Inbox, CheckSquare, Settings, LogOut, UserCircle } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeView: 'map' | 'my-reports' | 'moderation' | 'admin';
  setActiveView: (view: 'map' | 'my-reports' | 'moderation' | 'admin') => void;
  onLogout: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  setActiveView,
  onLogout,
  onOpenReport,
}) => {
  const isModeratorOrAdmin = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');
  const isAdmin = user && user.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-[1000] w-full bg-[#080d17]/85 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('map')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-400 p-px shadow-lg shadow-cyan-950/40">
            <div className="w-full h-full bg-[#0c1422] rounded-[11px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-[-0.04em] text-white">TRACE</span>
              <span className="text-[9px] uppercase font-bold tracking-[0.14em] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-300/20">
                Pune Grid
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Technology for Reporting, Analysis & Crime Evaluation
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/[0.035] p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setActiveView('map')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeView === 'map'
                ? 'bg-cyan-400/15 text-cyan-100 shadow-sm border border-cyan-300/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Live Map</span>
          </button>

          {user && (
            <button
              onClick={() => setActiveView('my-reports')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeView === 'my-reports'
                ? 'bg-cyan-400/15 text-cyan-100 shadow-sm border border-cyan-300/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>My Reports</span>
            </button>
          )}

          {isModeratorOrAdmin && (
            <button
              onClick={() => setActiveView('moderation')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeView === 'moderation'
                ? 'bg-amber-400/15 text-amber-100 shadow-sm border border-amber-300/20'
                : 'text-amber-300/80 hover:bg-amber-400/10 border border-transparent'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Moderation</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveView('admin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeView === 'admin'
                ? 'bg-violet-400/15 text-violet-100 shadow-sm border border-violet-300/20'
                : 'text-violet-300/80 hover:bg-violet-400/10 border border-transparent'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Right Section: Report Button & User Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenReport}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-300 hover:bg-cyan-200 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-950/30 transition hover:-translate-y-px active:translate-y-0"
          >
            <span>+ Report Incident</span>
          </button>

          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-white/[0.08]">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        : user.role === 'MODERATOR'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <div
                title={user.email}
                className="w-9 h-9 rounded-lg bg-white/[0.05] text-slate-300 flex items-center justify-center border border-white/[0.1]"
              >
                <UserCircle className="w-5 h-5" />
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-red-500/15 text-slate-400 hover:text-red-300 flex items-center justify-center border border-white/[0.1] hover:border-red-400/30 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
