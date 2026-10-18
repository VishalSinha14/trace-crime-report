import React, { useState, useEffect } from 'react';
import { api, Incident, CorroborationType, Corroboration } from '../services/api';
import { X, Eye, HeartCrack, Flag, Send, Loader2, CheckCircle2, Users, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CorroborateModalProps {
  incident: Incident;
  onClose: () => void;
  onCorroborated: (incidentId: string, score: number, count: number, type: CorroborationType) => void;
}

interface TypeOption {
  value: CorroborationType;
  label: string;
  description: string;
  icon: React.ReactElement<{ className?: string }>;
  color: string;
  borderColor: string;
  bgColor: string;
}

// ─── Type Options ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: 'WITNESSED',
    label: 'I Witnessed This',
    description: 'I was physically present and saw this happen.',
    icon: <Eye className="w-5 h-5" />,
    color: 'text-cyan-300',
    borderColor: 'border-cyan-400/60',
    bgColor: 'bg-cyan-400/10',
  },
  {
    value: 'AFFECTED',
    label: 'I Was Also Affected',
    description: 'This incident also happened to me or someone with me.',
    icon: <HeartCrack className="w-5 h-5" />,
    color: 'text-amber-300',
    borderColor: 'border-amber-400/60',
    bgColor: 'bg-amber-400/10',
  },
  {
    value: 'FALSE_REPORT',
    label: 'I Dispute This Report',
    description: 'I have reason to believe this report is inaccurate.',
    icon: <Flag className="w-5 h-5" />,
    color: 'text-rose-300',
    borderColor: 'border-rose-400/60',
    bgColor: 'bg-rose-400/10',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const CorroborateModal: React.FC<CorroborateModalProps> = ({
  incident,
  onClose,
  onCorroborated,
}) => {
  const [selectedType, setSelectedType] = useState<CorroborationType | null>(null);
  const [statement, setStatement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingCorroborations, setExistingCorroborations] = useState<Corroboration[]>([]);
  const [corrobStats, setCorrobStats] = useState<{
    count: number; score: number;
    breakdown: { WITNESSED: number; AFFECTED: number; FALSE_REPORT: number };
    userType: CorroborationType | null;
  } | null>(null);
  const [showWitnesses, setShowWitnesses] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Load existing corroborations on mount
  useEffect(() => {
    api.getCorroborations(incident.id)
      .then((data) => {
        setExistingCorroborations(data.corroborations);
        setCorrobStats({
          count: data.corroboration_count,
          score: data.credibility_score,
          breakdown: data.breakdown,
          userType: data.user_corroboration_type,
        });
        if (data.user_corroboration_type) {
          setSubmitted(true);
          setSelectedType(data.user_corroboration_type);
        }
      })
      .catch(() => {/* non-critical */})
      .finally(() => setLoadingExisting(false));
  }, [incident.id]);

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Please select how you are connected to this incident.');
      return;
    }
    if (statement.trim().length < 10) {
      setError('Please write at least 10 characters describing what you know.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.submitCorroboration(incident.id, selectedType, statement.trim());
      setSubmitted(true);
      setCorrobStats((prev) => ({
        count: res.corroboration_count,
        score: res.credibility_score,
        breakdown: prev?.breakdown ?? { WITNESSED: 0, AFFECTED: 0, FALSE_REPORT: 0 },
        userType: selectedType,
      }));
      onCorroborated(incident.id, res.credibility_score, res.corroboration_count, selectedType);
    } catch (err: any) {
      setError(err.message || 'Failed to submit corroboration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOption = TYPE_OPTIONS.find((o) => o.value === selectedType);
  const charCount = statement.length;
  const charOk = charCount >= 10 && charCount <= 500;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg corroborate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Corroborate This Report</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your voice helps verify community safety data</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Incident Summary ── */}
        <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              incident.severity === 'CRITICAL' ? 'bg-rose-400/15 text-rose-300' :
              incident.severity === 'HIGH' ? 'bg-orange-400/15 text-orange-300' :
              incident.severity === 'MEDIUM' ? 'bg-amber-400/15 text-amber-300' :
              'bg-emerald-400/15 text-emerald-300'
            }`}>
              {incident.severity}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
              {incident.category?.replace(/_/g, ' ') ?? 'Incident'}
            </span>
            {incident.location_area && (
              <span className="text-[10px] text-slate-500">· {incident.location_area}</span>
            )}
          </div>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {incident.description}
          </p>

          {/* Credibility bar */}
          {!loadingExisting && corrobStats && corrobStats.count > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, corrobStats.score)}%`,
                    background: corrobStats.score >= 60
                      ? 'linear-gradient(90deg, #22c55e, #10b981)'
                      : corrobStats.score >= 30
                      ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                      : 'linear-gradient(90deg, #ef4444, #f97316)',
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {corrobStats.count} {corrobStats.count === 1 ? 'corroboration' : 'corroborations'} · credibility {corrobStats.score}/100
              </span>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">

          {/* ── Already submitted ── */}
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedOption?.bgColor} border ${selectedOption?.borderColor}`}>
                {selectedOption?.icon && React.cloneElement(selectedOption.icon, {
                  className: `w-7 h-7 ${selectedOption.color}`,
                })}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Corroboration Submitted</p>
                <p className="text-xs text-slate-400 mt-1">
                  You selected <span className={`font-semibold ${selectedOption?.color}`}>"{selectedOption?.label}"</span>.
                  Thank you for contributing.
                </p>
              </div>
              {corrobStats && (
                <div className="w-full grid grid-cols-3 gap-2 mt-1">
                  {[
                    { label: 'Witnessed', val: corrobStats.breakdown.WITNESSED, color: 'text-cyan-300' },
                    { label: 'Affected', val: corrobStats.breakdown.AFFECTED, color: 'text-amber-300' },
                    { label: 'Disputed', val: corrobStats.breakdown.FALSE_REPORT, color: 'text-rose-300' },
                  ].map((s) => (
                    <div key={s.label} className="text-center bg-white/[0.04] rounded-xl py-2">
                      <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
                      <div className="text-[10px] text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── Type Selector ── */}
              <div>
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2.5">
                  How are you connected to this incident?
                </p>
                <div className="flex flex-col gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedType(opt.value)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                        selectedType === opt.value
                          ? `${opt.bgColor} ${opt.borderColor} shadow-lg`
                          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedType === opt.value ? `${opt.bgColor} ${opt.color}` : 'bg-white/[0.06] text-slate-400'
                      }`}>
                        {React.cloneElement(opt.icon, { className: 'w-5 h-5' })}
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${selectedType === opt.value ? opt.color : 'text-slate-200'}`}>
                          {opt.label}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{opt.description}</div>
                      </div>
                      {selectedType === opt.value && (
                        <CheckCircle2 className={`w-4 h-4 ml-auto shrink-0 ${opt.color}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Statement ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Your statement
                  </p>
                  <span className={`text-[10px] ${charOk ? 'text-slate-400' : charCount > 500 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {charCount}/500
                  </span>
                </div>
                <textarea
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder={
                    selectedType === 'WITNESSED'
                      ? 'Describe what you saw — location, time, what happened...'
                      : selectedType === 'AFFECTED'
                      ? 'Describe how this incident affected you...'
                      : 'Explain why you believe this report may be inaccurate...'
                  }
                  rows={4}
                  className="corroborate-textarea"
                />
                <p className="text-[10px] text-slate-500 mt-1.5">
                  🔒 Your name will not be shown publicly. Statements help moderators verify reports.
                </p>
              </div>

              {/* ── Error ── */}
              {error && (
                <div className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2.5">
                  {error}
                </div>
              )}
            </>
          )}

          {/* ── Existing witness statements (toggle) ── */}
          {existingCorroborations.length > 0 && (
            <div className="border-t border-white/[0.07] pt-3">
              <button
                onClick={() => setShowWitnesses(!showWitnesses)}
                className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition"
              >
                <span className="font-semibold">Community statements ({existingCorroborations.length})</span>
                {showWitnesses ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showWitnesses && (
                <div className="mt-2.5 flex flex-col gap-2">
                  {existingCorroborations.slice(0, 10).map((c) => {
                    const typeStyle =
                      c.type === 'WITNESSED' ? 'text-cyan-400 bg-cyan-400/10'
                      : c.type === 'AFFECTED' ? 'text-amber-400 bg-amber-400/10'
                      : 'text-rose-400 bg-rose-400/10';
                    return (
                      <div key={c.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${typeStyle}`}>
                            {c.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {c.author_name} · {new Date(c.created_at).toLocaleDateString()}
                          </span>
                          {c.is_own && (
                            <span className="text-[9px] text-indigo-400 font-semibold ml-auto">You</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{c.statement}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-white/[0.08]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm text-slate-300 hover:bg-white/[0.06] transition">
            {submitted ? 'Close' : 'Cancel'}
          </button>
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedType || statement.trim().length < 10}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white flex items-center justify-center gap-2 transition"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Corroboration</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
