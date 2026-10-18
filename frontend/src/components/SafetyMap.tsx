import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Incident } from '../services/api';
import { RouteResult } from './SafeRoutePanel';

// Global corroborate callback invoked from Leaflet popup HTML buttons
declare global {
  interface Window {
    traceCorroborate?: (incidentId: string) => void;
  }
}

interface SafetyMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  reportMode?: boolean;
  pinLocation?: { lat: number; lng: number } | null;
  onSetPinLocation?: (loc: { lat: number; lng: number }) => void;
  center?: [number, number];
  zoom?: number;
  // ─── Safe Route Props ───────────────────────────────────────────────
  routeMode?: boolean;
  routePickingTarget?: 'origin' | 'destination' | null;
  originLocation?: { lat: number; lng: number } | null;
  destinationLocation?: { lat: number; lng: number } | null;
  routeResults?: RouteResult[] | null;
  activeRouteIndex?: number;
  onSetRoutePoint?: (loc: { lat: number; lng: number }) => void;
  // Corroboration callback — triggered from Leaflet popup
  onCorroborateFromMap?: (incidentId: string) => void;
  canCorroborate?: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

// Route line colors
const ROUTE_COLORS = ['#22c55e', '#f59e0b', '#f97316']; // green, amber, orange

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] as string);
}

export const SafetyMap: React.FC<SafetyMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  reportMode = false,
  pinLocation,
  onSetPinLocation,
  center = [18.5204, 73.8567], // Pune center
  zoom = 13,
  // Safe Route props
  routeMode = false,
  routePickingTarget = null,
  originLocation = null,
  destinationLocation = null,
  routeResults = null,
  activeRouteIndex = 0,
  onSetRoutePoint,
  onCorroborateFromMap,
  canCorroborate = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const reportMarkerRef = useRef<L.Marker | null>(null);

  // Safe Route refs
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotLayerRef = useRef<L.LayerGroup | null>(null);
  const corroborateCallbackRef = useRef(onCorroborateFromMap);

  useEffect(() => {
    corroborateCallbackRef.current = onCorroborateFromMap;
  }, [onCorroborateFromMap]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Register global corroborate callback for use in Leaflet HTML popups
    window.traceCorroborate = (incidentId: string) => {
      corroborateCallbackRef.current?.(incidentId);
    };

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    // Free OSM tiles — dark appearance applied via CSS filter on the tile pane
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Apply dark-mode filter to the tile pane so pins/popups remain unaffected
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.3) saturate(0.3)';
    }

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    const routeLayer = L.layerGroup().addTo(map);
    routeLayerRef.current = routeLayer;

    const hotspotLayer = L.layerGroup().addTo(map);
    hotspotLayerRef.current = hotspotLayer;

    mapInstanceRef.current = map;

    return () => {
      if (window.traceCorroborate) delete window.traceCorroborate;
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click — report mode OR route mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (reportMode && onSetPinLocation) {
        onSetPinLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else if (routeMode && routePickingTarget && onSetRoutePoint) {
        onSetRoutePoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [reportMode, onSetPinLocation, routeMode, routePickingTarget, onSetRoutePoint]);

  // Render report marker pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pinLocation && reportMode) {
      if (reportMarkerRef.current) {
        reportMarkerRef.current.setLatLng([pinLocation.lat, pinLocation.lng]);
      } else {
        const pinIcon = L.divIcon({
          className: 'custom-report-pin',
          html: `
            <div style="
              width: 32px; height: 32px;
              background: #6366f1;
              border: 3px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              display: flex; align-items: center; justify-content: center;
            ">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        reportMarkerRef.current = L.marker([pinLocation.lat, pinLocation.lng], { icon: pinIcon }).addTo(map);
      }
    } else {
      if (reportMarkerRef.current) {
        reportMarkerRef.current.remove();
        reportMarkerRef.current = null;
      }
    }
  }, [pinLocation, reportMode]);

  // ─── Safe Route: Origin Marker ──────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (originLocation && routeMode) {
      const originIcon = L.divIcon({
        className: 'safe-route-origin-pin',
        html: `
          <div style="
            width: 36px; height: 36px;
            background: #22c55e;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 16px rgba(34,197,94,0.5), 0 4px 12px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: 14px; color: white;
            font-family: system-ui, sans-serif;
          ">A</div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (originMarkerRef.current) {
        originMarkerRef.current.setLatLng([originLocation.lat, originLocation.lng]);
        originMarkerRef.current.setIcon(originIcon);
      } else {
        originMarkerRef.current = L.marker([originLocation.lat, originLocation.lng], { icon: originIcon }).addTo(map);
      }
    } else {
      if (originMarkerRef.current) {
        originMarkerRef.current.remove();
        originMarkerRef.current = null;
      }
    }
  }, [originLocation, routeMode]);

  // ─── Safe Route: Destination Marker ─────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (destinationLocation && routeMode) {
      const destIcon = L.divIcon({
        className: 'safe-route-dest-pin',
        html: `
          <div style="
            width: 36px; height: 36px;
            background: #ef4444;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 16px rgba(239,68,68,0.5), 0 4px 12px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: 14px; color: white;
            font-family: system-ui, sans-serif;
          ">B</div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng([destinationLocation.lat, destinationLocation.lng]);
        destMarkerRef.current.setIcon(destIcon);
      } else {
        destMarkerRef.current = L.marker([destinationLocation.lat, destinationLocation.lng], { icon: destIcon }).addTo(map);
      }
    } else {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
    }
  }, [destinationLocation, routeMode]);

  // ─── Safe Route: Draw Route Polylines + Hotspot circles ─────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    const hotspotLayer = hotspotLayerRef.current;
    if (!map || !routeLayer || !hotspotLayer) return;

    // Clear previous
    routeLayer.clearLayers();
    hotspotLayer.clearLayers();

    if (!routeResults || routeResults.length === 0 || !routeMode) return;

    // Draw routes in reverse order so the active one is on top
    const sorted = [...routeResults].map((r, i) => ({ ...r, originalIndex: i }));
    sorted.sort((a, b) => {
      if (a.originalIndex === activeRouteIndex) return 1; // draw last (on top)
      if (b.originalIndex === activeRouteIndex) return -1;
      return 0;
    });

    sorted.forEach((route) => {
      const isActive = route.originalIndex === activeRouteIndex;
      const coords: L.LatLngTuple[] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as L.LatLngTuple
      );

      const color = isActive
        ? (route.safety_score >= 70 ? '#22c55e' : route.safety_score >= 40 ? '#f59e0b' : '#ef4444')
        : '#64748b';

      // Shadow line (wider, darker) for depth
      if (isActive) {
        const shadow = L.polyline(coords, {
          color: '#000000',
          weight: 10,
          opacity: 0.25,
          interactive: false,
        });
        routeLayer.addLayer(shadow);
      }

      // Main route line
      const polyline = L.polyline(coords, {
        color,
        weight: isActive ? 6 : 3,
        opacity: isActive ? 0.9 : 0.35,
        dashArray: isActive ? undefined : '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
      });

      routeLayer.addLayer(polyline);

      // Hotspot danger circles — only for the active route
      if (isActive && route.hotspots) {
        route.hotspots.forEach((hs) => {
          const circle = L.circle([hs.lat, hs.lng], {
            radius: 200,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.1,
            weight: 1.5,
            opacity: 0.4,
            dashArray: '4, 6',
            interactive: false,
          });
          hotspotLayer.addLayer(circle);
        });
      }
    });

    // Fit map bounds to the active route
    const activeRoute = routeResults[activeRouteIndex];
    if (activeRoute) {
      const activeCoords: L.LatLngTuple[] = activeRoute.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as L.LatLngTuple
      );
      if (activeCoords.length > 0) {
        map.fitBounds(L.latLngBounds(activeCoords), { padding: [50, 50] });
      }
    }
  }, [routeResults, activeRouteIndex, routeMode]);

  // ─── Clean up route visuals when leaving route mode ─────────────────────
  useEffect(() => {
    if (!routeMode) {
      routeLayerRef.current?.clearLayers();
      hotspotLayerRef.current?.clearLayers();
      if (originMarkerRef.current) {
        originMarkerRef.current.remove();
        originMarkerRef.current = null;
      }
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
    }
  }, [routeMode]);

  // Render Incident Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    incidents.slice(0, 1000).forEach((inc) => {
      const color = SEVERITY_COLORS[inc.severity] || '#6366f1';
      const isCritical = inc.severity === 'CRITICAL';

      const icon = L.divIcon({
        className: 'incident-circle-pin',
        html: `<div class="trace-map-pin ${isCritical ? 'trace-map-pin--critical' : ''}" style="--pin-color:${color}; width:${isCritical ? '20px' : '14px'}; height:${isCritical ? '20px' : '14px'}; background:${color}"></div>`,
        iconSize: [isCritical ? 22 : 16, isCritical ? 22 : 16],
        iconAnchor: [isCritical ? 11 : 8, isCritical ? 11 : 8],
      });

      const marker = L.marker([Number(inc.latitude), Number(inc.longitude)], { icon });

      // Custom HTML Popup
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 13px; color: #0f172a; text-transform: uppercase;">
              ${escapeHtml(inc.category ? inc.category.replace('_', ' ') : 'INCIDENT')}
            </span>
            <span style="
              font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
              background-color: ${color}20; color: ${color};
            ">${inc.severity}</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            📍 ${escapeHtml(inc.location_area || 'Pune Metro Area')}
          </div>
          <p style="font-size: 12px; color: #334155; line-height: 1.4; margin-bottom: 8px;">
            ${escapeHtml(inc.description.length > 90 ? inc.description.slice(0, 90) + '...' : inc.description)}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; margin-bottom: 8px;">
            <span>${new Date(inc.occurred_at).toLocaleDateString()}</span>
            <span style="color: ${inc.status === 'VERIFIED' ? '#16a34a' : '#ea580c'}; font-weight: 600;">
              ${escapeHtml(inc.status)}
            </span>
          </div>
          ${canCorroborate ? `<button
            onclick="window.traceCorroborate && window.traceCorroborate('${inc.id}')"
            style="
              width: 100%; padding: 6px 0; border-radius: 8px;
              background: #4f46e5; color: white; border: none;
              font-size: 11px; font-weight: 700; cursor: pointer;
              display: flex; align-items: center; justify-content: center; gap: 4px;
            "
          >
            🤝 Witness This
          </button>` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });
      marker.on('click', () => {
        onSelectIncident(inc);
      });

      markersLayer.addLayer(marker);
    });
  }, [incidents, onSelectIncident, canCorroborate]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-slate-950/70">
      <div className="absolute inset-0 pointer-events-none z-[401] bg-[linear-gradient(180deg,rgba(2,6,23,.12),transparent_28%,transparent_76%,rgba(2,6,23,.26))]" />
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '520px' }} />

      {reportMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-cyan-500 text-slate-950 px-5 py-2.5 rounded-full shadow-xl font-semibold text-sm flex items-center gap-2 border border-cyan-200/30">
          <span>📍 Click anywhere on the map to set the incident location</span>
        </div>
      )}

      {/* Route mode banner */}
      {routeMode && routePickingTarget && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-5 py-2.5 rounded-full shadow-xl font-semibold text-sm flex items-center gap-2 border ${
          routePickingTarget === 'origin'
            ? 'bg-emerald-500 text-white border-emerald-300/50'
            : 'bg-rose-500 text-white border-rose-300/50'
        }`}>
          <span>
            {routePickingTarget === 'origin'
              ? '📍 Click the map to set your STARTING point'
              : '🏁 Click the map to set your DESTINATION'}
          </span>
        </div>
      )}

      {/* Floating Map Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-slate-950/85 backdrop-blur-md p-3.5 rounded-xl border border-white/10 text-xs shadow-xl flex flex-col gap-2">
        <span className="font-semibold text-slate-200 uppercase tracking-[0.14em] text-[10px]">Risk signal</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span className="text-slate-300">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            <span className="text-slate-300">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
            <span className="text-slate-300">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
            <span className="text-slate-300">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
};
