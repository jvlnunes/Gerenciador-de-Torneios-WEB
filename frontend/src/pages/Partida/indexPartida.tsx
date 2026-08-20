import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { Loader2, Activity, BarChart3 } from "lucide-react";
import { cn } from "@/services/utils";

import { ActionDef, ladoOposto } from "./utils/LogicaPartida";
import { usePartidaAoVivo } from "./utils/usePartidaAoVivo";
import { useEscalacao } from "./utils/useEscalacao";
import { usePartidaCalculos } from "./utils/usePartidaCalculos";
import { tratarResultadoEvento } from "./utils/tratarResultadoEvento";
import type { EscalacaoSet } from "./components/Escalacao";

import { PlacarHeader } from "./components/PlacarHeader";
import { BarraRegras } from "./components/BarraRegras";
import { SetSelector } from "./components/SetSelector";
import { Quadra } from "./components/Quadra";
import { PainelBanco } from "./components/PainelBanco";
import { PainelAcaoJogador, type EscolhaAcao } from "./components/PainelAcaoJogador";
import { ResumoPartidaFinalizada } from "./components/ResumoPartidaFinalizada";
import { PartidaModals, type AlertaConfirmacao } from "./components/PartidaModals";

import { ModalEncerrarPartida } from "./modals/ModalEncerrarPartida";
import { ModalHistoricoPontos } from "./modals/ModalHistoricoPontos";
import { ModalEstatisticas, type AbaEstatisticas } from "./modals/ModalEstatisticas";

import type { TipoErro, LadoPonto, TipoCartao } from "@/services/api/types";
import { JogadorPartida } from "@/services/api/interfaces";
import api from "@/services/api";

export default function PartidaLivePage() {
  const { id: partidaId } = useParams();
  const { user } = useAuth();

  const {
    partida, setPartida, torneio, eventos, jogadores, loading,
    load, executarRegistro, executarCartao,
  } = usePartidaAoVivo(partidaId);

  const [setAtivo, setSetAtivo] = useState(0);

  const [setStarted, setSetStarted] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [jogadorSelecionado, setJogadorSelecionado] = useState<{
    jogador: JogadorPartida;
    lado: LadoPonto;
  } | null>(null);

  const [historicoModalAberto, setHistoricoModalAberto] = useState(false);
  const [modalEncerrarAberto, setModalEncerrarAberto] = useState(false);
  const [estatisticasModalAberto, setEstatisticasModalAberto] = useState(false);
  const [abaEstatisticas, setAbaEstatisticas] = useState<AbaEstatisticas>("time");
  const [statSetSelecionado, setStatSetSelecionado] = useState<number | "geral">("geral");

  const [modalCartao, setModalCartao] = useState<LadoPonto | null>(null);
  const [alerta, setAlerta] = useState<AlertaConfirmacao | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [showConfig, setShowConfig] = useState(false);
  const [configTimer, setConfigTimer] = useState(true);
  const [configAutoSaque, setConfigAutoSaque] = useState(true);

  const modalJaAbertoPorSet = useRef<Set<number>>(new Set());

  const handleEncerrarPartida = async (vencedor: LadoPonto | null) => {
    if (!partida || !partidaId) return;

    try {
      let setsCasa = partida.setsCasa;
      let setsVisitante = partida.setsVisitante;

      if (vencedor === "CASA" && setsCasa <= setsVisitante) {
        setsCasa = setsVisitante + 1;
      } else if (vencedor === "VISITANTE" && setsVisitante <= setsCasa) {
        setsVisitante = setsCasa + 1;
      }

      if (setsCasa !== partida.setsCasa || setsVisitante !== partida.setsVisitante) {
        await api.partidas.atualizarPartida(partidaId, { setsCasa, setsVisitante });
      }

      await api.partidas.finalizarPartida(partidaId);
      setTimerOn(false);
      await recarregarTudo();
    } catch (e) {
      console.error("Erro ao encerrar partida:", e);
      alert((e as Error).message || "Erro ao encerrar a partida.");
    } finally {
      setModalEncerrarAberto(false);
    }
  };

  const {
    modalEscalacaoAberto, abrirModalEscalacao, fecharModalEscalacao, confirmarEscalacao,
    modalSubAberto, timeSubId, abrirModalSubstituicao, fecharModalSubstituicao, confirmarSubstituicao,
    obterTitularesAtuais, obterBancoAtual, obterSubstituicoesDoSet, obterTodasSubstituicoesDoSet, obterEscalacao,
    obterQuadraAtual, obterSacadorInicial, recarregar,
  } = useEscalacao(partidaId, setAtivo, partida?.timeCasaId);

  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setTimerSecs((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerOn]);

  useEffect(() => {
    if (partida?.timeCasaId) recarregar();
    async function init() {
      const dados = await load();
      if (!dados) return;
      const { partida: p, eventos: evs } = dados;

      const indexSetAtual = p.setsCasa + p.setsVisitante;
      const setInicial = p.status === "FINALIZADA" ? Math.max(indexSetAtual - 1, 0) : indexSetAtual;
      setSetAtivo(setInicial);

      const pontosNesteSet = evs.filter((e) => e.indiceSet === indexSetAtual && !e.anulado).length;

      if (p.status === "AO_VIVO") {
        if (pontosNesteSet > 0) {
          setSetStarted(true);
        } else if (!modalJaAbertoPorSet.current.has(indexSetAtual)) {
          setSetStarted(false);
          modalJaAbertoPorSet.current.add(indexSetAtual);
          abrirModalEscalacao();
        }
      }

      await recarregar();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partida?.timeCasaId]);

  const recarregarTudo = async () => {
    const dados = await load();
    await recarregar();
    return dados;
  };

  const handleConfirmarEscalacao = async (escalacao: EscalacaoSet) => {
    await confirmarEscalacao(escalacao);

    if (partida && partida.status !== "AO_VIVO") {
      await api.partidas.atualizarPartida(partidaId!, { status: "AO_VIVO" });
      const partidaAtualizada = await api.partidas.buscar(partidaId!); // busca formatada
      setPartida(partidaAtualizada);
    }

    setSetStarted(true);
    setTimerSecs(0);
    setTimerOn(true);
  };

  const registrarAcao = async (
    acaoParaRegistrar: ActionDef,
    ladoAcao: LadoPonto,
    jogadorId?: string,
    tipoErro?: TipoErro,
  ) => {
    if (!partida || !partidaId || salvando) return;
    setSalvando(true);
    try {
      const resultado = await executarRegistro(
        { jCasaQuadra, jVisQuadra, sacadorAtual },
        acaoParaRegistrar,
        ladoAcao,
        jogadorId,
        tipoErro,
      );
      if (!resultado) return;
      await recarregarTudo();

      tratarResultadoEvento({
        resultado,
        partidaId,
        setAlerta,
        setTimerOn,
        setSetStarted,
        setTimerSecs,
        recarregarTudo,
        abrirModalEscalacao,
        marcarModalAbertoParaSet: (indice) => modalJaAbertoPorSet.current.add(indice),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
      setJogadorSelecionado(null);
    }
  };

  const aplicarCartao = async (jogadorId: string, tipoCartao: TipoCartao, ladoPenalizadoParam: LadoPonto) => {
    if (!partida || !partidaId || salvando) return;
    setSalvando(true);
    try {
      const resultado = await executarCartao(
        { jCasaQuadra, jVisQuadra, sacadorAtual },
        jogadorId,
        tipoCartao,
        ladoPenalizadoParam,
      );
      if (!resultado) return;
      await recarregarTudo();

      if (resultado.daPonto) {
        tratarResultadoEvento({
          resultado,
          partidaId,
          setAlerta,
          setTimerOn,
          setSetStarted,
          setTimerSecs,
          recarregarTudo,
          abrirModalEscalacao,
          marcarModalAbertoParaSet: (indice) => modalJaAbertoPorSet.current.add(indice),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
      setModalCartao(null);
      setJogadorSelecionado(null);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!partida) return (
    <div className="p-10 text-center text-muted-foreground bg-background h-screen">
      Partida não encontrada
    </div>
  );

  const podeGerenciar = torneio ? api.torneios.podeGerenciarTorneio(torneio, user) : false;

  const {
    isAoVivo, isFinalizada, isAgendada,
    titularesCasaList, titularesVisList,
    reservasCasaAtivos, reservasVisAtivos,
    jogadoresInativos, casaTemAmarelo, visTemAmarelo,
    totalSetsJogados, resultadosSets,
    jogadoresCasaTodos, jogadoresVisTodos,
    evSetAtivo, rotCasa, rotVisit,
    jCasaQuadra, jVisQuadra, sacadorAtual,
    setEmExibicaoEhDecisivo, pontosDoSetEmExibicao,
  } = usePartidaCalculos({
    partida, eventos, jogadores, setAtivo,
    obterTitularesAtuais, obterBancoAtual, obterQuadraAtual, obterSacadorInicial,
  });

  const setAtivoParaHistorico = typeof statSetSelecionado === "number" ? statSetSelecionado : null;

  const eventosHistoricoFinalizada = setAtivoParaHistorico !== null
    ? eventos.filter((e) => !e.anulado && e.indiceSet === setAtivoParaHistorico)
    : eventos.filter((e) => !e.anulado);

  const substituicoesHistoricoFinalizada = setAtivoParaHistorico !== null
    ? obterTodasSubstituicoesDoSet(setAtivoParaHistorico)
    : Array.from({ length: totalSetsJogados }, (_, i) => obterTodasSubstituicoesDoSet(i)).flat();

  const eventosParaStatsJogador = statSetSelecionado === "geral"
    ? eventos
    : eventos.filter((e) => e.indiceSet === statSetSelecionado);

  const podeClicarQuadra = podeGerenciar && isAoVivo && setStarted;

  const leftColOverflowClass = isFinalizada
    ? "overflow-y-auto"
    : "overflow-y-auto lg:overflow-hidden";

  const handleJogadorClick = (jogador: JogadorPartida, lado: LadoPonto) => {
    if (!podeClicarQuadra) return;
    if (jogadoresInativos.has(jogador.jogadorId)) return;
    setJogadorSelecionado({ jogador, lado });
  };

  const handleEscolherAcao = (escolha: EscolhaAcao) => {
    if (!jogadorSelecionado) return;
    const { jogador, lado } = jogadorSelecionado;

    if (escolha.kind === "cartao") {
      setModalCartao(null);
      aplicarCartao(jogador.jogadorId, escolha.tipoCartao, lado);
      return;
    }

    if (escolha.kind === "erro") {
      const ladoQuePontua = ladoOposto(lado);

      if (escolha.tipoErro === "ERRO_SAQUE" && sacadorAtual !== lado) {
        setAlerta({
          msg: `${jogador.nomeJogador} não está sacando no momento. Registrar o erro mesmo assim?`,
          onOk: () => {
            setAlerta(null);
            registrarAcao(
              { type: "ERRO_ADVERSARIO", label: "Erro", emoji: "❌" },
              ladoQuePontua,
              jogador.jogadorId,
              escolha.tipoErro,
            );
          },
        });
        return;
      }

      registrarAcao(
        { type: "ERRO_ADVERSARIO", label: "Erro", emoji: "❌" },
        ladoQuePontua,
        jogador.jogadorId,
        escolha.tipoErro,
      );
      return;
    }

    if (escolha.acao.type === "SAQUE" && configAutoSaque && sacadorAtual !== lado) {
      setAlerta({
        msg: `${jogador.nomeJogador} não está sacando no momento. Registrar o ace mesmo assim?`,
        onOk: () => {
          setAlerta(null);
          registrarAcao(escolha.acao, lado, jogador.jogadorId);
        },
      });
      return;
    }

    registrarAcao(escolha.acao, lado, jogador.jogadorId);
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">

      <PartidaModals
        acao={{
          modal: null,
          partida: partida!,
          jogadores,
          sacadorAtual: sacadorAtual || "CASA",
          onRegistrar: registrarAcao,
          onClose: () => { },
        }}
        config={{
          aberto: showConfig,
          configTimer,
          setConfigTimer,
          configAutoSaque,
          setConfigAutoSaque,
          onClose: () => setShowConfig(false),
        }}
        cartao={{
          lado: modalCartao,
          partida,
          jogadoresDoLado: (lado) =>
            lado === "CASA"
              ? titularesCasaList.filter((j) => !jogadoresInativos.has(j.jogadorId))
              : titularesVisList.filter((j) => !jogadoresInativos.has(j.jogadorId)),
          timeJaTemAmarelo: (lado) => (lado === "CASA" ? casaTemAmarelo : visTemAmarelo),
          onRegistrar: (id, tipoCartao, lado) => aplicarCartao(id, tipoCartao, lado),
          onClose: () => setModalCartao(null),
        }}
        alerta={{
          alerta: alerta ? { msg: alerta.msg, onOk: alerta.onOk || (() => { }) } : null,
          onCancelar: () => setAlerta(null),
        }}
        escalacao={{
          aberto: modalEscalacaoAberto,
          indiceSet: setAtivo,
          partida,
          jogadores,
          escalacaoAnterior: setAtivo > 0 ? obterEscalacao(setAtivo - 1) : undefined,
          aoConfirmar: handleConfirmarEscalacao,
          aoFechar: fecharModalEscalacao,
        }}
        substituicao={{
          aberto: modalSubAberto,
          timeSubId,
          indiceSet: setAtivo,
          partida,
          titularesCasaList,
          titularesVisList,
          reservasCasaAtivos,
          reservasVisAtivos,
          obterSubstituicoesDoSet,
          aoConfirmar: confirmarSubstituicao,
          aoFechar: fecharModalSubstituicao,
          rotCasa,
          rotVisit,
        }}
      />

      <div className="max-w-[1400px] lg:w-[90vw] mx-auto flex flex-col flex-1 overflow-hidden bg-card rounded-none lg:rounded-3xl shadow-xl border-x lg:border border-border lg:my-4">

        <PlacarHeader
          partida={partida}
          isAoVivo={isAoVivo}
          isFinalizada={isFinalizada}
          isAgendada={isAgendada}
          setStarted={setStarted}
          sacadorAtual={sacadorAtual}
          podeGerenciar={podeGerenciar}
          resultadosSets={resultadosSets}
          onIniciarPartida={async () => {
            try {
              await api.partidas.comecaPartida(partidaId!);
              const p = await api.partidas.buscar(partidaId!); // busca formatada, com nomes/logos
              setPartida(p);
              setSetStarted(false);
              modalJaAbertoPorSet.current.add(0);
              abrirModalEscalacao();
            } catch (e) {
              console.error("Erro ao iniciar partida:", e);
              alert((e as Error).message || "Erro ao iniciar a partida.");
            }
          }}
          onIniciarSet={() => abrirModalEscalacao()}
          onAnularPonto={() => {
            setAlerta({
              msg: "Anular último ponto/ação?",
              onOk: async () => {
                try {
                  await api.partidas.anularUltimoEvento(partidaId!);
                  await recarregarTudo();
                } catch (e) {
                  console.error(e);
                } finally {
                  setAlerta(null);
                }
              },
            });
          }}
          onEncerrarPartida={() => setModalEncerrarAberto(true)}
          onOpenConfig={() => setShowConfig(true)}
          statSetSelecionado={statSetSelecionado}
          onSelecionarStatSet={setStatSetSelecionado}
        />

        <BarraRegras
          setsParaVencerPartida={partida.setsParaVencerPartida ?? 3}
          pontosDoSetEmExibicao={pontosDoSetEmExibicao}
          setEmExibicaoEhDecisivo={setEmExibicaoEhDecisivo}
          titularesPorTime={partida.titularesPorTime ?? 6}
          mostrarTimer={configTimer && isAoVivo && setStarted}
          timerOn={timerOn}
          timerSecs={timerSecs}
          onToggleTimer={() => setTimerOn((v) => !v)}
        />

        <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">

          <div className={cn("flex-1 flex flex-col", leftColOverflowClass)}>
            <div className="order-2 lg:order-none p-4 border-b border-border bg-card shadow-sm z-10 shrink-0">
              {!isFinalizada ? (
                <>
                  <Quadra
                    jCasa={jCasaQuadra}
                    jVisit={jVisQuadra}
                    sacador={sacadorAtual}
                    podeClicar={podeClicarQuadra}
                    jogadorSelecionadoId={jogadorSelecionado?.jogador.jogadorId}
                    onJogadorClick={handleJogadorClick}
                  />
                  <SetSelector
                    totalSets={(partida.setsParaVencerPartida ?? 3) * 2 - 1}
                    setsJogados={partida.sets ?? []}
                    setAtual={partida.setsCasa + partida.setsVisitante}
                    setSelecionado={setAtivo}
                    onSelecionar={setSetAtivo}
                  />
                </>
              ) : (
                <ResumoPartidaFinalizada
                  partida={partida}
                  eventos={eventos}
                  eventosParaStatsJogador={eventosParaStatsJogador}
                  jogadoresCasaTodos={jogadoresCasaTodos}
                  jogadoresVisTodos={jogadoresVisTodos}
                  statSetSelecionado={statSetSelecionado}
                  setAtivoParaHistorico={setAtivoParaHistorico}
                  onAbrirHistorico={() => setHistoricoModalAberto(true)}
                />
              )}
            </div>

            {podeGerenciar && isAoVivo && setStarted && jogadorSelecionado && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
                <div className="bg-card w-full rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-200">
                  <PainelAcaoJogador
                    jogador={jogadorSelecionado.jogador}
                    lado={jogadorSelecionado.lado}
                    nomeTime={jogadorSelecionado.lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante}
                    timeJaTemAmarelo={jogadorSelecionado.lado === "CASA" ? casaTemAmarelo : visTemAmarelo}
                    onEscolher={handleEscolherAcao}
                    onLimparSelecao={() => setJogadorSelecionado(null)}
                  />
                </div>
              </div>
            )}

            {isAoVivo && (
              <div className="order-1 lg:order-none grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-3 border-b border-border shrink-0">
                <PainelBanco
                  cor="emerald"
                  nomeTime={partida.nomeTimeCasa}
                  canManage={podeGerenciar && isAoVivo && setStarted}
                  onSub={() => abrirModalSubstituicao(partida.timeCasaId)}
                  titulares={[]}
                  reservas={[]}
                />
                <PainelBanco
                  cor="orange"
                  nomeTime={partida.nomeTimeVisitante}
                  canManage={podeGerenciar && isAoVivo && setStarted}
                  onSub={() => abrirModalSubstituicao(partida.timeVisitanteId)}
                  titulares={[]}
                  reservas={[]}
                />
              </div>
            )}

            {!isFinalizada && (
              <div className="order-4 border-t border-border px-4 py-3 shrink-0 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setHistoricoModalAberto(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <Activity className="h-3.5 w-3.5" />
                  Histórico ({evSetAtivo.length})
                </button>
                <button
                  onClick={() => setEstatisticasModalAberto(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Estatísticas
                </button>
              </div>
            )}

            {historicoModalAberto && (
              <ModalHistoricoPontos
                eventos={isFinalizada ? eventosHistoricoFinalizada : evSetAtivo}
                substituicoes={isFinalizada ? substituicoesHistoricoFinalizada : obterTodasSubstituicoesDoSet(setAtivo)}
                partida={partida}
                setStarted={setStarted}
                isFinalizada={isFinalizada}
                setAtivoParaHistorico={setAtivoParaHistorico}
                onClose={() => setHistoricoModalAberto(false)}
              />
            )}

            {!isFinalizada && estatisticasModalAberto && (
              <ModalEstatisticas
                eventos={eventos}
                partida={partida}
                setAtivo={setAtivo}
                aba={abaEstatisticas}
                onMudarAba={setAbaEstatisticas}
                jogadoresCasaTodos={jogadoresCasaTodos}
                jogadoresVisTodos={jogadoresVisTodos}
                onClose={() => setEstatisticasModalAberto(false)}
              />
            )}
          </div>

          {modalEncerrarAberto && (
            <ModalEncerrarPartida
              partida={partida}
              onConfirmar={handleEncerrarPartida}
              onFechar={() => setModalEncerrarAberto(false)}
            />
          )}

          {podeGerenciar && isAoVivo && setStarted && (
            <div className="hidden lg:flex lg:w-[320px] shrink-0 p-4 border-l border-border bg-muted/30 flex-col">
              <PainelAcaoJogador
                jogador={jogadorSelecionado?.jogador ?? null}
                lado={jogadorSelecionado?.lado ?? null}
                nomeTime={
                  jogadorSelecionado?.lado === "CASA"
                    ? partida.nomeTimeCasa
                    : jogadorSelecionado?.lado === "VISITANTE"
                      ? partida.nomeTimeVisitante
                      : undefined
                }
                timeJaTemAmarelo={
                  jogadorSelecionado?.lado === "CASA"
                    ? casaTemAmarelo
                    : jogadorSelecionado?.lado === "VISITANTE"
                      ? visTemAmarelo
                      : undefined
                }
                onEscolher={handleEscolherAcao}
                onLimparSelecao={() => setJogadorSelecionado(null)}
              />
            </div>
          )}

          {isAgendada && (
            <div className="flex-1 flex items-center justify-center p-10 text-sm text-muted-foreground">
              A partida ainda não começou.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}