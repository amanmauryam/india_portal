"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.matches) root.classList.add("dark");
      else root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const icons: Record<Theme, any> = { light: Sun, dark: Moon, system: Monitor };
  const labels: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" };
  const Icon = icons[theme];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
        title={`Theme: ${labels[theme]}`}
      >
        <Icon className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {(Object.keys(icons) as Theme[]).map((t) => {
              const TIcon = icons[t];
              return (
                <button
                  key={t}
                  onClick={() => { setTheme(t); setOpen(false); }}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold transition-colors ${
                    theme === t
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <TIcon className="h-4 w-4" />
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
