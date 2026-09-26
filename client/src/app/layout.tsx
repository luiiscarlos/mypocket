import type { Metadata } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { getTheme } from "@/lib/preferences";
import "./globals.css";

// Self-hosted by next/font at build time, so CSP can stay font-src 'self'.
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "mypocket — Todo tu dinero, en un único sitio", template: "%s · mypocket" },
  description:
    "Conecta tus bancos, añade tu efectivo y mira cuánto tienes de verdad. Un balance total, sin perder de vista de dónde viene cada euro.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return (
    // Set on the server so there is no flash; "system" leaves it out and CSS follows prefers-color-scheme.
    <html lang={locale} data-theme={theme === "system" ? undefined : theme} className={`${schibsted.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Makes locale and messages available to client components (useTranslations). */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
