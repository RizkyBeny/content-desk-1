"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
export type ThemeSetting = Theme | "system";

export type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: ThemeSetting;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
  forcedTheme?: Theme;
};

export type ThemeContextValue = {
  theme: ThemeSetting;
  resolvedTheme: Theme;
  setTheme: (theme: ThemeSetting) => void;
  themes: ThemeSetting[];
};

const THEME_CLASSES: Theme[] = ["light", "dark"];
const ALL_THEMES: ThemeSetting[] = ["light", "dark", "system"];

function isThemeSetting(value: unknown): value is ThemeSetting {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove(...THEME_CLASSES);
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  disableTransitionOnChange = false,
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeSetting>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const stored = window.localStorage.getItem(storageKey);
      return isThemeSetting(stored) ? stored : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });
  const [systemTheme, setSystemTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "light" : getSystemTheme(),
  );

  const resolvedTheme: Theme = forcedTheme ?? (theme === "system" ? systemTheme : theme);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      if (isThemeSetting(event.newValue)) {
        setThemeState(event.newValue);
      } else {
        setThemeState(defaultTheme);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, defaultTheme]);

  useEffect(() => {
    const next = resolvedTheme;
    if (!disableTransitionOnChange) {
      applyTheme(next);
      return;
    }
    const style = document.createElement("style");
    style.appendChild(document.createTextNode("*{transition:none!important}"));
    document.head.appendChild(style);
    void document.body.offsetHeight;
    applyTheme(next);
    const timeout = window.setTimeout(() => style.remove(), 1);
    return () => window.clearTimeout(timeout);
  }, [resolvedTheme, disableTransitionOnChange]);

  const setTheme = useCallback(
    (next: ThemeSetting) => {
      setThemeState(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // localStorage unavailable (private mode / quota)
      }
    },
    [storageKey],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, themes: ALL_THEMES }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
