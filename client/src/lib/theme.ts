export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];

export const THEME_COOKIE = "theme";

export const isTheme = (value: unknown): value is Theme => themes.includes(value as Theme);
