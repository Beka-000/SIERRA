"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";
import BackButton from "@/app/components/ui/BackButton";

function Stars({
  rating, interactive = false, onSet, onHover,
}: {
  rating: number; interactive?: boolean;
  onSet?: (n: number) => void; onHover?: (n: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => interactive && onSet?.(i + 1)}
          onMouseEnter={() => interactive && onHover?.(i + 1)}
          onMouseLeave={() => interactive && onHover?.(0)}
          className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
          disabled={!interactive}
        >
          <svg
            width={interactive ? 28 : 16}
            height={interactive ? 28 : 16}
            viewBox="0 0 24 24"
            fill={i < rating ? "#D9B66F" : "none"}
            stroke="#D9B66F"
            strokeWidth="1.8"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useLocale();
  const i18n = t(locale);

  const [reviews,     setReviews]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [rating,      setRating]      = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text,        setText]        = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);

  const scoreLabels = [
    "",
    i18n.reviews.score1,
    i18n.reviews.score2,
    i18n.reviews.score3,
    i18n.reviews.score4,
    i18n.reviews.score5,
  ];

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/reviews?limit=30");
      const d = await r.json();
      if (r.ok) setReviews(d.reviews || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) { router.push("/login"); return; }
    if (rating === 0) { setError(i18n.reviews.errorRating); return; }
    if (text.trim().length < 10) { setError(i18n.reviews.errorText); return; }
    try {
      setSubmitting(true);
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: text.trim(), productId: null, orderId: null }),
      });
      const d = await r.json();
      if (r.ok) {
        setSuccess(true);
        setShowForm(false);
        setRating(0);
        setText("");
        fetchReviews();
      } else {
        setError(d.message || i18n.reviews.errorNetwork);
      }
    } catch {
      setError(i18n.reviews.errorNetwork);
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#17130F] pt-20 pb-16">

        <section className="py-14 sm:py-20 text-center border-b border-white/[0.05]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex justify-start mb-6">
              <BackButton fallback="/" label="На главную" />
            </div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#D9B66F] mb-5">
              {i18n.reviews.label}
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-[#F7F1E8] mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              {i18n.reviews.pageTitle}
            </h1>
            <p className="text-[#B8AA98] text-lg max-w-xl mx-auto mb-8">
              {i18n.reviews.pageSubtitle}
            </p>

            {!showForm && !success && (
              <button
                onClick={() => { if (!user) { router.push("/login"); return; } setShowForm(true); setError(""); }}
                className="btn-gold"
              >
                {user ? i18n.reviews.writeBtn : i18n.reviews.loginToWrite}
              </button>
            )}
            {success && (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                {i18n.reviews.successMsg}
              </div>
            )}
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">

          {/* Форма отзыва */}
          {showForm && (
            <div className="rounded-2xl bg-[#211A15] border border-white/[0.08] p-6 sm:p-8 mb-10">
              <h2 className="text-xl font-semibold text-[#F7F1E8] mb-6" style={{ fontFamily: "var(--font-display)" }}>
                {i18n.reviews.formTitle}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-medium tracking-wider uppercase text-[#B8AA98]/60 mb-3">
                    {i18n.reviews.ratingLabel}
                  </label>
                  <Stars rating={displayRating} interactive onSet={setRating} onHover={setHoverRating} />
                  {displayRating > 0 && (
                    <p className="mt-2 text-xs text-[#B8AA98]/50">{scoreLabels[displayRating]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium tracking-wider uppercase text-[#B8AA98]/60 mb-3">
                    {i18n.reviews.reviewLabel}
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={i18n.reviews.reviewPlaceholder}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[#F7F1E8] placeholder-[#B8AA98]/30 focus:outline-none focus:border-[#D9B66F]/40 transition resize-none text-sm"
                    rows={5}
                    maxLength={1000}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-red-400">{error}</span>
                    <span className="text-xs text-[#B8AA98]/40">{text.length}/1000</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setRating(0); setText(""); setError(""); }}
                    className="btn-outline"
                    disabled={submitting}
                  >
                    {i18n.reviews.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    disabled={rating === 0 || text.trim().length < 10 || submitting}
                    className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#17130F]/30 border-t-[#17130F] rounded-full animate-spin" />
                        {i18n.reviews.submitting}
                      </span>
                    ) : i18n.reviews.submitBtn}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Список отзывов */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-[#211A15] border border-white/[0.07] p-6 animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/[0.06] rounded w-32" />
                      <div className="h-2.5 bg-white/[0.04] rounded w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/[0.04] rounded w-full" />
                    <div className="h-3 bg-white/[0.04] rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-[#211A15] border border-white/[0.07]">
              <div className="text-5xl mb-4">☕</div>
              <p className="text-[#F7F1E8] font-medium mb-1">{i18n.reviews.noReviews}</p>
              <p className="text-[#B8AA98]/50 text-sm">{i18n.reviews.noReviewsSub}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl bg-[#211A15] border border-white/[0.07] p-6 hover:border-[#D9B66F]/15 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    {review.user?.googleAvatar ? (
                      <img src={review.user.googleAvatar} alt={review.user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#D9B66F]/10 border border-[#D9B66F]/20 flex items-center justify-center text-[#D9B66F] font-semibold shrink-0">
                        {review.user?.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                        <span className="font-medium text-[#F7F1E8] text-sm">{review.user?.name ?? i18n.reviews.guest}</span>
                        <Stars rating={review.rating} />
                      </div>
                      <p className="text-xs text-[#B8AA98]/50">
                        {new Date(review.createdAt).toLocaleDateString(
                          locale === "en" ? "en-GB" : "ru-RU",
                          { day: "numeric", month: "long", year: "numeric" }
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-[#B8AA98] text-sm leading-relaxed">{review.text}</p>
                  {review.product && (
                    <p className="mt-3 text-xs text-[#B8AA98]/40">{i18n.reviews.aboutProduct} {review.product.title}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
