import type { Metadata } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${schibsted.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
