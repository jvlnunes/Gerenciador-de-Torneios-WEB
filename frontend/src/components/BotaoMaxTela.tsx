import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export function BotaoMaxTela() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
      className="fixed bottom-5 right-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg transition-all hover:scale-105 hover:bg-muted hover:text-foreground active:scale-95"
    >
      {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
    </button>
  );
}