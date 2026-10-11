import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Sierra Coffee — кофейня в Бишкеке",
  description:
    "Уютная кофейня Sierra Coffee. Авторский кофе, свежая выпечка, завтраки и обеды. Онлайн-заказ и бронирование столиков.",
  keywords: "кофейня, кофе, Бишкек, Sierra Coffee, завтрак, бронирование",
  openGraph: {
    title: "Sierra Coffee",
    description: "Уютная кофейня в Бишкеке. Авторский кофе и вкусная еда.",
    type: "website",
    locale: "ru_KG",
  },
};

import { LocaleProvider } from "@/lib/LocaleContext";
import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";
import { ToastProvider } from "@/lib/ToastContext";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${playfair.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#0f0d0b] text-[#f5f0e8]">
        <ToastProvider>
          <LocaleProvider>
            <AuthProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </AuthProvider>
          </LocaleProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
