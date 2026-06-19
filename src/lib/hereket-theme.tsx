import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
const KEY = "hereket:theme";

interface Ctx {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeCtx = createContext<Ctx | null>(null);

function systemPrefersDark() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}

function readInitial(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "dark";
}

export function HereketThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitial);
  const resolved: "light" | "dark" = mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => document.documentElement.classList.toggle("dark", mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try { localStorage.setItem(KEY, m); } catch {}
  };

  const toggle = () => setMode(resolved === "dark" ? "light" : "dark");

  return <ThemeCtx.Provider value={{ mode, resolved, setMode, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useHereketTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("HereketThemeProvider missing");
  return ctx;
}