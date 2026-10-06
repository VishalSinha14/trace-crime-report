import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Incident } from '../services/api';

interface SafetyMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  reportMode?: boolean;
  pinLocation?: { lat: number; lng: number } | null;
  onSetPinLocation?: (loc: { lat: number; lng: number }) => void;
  center?: [number, number];
  zoom?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

export const SafetyMap: React.FC<SafetyMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  reportMode = false,
  pinLocation,
  onSetPinLocation,
  center = [18.5204, 73.8567], // Pune center
  zoom = 13,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const reportMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

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
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click in report mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (reportMode && onSetPinLocation) {
        onSetPinLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [reportMode, onSetPinLocation]);

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
              ${inc.category ? inc.category.replace('_', ' ') : 'INCIDENT'}
            </span>
            <span style="
              font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
              background-color: ${color}20; color: ${color};
            ">${inc.severity}</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            📍 ${inc.location_area || 'Pune Metro Area'}
          </div>
          <p style="font-size: 12px; color: #334155; line-height: 1.4; margin-bottom: 8px;">
            ${inc.description.length > 90 ? inc.description.slice(0, 90) + '...' : inc.description}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
            <span>${new Date(inc.occurred_at).toLocaleDateString()}</span>
            <span style="color: ${inc.status === 'VERIFIED' ? '#16a34a' : '#ea580c'}; font-weight: 600;">
              ${inc.status}
            </span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectIncident(inc);
      });

      markersLayer.addLayer(marker);
    });
  }, [incidents, onSelectIncident]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-slate-950/70">
      <div className="absolute inset-0 pointer-events-none z-[401] bg-[linear-gradient(180deg,rgba(2,6,23,.12),transparent_28%,transparent_76%,rgba(2,6,23,.26))]" />
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '520px' }} />

      {reportMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-cyan-500 text-slate-950 px-5 py-2.5 rounded-full shadow-xl font-semibold text-sm flex items-center gap-2 border border-cyan-200/30">
          <span>📍 Click anywhere on the map to set the incident location</span>
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
