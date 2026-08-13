"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "obsidian" | "paper";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("obsidian");

  useEffect(() => {
    const saved = localStorage.getItem("nexus-theme") as Theme;
    if (saved === "obsidian" || saved === "paper") {
      setThemeState(saved);
    }
  }, []);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    localStorage.setItem("nexus-theme", nextTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-obsidian", "theme-paper");
    root.classList.add(`theme-${theme}`);
    
    // Enable dark class for Tailwind's dark selector compatibility
    if (theme === "obsidian") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
