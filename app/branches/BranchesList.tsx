"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { getPublicBranches, getMappableBranches, formatPhone, type Branch } from "@/lib/branches";

// Загружаем карту только на клиенте — 2ГИС SDK работает только в браузере
const TwoGisMap = dynamic(() => import("@/app/components/TwoGisMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-[#211A15]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-[#D9B66F]/30 border-t-[#D9B66F] rounded-full animate-spin" />
        <p className="text-xs text-[#B8AA98]/60">Загрузка карты…</p>
      </div>
    </div>
  ),
});

// ─── Иконки ───────────────────────────────────────────────────────────────────

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0
               0 13.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0
               012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09
               7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339
               1.85.573 2.81.7A2 2 0 0122 14.92z"/>
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="6"  cy="19" r="3"/>
      <circle cx="18" cy="5"  r="3"/>
      <path d="M12 12H6a3 3 0 000 6"/>
      <path d="M12 12h6a3 3 0 000-6"/>
    </svg>
  );
}

function MapPinOffIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M10.73 10.73A4 4 0 0012 14c2.21 0 4-1.79 4-4a4 4 0 00-.37-1.67"/>
      <path d="M7.94 7.94A4 4 0 008 10c0 3.5 4 9 4 9s.48-.67 1.1-1.66"/>
      <path d="M18.44 12.94A9.005 9.005 0 0020 10a8 8 0 00-8-8c-1.61 0-3.1.47-4.37 1.27"/>
    </svg>
  );
}

// ─── Бейдж статуса ────────────────────────────────────────────────────────────

function StatusBadge({ branch }: { branch: Branch }) {
  if (branch.status === "open" && !branch.statusNote) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium
                       text-emerald-400 bg-emerald-500/10 border border-emerald-500/20
                       px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
        Работает
      </span>
    );
  }
  if (branch.statusNote) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium
                       text-amber-400 bg-amber-500/10 border border-amber-500/20
                       px-2 py-0.5 rounded-full">
        ⚠ {branch.statusNote}
      </span>
    );
  }
  return null;
}

// ─── Карточка одного филиала ──────────────────────────────────────────────────

function BranchCard({
  branch,
  isActive,
  onClick,
}: {
  branch: Branch;
  isActive: boolean;
  onClick: () => void;
}) {
  const routeUrl = `https://2gis.kg/bishkek/geo/firm?q=${encodeURIComponent(branch.mapsQuery)}`;
  const hasCoordsForMap = branch.lat !== null && branch.lng !== null;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-pressed={isActive}
      className={`group rounded-2xl border transition-all duration-200 p-5 sm:p-6 flex flex-col gap-4 cursor-pointer
        ${isActive
          ? "bg-[#2A1F14] border-[#D9B66F]/40 shadow-[0_0_0_2px_rgba(217,182,111,0.15)]"
          : "bg-[#211A15] border-white/[0.07] hover:border-[#D9B66F]/20"
        }`}
    >
      {/* Заголовок + статус */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Индикатор — на карте или нет */}
          {hasCoordsForMap ? (
            <span
              title="Показан на карте"
              className={`flex-shrink-0 w-2 h-2 rounded-full mt-1 ${
                isActive ? "bg-[#D9B66F]" : "bg-[#D9B66F]/40 group-hover:bg-[#D9B66F]/60"
              } transition`}
            />
          ) : (
            <span
              title="Нет на карте (координаты уточняются)"
              className="flex-shrink-0 text-white/20 mt-0.5"
            >
              <MapPinOffIcon />
            </span>
          )}
          <h2 className="text-base font-semibold text-[#F7F1E8] leading-snug truncate">
            {branch.name}
          </h2>
        </div>
        <div className="flex-shrink-0 mt-0.5">
          <StatusBadge branch={branch} />
        </div>
      </div>

      {/* Адрес */}
      <div className="flex items-start gap-2.5 text-[#B8AA98]">
        <span className="mt-0.5 flex-shrink-0 text-[#D9B66F]/60">
          <PinIcon />
        </span>
        <span className="text-sm leading-relaxed">{branch.address}</span>
      </div>

      {/* Телефон */}
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex-shrink-0 text-[#D9B66F]/60">
          <PhoneIcon />
        </span>
        <div>
          {branch.phone ? (
            <>
              <a
                href={`tel:${branch.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-[#B8AA98] hover:text-[#D9B66F] transition-colors"
              >
                {formatPhone(branch.phone)}
              </a>
              {branch.phoneNote && (
                <p className="text-[11px] text-[#B8AA98]/40 mt-0.5 leading-relaxed">
                  {branch.phoneNote}
                </p>
              )}
            </>
          ) : (
            <span className="text-sm text-[#B8AA98]/40 italic">Телефон уточняется</span>
          )}
        </div>
      </div>

      {/* Время работы */}
      {branch.hours && (
        <p className="text-xs text-[#B8AA98]/50">🕐 {branch.hours}</p>
      )}

      {/* Кнопки */}
      <div className="flex gap-2.5 mt-auto pt-2">
        {/* Позвонить */}
        {branch.phone ? (
          <a
            href={`tel:${branch.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl
                       bg-[#D9B66F]/10 border border-[#D9B66F]/20 text-[#D9B66F]
                       text-xs font-semibold hover:bg-[#D9B66F]/18 transition active:scale-95"
          >
            <PhoneIcon />
            Позвонить
          </a>
        ) : (
          <div
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl
                       bg-white/[0.03] border border-white/[0.06] text-white/25
                       text-xs cursor-not-allowed select-none"
          >
            <PhoneIcon />
            Телефон уточняется
          </div>
        )}

        {/* Маршрут в 2ГИС */}
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl
                     bg-white/[0.04] border border-white/[0.08] text-[#B8AA98]
                     text-xs font-semibold hover:bg-white/[0.08] hover:text-[#F7F1E8]
                     transition active:scale-95"
        >
          <RouteIcon />
          Маршрут
        </a>
      </div>
    </div>
  );
}

// ─── Список всех филиалов с картой ────────────────────────────────────────────

export default function BranchesList() {
  const branches    = getPublicBranches();
  const mappable    = getMappableBranches();
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  function handleCardClick(id: string) {
    const branch = branches.find((b) => b.id === id);
    // Если у филиала нет координат — не передаём на карту
    if (!branch || branch.lat === null || branch.lng === null) {
      setActiveBranchId(null);
      return;
    }
    setActiveBranchId(id);
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      {/* Карта 2ГИС */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.07] mb-10 sm:mb-12"
           style={{ height: "clamp(320px, 45vw, 500px)" }}>
        <TwoGisMap activeBranchId={activeBranchId} height="100%" />
      </div>

      {/* Подсказка */}
      <p className="text-xs text-[#B8AA98]/40 mb-6">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D9B66F]/40 inline-block" />
          Нажмите на карточку, чтобы найти филиал на карте
        </span>
        {branches.length > mappable.length && (
          <span className="ml-4 inline-flex items-center gap-1.5 text-white/20">
            <MapPinOffIcon />
            {branches.length - mappable.length} филиала без координат — не показаны на карте
          </span>
        )}
      </p>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            isActive={activeBranchId === branch.id}
            onClick={() => handleCardClick(branch.id)}
          />
        ))}
      </div>

      {/* Подсказка под сеткой */}
      <p className="mt-10 text-center text-xs text-[#B8AA98]/35 leading-relaxed">
        Режим работы и контакты некоторых филиалов уточняются.
        Актуальную информацию рекомендуем проверять по телефону.
      </p>
    </section>
  );
}
