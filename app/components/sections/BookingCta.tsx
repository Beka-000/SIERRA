"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";
import { usePhoneInput } from "@/lib/usePhoneInput";

export default function BookingCta() {
  const { locale } = useLocale();
  const i18n = t(locale);

  const [name,    setName]   = useState("");
  const phone = usePhoneInput();
  const [date,    setDate]   = useState("");
  const [guests,  setGuests] = useState("2");
  const [nameErr, setNameErr]= useState("");
  // Вычисляем minDate только на клиенте после монтирования,
  // чтобы избежать mismatch серверного и клиентского HTML
  const [minDate, setMinDate] = useState("");
  useEffect(() => {
    setMinDate(new Date().toISOString().split("T")[0]);
  }, []);
  const [sent,    setSent]   = useState(false);

  // Kyrgyz/Russian pluralisation for guests selector
  function guestLabel(n: number) {
    if (locale === "en") return `${n} ${n === 1 ? i18n.booking.guest : i18n.booking.guests2}`;
    if (n === 1) return `${n} ${i18n.booking.guest}`;
    if (n < 5)  return `${n} ${i18n.booking.guests2}`;
    return `${n} ${i18n.booking.guests5}`;
  }

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    let ok = true;
    if (!name.trim()) { setNameErr(i18n.booking.errorName); ok = false; }
    else setNameErr("");
    if (!phone.validate()) { ok = false; }
    if (ok) setSent(true);
  }

  return (
    <section id="booking" className="relative py-24 sm:py-28 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/20 to-transparent" />
      <div className="absolute inset-0 bg-[#c9a96e]/[0.02]" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #c9a96e 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#c9a96e]/[0.06] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Левая — текст */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#c9a96e] mb-4">
              {i18n.booking.label}
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
              {i18n.booking.title}
            </h2>
            <p className="text-[rgba(245,240,232,0.5)] text-lg leading-relaxed mb-10">
              {i18n.booking.description}
            </p>
            <ul className="space-y-4">
              {[i18n.booking.feature1, i18n.booking.feature2, i18n.booking.feature3].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[rgba(245,240,232,0.6)]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Правая — форма */}
          <div className="rounded-2xl bg-[#161411] border border-white/[0.07] p-6 sm:p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <p className="text-lg font-semibold text-[#f5f0e8]">{i18n.booking.successMsg}</p>
                <p className="text-sm text-[rgba(245,240,232,0.5)] max-w-xs">
                  {i18n.booking.successSub} {phone.value} {i18n.booking.successSub2}
                </p>
                <button
                  onClick={() => { setSent(false); setName(""); phone.reset(); setDate(""); }}
                  className="btn-outline mt-2"
                  style={{ height: "38px", padding: "0 20px", fontSize: "0.8125rem" }}
                >
                  {i18n.booking.newBookingBtn}
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheck} noValidate>
                <h3 className="text-base font-semibold text-[#f5f0e8] mb-6">{i18n.booking.formTitle}</h3>
                <div className="space-y-4">

                  {/* Имя */}
                  <div>
                    <label className="block text-xs font-medium text-[rgba(245,240,232,0.4)] mb-1.5 uppercase tracking-wider">
                      {i18n.booking.nameLabel} *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (nameErr) setNameErr(""); }}
                      placeholder={i18n.booking.namePlaceholder}
                      required
                      className={`w-full h-11 rounded-xl bg-white/[0.04] border text-[#f5f0e8] placeholder-[rgba(245,240,232,0.2)] px-4 text-sm outline-none focus:ring-2 focus:ring-[#c9a96e]/10 transition ${
                        nameErr ? "border-red-500/50 focus:border-red-400" : "border-white/[0.08] focus:border-[#c9a96e]/50"
                      }`}
                    />
                    {nameErr && <p className="mt-1 text-xs text-red-400">{nameErr}</p>}
                  </div>

                  {/* Телефон */}
                  <div>
                    <label className="block text-xs font-medium text-[rgba(245,240,232,0.4)] mb-1.5 uppercase tracking-wider">
                      {i18n.booking.phoneLabel} * <span className="normal-case text-[rgba(245,240,232,0.25)]">(+996)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone.value}
                      onChange={phone.onChange}
                      onBlur={phone.onBlur}
                      placeholder={i18n.booking.phonePlaceholder}
                      maxLength={17}
                      required
                      className={`w-full h-11 rounded-xl bg-white/[0.04] border text-[#f5f0e8] placeholder-[rgba(245,240,232,0.2)] px-4 text-sm outline-none focus:ring-2 focus:ring-[#c9a96e]/10 transition ${
                        phone.errorMsg ? "border-red-500/50 focus:border-red-400" : phone.isValid ? "border-green-500/30 focus:border-green-400/50" : "border-white/[0.08] focus:border-[#c9a96e]/50"
                      }`}
                    />
                    {phone.errorMsg && <p className="mt-1 text-xs text-red-400">{phone.errorMsg}</p>}
                    {!phone.errorMsg && phone.isValid && (
                      <p className="mt-1 text-xs text-green-400">✓ {locale === "ky" ? "Номер туура" : locale === "en" ? "Number is valid" : "Номер корректен"}</p>
                    )}
                  </div>

                  {/* Дата + гости */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[rgba(245,240,232,0.4)] mb-1.5 uppercase tracking-wider">
                        {i18n.booking.dateLabel}
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={minDate}
                        className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[rgba(245,240,232,0.7)] px-4 text-sm outline-none focus:border-[#c9a96e]/50 focus:ring-2 focus:ring-[#c9a96e]/10 transition [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[rgba(245,240,232,0.4)] mb-1.5 uppercase tracking-wider">
                        {i18n.booking.guestsLabel}
                      </label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[rgba(245,240,232,0.7)] px-4 text-sm outline-none focus:border-[#c9a96e]/50 focus:ring-2 focus:ring-[#c9a96e]/10 transition [color-scheme:dark]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>{guestLabel(n)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-gold w-full">
                    {i18n.booking.checkBtn}
                  </button>
                </div>

                <p className="mt-4 text-xs text-center text-[rgba(245,240,232,0.25)]">
                  {i18n.booking.agreement}
                </p>
              </form>
            )}
          </div>

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/20 to-transparent" />
    </section>
  );
}
