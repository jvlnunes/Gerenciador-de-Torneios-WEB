import type { Partida } from "@/services/api/interfaces";
import api from "@/services/api";

interface ResultadoComumEvento {
  partidaAtualizada: Partida;
  fimSet: boolean;
  vencedorSet: "CASA" | "VISITANTE" | null;
  fimPartida: boolean;
  vencedorPartida: "CASA" | "VISITANTE" | null;
  novoSetsCasa: number;
  novoSetsVisitante: number;
}

interface TratarResultadoArgs {
  resultado: ResultadoComumEvento;
  partidaId: string;
  setAlerta: (a: { msg: string; onOk: () => void | Promise<void> } | null) => void;
  setTimerOn: (v: boolean) => void;
  setSetStarted: (v: boolean) => void;
  setTimerSecs: (v: number) => void;
  recarregarTudo: () => Promise<unknown>;
  abrirModalEscalacao: () => void;
  marcarModalAbertoParaSet: (indiceSet: number) => void;
}

export function tratarResultadoEvento({
  resultado,
  partidaId,
  setAlerta,
  setTimerOn,
  setSetStarted,
  setTimerSecs,
  recarregarTudo,
  abrirModalEscalacao,
  marcarModalAbertoParaSet,
}: TratarResultadoArgs) {
  const { partidaAtualizada, fimSet, vencedorSet, fimPartida, vencedorPartida, novoSetsCasa, novoSetsVisitante } = resultado;

  if (fimPartida && vencedorPartida) {
    const nomeVencedor = vencedorPartida === "CASA" ? partidaAtualizada.nomeTimeCasa : partidaAtualizada.nomeTimeVisitante;
    setTimerOn(false);
    setAlerta({
      msg: `🏆 ${nomeVencedor} venceu a partida! Encerrar agora?`,
      onOk: async () => {
        await api.partidas.atualizarPartida(partidaId, {
          setsCasa: novoSetsCasa, setsVisitante: novoSetsVisitante,
          setAtualCasa: 0, setAtualVisitante: 0,
        });
        await api.partidas.finalizarPartida(partidaId);
        await recarregarTudo();
        setAlerta(null);
      },
    });
    return;
  }

  if (fimSet && vencedorSet) {
    const nomeVencedor = vencedorSet === "CASA" ? partidaAtualizada.nomeTimeCasa : partidaAtualizada.nomeTimeVisitante;
    setTimerOn(false);
    setAlerta({
      msg: `✅ ${nomeVencedor} venceu o set! Iniciar próximo set?`,
      onOk: async () => {
        await api.partidas.atualizarPartida(partidaId, {
          setsCasa: novoSetsCasa, setsVisitante: novoSetsVisitante,
          setAtualCasa: 0, setAtualVisitante: 0,
        });
        await recarregarTudo();
        setAlerta(null);
        setSetStarted(false);
        setTimerSecs(0);
        const proximoSet = novoSetsCasa + novoSetsVisitante;
        marcarModalAbertoParaSet(proximoSet);
        abrirModalEscalacao();
      },
    });
  }
}