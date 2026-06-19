"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme         = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme:         Theme;
  resolvedTheme: ResolvedTheme;
  setTheme:      (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:         "system",
  resolvedTheme: "light",
  setTheme:      () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [theme,         setThemeState]    = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  // Read persisted preference on first mount
  useEffect(() => {
    const stored = (localStorage.getItem("theme") ?? "system") as Theme;
    setThemeState(stored);
  }, []);

  // Apply class to <html> and track system-preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved: ResolvedTheme =
        theme === "dark"   ? "dark"  :
        theme === "light"  ? "light" :
        mq.matches         ? "dark"  : "light";

      setResolvedTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };

    apply();

    if (theme === "system") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem("theme", next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

