import React, { useState } from 'react';
import { api, User } from '../services/api';
import { Shield, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, ChevronLeft } from 'lucide-react';

interface LoginPageProps {
  onAuthSuccess: (user: User) => void;
  onGoToRegister: () => void;
  onGoToLanding: () => void;
}

const PERSONAS = [
  { label: 'Citizen',   email: 'citizen@trace.dev',    password: 'citizen123', icon: '🧑‍💼', color: '#6ee7b7', border: 'rgba(110,231,183,.3)',  bg: 'rgba(110,231,183,.06)', glow: 'rgba(110,231,183,.08)' },
  { label: 'Moderator', email: 'moderator@trace.dev',  password: 'mod123',     icon: '🛡️', color: '#fcd34d', border: 'rgba(252,211,77,.3)',   bg: 'rgba(252,211,77,.06)',  glow: 'rgba(252,211,77,.08)'  },
  { label: 'Admin',     email: 'admin@trace.dev',      password: 'admin123',   icon: '⚙️', color: '#c4b5fd', border: 'rgba(196,181,253,.3)',  bg: 'rgba(196,181,253,.06)', glow: 'rgba(196,181,253,.08)' },
];

/* ── Shared glass styling tokens ─────────────────────────────────────────── */
const glass = {
  card: {
    background: 'linear-gradient(145deg, rgba(15,23,42,.7), rgba(8,14,25,.85))',
    backdropFilter: 'blur(24px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
    border: '1px solid rgba(125,211,252,.12)',
    boxShadow: '0 24px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(125,211,252,.06) inset, 0 1px 0 rgba(255,255,255,.04) inset',
    borderRadius: 20,
  } as React.CSSProperties,
  input: {
    background: 'rgba(2,6,23,.5)',
    border: '1px solid rgba(148,163,184,.12)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  } as React.CSSProperties,
};

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess, onGoToRegister, onGoToLanding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Please fill all fields.'); return; }
    setLoading(true); setError(null);
    try { const r = await api.login(email.trim(), password); onAuthSuccess(r.user); }
    catch (err: any) { setError(err.message || 'Invalid credentials.'); }
    finally { setLoading(false); }
  };

  const handleDemo = async (p: typeof PERSONAS[0]) => {
    setDemoLoading(p.label); setError(null);
    try { const r = await api.login(p.email, p.password); onAuthSuccess(r.user); }
    catch (err: any) { setError(err.message || 'Demo login failed.'); }
    finally { setDemoLoading(null); }
  };

  return (
    <div className="landing-shell min-h-screen text-slate-100 flex font-sans selection:bg-cyan-400 selection:text-slate-950">
      <div className="landing-grid" />

      {/* ── Left — Visual Panel ──────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] relative flex-col items-center justify-center p-12 overflow-hidden border-r border-white/[0.06]">
        {/* Ambient blobs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-[100px]" style={{ background: 'rgba(14,116,144,.18)' }} />
        <div className="absolute bottom-1/3 right-1/5 w-56 h-56 rounded-full blur-[80px]" style={{ background: 'rgba(34,211,238,.1)' }} />

        <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-xs">
          {/* Glass logo card */}
          <div
            onClick={onGoToLanding}
            className="cursor-pointer hover:scale-[1.04] transition-transform duration-300"
            style={{
              ...glass.card,
              padding: '2px',
              borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(103,232,249,.35), rgba(45,212,191,.2), rgba(103,232,249,.1))',
              boxShadow: '0 20px 60px rgba(34,211,238,.15), 0 0 0 1px rgba(125,211,252,.08) inset',
            }}
          >
            <div className="w-24 h-24 rounded-[26px] flex items-center justify-center" style={{ background: '#0a1628' }}>
              <Shield className="w-10 h-10 text-cyan-300" />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-white mb-2">TRACE</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              AI-powered crime reporting &<br />real-time safety intelligence<br />for Pune.
            </p>
          </div>

          {/* Role orbs in glass strip */}
          <div className="flex items-center gap-3 p-3 rounded-2xl" style={glass.card}>
            {PERSONAS.map((r) => (
              <div
                key={r.label}
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ background: r.bg, border: `1px solid ${r.border}`, boxShadow: `0 4px 20px ${r.glow}` }}
              >
                <span className="text-2xl">{r.icon}</span>
                <span className="text-[10px] font-bold" style={{ color: r.color }}>{r.label}</span>
              </div>
            ))}
          </div>

          <div className="live-label"><span /> Pune Metro · Live System</div>
        </div>

        <p className="absolute bottom-6 text-[10px] text-slate-700">B.Tech CSE Final Year · 2026</p>
      </div>

      {/* ── Right — Form ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto relative z-10">
        <button
          onClick={onGoToLanding}
          className="lg:hidden self-start mb-8 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </button>

        {/* ── Glass Form Card ──────────────────────────── */}
        <div className="w-full max-w-sm p-7 sm:p-8" style={glass.card}>
          {/* Subtle top highlight line */}
          <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(125,211,252,.25), transparent)' }} />

          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-white mb-1">Welcome back</h1>
            <p className="text-slate-500 text-sm">Sign in to your TRACE account</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5"
              style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#fca5a5' }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form id="login-form" onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="eyebrow mb-1.5 block" style={{ color: '#94a3b8' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15 transition"
                  style={glass.input} />
              </div>
            </div>

            <div>
              <label className="eyebrow mb-1.5 block" style={{ color: '#94a3b8' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                <input id="login-password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15 transition"
                  style={glass.input} />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button id="login-submit-btn" type="submit" disabled={loading}
              className="command-button command-button-primary w-full justify-center mt-2"
              style={{ minHeight: 46, borderRadius: 14, fontSize: 13, boxShadow: '0 12px 35px rgba(45,212,191,.2)' }}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Signing In…</>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(148,163,184,.1)' }} />
            <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">Quick Demo</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(148,163,184,.1)' }} />
          </div>

          {/* Demo personas */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {PERSONAS.map((p) => (
              <button
                key={p.label}
                id={`demo-${p.label.toLowerCase()}-btn`}
                onClick={() => handleDemo(p)}
                disabled={demoLoading !== null}
                className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl transition-all duration-200 disabled:opacity-50 hover:scale-[1.05] active:scale-[0.97] group"
                style={{
                  background: p.bg,
                  border: `1px solid ${p.border}`,
                  backdropFilter: 'blur(12px)',
                  boxShadow: `0 4px 20px ${p.glow}`,
                }}
              >
                {demoLoading === p.label ? (
                  <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-2xl group-hover:scale-110 transition-transform">{p.icon}</span>
                )}
                <span className="text-[10px] font-bold" style={{ color: p.color }}>{p.label}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-slate-600">
            No account?{' '}
            <button id="goto-register-btn" onClick={onGoToRegister} className="font-semibold transition hover:underline" style={{ color: '#7dd3fc' }}>
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
