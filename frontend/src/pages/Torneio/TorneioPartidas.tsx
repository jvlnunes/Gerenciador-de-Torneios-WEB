
import { useOutletContext } from "react-router-dom";
import { type Torneio } from "@/services/api";

interface TorneioCtx { torneio: Torneio; torneioId: string; liveCount: number; }

export default function TorneioPartidas() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  return (
    <div className="p-6">
      <h1 className="font-display text-3xl font-black text-foreground">Partidas</h1>
      <p className="text-muted-foreground mt-1 text-sm">{torneio.nome}</p>
      {/* TODO: mover conteúdo de src/routes/torneios.$id.matches.tsx para cá */}

      
    </div>
  );
}