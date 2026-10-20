import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/cyrillic-500.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/cormorant-garamond/cyrillic-400.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: "ПРОСТРАНСТВО — архитектура вашего бизнеса",
    template: "%s — ПРОСТРАНСТВО",
  },
  description:
    "Коммерческие пространства от идеи до первого посетителя. Проектирование, строительство, инженерные системы и отделка ресторанов, магазинов, офисов, банков и клиник.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "ПРОСТРАНСТВО — архитектура вашего бизнеса",
    description: "Одно пространство. Бесконечные возможности для бизнеса.",
    locale: "ru_RU",
    type: "website",
    images: process.env.NEXT_PUBLIC_SITE_URL
      ? [
          {
            url: "/images/restaurant.jpg",
            width: 1536,
            height: 1024,
            alt: "Архитектура коммерческого пространства",
          },
        ]
      : undefined,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#151718",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <a className="skip-link" href="#main">
          Перейти к содержимому
        </a>
        {children}
      </body>
    </html>
  );
}
