import React, { useState } from 'react';
import { api, Incident } from '../services/api';
import { X, Sparkles, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinLocation: { lat: number; lng: number } | null;
  onIncidentCreated: (incident: Incident) => void;
}

const CATEGORIES = [
  { value: '', label: 'Auto-detect using AI (Recommended)' },
  { value: 'THEFT_SNATCHING', label: 'Theft / Snatching' },
  { value: 'ASSAULT', label: 'Physical Assault' },
  { value: 'BURGLARY', label: 'Burglary / Break-in' },
  { value: 'VANDALISM', label: 'Vandalism / Property Damage' },
  { value: 'HARASSMENT', label: 'Harassment / Stalking' },
  { value: 'FRAUD', label: 'Financial Fraud' },
  { value: 'CYBERCRIME', label: 'Cybercrime / Phishing' },
  { value: 'ROBBERY', label: 'Armed Robbery' },
  { value: 'VEHICLE_RELATED', label: 'Vehicle Theft / Hit & Run' },
  { value: 'OTHER', label: 'Other Incident' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  pinLocation,
  onIncidentCreated,
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [area, setArea] = useState('Shivajinagar, Pune');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    predictedCategory: string;
    confidence: number;
    predictedSeverity: string;
  } | null>(null);

  if (!isOpen) return null;

  const lat = pinLocation ? pinLocation.lat : 18.5204;
  const lng = pinLocation ? pinLocation.lng : 73.8567;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.length < 10) {
      setError('Please provide a detailed description (minimum 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.createIncident({
        description,
        category: category || null,
        latitude: lat,
        longitude: lng,
        location_area: area,
      });

      setAiResult(res.aiAnalysis);
      onIncidentCreated(res.incident);

      setTimeout(() => {
        onClose();
        setAiResult(null);
        setDescription('');
        setCategory('');
      }, 2400);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Ensure you are signed in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Report Safety Incident</h2>
            <p className="text-xs text-slate-400">AI-assisted categorization & severity evaluation</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {aiResult ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Report Successfully Submitted!</h3>
            <p className="text-xs text-slate-400">
              Your report has been received and queued for review.
            </p>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">AI Category:</span>
                <span className="font-semibold text-indigo-400">{aiResult.predictedCategory.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">AI Confidence:</span>
                <span className="font-semibold text-emerald-400">{(aiResult.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Estimated Severity:</span>
                <span className="font-semibold text-amber-400">{aiResult.predictedSeverity}</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Incident Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred, who was involved, time, vehicle details, etc."
                rows={4}
                required
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              />
              <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                <span>Minimum 10 characters</span>
                <span>{description.length} chars</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Category (Optional)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl bg-slate-800/80 border border-slate-700 p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Location Area
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. FC Road, Pune"
                  className="w-full rounded-xl bg-slate-800/80 border border-slate-700 p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Click map behind to adjust</span>
            </div>

            {/* ── No custom pin warning ─────────────────────────────────────── */}
            {!pinLocation && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold">No pin placed.</span> Your report will default to Pune city center.
                  Close this modal, click <span className="font-semibold">"Drop Pin on Map"</span> to set an accurate location.
                </span>
              </div>
            )}


            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Analyzing & Submitting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
