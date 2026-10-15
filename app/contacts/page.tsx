import Navbar   from "@/app/components/Navbar";
import Contacts  from "@/app/components/sections/Contacts";
import Footer    from "@/app/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты — Sierra Coffee",
  description: "Адрес кофейни Sierra Coffee в Бишкеке, телефон, режим работы и карта проезда.",
};

export default function ContactsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Заголовок страницы */}
        <section className="py-16 sm:py-20 text-center border-b border-white/[0.05]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-xs font-medium tracking-widest uppercase text-[#D9B66F] mb-5">
              Как нас найти
            </p>
            <h1
              className="text-4xl sm:text-5xl font-semibold text-[#F7F1E8] leading-tight mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Контакты
            </h1>
            <p className="text-[#B8AA98] text-lg max-w-xl mx-auto">
              Мы в самом сердце Бишкека. Приходите — будем рады вас видеть.
            </p>
          </div>
        </section>

        <Contacts />
      </main>
      <Footer />
    </>
  );
}
