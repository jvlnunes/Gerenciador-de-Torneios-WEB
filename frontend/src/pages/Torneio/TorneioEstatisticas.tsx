import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { Torneio } from "@/services/api/interfaces";
import { Loader2, BarChart3, Swords } from "lucide-react";
import { cn } from "@/services/utils";
import { usePlayerStats } from "./utils/usePlayerStats";
import { EstatisticasLideres } from "./components/Estatisticas/Lideres";
import { EstatisticasTabelaCompleta } from "./components/Estatisticas/TabelaCompleta";
import { EstatisticasPorPartida } from "./components/Estatisticas/PorPartida";

interface TorneioCtx {
  torneio: Torneio;
  torneioId: string;
  liveCount: number;
}

type AbaEstatisticas = "resumo" | "detalhado" | "partida";

const TABS: { id: AbaEstatisticas; label: string }[] = [
  { id: "resumo", label: "Líderes Individuais" },
  { id: "detalhado", label: "Tabela Completa" },
  { id: "partida", label: "Por Partida" },
];

export default function TorneioEstatisticas() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  const { stats, times, loading } = usePlayerStats(torneioId);
  const [activeTab, setActiveTab] = useState<AbaEstatisticas>("resumo");

  if (loading) {
    return (
      <div className="p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black text-foreground">Estatísticas do Torneio</h1>
        <p className="text-muted-foreground mt-1 text-sm">{torneio.nome}</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5",
              activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.id === "partida" }
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "partida" ? (
        <EstatisticasPorPartida torneioId={torneioId} />
      ) : stats.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
        </div>
      ) : activeTab === "resumo" ? (
        <EstatisticasLideres stats={stats} />
      ) : (
        <EstatisticasTabelaCompleta stats={stats} times={times} />
      )}
    </div>
  );
}