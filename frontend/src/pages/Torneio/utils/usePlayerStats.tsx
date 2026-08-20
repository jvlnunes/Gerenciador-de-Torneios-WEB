import { useEffect, useState } from "react";
import api from "@/services/api";

export interface PlayerStat {
  jogadorId: string;
  nomeJogador: string;
  timeId: string;
  nomeTime: string;
  saques: number;
  ataques: number;
  bloqueios: number;
  erroSaque: number;
  erroAtaque: number;
  outrosErros: number;
  totalPontos: number;
  totalErros: number;
  eficiencia: number;
  logoTime?: string | null;
}

export interface TimeResumo {
  id: string;
  nome: string;
}

export function usePlayerStats(torneioId: string) {
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [times, setTimes] = useState<TimeResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function load() {
      setLoading(true);
      const [partidas, ts] = await Promise.all([
        api.partidas.listarPorTorneio(torneioId),
        api.times.listarPorTorneio(torneioId),
      ]);
      if (cancelado) return;

      setTimes(ts.map((t) => ({ id: t.id, nome: t.nome })));
      const timeNomeMap = new Map(ts.map((t) => [t.id, t.nome]));
      const timeLogoMap = new Map(ts.map((t) => [t.id, t.logoUrl]));

      const eventosByPartida = await Promise.all(
        partidas
          .filter((p) => p.status === "FINALIZADA" || p.status === "AO_VIVO")
          .map((p) => api.partidas.listarEventos(p.id).then((evs) => ({ partida: p, evs })))
      );
      if (cancelado) return;

      const playerMap = new Map<string, PlayerStat>();

      eventosByPartida.forEach(({ partida, evs }) => {
        evs.filter((e) => !e.anulado).forEach((ev) => {
          if (!ev.jogadorId || !ev.jogadorNome) return;

          const key = ev.jogadorId;
          if (!playerMap.has(key)) {
            const timeId = ev.lado === "CASA" ? partida.timeCasaId : partida.timeVisitanteId;
            playerMap.set(key, {
              jogadorId: ev.jogadorId,
              nomeJogador: ev.jogadorNome,
              timeId,
              nomeTime: timeNomeMap.get(timeId) ?? "Desconhecido",
              saques: 0, ataques: 0, bloqueios: 0,
              erroSaque: 0, erroAtaque: 0, outrosErros: 0,
              totalPontos: 0, totalErros: 0, eficiencia: 0,
              logoTime: timeLogoMap.get(timeId) ?? null,
            });
          }

          const s = playerMap.get(key)!;
          if (ev.tipo === "SAQUE") s.saques++;
          else if (ev.tipo === "ATAQUE") s.ataques++;
          else if (ev.tipo === "BLOQUEIO") s.bloqueios++;
          else if (ev.tipo === "ERRO_ADVERSARIO") {
            if (ev.tipoErro === "ERRO_SAQUE") s.erroSaque++;
            else s.outrosErros++;
          }

          s.totalPontos = s.saques + s.ataques + s.bloqueios;
          s.totalErros = s.erroSaque + s.erroAtaque + s.outrosErros;
          const tentativas = s.totalPontos + s.totalErros;
          s.eficiencia = tentativas > 0 ? Math.round((s.totalPontos / tentativas) * 100) : 0;
        });
      });

      setStats(Array.from(playerMap.values()));
      setLoading(false);
    }

    load();
    return () => { cancelado = true; };
  }, [torneioId]);

  return { stats, times, loading };
}