"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const THEMES = ["system", "light", "dark"] as const;
type T = (typeof THEMES)[number];

const ICONS: Record<T, React.ReactNode> = {
  system: <Monitor size={16} strokeWidth={1.8} />,
  light: <Sun size={16} strokeWidth={1.8} />,
  dark: <Moon size={16} strokeWidth={1.8} />,
};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={`w-9 h-9 rounded-full ${className}`} />;
  }

  const current = (theme as T) ?? "system";
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];

  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`Tema: ${current}`}
      className={`
        w-9 h-9 flex items-center justify-center rounded-full
        text-zinc-500 dark:text-zinc-400
        hover:text-zinc-900 dark:hover:text-white
        hover:bg-black/[0.07] dark:hover:bg-white/10
        active:bg-black/[0.12] dark:active:bg-white/20
        transition-all duration-150 ${className}
      `}
    >
      {ICONS[current]}
    </button>
  );
}
