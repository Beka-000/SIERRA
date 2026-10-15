"use client";

import { useEffect, useRef } from "react";

const LAT = 42.8746;
const LNG = 74.5698;
const GMAPS_ROUTE = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`;
const GMAPS_OPEN  = `https://www.google.com/maps/search/?api=1&query=${LAT},${LNG}`;

export default function LeafletMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);

  useEffect(() => {
    // Уже инициализирован — выходим
    if (mapRef.current) return;

    let mounted = true;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Ждём, пока контейнер действительно появится в DOM
      if (!mounted || !containerRef.current) return;

      // Патч иконок (webpack-проблема)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, {
        center:           [LAT, LNG],
        zoom:             16,
        zoomControl:      true,
        scrollWheelZoom:  false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Кастомный золотой маркер
      const goldIcon = L.divIcon({
        className: "",
        html: `<div style="
            width:36px;height:44px;
            display:flex;flex-direction:column;align-items:center;
            filter:drop-shadow(0 4px 10px rgba(0,0,0,0.6));">
          <div style="
            width:36px;height:36px;border-radius:50% 50% 50% 0;
            background:#D9B66F;transform:rotate(-45deg);
            border:3px solid #17130F;
            display:flex;align-items:center;justify-content:center;">
            <svg style="transform:rotate(45deg)" width="14" height="14"
              viewBox="0 0 24 24" fill="none"
              stroke="#17130F" stroke-width="2.5" stroke-linecap="round">
              <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
              <path d="M6 1v3M10 1v3M14 1v3"/>
            </svg>
          </div>
        </div>`,
        iconSize:    [36, 44],
        iconAnchor:  [18, 44],
        popupAnchor: [0, -46],
      });

      const marker = L.marker([LAT, LNG], { icon: goldIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif;padding:4px 0;min-width:180px">
          <div style="font-weight:700;font-size:14px;color:#17130F;margin-bottom:4px">
            ☕ Sierra Coffee
          </div>
          <div style="font-size:12px;color:#666;margin-bottom:10px">
            пр. Чуй 154, Бишкек
          </div>
          <a href="${GMAPS_ROUTE}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;background:#D9B66F;color:#17130F;
                   font-size:12px;font-weight:600;padding:5px 14px;
                   border-radius:6px;text-decoration:none">
            Маршрут →
          </a>
        </div>`, { maxWidth: 240 }).openPopup();

      mapRef.current = map;
    })();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[340px]">
      {/* Контейнер карты */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Кнопки поверх карты — z-[1000] выше тайлов Leaflet */}
      <div className="absolute bottom-3 left-3 z-[1000] flex gap-2 pointer-events-none">
        <a href={GMAPS_ROUTE} target="_blank" rel="noopener noreferrer"
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-lg"
          style={{ background: "#D9B66F", color: "#17130F" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 12l18-9-9 18-2-8-7-1z"/>
          </svg>
          Маршрут
        </a>
        <a href={GMAPS_OPEN} target="_blank" rel="noopener noreferrer"
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shadow-lg"
          style={{ background: "rgba(23,19,15,0.85)", color: "#F7F1E8",
                   border: "1px solid rgba(217,182,111,0.3)" }}>
          Google Maps ↗
        </a>
      </div>
    </div>
  );
}
