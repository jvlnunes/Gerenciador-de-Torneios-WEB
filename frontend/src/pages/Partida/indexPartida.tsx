import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { Loader2, Trophy, Target, Users, BarChart3, ChevronDown, Activity } from "lucide-react";
import { cn } from "@/services/utils";

import { ActionDef, ladoOposto } from "./utils/LogicaPartida";
import { usePartidaAoVivo } from "./utils/usePartidaAoVivo";
import { useEscalacao } from "./utils/useEscalacao";
import { jogadoresExpulsosNoSet, jogadoresDesqualificados, timeTemAmareloNoSet } from "./utils/cartoes";
import type { EscalacaoSet } from "./components/Escalacao";

import { PlacarHeader } from "./components/PlacarHeader";
import { SetTimer } from "./components/Timer";
import { Quadra } from "./components/Quadra";
import { HistoricoSet } from "./components/HistoricoSet";
import { PainelBanco } from "./components/PainelBanco";
import { PainelAcaoJogador, type EscolhaAcao } from "./components/PainelAcaoJogador";
import { EstatisticasTime } from "./components/EstatisticasTime";
import { PartidaModals, type AlertaConfirmacao } from "./components/PartidaModals";

import type { TipoErro, LadoPonto, TipoCartao } from "@/services/api/types";
import { JogadorPartida, Partida } from "@/services/api/interfaces";
import api  from "@/services/api";

export default function PartidaLivePage() {
  const { id: partidaId } = useParams();
  const { user } = useAuth();

  /* ── Estado principal (via hook) ──────────────────────────── */
  const {
    partida, setPartida, torneio, eventos, jogadores, loading,
    load, executarRegistro, executarCartao,
  } = usePartidaAoVivo(partidaId);

  const [setAtivo, setSetAtivo] = useState(0);

  /* ── Timer do set ─────────────────────────────────────────── */
  const [setStarted, setSetStarted] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Seleção de jogador + painel de ação ──────────────────── */
  const [jogadorSelecionado, setJogadorSelecionado] = useState<{
    jogador: JogadorPartida;
    lado: LadoPonto;
  } | null>(null);

  const [painelAcaoAberto, setPainelAcaoAberto] = useState(false);
  const [historicoModalAberto, setHistoricoModalAberto] = useState(false);
  const [estatisticasModalAberto, setEstatisticasModalAberto] = useState(false); // NOVO

  /* ── Modais e Configurações ───────────────────────────────── */
  const [modalCartao, setModalCartao] = useState<LadoPonto | null>(null);
  const [alerta, setAlerta] = useState<AlertaConfirmacao | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [showConfig, setShowConfig] = useState(false);
  const [configTimer, setConfigTimer] = useState(true);
  const [configAutoSaque, setConfigAutoSaque] = useState(true);

  const modalJaAbertoPorSet = useRef<Set<number>>(new Set());

  /* ── Hook de Escalação e Substituições ────────────────────── */
  const {
    modalEscalacaoAberto, abrirModalEscalacao, fecharModalEscalacao, confirmarEscalacao,
    modalSubAberto, timeSubId, abrirModalSubstituicao, fecharModalSubstituicao, confirmarSubstituicao,
    obterTitularesAtuais, obterBancoAtual, obterSubstituicoesDoSet, obterTodasSubstituicoesDoSet, obterEscalacao,
    obterJogadorPosicao1, obterQuadraAtual, obterSacadorInicial, recarregar, // + obterSacadorInicial
  } = useEscalacao(partidaId, setAtivo);

  /* ── Timer effect ─────────────────────────────────────────── */
  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setTimerSecs((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerOn]);

  /* ── Carregar dados ───────────────────────────────────────── */
  useEffect(() => {
    async function init() {
      const dados = await load();
      if (!dados) return;
      const { partida: p, eventos: evs } = dados;

      const indexSetAtual = p.setsCasa + p.setsVisitante;

      const setInicial =
        p.status === "FINALIZADA" ? Math.max(indexSetAtual - 1, 0) : indexSetAtual;

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
  }, [partidaId]);

  const recarregarTudo = async () => {
    const dados = await load();
    await recarregar();
    return dados;
  };

  /* ── Handlers de Escalação ────────────────────────────────── */
  const handleConfirmarEscalacao = async (escalacao: EscalacaoSet) => {
    await confirmarEscalacao(escalacao);
    setSetStarted(true);
    setTimerSecs(0);
    setTimerOn(true);
  };

  /* ── Registrar ponto (orquestra fim de set / fim de partida) ── */
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
      } else if (fimSet && vencedorSet) {
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
            modalJaAbertoPorSet.current.add(proximoSet);
            abrirModalEscalacao();
          },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
      setJogadorSelecionado(null);
    }
  };

  /* ── Registrar cartão ─────────────────────────────────────── */
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

      const { partidaAtualizada, daPonto, fimSet, vencedorSet, fimPartida, vencedorPartida, novoSetsCasa, novoSetsVisitante } = resultado;

      if (daPonto) {
        if (fimPartida && vencedorPartida) {
          const nomeVencedor = vencedorPartida === "CASA" ? partidaAtualizada.nomeTimeCasa : partidaAtualizada.nomeTimeVisitante;
          setTimerOn(false);
          setAlerta({
            msg: `🏆 ${nomeVencedor} venceu a partida! Encerrar agora?`,
            onOk: async () => {
              await api.partidas.finalizarPartida(partidaId);
              await recarregarTudo();
              setAlerta(null);
            },
          });
        } else if (fimSet && vencedorSet) {
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
              modalJaAbertoPorSet.current.add(proximoSet);
              abrirModalEscalacao();
            },
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
      setModalCartao(null);
      setJogadorSelecionado(null);
    }
  };

  /* ── Loading / not found ──────────────────────────────────── */
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );
  if (!partida) return (
    <div className="p-10 text-center text-gray-500 bg-gray-100 h-screen">
      Partida não encontrada
    </div>
  );

  /* ── Derivações ───────────────────────────────────────────── */
  const podeGerenciar = torneio ? api.torneios.podeGerenciarTorneio(torneio, user) : false;
  const isAoVivo = partida.status === "AO_VIVO";
  const isFinalizada = partida.status === "FINALIZADA";
  const isAgendada = partida.status === "AGENDADA" || partida.status === "AQUECIMENTO";

  const titularesCasaList = obterTitularesAtuais(partida.timeCasaId, setAtivo, jogadores);
  const titularesVisList = obterTitularesAtuais(partida.timeVisitanteId, setAtivo, jogadores);
  const bancoCasaList = obterBancoAtual(partida.timeCasaId, setAtivo, jogadores);
  const bancoVisList = obterBancoAtual(partida.timeVisitanteId, setAtivo, jogadores);

  // Cartões: jogadores fora de quadra por vermelho (no set) ou por 2º vermelho (partida toda)
  const jogadoresInativos = new Set([
    ...jogadoresExpulsosNoSet(eventos, setAtivo),
    ...jogadoresDesqualificados(eventos),
  ]);

  const casaTemAmarelo = timeTemAmareloNoSet(eventos, "CASA", setAtivo);
  const visTemAmarelo = timeTemAmareloNoSet(eventos, "VISITANTE", setAtivo);

  const reservasCasaAtivos = bancoCasaList.filter((j) => !jogadoresInativos.has(j.jogadorId));
  const reservasVisAtivos = bancoVisList.filter((j) => !jogadoresInativos.has(j.jogadorId));

  // Placar final por set (usado no header e para popular o resumo "Set N: X–Y")
  const totalSetsJogados = partida.setsCasa + partida.setsVisitante;
  const resultadosSets = isFinalizada
    ? Array.from({ length: totalSetsJogados }, (_, i) => {
      const evsDoSet = eventos.filter((e) => !e.anulado && e.indiceSet === i);
      if (evsDoSet.length === 0) return null;
      const ultimo = evsDoSet.reduce((acc, e) =>
        new Date(e.horario).getTime() > new Date(acc.horario).getTime() ? e : acc
      );
      return { casa: ultimo.placarCasa, visitante: ultimo.placarVisitante };
    }).filter((r): r is { casa: number; visitante: number } => r !== null)
    : [];

  // Elenco completo (titulares + reservas) de cada time nesta partida — usado nas
  // estatísticas pós-jogo, que substituem a quadra quando a partida está finalizada.
  const jogadoresCasaTodos = jogadores.filter((j) => j.timeId === partida.timeCasaId);
  const jogadoresVisTodos = jogadores.filter((j) => j.timeId === partida.timeVisitanteId);

  const evSetAtivo = eventos.filter((e) => !e.anulado && e.indiceSet === setAtivo).reverse();
  const eventosCron = [...evSetAtivo].reverse();

  // ── Cálculo do sacador e rotação ──────────────────────────
  let ladoSaque: LadoPonto = obterSacadorInicial(setAtivo);
  if (eventosCron.length > 0) {
    ladoSaque = eventosCron[eventosCron.length - 1].lado;
  }

  let rotCasa = 0, rotVisit = 0;
  let ladoAnterior: LadoPonto = obterSacadorInicial(setAtivo);
  for (const ev of eventosCron) {
    if (ev.lado !== ladoAnterior) {
      if (ev.lado === "CASA") rotCasa++;
      else rotVisit++;
    }
    ladoAnterior = ev.lado;
  }

  const jCasaQuadra = obterQuadraAtual(partida.timeCasaId, setAtivo, jogadores, rotCasa);
  const jVisQuadra = obterQuadraAtual(partida.timeVisitanteId, setAtivo, jogadores, rotVisit);

  const sacadorAtual: LadoPonto = ladoSaque;

  const sacadorCasaJogador = obterJogadorPosicao1(partida.timeCasaId, setAtivo, jogadores, rotCasa - 1);
  const sacadorVisJogador = obterJogadorPosicao1(partida.timeVisitanteId, setAtivo, jogadores, rotVisit - 1);

  const getSacadorAtualJogador = (lado: LadoPonto) =>
    lado === "CASA" ? sacadorCasaJogador : sacadorVisJogador;

  const podeClicarQuadra = podeGerenciar && isAoVivo && setStarted;

  /* ── Interceptador de clique no jogador (quadra) ──────────── */
  const handleJogadorClick = (jogador: JogadorPartida, lado: LadoPonto) => {
    if (!podeClicarQuadra) return;
    if (jogadoresInativos.has(jogador.jogadorId)) return;
    setJogadorSelecionado({ jogador, lado });
  };

  /* ── Interceptador de escolha de ação no painel lateral ───── */
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

      // Erro de saque só faz sentido se o jogador estava sacando no momento
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

    // Ponto positivo (saque/ataque/bloqueio)
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
    <div className="h-screen bg-gray-100 text-gray-900 flex flex-col font-sans overflow-hidden">

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

      {/* ── CONTAINER PRINCIPAL ── */}
      <div className="max-w-[1400px] lg:w-[90vw] mx-auto flex flex-col flex-1 overflow-hidden bg-white rounded-none lg:rounded-3xl shadow-xl border-x lg:border border-gray-200 lg:my-4">

        <PlacarHeader
          partida={partida}
          isAoVivo={isAoVivo}
          isFinalizada={isFinalizada}
          isAgendada={isAgendada}
          setStarted={setStarted}
          sacadorAtual={sacadorAtual}
          podeGerenciar={podeGerenciar}
          resultadosSets={resultadosSets}
          onIniciarPartida={() => {
            setAlerta({
              msg: "Iniciar a partida?",
              onOk: async () => {
                const p = await api.partidas.comecaPartida(partidaId!);
                setPartida(p);
                setSetStarted(false);
                modalJaAbertoPorSet.current.add(0);
                setAlerta(null);
                abrirModalEscalacao();
              },
            });
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
          onEncerrarPartida={() => {
            setAlerta({
              msg: "Encerrar partida permanentemente?",
              onOk: async () => {
                await api.partidas.finalizarPartida(partidaId!);
                setTimerOn(false);
                await recarregarTudo();
                setAlerta(null);
              },
            });
          }}
          onOpenConfig={() => setShowConfig(true)}
        />

        {/* Barra de regras */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-gray-500">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-emerald-500" />
              Sets p/ vencer: <span className="text-gray-900 font-black ml-1">{partida.setsParaVencerPartida ?? 3}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              Pts/set: <span className="text-gray-900 font-black ml-1">{partida.pontosParaVencerSet ?? 25}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              Titulares: <span className="text-gray-900 font-black ml-1">{partida.titularesPorTime ?? 6}</span>
            </span>
          </div>
          {configTimer && isAoVivo && setStarted && (
            <SetTimer running={timerOn} seconds={timerSecs} onToggle={() => setTimerOn((v) => !v)} />
          )}
        </div>

        <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">

          {/* Coluna esquerda: quadra (ou estatísticas, se finalizada) + histórico */}
          <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden">
            <div className="order-2 lg:order-none p-4 border-b border-gray-100 bg-white shadow-sm z-10 shrink-0">
              {!isFinalizada ? (
                <Quadra
                  jCasa={jCasaQuadra}
                  jVisit={jVisQuadra}
                  sacador={sacadorAtual}
                  podeClicar={podeClicarQuadra}
                  jogadorSelecionadoId={jogadorSelecionado?.jogador.jogadorId}
                  onJogadorClick={handleJogadorClick}
                />
              ) : (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Estatísticas da partida
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                    <EstatisticasTime
                      eventos={eventos}
                      jogadores={jogadoresCasaTodos}
                      nomeTime={partida.nomeTimeCasa}
                      cor="emerald"
                    />
                    <EstatisticasTime
                      eventos={eventos}
                      jogadores={jogadoresVisTodos}
                      nomeTime={partida.nomeTimeVisitante}
                      cor="orange"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-1 mt-3 flex-wrap">
                {Array.from(
                  { length: (partida.setsParaVencerPartida ?? 3) * 2 - 1 },
                  (_, i) => {
                    const set = (partida.sets ?? [])[i];
                    const isCurrent = i === partida.setsCasa + partida.setsVisitante;
                    const isDone = i < (partida.sets ?? []).length;
                    return (
                      <button
                        key={i}
                        onClick={() => setSetAtivo(i)}
                        className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold transition-all border",
                          setAtivo === i && "ring-2 ring-emerald-400 ring-offset-1 ring-offset-white",
                          isCurrent
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : isDone
                              ? "bg-gray-200 text-gray-700 border-gray-200"
                              : "bg-transparent text-gray-300 border-gray-200"
                        )}
                      >
                        S{i + 1}
                        {isDone && set && (
                          <span className="ml-1 opacity-60 font-normal">
                            {set.casa}–{set.visitante}
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Painel de ação — em telas < lg vira modal de foco, abre sozinho ao selecionar jogador */}
            {podeGerenciar && isAoVivo && setStarted && jogadorSelecionado && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
                <div className="bg-white w-full rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-200">
                  <PainelAcaoJogador
                    jogador={jogadorSelecionado.jogador}
                    lado={jogadorSelecionado.lado}
                    nomeTime={
                      jogadorSelecionado.lado === "CASA"
                        ? partida.nomeTimeCasa
                        : partida.nomeTimeVisitante
                    }
                    timeJaTemAmarelo={
                      jogadorSelecionado.lado === "CASA" ? casaTemAmarelo : visTemAmarelo
                    }
                    onEscolher={handleEscolherAcao}
                    onLimparSelecao={() => setJogadorSelecionado(null)}
                  />
                </div>
              </div>
            )}



            {/* Bancos */}
            {isAoVivo && (
              <div className="order-1 lg:order-none grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
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

            {/* Botões para abrir histórico e estatísticas em modal — padrão em todas as telas */}
            <div className="order-4 border-t border-gray-100 px-4 py-3 shrink-0 grid grid-cols-2 gap-2">
              <button
                onClick={() => setHistoricoModalAberto(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Activity className="h-3.5 w-3.5" />
                Histórico ({evSetAtivo.length})
              </button>
              <button
                onClick={() => setEstatisticasModalAberto(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Estatísticas
              </button>
            </div>

            {historicoModalAberto && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
                <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
                    <span className="text-sm font-black text-gray-800">Histórico do set</span>
                    <button
                      onClick={() => setHistoricoModalAberto(false)}
                      className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-lg"
                    >
                      ×
                    </button>
                  </div>
                  <HistoricoSet
                    eventos={evSetAtivo}
                    substituicoes={obterTodasSubstituicoesDoSet(setAtivo)}
                    partida={partida}
                    setStarted={setStarted}
                  />
                </div>
              </div>
            )}

            {estatisticasModalAberto && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
                <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
                    <span className="text-sm font-black text-gray-800 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-gray-400" />
                      Estatísticas {isFinalizada ? "da partida" : "ao vivo"}
                    </span>
                    <button
                      onClick={() => setEstatisticasModalAberto(false)}
                      className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-lg"
                    >
                      ×
                    </button>
                  </div>
                  <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                    <EstatisticasTime
                      eventos={eventos}
                      jogadores={jogadoresCasaTodos}
                      nomeTime={partida.nomeTimeCasa}
                      cor="emerald"
                    />
                    <EstatisticasTime
                      eventos={eventos}
                      jogadores={jogadoresVisTodos}
                      nomeTime={partida.nomeTimeVisitante}
                      cor="orange"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {podeGerenciar && isAoVivo && setStarted && (
            <div className="hidden lg:flex lg:w-[320px] shrink-0 p-4 border-l border-gray-100 bg-gray-50 flex-col">
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
            <div className="flex-1 flex items-center justify-center p-10 text-sm text-gray-400">
              A partida ainda não começou.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}