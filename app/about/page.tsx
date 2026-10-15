import Navbar from "@/app/components/Navbar";
import About  from "@/app/components/sections/About";
import Atmosphere from "@/app/components/sections/Atmosphere";
import Footer from "@/app/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О нас — Sierra Coffee",
  description: "История кофейни Sierra Coffee в Бишкеке. Наши ценности, команда и подход к кофе.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero-баннер страницы */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2400&auto=format&fit=crop')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#17130F]/90 via-[#17130F]/80 to-[#17130F]" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-xs font-medium tracking-widest uppercase text-[#D9B66F] mb-5">
              О компании
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-semibold text-[#F7F1E8] leading-tight mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              История Sierra Coffee
            </h1>
            <p className="text-lg text-[#B8AA98] max-w-2xl mx-auto leading-relaxed">
              Мы начали с простой идеи — создать место, где каждая чашка кофе
              становится маленьким ритуалом, а каждый гость чувствует себя как дома.
            </p>
          </div>
        </section>

        <div className="divider-gold" />
        <About />
        <div className="divider-gold" />
        <Atmosphere />
      </main>
      <Footer />
    </>
  );
}
