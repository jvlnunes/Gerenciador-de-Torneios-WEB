import { BarChart3 } from "lucide-react";
import { cn } from "@/services/utils";
import type { EventoPartida, JogadorPartida } from "@/services/api/interfaces";

interface StatRow {
  jogadorId: string;
  nome: string;
  numero?: number;
  saques: number;
  ataques: number;
  bloqueios: number;
  erros: number;
  total: number;
}

interface Props {
  eventos: EventoPartida[]; // todos os eventos da partida (não só do set ativo)
  jogadores: JogadorPartida[]; // elenco completo do time nesta partida
  nomeTime: string;
  cor: "emerald" | "orange";
}

export function EstatisticasTime({ eventos, jogadores, nomeTime, cor }: Props) {
  const statsMap = new Map<string, StatRow>();

  jogadores.forEach((j) => {
    statsMap.set(j.jogadorId, {
      jogadorId: j.jogadorId,
      nome: j.nomeJogador,
      numero: j.numeroCamisa,
      saques: 0,
      ataques: 0,
      bloqueios: 0,
      erros: 0,
      total: 0,
    });
  });

  eventos
    .filter((e) => !e.anulado && e.jogadorId)
    .forEach((ev) => {
      const row = statsMap.get(ev.jogadorId!);
      if (!row) return; // jogador não pertence a este time

      if (ev.tipo === "SAQUE") {
        row.saques++;
        row.total++;
      } else if (ev.tipo === "ATAQUE") {
        row.ataques++;
        row.total++;
      } else if (ev.tipo === "BLOQUEIO") {
        row.bloqueios++;
        row.total++;
      } else if (ev.tipo === "ERRO_ADVERSARIO" || ev.tipo === "CARTAO_ADVERSARIO") {
        row.erros++;
      }
    });

  const rows = Array.from(statsMap.values()).sort((a, b) => b.total - a.total);
  const accent = cor === "emerald" ? "text-emerald-700" : "text-orange-600";
  const headBg = cor === "emerald" ? "bg-emerald-50" : "bg-orange-50";

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-gray-400" />
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
          Estatísticas — {nomeTime}
        </h3>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className={cn("border-b border-gray-200", headBg)}>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase text-[10px]">Jogador</th>
              <th className="text-center px-2 py-2 font-bold text-gray-500 uppercase text-[10px]">Saque</th>
              <th className="text-center px-2 py-2 font-bold text-gray-500 uppercase text-[10px]">Ataque</th>
              <th className="text-center px-2 py-2 font-bold text-gray-500 uppercase text-[10px]">Bloq.</th>
              <th className="text-center px-2 py-2 font-bold text-gray-500 uppercase text-[10px]">Erros</th>
              <th className="text-center px-2 py-2 font-bold text-gray-500 uppercase text-[10px]">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.jogadorId} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-3 py-2 font-semibold text-gray-700 truncate max-w-[140px]">
                  #{r.numero ?? "–"} {r.nome}
                </td>
                <td className="text-center px-2 py-2 text-gray-600">{r.saques}</td>
                <td className="text-center px-2 py-2 text-gray-600">{r.ataques}</td>
                <td className="text-center px-2 py-2 text-gray-600">{r.bloqueios}</td>
                <td className="text-center px-2 py-2 text-red-500">{r.erros}</td>
                <td className={cn("text-center px-2 py-2 font-black", accent)}>{r.total}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  Sem dados registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}