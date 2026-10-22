import type { Metadata } from "next";
import Navbar  from "@/app/components/Navbar";
import Footer  from "@/app/components/Footer";
import BranchesList from "@/app/branches/BranchesList";

export const metadata: Metadata = {
  title:       "Филиалы — Sierra Coffee",
  description: "Все кофейни SIERRA Coffee в Бишкеке: адреса, телефоны и как добраться.",
};

export default function BranchesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#17130F]">
        {/* Hero-шапка */}
        <section className="py-16 sm:py-20 text-center border-b border-white/[0.05]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-xs font-medium tracking-widest uppercase text-[#D9B66F] mb-5">
              Мы рядом
            </p>
            <h1
              className="text-4xl sm:text-5xl font-semibold text-[#F7F1E8] leading-tight mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Наши филиалы
            </h1>
            <p className="text-[#B8AA98] text-lg max-w-xl mx-auto">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              8 кофеен Sierra Coffee по всему Бишкеку — найдите ближайшую.
            </p>
          </div>
        </section>

        {/* Список карточек */}
        <BranchesList />
      </main>
      <Footer />
    </>
  );
}
