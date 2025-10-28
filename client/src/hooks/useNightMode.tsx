import { useEffect, useState } from "react";

export default function useNightMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("nightMode");
      if (v !== null) return v === "1";
      return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (isDark) root.classList.add("dark"); else root.classList.remove("dark");
      localStorage.setItem("nightMode", isDark ? "1" : "0");
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [isDark]);

  return {
    isDark,
    setDark: (v: boolean) => setIsDark(v),
    toggle: () => setIsDark((s) => !s),
  };
}
