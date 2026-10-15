"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

interface Review {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  user: { name: string; googleAvatar: string | null };
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i < n ? "#D9B66F" : "none"} stroke="#D9B66F" strokeWidth="1.8">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const { locale } = useLocale();
  const i18n = t(locale);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reviews?limit=6")
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="relative py-24 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12 h-8 w-48 rounded-lg bg-white/[0.05] animate-pulse" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#211A15] border border-white/[0.07] p-6 animate-pulse">
                <div className="h-3 w-24 bg-white/[0.06] rounded mb-4" />
                <div className="h-16 bg-white/[0.04] rounded mb-4" />
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
                  <div className="h-3 w-20 bg-white/[0.06] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section id="reviews" className="relative py-24 sm:py-28">
      <div className="absolute right-0 top-1/3 w-96 h-96 rounded-full bg-[#D9B66F]/[0.03] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#D9B66F] mb-4">
              {i18n.reviews.label}
            </p>
            <h2
              className="text-4xl md:text-5xl font-semibold text-[#F7F1E8] leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {i18n.reviews.sectionTitle}
            </h2>
          </div>
          <Link
            href="/reviews"
            className="shrink-0 text-sm text-[#D9B66F] hover:text-[#e8c87a] transition border-b border-[#D9B66F]/40 hover:border-[#D9B66F] pb-0.5"
          >
            {i18n.reviews.allReviewsLink}
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="group rounded-2xl bg-[#211A15] border border-white/[0.07] p-6 hover:border-[#D9B66F]/20 transition-colors flex flex-col"
            >
              <div className="mb-4">
                <Stars n={review.rating} />
              </div>

              <p className="flex-1 text-sm leading-relaxed text-[#B8AA98] mb-5 line-clamp-4">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="flex items-center gap-3 border-t border-white/[0.05] pt-4">
                {review.user.googleAvatar ? (
                  <img
                    src={review.user.googleAvatar}
                    alt={review.user.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#D9B66F]/10 border border-[#D9B66F]/20 flex items-center justify-center text-[#D9B66F] text-sm font-semibold shrink-0">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-[#F7F1E8]">{review.user.name}</p>
                  <p className="text-xs text-[#B8AA98]/50">
                    {new Date(review.createdAt).toLocaleDateString(
                      locale === "en" ? "en-GB" : "ru-RU",
                      { month: "long", year: "numeric" }
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/reviews" className="btn-outline">
            {i18n.reviews.readAllBtn}
          </Link>
        </div>
      </div>
    </section>
  );
}
