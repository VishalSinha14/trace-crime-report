import React, { useState } from 'react';
import { api, User } from '../services/api';
import {
  Shield, Mail, Lock, User as UserIcon,
  AlertCircle, ArrowRight, Eye, EyeOff,
  ChevronLeft, MapPin, Cpu, Bell, Lock as LockIcon,
} from 'lucide-react';

interface RegisterPageProps {
  onAuthSuccess: (user: User) => void;
  onGoToLogin: () => void;
  onGoToLanding: () => void;
}

const PW_RULES = [
  { label: '8+ chars', test: (p: string) => p.length >= 8 },
  { label: 'Number',   test: (p: string) => /\d/.test(p) },
  { label: 'Letter',   test: (p: string) => /[a-zA-Z]/.test(p) },
];

const BENEFITS = [
  { icon: MapPin,   label: 'Drop map pins',     color: '#7dd3fc' },
  { icon: Cpu,      label: 'AI auto-classifies', color: '#a5f3fc' },
  { icon: Bell,     label: 'Live notifications', color: '#fcd34d' },
  { icon: LockIcon, label: 'Identity protected', color: '#6ee7b7' },
];

/* ── Glass tokens (same as LoginPage) ────────────────────────────────────── */
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

export const RegisterPage: React.FC<RegisterPageProps> = ({ onAuthSuccess, onGoToLogin, onGoToLanding }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = PW_RULES.filter((r) => r.test(password)).length;
  const strengthColor = strength === 3 ? '#34d399' : strength === 2 ? '#fbbf24' : '#f87171';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Enter your full name.'); return; }
    if (!email.trim()) { setError('Enter a valid email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError(null);
    try {
      const r = await api.register(name.trim(), email.trim().toLowerCase(), password);
      onAuthSuccess(r.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="landing-shell min-h-screen text-slate-100 flex font-sans selection:bg-cyan-400 selection:text-slate-950">
      <div className="landing-grid" />

      {/* ── Left Visual Panel ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] relative flex-col items-center justify-center p-12 overflow-hidden border-r border-white/[0.06]">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full blur-[100px]" style={{ background: 'rgba(14,116,144,.16)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full blur-[80px]" style={{ background: 'rgba(34,211,238,.09)' }} />

        <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-xs">
          {/* Glass logo */}
          <div
            onClick={onGoToLanding}
            className="cursor-pointer hover:scale-[1.04] transition-transform duration-300"
            style={{
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
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-white mb-2">Join TRACE</h2>
            <p className="text-slate-400 text-sm">Help make Pune safer — one report at a time.</p>
          </div>

          {/* 2×2 benefit grid in glass card */}
          <div className="w-full p-3 rounded-2xl" style={glass.card}>
            <div className="grid grid-cols-2 gap-2.5">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.label} className="flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-200 hover:scale-105"
                    style={{ background: 'rgba(5,10,20,.4)', border: '1px solid rgba(148,163,184,.08)' }}>
                    <div className="signal-orb" style={{ width: 34, height: 34, borderRadius: 11 }}>
                      <Icon className="w-4 h-4" style={{ color: b.color }} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 text-center leading-tight">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Citizen badge */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-full justify-center"
            style={{ background: 'rgba(110,231,183,.06)', border: '1px solid rgba(110,231,183,.2)', boxShadow: '0 4px 20px rgba(110,231,183,.06)' }}>
            <span className="text-base">🧑‍💼</span>
            <span className="text-xs font-semibold" style={{ color: '#6ee7b7' }}>Registered as Citizen</span>
          </div>

          <p className="text-[10px] text-slate-600">Admins can upgrade roles later</p>
        </div>

        <p className="absolute bottom-6 text-[10px] text-slate-700">B.Tech CSE Final Year · Pune 2026</p>
      </div>

      {/* ── Right Form Panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto relative z-10">
        <button
          onClick={onGoToLanding}
          className="lg:hidden self-start mb-8 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </button>

        {/* ── Glass Form Card ──────────────────────────── */}
        <div className="w-full max-w-sm p-7 sm:p-8 relative" style={glass.card}>
          {/* Top highlight */}
          <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(125,211,252,.25), transparent)' }} />

          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-white mb-1">Create account</h1>
            <p className="text-slate-500 text-sm">Join Pune's safety network</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5"
              style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#fca5a5' }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form id="register-form" onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="eyebrow mb-1.5 block" style={{ color: '#94a3b8' }}>Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                <input id="register-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Riya Sharma" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15 transition"
                  style={glass.input} />
              </div>
            </div>

            <div>
              <label className="eyebrow mb-1.5 block" style={{ color: '#94a3b8' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="riya@example.com" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15 transition"
                  style={glass.input} />
              </div>
            </div>

            <div>
              <label className="eyebrow mb-1.5 block" style={{ color: '#94a3b8' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                <input id="register-password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15 transition"
                  style={glass.input} />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-1 h-1.5 mb-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: strength >= i ? strengthColor : 'rgba(148,163,184,.1)',
                          boxShadow: strength >= i ? `0 0 8px ${strengthColor}40` : 'none',
                        }} />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {PW_RULES.map((r) => (
                      <span key={r.label} className="text-[10px] font-medium transition-colors"
                        style={{ color: r.test(password) ? '#34d399' : '#475569' }}>
                        {r.test(password) ? '✓' : '○'} {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button id="register-submit-btn" type="submit" disabled={loading}
              className="command-button command-button-primary w-full justify-center mt-2"
              style={{ minHeight: 46, borderRadius: 14, fontSize: 13, boxShadow: '0 12px 35px rgba(45,212,191,.2)' }}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Creating…</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6">
            Have an account?{' '}
            <button id="goto-login-btn" onClick={onGoToLogin} className="font-semibold transition hover:underline" style={{ color: '#7dd3fc' }}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
