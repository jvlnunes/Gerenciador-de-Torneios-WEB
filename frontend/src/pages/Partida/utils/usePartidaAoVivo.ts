import { useCallback, useState } from "react";
import api from "@/services/api";
import { Partida, EventoPartida, JogadorPartida, Torneio } from "@/services/api/interfaces";
import type { LadoPonto, TipoErro, TipoCartao } from "@/services/api/types";
import { ActionDef } from "./LogicaPartida";
import { registrarPonto, registrarCartao } from "./eventosPartida";

interface QuadraCtx {
  jCasaQuadra: JogadorPartida[];
  jVisQuadra: JogadorPartida[];
  sacadorAtual: LadoPonto;
}

export function usePartidaAoVivo(partidaId: string | undefined) {
  const [partida, setPartida] = useState<Partida | null>(null);
  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [eventos, setEventos] = useState<EventoPartida[]>([]);
  const [jogadores, setJogadores] = useState<JogadorPartida[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!partidaId) return null;
    const [p, evs, jgs] = await Promise.all([
      api.partidas.buscar(partidaId),
      api.partidas.listarEventos(partidaId),
      api.partidas.listarJogadoresRelacionados(partidaId),
    ]);
    setPartida(p);
    setEventos(evs);
    setJogadores(jgs);

    const t = await api.torneios.buscarTorneio(p.torneioId);
    setTorneio(t);
    setLoading(false);

    return { partida: p, eventos: evs, jogadores: jgs };
  }, [partidaId]);

  const executarRegistro = useCallback(
    async (
      ctx: QuadraCtx,
      acao: ActionDef,
      lado: LadoPonto,
      jogadorId?: string,
      tipoErro?: TipoErro,
    ) => {
      if (!partida || !partidaId) return null;
      const resultado = await registrarPonto(
        { partida, partidaId, jogadores, ...ctx },
        acao,
        lado,
        jogadorId,
        tipoErro,
      );
      setPartida(resultado.partidaAtualizada);
      return resultado;
    },
    [partida, partidaId, jogadores],
  );

  const executarCartao = useCallback(
    async (
      ctx: QuadraCtx,
      jogadorId: string,
      tipoCartao: TipoCartao,
      ladoPenalizado: LadoPonto,
    ) => {
      if (!partida || !partidaId) return null;
      const resultado = await registrarCartao(
        { partida, partidaId, jogadores, ...ctx },
        jogadorId,
        tipoCartao,
        ladoPenalizado,
      );
      setPartida(resultado.partidaAtualizada);
      return resultado;
    },
    [partida, partidaId, jogadores],
  );

  return {
    partida,
    setPartida,
    torneio,
    eventos,
    jogadores,
    loading,
    load,
    executarRegistro,
    executarCartao,
  };
}