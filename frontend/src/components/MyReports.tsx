import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, Incident, NotificationItem } from '../services/api';
import { Bell, CheckCheck, Clock, ShieldCheck, MapPin, Sparkles, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface MyReportsProps {
  onOpenReportModal: () => void;
}

export const MyReports: React.FC<MyReportsProps> = ({ onOpenReportModal }) => {
  const [reports, setReports] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, notifRes] = await Promise.all([
        api.getIncidents({ my_reports: true, limit: 50 }),
        api.getNotifications(),
      ]);
      setReports(incRes.data);
      setNotifications(notifRes.notifications);
    } catch (err) {
      console.error('Failed to load my reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Real-time: listen for my report status changes ─────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('trace_token');
    const socket = io(
      (import.meta.env.VITE_SOCKET_URL as string | undefined) || 'http://localhost:5000',
      { auth: { token }, transports: ['websocket', 'polling'] }
    );

    socket.on('incident:my_update', (updatedInc: Incident) => {
      setReports((prev) =>
        prev.map((r) => (r.id === updatedInc.id ? updatedInc : r))
      );
      // Show toast with the new status
      if (updatedInc.status === 'VERIFIED') {
        showToast(`✅ Report #${updatedInc.id.slice(0, 8)} was VERIFIED and is now live on the map.`, 'success');
      } else if (updatedInc.status === 'REJECTED') {
        const note = updatedInc.moderation_notes ? ` Reason: ${updatedInc.moderation_notes}` : '';
        showToast(`❌ Report #${updatedInc.id.slice(0, 8)} was REJECTED.${note}`, 'error');
      } else {
        showToast(`🔄 Report #${updatedInc.id.slice(0, 8)} status changed to ${updatedInc.status}.`, 'info');
      }
      // Refresh notifications as well
      api.getNotifications().then((r) => setNotifications(r.notifications)).catch(() => {});
    });

    return () => { socket.disconnect(); };
  }, [showToast]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* ── Live Status Toast ─────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-start gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold max-w-md animate-bounce-in ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-red-900/90 border-red-500/50 text-red-300'
              : 'bg-indigo-900/90 border-indigo-500/50 text-indigo-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : toast.type === 'error' ? (
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span className="leading-snug">{toast.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Citizen Safety Portal</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">My Submissions & Alerts</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track the status of incidents you reported and receive moderation updates
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Report New Incident</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports List (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Submitted Reports ({reports.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
              Loading your reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Clock className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">You have not submitted any incident reports yet.</p>
              <button
                onClick={onOpenReportModal}
                className="px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs font-semibold transition"
              >
                Submit Your First Report
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((inc) => (
                <div
                  key={inc.id}
                  className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3 hover:border-slate-600 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {inc.category ? inc.category.replace('_', ' ') : 'Incident Report'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">#{inc.id.slice(0, 8)}</span>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold border ${
                        inc.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : inc.status === 'REJECTED'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{inc.description}</p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{inc.location_area || 'Pune Metro Area'}</span>
                    </div>
                    <span>Reported on {new Date(inc.occurred_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications & System Updates (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Bell className="w-4 h-4 text-indigo-400" />
                <span>Notifications</span>
              </div>
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark read</span>
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No notifications received.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 transition ${
                      !n.read
                        ? 'bg-indigo-950/30 border-indigo-500/40 text-slate-200'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{n.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
