import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  ShieldCheck,
  FileText,
  Activity,
  Server,
  TrendingUp,
  Search,
  CheckCircle,
  Database,
  BarChart3,
} from 'lucide-react';

export const AdminCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'audit' | 'system'>('analytics');
  const [overview, setOverview] = useState<any>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const [ovRes, hotRes] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getHotspots(),
        ]);
        setOverview(ovRes);
        setHotspots(hotRes.hotspots);
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers({ search: searchUser });
        setUsers(res.users);
      } else if (activeTab === 'audit') {
        const res = await api.getAuditLogs();
        setAuditLogs(res.logs);
      } else if (activeTab === 'system') {
        const res = await api.getSystemStats();
        setSystemStats(res);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Command & Oversight Intelligence</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">System Administration</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full RBAC oversight, geospatial analytics, audit trail, and database telemetry
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700/60">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'users', label: 'Users & RBAC', icon: Users },
            { id: 'audit', label: 'Audit Trail', icon: FileText },
            { id: 'system', label: 'Telemetry', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && overview && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 font-semibold">Total Incident Volume</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {overview.counts.total.toLocaleString()}
              </h3>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Geotagged & Indexed</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 font-semibold">Verified on Map</span>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">
                {overview.counts.verified.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500 mt-2">Publicly visible safety data</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 font-semibold">Pending Review</span>
              <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
                {overview.counts.submitted.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500 mt-2">Awaiting moderator check</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 font-semibold">Under Investigation</span>
              <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">
                {overview.counts.investigating.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500 mt-2">Law enforcement escalation</p>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Breakdown (7 cols) */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Crime Distribution by Category
              </h3>
              <div className="space-y-3">
                {overview.categories.slice(0, 8).map((cat: any) => {
                  const percent = Math.round((cat.count / overview.counts.total) * 100);
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{cat.category.replace('_', ' ')}</span>
                        <span className="text-slate-400">{cat.count.toLocaleString()} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${percent * 2.5}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hotspots Ranking (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                High-Density Crime Hotspots (Pune)
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[340px]">
                {hotspots.slice(0, 10).map((spot: any, i: number) => (
                  <div
                    key={spot.area}
                    className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-700 font-bold text-slate-300 flex items-center justify-center text-[10px]">
                        #{i + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-white block">{spot.area}</span>
                        <span className="text-[10px] text-slate-400">
                          Top: {spot.top_category?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      {spot.total_incidents} incidents
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users & RBAC */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-white">User Accounts & Access Management</h3>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                placeholder="Search by name or email..."
                className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Current Role</th>
                  <th className="p-3.5">Submitted Reports</th>
                  <th className="p-3.5 text-right">Role Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-semibold text-white">{u.name}</td>
                    <td className="p-3.5 text-slate-400">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : u.role === 'MODERATOR'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">{u.report_count || 0}</td>
                    <td className="p-3.5 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="CITIZEN">CITIZEN</option>
                        <option value="MODERATOR">MODERATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white">System Security & Audit Trail</h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-indigo-400">{log.action}</td>
                    <td className="p-3.5 text-white">{log.user_name || 'System / Guest'}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate font-mono text-[11px]">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: System & Database Health */}
      {activeTab === 'system' && systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase">
              <Database className="w-5 h-5" />
              <span>PostgreSQL & PostGIS Telemetry</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block mb-1">Server Engine:</span>
                <span className="font-mono text-slate-200">{systemStats.database.serverVersion}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block mb-1">Spatial Extension:</span>
                <span className="font-mono text-emerald-400">{systemStats.database.postgisVersion}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase">
              <Activity className="w-5 h-5" />
              <span>Database Table Counts</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block">Total Incidents:</span>
                <span className="text-xl font-bold text-white mt-1 block">
                  {systemStats.tableCounts.incidents_count.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block">AI Analyses:</span>
                <span className="text-xl font-bold text-indigo-400 mt-1 block">
                  {systemStats.tableCounts.analysis_count.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block">Registered Users:</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">
                  {systemStats.tableCounts.users_count.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block">Audit Log Entries:</span>
                <span className="text-xl font-bold text-amber-400 mt-1 block">
                  {systemStats.tableCounts.audit_logs_count.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
