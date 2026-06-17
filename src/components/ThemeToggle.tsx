"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "dark" | "light";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const savedTheme =
      typeof window !== "undefined"
        ? window.localStorage.getItem("tal-theme")
        : null;
    const initialTheme: ThemeMode = savedTheme === "light" ? "light" : "dark";

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem("tal-theme", nextTheme);
  }

  const Icon = theme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={
        compact
          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-200 transition hover:border-cyan-300/30 hover:bg-cyan-400 hover:text-slate-950"
          : "flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/10 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200 transition hover:border-cyan-300/30 hover:bg-cyan-400 hover:text-slate-950"
      }
      title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      <Icon size={18} />
      {!compact && <span>{theme === "dark" ? "Oscuro" : "Claro"}</span>}
    </button>
  );
}
