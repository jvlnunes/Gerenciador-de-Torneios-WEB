import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/services/utils";

export function TrocaTema() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark
          ? "bg-secondary border-border"
          : "bg-muted border-border",
      )}
    >
      {/* Ícones fixos nas pontas */}
      <Sun
        className={cn(
          "absolute left-1.5 h-4 w-4 transition-opacity duration-300",
          isDark ? "opacity-30 text-muted-foreground" : "opacity-100 text-accent-foreground",
        )}
      />
      <Moon
        className={cn(
          "absolute right-1.5 h-4 w-4 transition-opacity duration-300",
          isDark ? "opacity-100 text-primary-foreground" : "opacity-30 text-muted-foreground",
        )}
      />

      {/* Thumb que desliza */}
      <span
        className={cn(
          "inline-block h-6 w-6 transform rounded-full bg-primary shadow-md transition-transform duration-300 ease-in-out",
          isDark ? "translate-x-[26px]" : "translate-x-1",
        )}
      />
    </button>
  );
}