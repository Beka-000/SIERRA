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
  // PWA manifest подключается через app/manifest.ts автоматически
  applicationName: "Sierra Coffee",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sierra Coffee",
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png",   sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icon-base.svg" },
    ],
  },
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
import HeartbeatProvider from "./components/HeartbeatProvider";
import AiChat from "./components/AiChat";
import PwaProvider from "./components/PwaProvider";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${playfair.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#17130F] text-[#F7F1E8]">
        <ToastProvider>
          <LocaleProvider>
            <AuthProvider>
              <CartProvider>
                <HeartbeatProvider>
                  {children}
                  <AiChat />
                  <PwaProvider />
                </HeartbeatProvider>
              </CartProvider>
            </AuthProvider>
          </LocaleProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
