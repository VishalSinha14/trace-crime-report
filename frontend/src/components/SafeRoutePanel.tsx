import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Shield, Navigation, MapPin, Flag, Footprints, Car,
  Search, X, AlertTriangle, Clock, Route, Loader2,
  ChevronRight, Zap,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RouteResult {
  id: number;
  name: string;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  distance_km: number;
  duration_min: number;
  safety_score: number;
  risk_score: number;
  incident_count_along_route: number;
  risk_breakdown: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  hotspots: { lat: number; lng: number; riskContribution: number }[];
}

export interface SafeRouteResponse {
  routes: RouteResult[];
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode: string;
}

interface SafeRoutePanelProps {
  originLocation: { lat: number; lng: number } | null;
  destinationLocation: { lat: number; lng: number } | null;
  routeResults: RouteResult[] | null;
  activeRouteIndex: number;
  loading: boolean;
  onSetActiveRoute: (index: number) => void;
  onFindRoute: (mode: 'walking' | 'driving') => void;
  onClearRoute: () => void;
  onClose: () => void;
  pickingTarget: 'origin' | 'destination' | null;
  onSetPickingTarget: (target: 'origin' | 'destination' | null) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSafetyColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 60) return '#f59e0b'; // amber
  if (score >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}

function getSafetyLabel(score: number): string {
  if (score >= 80) return 'Very Safe';
  if (score >= 60) return 'Moderately Safe';
  if (score >= 40) return 'Use Caution';
  return 'High Risk';
}

function getSafetyGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500/20 to-emerald-500/5';
  if (score >= 60) return 'from-amber-500/20 to-amber-500/5';
  if (score >= 40) return 'from-orange-500/20 to-orange-500/5';
  return 'from-red-500/20 to-red-500/5';
}

// ─── Component ──────────────────────────────────────────────────────────────

export const SafeRoutePanel: React.FC<SafeRoutePanelProps> = ({
  originLocation,
  destinationLocation,
  routeResults,
  activeRouteIndex,
  loading,
  onSetActiveRoute,
  onFindRoute,
  onClearRoute,
  onClose,
  pickingTarget,
  onSetPickingTarget,
}) => {
  const [mode, setMode] = useState<'walking' | 'driving'>('walking');

  const canSearch = !!originLocation && !!destinationLocation && !loading;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="intel-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-400/20 flex items-center justify-center border border-cyan-300/20">
              <Shield className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Safe Route</h3>
                <span className="text-[9px] uppercase font-bold tracking-[0.14em] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-300/20">
                  Navigator
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Crime-aware path intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Origin & Destination Inputs */}
      <div className="intel-card p-4 space-y-3">
        {/* Origin */}
        <div>
          <label className="text-[10px] uppercase tracking-[0.12em] font-semibold text-slate-400 mb-1.5 block">
            <MapPin className="w-3 h-3 inline mr-1 text-emerald-400" />
            Origin Point
          </label>
          <button
            onClick={() => onSetPickingTarget(pickingTarget === 'origin' ? null : 'origin')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs text-left transition border flex items-center justify-between ${
              pickingTarget === 'origin'
                ? 'bg-emerald-400/10 border-emerald-400/40 text-emerald-300 shadow-lg shadow-emerald-950/20'
                : originLocation
                  ? 'bg-white/[0.04] border-white/[0.1] text-slate-200'
                  : 'bg-white/[0.025] border-white/[0.06] text-slate-500 hover:border-white/[0.15]'
            }`}
          >
            <span>
              {pickingTarget === 'origin'
                ? '📍 Click on the map...'
                : originLocation
                  ? `${originLocation.lat.toFixed(5)}, ${originLocation.lng.toFixed(5)}`
                  : 'Click to set on map'}
            </span>
            {originLocation && !pickingTarget && (
              <span className="text-[9px] text-emerald-400 font-semibold">SET ✓</span>
            )}
          </button>
        </div>

        {/* Route line connector */}
        <div className="flex items-center gap-2 px-3">
          <div className="w-px h-6 bg-gradient-to-b from-emerald-400/60 to-rose-400/60 ml-1" />
          <Route className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Destination */}
        <div>
          <label className="text-[10px] uppercase tracking-[0.12em] font-semibold text-slate-400 mb-1.5 block">
            <Flag className="w-3 h-3 inline mr-1 text-rose-400" />
            Destination
          </label>
          <button
            onClick={() => onSetPickingTarget(pickingTarget === 'destination' ? null : 'destination')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs text-left transition border flex items-center justify-between ${
              pickingTarget === 'destination'
                ? 'bg-rose-400/10 border-rose-400/40 text-rose-300 shadow-lg shadow-rose-950/20'
                : destinationLocation
                  ? 'bg-white/[0.04] border-white/[0.1] text-slate-200'
                  : 'bg-white/[0.025] border-white/[0.06] text-slate-500 hover:border-white/[0.15]'
            }`}
          >
            <span>
              {pickingTarget === 'destination'
                ? '📍 Click on the map...'
                : destinationLocation
                  ? `${destinationLocation.lat.toFixed(5)}, ${destinationLocation.lng.toFixed(5)}`
                  : 'Click to set on map'}
            </span>
            {destinationLocation && !pickingTarget && (
              <span className="text-[9px] text-rose-400 font-semibold">SET ✓</span>
            )}
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setMode('walking')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'walking'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" /> Walking
          </button>
          <button
            onClick={() => setMode('driving')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'driving'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" /> Driving
          </button>
        </div>

        {/* Search Button */}
        <button
          onClick={() => onFindRoute(mode)}
          disabled={!canSearch}
          className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
            canSearch
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-950/30'
              : 'bg-white/[0.06] text-slate-500 cursor-not-allowed border border-white/[0.06]'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Computing safest path...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Find Safest Route</span>
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {routeResults && routeResults.length > 0 && (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
          {/* Summary badge */}
          <div className="flex items-center gap-2 px-1">
            <Zap className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[10px] uppercase font-semibold tracking-[0.12em] text-slate-400">
              {routeResults.length} routes analyzed
            </span>
          </div>

          {/* Route Cards */}
          {routeResults.map((route, idx) => {
            const isActive = idx === activeRouteIndex;
            const color = getSafetyColor(route.safety_score);
            const label = getSafetyLabel(route.safety_score);
            const gradient = getSafetyGradient(route.safety_score);
            const isSafest = idx === 0;

            return (
              <button
                key={route.id}
                onClick={() => onSetActiveRoute(idx)}
                className={`intel-card p-4 text-left transition-all cursor-pointer ${
                  isActive
                    ? `ring-1 shadow-lg bg-gradient-to-br ${gradient}`
                    : 'hover:bg-white/[0.04]'
                }`}
                style={{
                  ringColor: isActive ? color : undefined,
                  borderColor: isActive ? `${color}40` : undefined,
                }}
              >
                {/* Route Name + Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isSafest && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border"
                        style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
                      >
                        Recommended
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-200">{route.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition ${isActive ? 'text-white' : 'text-slate-600'}`} />
                </div>

                {/* Safety Score */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border"
                    style={{
                      color,
                      borderColor: `${color}30`,
                      backgroundColor: `${color}12`,
                    }}
                  >
                    {route.safety_score}
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color }}>{label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Safety Score</div>
                  </div>
                </div>

                {/* Safety Bar */}
                <div className="w-full h-2 rounded-full bg-white/[0.06] mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${route.safety_score}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}99)`,
                      boxShadow: `0 0 8px ${color}50`,
                    }}
                  />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/[0.03] rounded-lg px-2 py-1.5 text-center border border-white/[0.05]">
                    <div className="text-[10px] text-slate-500">Distance</div>
                    <div className="text-xs font-bold text-slate-200">{route.distance_km} km</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg px-2 py-1.5 text-center border border-white/[0.05]">
                    <div className="text-[10px] text-slate-500">Duration</div>
                    <div className="text-xs font-bold text-slate-200">{route.duration_min} min</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg px-2 py-1.5 text-center border border-white/[0.05]">
                    <div className="text-[10px] text-slate-500">Incidents</div>
                    <div className="text-xs font-bold" style={{ color: route.incident_count_along_route > 10 ? '#f97316' : '#94a3b8' }}>
                      {route.incident_count_along_route}
                    </div>
                  </div>
                </div>

                {/* Risk Breakdown (expanded for active) */}
                {isActive && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
                    <div className="text-[10px] uppercase font-semibold tracking-[0.1em] text-slate-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Risk Breakdown
                    </div>
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => {
                      const count = route.risk_breakdown[sev];
                      const sevColors: Record<string, string> = {
                        CRITICAL: '#ef4444',
                        HIGH: '#f97316',
                        MEDIUM: '#f59e0b',
                        LOW: '#22c55e',
                      };
                      return (
                        <div key={sev} className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sevColors[sev] }}
                          />
                          <span className="text-[10px] text-slate-400 w-16">{sev}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, count * 10)}%`,
                                backgroundColor: sevColors[sev],
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-300 w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}

          {/* Clear Button */}
          <button
            onClick={onClearRoute}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition flex items-center justify-center gap-2"
          >
            <X className="w-3.5 h-3.5" /> Clear Route
          </button>
        </div>
      )}

      {/* Empty state when no results yet */}
      {!routeResults && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <Navigation className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Set your <span className="text-emerald-300 font-semibold">origin</span> and{' '}
            <span className="text-rose-300 font-semibold">destination</span> on the map, then
            find the safest path based on verified crime data.
          </p>
        </div>
      )}
    </div>
  );
};
