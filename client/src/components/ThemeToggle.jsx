import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle theme"
      className="
        relative w-9 h-9 rounded-lg flex items-center justify-center
        border border-light-border dark:border-dark-border
        bg-light-card dark:bg-dark-card
        text-light-muted dark:text-dark-muted
        hover:text-amu-primary dark:hover:text-amu-accent
        hover:border-amu-accent/50
        transition-all duration-200
      "
    >
      {dark
        ? <FiSun size={15} className="transition-transform duration-200 rotate-0" />
        : <FiMoon size={15} className="transition-transform duration-200" />
      }
    </button>
  );
}