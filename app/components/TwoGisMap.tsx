"use client";

/**
 * TwoGisMap.tsx
 *
 * Карта 2ГИС со всеми маркерами филиалов SIERRA Coffee.
 * Использует официальный npm-пакет @2gis/mapgl.
 *
 * API-ключ: NEXT_PUBLIC_2GIS_API_KEY
 * Получить: https://dev.2gis.ru → создать проект → Map Tiles API
 * Разрешённые домены в кабинете: localhost:*, ваш-домен.com, *.vercel.app
 */

import React, { useEffect, useRef } from "react";
import { getMappableBranches, formatPhone, type Branch } from "@/lib/branches";

interface TwoGisMapProps {
  /** ID активного филиала — центрируем и показываем инфо-панель */
  activeBranchId?: string | null;
  /** CSS-высота карты */
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [74.5899, 42.8746]; // [lng, lat]
const DEFAULT_ZOOM = 12;

function build2GisRouteUrl(mapsQuery: string): string {
  return `https://2gis.kg/bishkek/geo/firm?q=${encodeURIComponent(mapsQuery)}`;
}

// Строит HTML попапа (отображается в DOM поверх карты)
function buildPopupHtml(branch: Branch): string {
  const phone    = branch.phone ? formatPhone(branch.phone) : null;
  const routeUrl = build2GisRouteUrl(branch.mapsQuery);

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;min-width:200px;max-width:240px;">
      <div style="font-weight:700;font-size:13px;color:#17130F;margin-bottom:4px;line-height:1.3;">
        ${branch.name}
      </div>
      <div style="font-size:11px;color:#555;margin-bottom:${branch.statusNote || phone ? "6px" : "10px"};line-height:1.4;">
        ${branch.address}
      </div>
      ${branch.statusNote ? `
        <div style="font-size:10px;color:#b45309;background:#fef3c7;border-radius:4px;padding:3px 6px;margin-bottom:6px;">
          ⚠ ${branch.statusNote}
        </div>` : ""}
      ${phone ? `
        <a href="tel:${branch.phone}" style="display:block;font-size:11px;color:#17130F;text-decoration:none;margin-bottom:8px;font-weight:500;">
          📞 ${phone}
        </a>` : ""}
      <a href="${routeUrl}" target="_blank" rel="noopener noreferrer"
        style="display:inline-flex;align-items:center;gap:4px;background:#D9B66F;color:#17130F;font-size:11px;font-weight:600;padding:5px 12px;border-radius:6px;text-decoration:none;">
        Маршрут в 2ГИС →
      </a>
    </div>`;
}

// Создаёт DOM-элемент попапа (прикреплён к контейнеру карты)
function createPopupElement(): HTMLDivElement {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position:     "absolute",
    zIndex:       "999",
    background:   "#fff",
    borderRadius: "10px",
    boxShadow:    "0 4px 20px rgba(0,0,0,0.25)",
    padding:      "12px 14px",
    display:      "none",
    pointerEvents: "auto",
  });
  // Стрелка вниз
  const arrow = document.createElement("div");
  Object.assign(arrow.style, {
    position:    "absolute",
    bottom:      "-8px",
    left:        "50%",
    transform:   "translateX(-50%)",
    width:       "0",
    height:      "0",
    borderLeft:  "8px solid transparent",
    borderRight: "8px solid transparent",
    borderTop:   "8px solid #fff",
  });
  el.appendChild(arrow);

  // Кнопка закрытия
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "✕";
  Object.assign(closeBtn.style, {
    position:   "absolute",
    top:        "6px",
    right:      "8px",
    background: "none",
    border:     "none",
    cursor:     "pointer",
    fontSize:   "12px",
    color:      "#888",
    padding:    "0",
    lineHeight: "1",
  });
  closeBtn.setAttribute("aria-label", "Закрыть");
  el.appendChild(closeBtn);

  return el;
}

export default function TwoGisMap({ activeBranchId, height = "400px" }: TwoGisMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  // branchId → marker instance
  const markersRef   = useRef<Record<string, any>>({});
  // Единый DOM-попап, переиспользуемый
  const popupElRef   = useRef<HTMLDivElement | null>(null);
  // ID текущего открытого попапа
  const openIdRef    = useRef<string | null>(null);

  const branches = getMappableBranches();

  // ── Позиционируем попап над маркером ─────────────────────────────────────

  const showPopup = (map: any, branch: Branch) => {
    if (!popupElRef.current || branch.lat === null || branch.lng === null) return;

    const popup  = popupElRef.current;
    const coords = [branch.lng, branch.lat];

    // Обновляем содержимое (минус кнопка закрытия и стрелка — они первые 2 дочерних)
    const content = popup.children[2] as HTMLElement | undefined;
    if (content) {
      content.innerHTML = buildPopupHtml(branch);
    } else {
      const div = document.createElement("div");
      div.innerHTML = buildPopupHtml(branch);
      popup.appendChild(div);
    }

    popup.style.display = "block";
    openIdRef.current = branch.id;

    // Пересчитываем позицию при рендере и при движении карты
    const reposition = () => {
      if (!mapRef.current || !containerRef.current || !popupElRef.current) return;
      const screen = mapRef.current.project(coords);
      const pw = popupElRef.current.offsetWidth  || 240;
      const ph = popupElRef.current.offsetHeight || 100;
      Object.assign(popupElRef.current.style, {
        left: `${screen[0] - pw / 2}px`,
        top:  `${screen[1] - ph - 16}px`,
      });
    };

    // Задержка для корректного offsetWidth
    requestAnimationFrame(() => {
      reposition();
      map.on("move", reposition);
      // Сохраняем колбэк для последующего удаления
      (popupElRef.current as any)._reposition = reposition;
      (popupElRef.current as any)._map = map;
    });
  };

  const hidePopup = () => {
    if (!popupElRef.current) return;
    popupElRef.current.style.display = "none";
    openIdRef.current = null;
    const map = (popupElRef.current as any)._map;
    const cb  = (popupElRef.current as any)._reposition;
    if (map && cb) map.off("move", cb);
  };

  // ── Инициализация карты ───────────────────────────────────────────────────

  useEffect(() => {
    if (mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;
    if (!apiKey) {
      console.warn("[TwoGisMap] NEXT_PUBLIC_2GIS_API_KEY is not set.");
      return;
    }
    if (!containerRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const { load } = await import("@2gis/mapgl");
        if (cancelled || !containerRef.current) return;

        const mapglAPI = await load();
        if (cancelled || !containerRef.current) return;

        const map = new mapglAPI.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom:   DEFAULT_ZOOM,
          key:    apiKey,
        });

        mapRef.current = map;

        // Создаём попап и добавляем в контейнер карты
        const popup = createPopupElement();
        containerRef.current.style.position = "relative";
        containerRef.current.appendChild(popup);
        popupElRef.current = popup;

        // Кнопка закрытия
        (popup.children[1] as HTMLElement).addEventListener("click", hidePopup);

        // Клик по карте — закрываем попап
        map.on("click", hidePopup);

        // Добавляем маркеры
        for (const branch of branches) {
          if (branch.lat === null || branch.lng === null) continue;
          const coords: [number, number] = [branch.lng, branch.lat];

          const marker = new mapglAPI.Marker(map, {
            coordinates: coords,
          });

          marker.on("click", () => {
            if (openIdRef.current === branch.id) {
              hidePopup();
              return;
            }
            hidePopup();
            showPopup(map, branch);
            map.setCenter(coords, { animate: true });
          });

          markersRef.current[branch.id] = marker;
        }
      } catch (err) {
        console.error("[TwoGisMap] Failed to initialize:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        markersRef.current = {};
        popupElRef.current = null;
        openIdRef.current  = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Реакция на activeBranchId (клик по карточке снаружи) ─────────────────

  useEffect(() => {
    if (!activeBranchId || !mapRef.current) return;

    const branch = branches.find((b) => b.id === activeBranchId);
    if (!branch || branch.lat === null || branch.lng === null) return;

    const coords: [number, number] = [branch.lng, branch.lat];

    hidePopup();
    mapRef.current.setCenter(coords, { animate: true });
    mapRef.current.setZoom(16, { animate: true });

    // Небольшая задержка, чтобы карта успела переместиться
    setTimeout(() => showPopup(mapRef.current, branch), 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId]);

  // ── Рендер ────────────────────────────────────────────────────────────────

  if (!process.env.NEXT_PUBLIC_2GIS_API_KEY) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-3 bg-[#211A15] rounded-2xl border border-white/[0.07] px-6 text-center"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D9B66F" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-sm font-medium text-[#F7F1E8]">Карта временно недоступна</p>
        <p className="text-xs text-[#B8AA98]/60 max-w-xs">
          Не задана переменная <code className="text-[#D9B66F]">NEXT_PUBLIC_2GIS_API_KEY</code>.
          {" "}Получить ключ:{" "}
          <a href="https://dev.2gis.ru" target="_blank" rel="noopener noreferrer"
             className="text-[#D9B66F] underline">dev.2gis.ru</a>.
        </p>
        <a
          href="/branches"
          className="mt-1 text-xs text-[#D9B66F] hover:underline"
        >
          Смотреть все адреса →
        </a>
      </div>
    );
  }

  return (
    <div style={{ height, position: "relative" }} className="w-full overflow-hidden">
      <MapContainer containerRef={containerRef} />
    </div>
  );
}

// Мемоизированный контейнер — 2ГИС работает напрямую с DOM-элементом
const MapContainer = React.memo(
  ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) => (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
    />
  ),
  () => true,
);
MapContainer.displayName = "MapContainer";
