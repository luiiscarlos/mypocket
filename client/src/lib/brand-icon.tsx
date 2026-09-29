import { ImageResponse } from "next/og";

/**
 * App icon: brand-green square with "m." (the dot in mint), drawn at any size. `maskable` fills the whole
 * canvas and keeps the mark inside the 80 % safe zone Android crops to; otherwise the square is rounded.
 */
export function brandIcon(size: number, { maskable = false } = {}) {
  const mark = Math.round(size * (maskable ? 0.42 : 0.56));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B4D3A",
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
          color: "#F6F2EA",
          fontSize: mark,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          paddingBottom: Math.round(size * 0.06),
        }}
      >
        m<span style={{ color: "#86C9A3" }}>.</span>
      </div>
    ),
    { width: size, height: size },
  );
}
