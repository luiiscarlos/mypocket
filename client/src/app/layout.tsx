import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
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

// Browser chrome follows the shell colour (beige / black); "cover" lets the mobile app use the safe areas.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F2EA" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: t("title"), template: "%s · mypocket" },
    description: t("description"),
    // Installed from iOS "Add to Home Screen": full screen, app name under the icon.
    // black-translucent: the installed app draws under the status bar / notch (iOS then shows white status text).
    appleWebApp: { capable: true, title: "mypocket", statusBarStyle: "black-translucent" },
  };
}

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
