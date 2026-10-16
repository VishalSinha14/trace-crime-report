import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { api, Incident, User } from './services/api';
import { Navbar } from './components/Navbar';
import { SafetyMap } from './components/SafetyMap';
import { ReportModal } from './components/ReportModal';
import { ModeratorQueue } from './components/ModeratorQueue';
import { AdminCenter } from './components/AdminCenter';
import { MyReports } from './components/MyReports';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { SafeRoutePanel, RouteResult } from './components/SafeRoutePanel';
import { MapPin, Sparkles, CheckCircle2, Radio, Activity, Crosshair, Layers3, X, Clock3, ShieldAlert, Shield, Navigation } from 'lucide-react';

// ─── Auth screen state ────────────────────────────────────────────────────────
type AuthScreen = 'landing' | 'login' | 'register';

const CATEGORIES = [
  'ALL',
  'THEFT_SNATCHING',
  'ASSAULT',
  'BURGLARY',
  'VANDALISM',
  'HARASSMENT',
  'FRAUD',
  'CYBERCRIME',
  'ROBBERY',
  'VEHICLE_RELATED',
];

const SEVERITIES = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const severityTone: Record<string, string> = {
  LOW: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/10',
  MEDIUM: 'text-amber-300 border-amber-400/25 bg-amber-400/10',
  HIGH: 'text-orange-300 border-orange-400/25 bg-orange-400/10',
  CRITICAL: 'text-rose-300 border-rose-400/25 bg-rose-400/10',
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('landing');
  const [authLoading, setAuthLoading] = useState(true);

  const [activeView, setActiveView] = useState<'map' | 'my-reports' | 'moderation' | 'admin'>('map');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportPinMode, setReportPinMode] = useState(false);
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);

  // ─── Safe Route State ───────────────────────────────────────────────────
  const [routeMode, setRouteMode] = useState(false);
  const [routePickingTarget, setRoutePickingTarget] = useState<'origin' | 'destination' | null>(null);
  const [originLocation, setOriginLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeResults, setRouteResults] = useState<RouteResult[] | null>(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);

  const [safetyMetrics] = useState<{ score: number; nearbyCount: number }>({
    score: 84,
    nearbyCount: 42,
  });

  // ─── Restore existing session on mount ───────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('trace_token');
    if (token) {
      api
        .getMe()
        .then((res) => {
          setUser(res.user);
          if (res.user.role === 'MODERATOR') setActiveView('moderation');
          else if (res.user.role === 'ADMIN') setActiveView('admin');
          else setActiveView('map');
        })
        .catch(() => {
          localStorage.removeItem('trace_token');
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // ─── Auth success handler ─────────────────────────────────────────────────
  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'MODERATOR') setActiveView('moderation');
    else if (loggedInUser.role === 'ADMIN') setActiveView('admin');
    else setActiveView('map');
  };

  // ─── Logout handler ───────────────────────────────────────────────────────
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIncidents([]);
    setActiveView('map');
    setAuthScreen('landing');
  };

  // ─── Fetch map incidents ──────────────────────────────────────────────────
  const fetchMapIncidents = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 800 };
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedSeverity !== 'ALL') params.severity = selectedSeverity;
      const res = await api.getMapIncidents(params);
      setIncidents(res.incidents);
    } catch (err) {
      console.error('Failed to load map incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMapIncidents();
  }, [selectedCategory, selectedSeverity, user]);

  // ─── Real-time socket events ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('trace_token');
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('incident:verified', (newInc: Incident) => {
      setIncidents((prev) => {
        const exists = prev.some((inc) => inc.id === newInc.id);
        if (exists) return prev.map((inc) => (inc.id === newInc.id ? newInc : inc));
        return [newInc, ...prev];
      });
    });

    socket.on('incident:updated', (updatedInc: Incident) => {
      setIncidents((prev) => {
        const isPublicVerified = updatedInc.status === 'VERIFIED' && updatedInc.is_public;
        if (isPublicVerified) {
          const exists = prev.some((inc) => inc.id === updatedInc.id);
          if (exists) return prev.map((inc) => (inc.id === updatedInc.id ? updatedInc : inc));
          return [updatedInc, ...prev];
        } else {
          return prev.filter((inc) => inc.id !== updatedInc.id);
        }
      });
    });

    return () => { socket.disconnect(); };
  }, [user]);

  const handleStartReportWithPin = () => setReportPinMode(true);

  const handleSetPinLocation = (loc: { lat: number; lng: number }) => {
    setPinLocation(loc);
    setReportPinMode(false);
    setIsReportOpen(true);
  };

  // ─── Safe Route Handlers ────────────────────────────────────────────────
  const handleToggleRouteMode = () => {
    if (routeMode) {
      // Exit route mode
      setRouteMode(false);
      setRoutePickingTarget(null);
      setOriginLocation(null);
      setDestinationLocation(null);
      setRouteResults(null);
      setActiveRouteIndex(0);
    } else {
      // Enter route mode, exit report pin mode
      setReportPinMode(false);
      setRouteMode(true);
      setRoutePickingTarget('origin');
    }
  };

  const handleSetRoutePoint = (loc: { lat: number; lng: number }) => {
    if (routePickingTarget === 'origin') {
      setOriginLocation(loc);
      setRoutePickingTarget('destination');
    } else if (routePickingTarget === 'destination') {
      setDestinationLocation(loc);
      setRoutePickingTarget(null);
    }
  };

  const handleFindRoute = async (mode: 'walking' | 'driving') => {
    if (!originLocation || !destinationLocation) return;
    setRouteLoading(true);
    setRouteResults(null);
    try {
      const res = await api.getSafeRoute(
        originLocation.lat, originLocation.lng,
        destinationLocation.lat, destinationLocation.lng,
        mode
      );
      setRouteResults(res.routes);
      setActiveRouteIndex(0);
    } catch (err: any) {
      console.error('Safe route error:', err);
      alert(err.message || 'Failed to compute safe route');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleClearRoute = () => {
    setOriginLocation(null);
    setDestinationLocation(null);
    setRouteResults(null);
    setActiveRouteIndex(0);
    setRoutePickingTarget('origin');
  };

  // ─── Auth loading splash ──────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center animate-pulse">
            <span className="text-white font-black text-lg">T</span>
          </div>
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading TRACE...</p>
        </div>
      </div>
    );
  }

  // ─── Auth gate (not logged in) ────────────────────────────────────────────
  if (!user) {
    if (authScreen === 'login') {
      return (
        <LoginPage
          onAuthSuccess={handleAuthSuccess}
          onGoToRegister={() => setAuthScreen('register')}
          onGoToLanding={() => setAuthScreen('landing')}
        />
      );
    }
    if (authScreen === 'register') {
      return (
        <RegisterPage
          onAuthSuccess={handleAuthSuccess}
          onGoToLogin={() => setAuthScreen('login')}
          onGoToLanding={() => setAuthScreen('landing')}
        />
      );
    }
    return (
      <LandingPage
        onLogin={() => setAuthScreen('login')}
        onRegister={() => setAuthScreen('register')}
      />
    );
  }

  // ─── Authenticated Dashboard ──────────────────────────────────────────────
  return (
    <div className="trace-shell min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950">
      <Navbar
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
        onOpenReport={() => { setPinLocation(null); setIsReportOpen(true); }}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* VIEW: Live Map */}
        {activeView === 'map' && (
          <div className="flex flex-col gap-4 trace-view-enter">
            <section className="command-header">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start gap-3">
                  <div className="signal-orb mt-1"><Radio className="w-4 h-4" /></div>
                  <div>
                    <div className="eyebrow"><span className="status-dot" /> Live operational picture</div>
                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.035em] text-white mt-1">Pune Safety Intelligence</h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1.5">Verified incident telemetry, spatial context, and AI-assisted triage.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                <button
                  onClick={handleToggleRouteMode}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
                    routeMode
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-bold shadow-lg shadow-cyan-400/20'
                      : 'command-button command-button-muted'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>{routeMode ? 'Exit Safe Route' : 'Safe Route'}</span>
                </button>

                <button
                  onClick={handleStartReportWithPin}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
                    reportPinMode
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-lg shadow-amber-400/20'
                      : 'command-button command-button-muted'
                  }`}
                >
                  <Crosshair className="w-4 h-4" />
                  <span>{reportPinMode ? 'Click Map to Place Pin' : 'Drop Pin on Map'}</span>
                </button>

                <button
                  onClick={() => setIsReportOpen(true)}
                  className="command-button command-button-primary"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Report Incident</span>
                </button>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-6 rounded-xl overflow-hidden border border-white/[0.07] bg-white/[0.06]">
                <div className="metric-cell"><span>Visible incidents</span><strong>{loading ? '—' : incidents.length}</strong><small>Within active filters</small></div>
                <div className="metric-cell"><span>Safety index</span><strong className="text-emerald-300">{safetyMetrics.score}</strong><small>Central Pune baseline</small></div>
                <div className="metric-cell"><span>Coverage</span><strong>8 km</strong><small>Live map envelope</small></div>
                <div className="metric-cell"><span>Feed status</span><strong className="text-cyan-300">Live</strong><small>PostGIS spatial stream</small></div>
              </div>
            </section>

            <section className="intel-filterbar">
              <div className="flex items-center gap-2 shrink-0"><Layers3 className="w-4 h-4 text-cyan-300" /><span className="eyebrow">Map filters</span></div>
              <div className="filter-scroll">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                    selectedCategory === cat ? 'filter-chip filter-chip-active' : 'filter-chip'
                  }`}
                >
                  {cat === 'ALL' ? 'All Incidents' : cat.replace('_', ' ')}
                </button>
              ))}
              </div>
              <div className="filter-scroll border-l border-white/10 pl-3">
                {SEVERITIES.map((severity) => (
                  <button key={severity} onClick={() => setSelectedSeverity(severity)} className={selectedSeverity === severity ? 'filter-chip filter-chip-active' : 'filter-chip'}>
                    {severity === 'ALL' ? 'Any severity' : severity}
                  </button>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 min-h-[640px]">
              <div className="relative flex flex-col h-[640px]">
                <SafetyMap
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={(inc) => setSelectedIncident(inc)}
                  reportMode={reportPinMode}
                  pinLocation={pinLocation}
                  onSetPinLocation={handleSetPinLocation}
                  routeMode={routeMode}
                  routePickingTarget={routePickingTarget}
                  originLocation={originLocation}
                  destinationLocation={destinationLocation}
                  routeResults={routeResults}
                  activeRouteIndex={activeRouteIndex}
                  onSetRoutePoint={handleSetRoutePoint}
                />
              </div>

              <aside className="flex flex-col gap-3 h-[640px]">
                {/* ── Sidebar: Safe Route Panel OR Incident Stream ── */}
                {routeMode ? (
                  <SafeRoutePanel
                    originLocation={originLocation}
                    destinationLocation={destinationLocation}
                    routeResults={routeResults}
                    activeRouteIndex={activeRouteIndex}
                    loading={routeLoading}
                    onSetActiveRoute={setActiveRouteIndex}
                    onFindRoute={handleFindRoute}
                    onClearRoute={handleClearRoute}
                    onClose={handleToggleRouteMode}
                    pickingTarget={routePickingTarget}
                    onSetPickingTarget={setRoutePickingTarget}
                  />
                ) : (
                  <>
                    <div className="intel-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-400/10 text-emerald-300 flex items-center justify-center font-bold text-lg border border-emerald-300/20">
                          {safetyMetrics.score}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Central Pune safety index</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {safetyMetrics.score > 75 ? 'Safe Area • Normal Vigilance' : 'Elevated Risk'}
                          </p>
                        </div>
                      </div>
                      <Activity className="w-5 h-5 text-emerald-300" />
                    </div>

                    <div className="flex-1 intel-card p-3 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between px-2 py-2.5 border-b border-white/[0.07]">
                        <div><p className="eyebrow">Incident stream</p><p className="text-xs text-slate-400 mt-1">Latest verified reports</p></div>
                        <span className="data-badge">{incidents.length}</span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1">
                        {loading ? (
                          <div className="space-y-2 p-2">{[1,2,3,4,5].map((item) => <div key={item} className="h-20 rounded-xl trace-skeleton" />)}</div>
                        ) : incidents.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500">No verified reports matching this filter.</div>
                        ) : (
                          incidents.slice(0, 40).map((inc) => {
                            const isSelected = selectedIncident?.id === inc.id;
                            return (
                              <div
                                key={inc.id}
                                onClick={() => setSelectedIncident(inc)}
                                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition ${
                                  isSelected
                                  ? 'bg-cyan-400/[0.08] border-cyan-300/40 shadow-lg shadow-cyan-950/20'
                                    : 'bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.055] hover:border-white/[0.12]'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-semibold text-xs text-slate-200">
                                    {inc.category ? inc.category.replace('_', ' ') : 'INCIDENT'}
                                  </span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${severityTone[inc.severity] || severityTone.MEDIUM}`}>
                                    {inc.severity}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{inc.description}</p>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                                  <span>📍 {inc.location_area || 'Pune Metro'}</span>
                                  <span className="text-emerald-300 flex items-center gap-1 font-semibold">
                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                    {selectedIncident && (
                      <div className="incident-drawer">
                        <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Selected incident</p><h3 className="text-sm font-semibold text-white mt-1">{selectedIncident.category?.replace('_', ' ') || 'Incident report'}</h3></div><button onClick={() => setSelectedIncident(null)} className="text-slate-500 hover:text-white transition"><X className="w-4 h-4" /></button></div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-3 line-clamp-3">{selectedIncident.description}</p>
                        <div className="flex gap-2 mt-3"><span className={`data-badge border ${severityTone[selectedIncident.severity]}`}>{selectedIncident.severity}</span><span className="data-badge"><Clock3 className="w-3 h-3" />{new Date(selectedIncident.occurred_at).toLocaleDateString()}</span></div>
                        <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center gap-2 text-[11px] text-cyan-200"><Sparkles className="w-3.5 h-3.5" />AI classification: {selectedIncident.ai_category || selectedIncident.category || 'Pending'}</div>
                      </div>
                    )}
                  </>
                )}
              </aside>
            </div>
          </div>
        )}

        {activeView === 'my-reports' && <MyReports onOpenReportModal={() => setIsReportOpen(true)} />}
        {activeView === 'moderation' && <ModeratorQueue onStatusUpdated={fetchMapIncidents} />}
        {activeView === 'admin' && <AdminCenter />}
      </main>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        pinLocation={pinLocation}
        onIncidentCreated={(newInc) => {
          if (newInc.status === 'VERIFIED' && newInc.is_public) {
            setIncidents((prev) => [newInc, ...prev]);
          } else if (user) {
            setActiveView('my-reports');
          }
        }}
      />
    </div>
  );
}

export default App;
