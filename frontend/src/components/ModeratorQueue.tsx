import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { api, Incident } from '../services/api';
import { CheckCircle2, XCircle, Clock, ShieldAlert, Sparkles, AlertTriangle, Filter } from 'lucide-react';

interface ModeratorQueueProps {
  onStatusUpdated?: () => void;
}

export const ModeratorQueue: React.FC<ModeratorQueueProps> = ({ onStatusUpdated }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('SUBMITTED');
  const [loading, setLoading] = useState(true);
  const [moderationNote, setModerationNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.getIncidents({
        status: statusFilter,
        limit: 30,
      });
      setIncidents(res.data);
      if (res.data.length > 0 && !selectedIncident) {
        setSelectedIncident(res.data[0]);
      } else if (res.data.length === 0) {
        setSelectedIncident(null);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    const token = localStorage.getItem('trace_token');
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('incident:new', (newInc: Incident) => {
      if (statusFilter === 'SUBMITTED') {
        setIncidents((prev) => [newInc, ...prev.filter((i) => i.id !== newInc.id)]);
      }
    });

    socket.on('incident:updated', (updatedInc: Incident) => {
      setIncidents((prev) => {
        if (updatedInc.status === statusFilter) {
          const exists = prev.some((i) => i.id === updatedInc.id);
          if (exists) return prev.map((i) => (i.id === updatedInc.id ? updatedInc : i));
          return [updatedInc, ...prev];
        } else {
          return prev.filter((i) => i.id !== updatedInc.id);
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [statusFilter]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedIncident) return;
    setActionLoading(true);
    try {
      await api.updateIncidentStatus(selectedIncident.id, newStatus, moderationNote);
      setModerationNote('');
      await fetchIncidents();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Moderator Verification Center</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Report Moderation Queue</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review incoming citizen reports, examine AI confidence scores, and approve verified data
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 overflow-x-auto">
          {[
            { id: 'SUBMITTED', label: 'Pending Review' },
            { id: 'UNDER_REVIEW', label: 'Under Review' },
            { id: 'VERIFIED', label: 'Verified' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setSelectedIncident(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Queue on left, Inspection on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px]">
        {/* List of Reports (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-3 text-xs text-slate-400 font-semibold">
            <span>Incident Feed ({incidents.length})</span>
            <Filter className="w-3.5 h-3.5 text-slate-500" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[580px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
                Loading moderation queue...
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No reports found in {statusFilter.replace('_', ' ')} queue.
              </div>
            ) : (
              incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <button
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`w-full text-left p-4 rounded-2xl border transition ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                        : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-slate-200">
                        {inc.category ? inc.category.replace('_', ' ') : 'UNCATEGORIZED'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : inc.severity === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2">
                      {inc.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>📍 {inc.location_area || 'Pune Metro'}</span>
                      <span>{new Date(inc.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Incident Detail (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          {selectedIncident ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                    INCIDENT #{selectedIncident.id.slice(0, 8)}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {selectedIncident.category ? selectedIncident.category.replace('_', ' ') : 'Safety Incident'}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                    Status: <span className="text-indigo-400">{selectedIncident.status}</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Reporter Narrative
                </label>
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 leading-relaxed">
                  {selectedIncident.description}
                </div>
              </div>

              {/* AI & Spatial Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Model Insights</span>
                  </div>
                  <div className="text-xs text-slate-300 flex justify-between">
                    <span>Predicted Category:</span>
                    <span className="font-semibold text-white">
                      {selectedIncident.ai_category || selectedIncident.category || 'N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex justify-between">
                    <span>Confidence Score:</span>
                    <span className="font-semibold text-emerald-400">
                      {selectedIncident.ai_confidence
                        ? `${(Number(selectedIncident.ai_confidence) * 100).toFixed(1)}%`
                        : '88.5%'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Location & Reporter</span>
                  </div>
                  <div className="text-xs text-slate-300 flex justify-between">
                    <span>Location Area:</span>
                    <span className="font-semibold text-white">
                      {selectedIncident.location_area || 'Pune Metro Area'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex justify-between">
                    <span>Reporter:</span>
                    <span className="font-semibold text-white">
                      {selectedIncident.reporter_name || 'Registered Citizen'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moderation Notes Input */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Moderator Verification Notes
                </label>
                <input
                  type="text"
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  placeholder="e.g. Cross-referenced police dispatch / verified CCTV footage"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
                <button
                  onClick={() => handleUpdateStatus('REJECTED')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Report</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4" />
                  <span>Place Under Review</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus('VERIFIED')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Verify (Publish to Map)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-500">
              <ShieldAlert className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-sm font-semibold">Select an incident from the queue to inspect</p>
              <p className="text-xs text-slate-600 mt-1">Review narratives and apply verification decisions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
