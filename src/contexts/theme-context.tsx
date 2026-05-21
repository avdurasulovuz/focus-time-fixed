import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { applyTheme, getStoredTheme, type ThemeId } from "@/lib/themes";
import { getProfile } from "@/lib/local-store";

type ThemeContextType = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "forest",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("forest");

  useEffect(() => {
    const stored = getStoredTheme();
    const profileTheme = getProfile().settings?.theme as ThemeId | undefined;
    const initial =
      profileTheme && ["forest", "ocean", "sunset", "midnight", "sakura"].includes(profileTheme)
        ? profileTheme
        : stored;
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  function setTheme(id: ThemeId) {
    setThemeState(id);
    applyTheme(id);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
