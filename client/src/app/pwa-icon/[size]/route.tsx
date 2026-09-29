import { brandIcon } from "@/lib/brand-icon";

// Fixed-size PNG icons for the web app manifest: /pwa-icon/192, /pwa-icon/512, /pwa-icon/maskable-512.
const SIZES: Record<string, { px: number; maskable: boolean }> = {
  "192": { px: 192, maskable: false },
  "512": { px: 512, maskable: false },
  "maskable-512": { px: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

export async function GET(_: Request, { params }: RouteContext<"/pwa-icon/[size]">) {
  const icon = SIZES[(await params).size];
  if (!icon) return new Response("Not found", { status: 404 });
  return brandIcon(icon.px, { maskable: icon.maskable });
}
