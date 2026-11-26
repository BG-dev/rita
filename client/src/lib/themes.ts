export type ThemeId = "simple" | "lol" | "gta";

export const THEMES: { id: ThemeId; label: string; hint: string }[] = [
  { id: "simple", label: "Простой", hint: "Чистый минимализм" },
  { id: "lol", label: "Лига Легенд", hint: "Золото и магия Рунтерры" },
  { id: "gta", label: "GTA VI", hint: "Неон Вайс-Сити" },
];

export const DEFAULT_THEME: ThemeId = "lol";
export const THEME_KEY = "watch:theme";

export function isTheme(v: unknown): v is ThemeId {
  return v === "simple" || v === "lol" || v === "gta";
}
