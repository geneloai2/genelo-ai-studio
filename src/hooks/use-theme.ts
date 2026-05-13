import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitial(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("genelo-theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const t = getInitial();
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("genelo-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }

  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
