"use client";

import { getPublicBranches, formatPhone, type Branch } from "@/lib/branches";

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

function BranchCard({ branch }: { branch: Branch }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.mapsQuery)}`;

  return (
    <div className="group rounded-2xl bg-[#211A15] border border-white/[0.07]
                    hover:border-[#D9B66F]/20 transition-colors duration-300 p-5 sm:p-6
                    flex flex-col gap-4">

      {/* Заголовок + статус */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-[#F7F1E8] leading-snug">
          {branch.name}
        </h2>
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
            <span className="text-sm text-[#B8AA98]/40 italic">
              Телефон уточняется
            </span>
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

        {/* Маршрут */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
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

// ─── Список всех филиалов ─────────────────────────────────────────────────────

export default function BranchesList() {
  const branches = getPublicBranches();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Сетка: 1 колонка на мобиле, 2 на sm, 3 на lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map((branch) => (
          <BranchCard key={branch.id} branch={branch} />
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
