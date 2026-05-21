export type ThemeId = "forest" | "ocean" | "sunset" | "midnight" | "sakura";

export const THEMES: { id: ThemeId; name: string; swatch: string }[] = [
  { id: "forest", name: "O'rmon", swatch: "#5ecf8a" },
  { id: "ocean", name: "Okean", swatch: "#5eb8e8" },
  { id: "sunset", name: "Quyosh", swatch: "#f0a060" },
  { id: "midnight", name: "Tun", swatch: "#9b8cff" },
  { id: "sakura", name: "Gul", swatch: "#f0a0c8" },
];

const THEME_KEY = "focus-time-theme";

export function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", id);
  localStorage.setItem(THEME_KEY, id);
  const meta = document.querySelector('meta[name="theme-color"]');
  const colors: Record<ThemeId, string> = {
    forest: "#1a3a26",
    ocean: "#142838",
    sunset: "#2a1e14",
    midnight: "#141428",
    sakura: "#281820",
  };
  if (meta) meta.setAttribute("content", colors[id]);
}

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "forest";
  const saved = localStorage.getItem(THEME_KEY) as ThemeId | null;
  if (saved && THEMES.some((t) => t.id === saved)) return saved;
  return "forest";
}
