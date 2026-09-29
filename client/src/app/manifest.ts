import type { MetadataRoute } from "next";

// Installable PWA: opens the mobile app full screen. No service worker yet (no offline mode).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "mypocket",
    short_name: "mypocket",
    description: "Todo tu dinero, en un único sitio.",
    id: "/mobile",
    start_url: "/mobile",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F2EA",
    theme_color: "#F6F2EA",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
