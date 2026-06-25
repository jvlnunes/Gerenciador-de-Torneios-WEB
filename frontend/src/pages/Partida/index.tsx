import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  api, type Partida, type EventoPartida, type TipoErro, type LadoPonto, type JogadorPartida,
} from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle, Trophy, Target, Zap, Users } from "lucide-react";
import { cn } from "@/services/utils";

// --- Utilitários ---
import { ActionDef, verificarFimSet } from "./utils/LogicaPartida";
import { useEscalacao } from "./utils/useEscalacao";
import type { EscalacaoSet } from "./components/Escalacao";

// --- Componentes ---
import { PlacarHeader } from "./components/PlacarHeader";
import { SetTimer } from "./components/Timer";
import { Quadra } from "./components/Quadra";
import { HistoricoSet } from "./components/HistoricoSet";
import { ColunaTime } from "./components/ColunaTime";

// --- Modais ---
import { ModalAcao } from "./modals/ModalAcao";
import { ModalConfiguracao } from "./modals/ModalConfiguracao";
import { ModalCartao } from "./modals/ModalCartao";
import { ModalEscalacao } from "./modals/ModalEscalacao";
import { ModalSubstituicao } from "./modals/ModalSubstituicao";

export default function PartidaLivePage() {
  const { id: partidaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Estado principal ─────────────────────────────────────── */
  const [partida, setPartida] = useState<Partida | null>(null);
  const [eventos, setEventos] = useState<EventoPartida[]>([]);
  const [jogadores, setJogadores] = useState<JogadorPartida[]>([]);
  const [loading, setLoading] = useState(true);
  const [setAtivo, setSetAtivo] = useState(0);

  /* ── Timer do set ─────────────────────────────────────────── */
  const [setStarted, setSetStarted] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Modais e Configurações ───────────────────────────────── */
  const [modal, setModal] = useState<{ lado: LadoPonto; acao: ActionDef } | null>(null);
  const [modalCartao, setModalCartao] = useState<LadoPonto | null>(null);
  const [alerta, setAlerta] = useState<{ msg: string; onOk: () => void } | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Configurações Locais
  const [showConfig, setShowConfig] = useState(false);
  const [configTimer, setConfigTimer] = useState(true);
  const [configAutoSaque, setConfigAutoSaque] = useState(true);

  // Controla se o modal de escalação já foi aberto para o set atual nesta sessão
  const modalJaAbertoPorSet = useRef<Set<number>>(new Set());

  /* ── Hook de Escalação e Substituições ────────────────────── */
  const {
    modalEscalacaoAberto, abrirModalEscalacao, fecharModalEscalacao, confirmarEscalacao,
    modalSubAberto, timeSubId, abrirModalSubstituicao, fecharModalSubstituicao, confirmarSubstituicao,
    obterTitularesAtuais, obterBancoAtual, obterSubstituicoesDoSet, obterEscalacao,
    setJaTemEscalacao, obterJogadorPosicao1,
  } = useEscalacao(setAtivo);

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
  const load = useCallback(async () => {
    if (!partidaId) return;
    try {
      const [p, evs, jgs] = await Promise.all([
        api.buscarPartida(partidaId),
        api.listarEventosPartida(partidaId),
        api.listarJogadoresPartida(partidaId),
      ]);
      setPartida(p);
      setEventos(evs);
      setJogadores(jgs);

      const indexSetAtual = p.setsCasa + p.setsVisitante;
      setSetAtivo(indexSetAtual);

      const pontosNesteSet = evs.filter(
        (e) => e.indiceSet === indexSetAtual && !e.anulado
      ).length;

      if (p.status === "AO_VIVO") {
        if (pontosNesteSet > 0) {
          // Set já tem pontos → já iniciou, não abre modal
          setSetStarted(true);
        } else if (!modalJaAbertoPorSet.current.has(indexSetAtual)) {
          // Set sem pontos e modal ainda não foi aberto nesta sessão → abre
          setSetStarted(false);
          modalJaAbertoPorSet.current.add(indexSetAtual);
          abrirModalEscalacao();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [partidaId]);

  useEffect(() => { load(); }, [load]);

  /* ── Handlers de Escalação ────────────────────────────────── */
  const handleConfirmarEscalacao = (escalacao: EscalacaoSet) => {
    confirmarEscalacao(escalacao);
    setSetStarted(true);
    setTimerSecs(0);
    setTimerOn(true);
  };

  /* ── FUNÇÃO NÚCLEO DE REGISTRAR EVENTO ─────────────────────── */
  const executarRegistro = async (
    acaoParaRegistrar: ActionDef,
    ladoAcao: LadoPonto,
    jogadorId?: string,
    tipoErro?: TipoErro
  ) => {
    if (!partida || !partidaId || salvando) return;
    setSalvando(true);

    const nC = partida.setAtualCasa + (ladoAcao === "CASA" ? 1 : 0);
    const nV = partida.setAtualVisitante + (ladoAcao === "VISITANTE" ? 1 : 0);

    try {
      const jogadorNome = jogadores.find((j) => j.jogadorId === jogadorId)?.nomeJogador;
      const { partida: p } = await api.registrarEvento(partidaId, {
        indiceSet: partida.setsCasa + partida.setsVisitante,
        lado: ladoAcao,
        tipo: acaoParaRegistrar.type,
        tipoErro,
        jogadorId,
        jogadorNome,
        placarCasa: nC,
        placarVisitante: nV,
      });

      setPartida(p);
      await load();

      const res = verificarFimSet(p, nC, nV);

      if (res.fimPartida && res.vencedorPartida) {
        const nomeVencedor = res.vencedorPartida === "CASA" ? p.nomeTimeCasa : p.nomeTimeVisitante;
        setTimerOn(false);
        setAlerta({
          msg: `🏆 ${nomeVencedor} venceu a partida! Encerrar agora?`,
          onOk: async () => {
            await api.atualizarPartida(partidaId, {
              setsCasa: res.novoSetsCasa,
              setsVisitante: res.novoSetsVisitante,
              setAtualCasa: 0,
              setAtualVisitante: 0,
            });
            await api.finalizarPartida(partidaId);
            await load();
            setAlerta(null);
          },
        });
      } else if (res.fimSet && res.vencedorSet) {
        const nomeVencedor = res.vencedorSet === "CASA" ? p.nomeTimeCasa : p.nomeTimeVisitante;
        setTimerOn(false);
        setAlerta({
          msg: `✅ ${nomeVencedor} venceu o set! Iniciar próximo set?`,
          onOk: async () => {
            await api.atualizarPartida(partidaId, {
              setsCasa: res.novoSetsCasa,
              setsVisitante: res.novoSetsVisitante,
              setAtualCasa: 0,
              setAtualVisitante: 0,
            });
            await load();
            setAlerta(null);
            setSetStarted(false);
            setTimerSecs(0);
            // Próximo set — marca no ref para controlar abertura
            const proximoSet = res.novoSetsCasa + res.novoSetsVisitante;
            modalJaAbertoPorSet.current.add(proximoSet);
            abrirModalEscalacao();
          },
        });
      }
    } catch (e) { console.error(e); } finally {
      setSalvando(false);
      setModal(null);
    }
  };

  /* ── FUNÇÃO NÚCLEO DE REGISTRAR CARTÃO ─────────────────────── */
  const executarCartao = async (
    jogadorId: string,
    tipoCartao: TipoErro,
    ladoPenalizado: LadoPonto
  ) => {
    if (!partida || !partidaId || salvando) return;
    setSalvando(true);

    // Cartão vermelho = ponto para o adversário
    let nC = partida.setAtualCasa;
    let nV = partida.setAtualVisitante;
    const daPonto = tipoCartao === "CARTAO_VERMELHO" || tipoCartao === "EXPULSAO";

    if (daPonto) {
      if (ladoPenalizado === "CASA") nV += 1;
      else nC += 1;
    }

    // O ponto vai para o adversário do penalizado
    const ladoQueGanhaPonto: LadoPonto = ladoPenalizado === "CASA" ? "VISITANTE" : "CASA";

    try {
      const jogadorNome = jogadores.find((j) => j.jogadorId === jogadorId)?.nomeJogador;
      const { partida: p } = await api.registrarEvento(partidaId, {
        indiceSet: partida.setsCasa + partida.setsVisitante,
        lado: daPonto ? ladoQueGanhaPonto : ladoPenalizado, // lado que pontua (adversário) ou time penalizado
        tipo: "CARTAO_ADVERSARIO",
        tipoErro: tipoCartao,
        jogadorId,
        jogadorNome,
        placarCasa: nC,
        placarVisitante: nV,
      });

      setPartida(p);
      await load();

      if (daPonto) {
        const res = verificarFimSet(p, nC, nV);
        if (res.fimPartida && res.vencedorPartida) {
          const nomeVencedor = res.vencedorPartida === "CASA" ? p.nomeTimeCasa : p.nomeTimeVisitante;
          setTimerOn(false);
          setAlerta({
            msg: `🏆 ${nomeVencedor} venceu a partida! Encerrar agora?`,
            onOk: async () => {
              await api.finalizarPartida(partidaId);
              await load();
              setAlerta(null);
            },
          });
        } else if (res.fimSet && res.vencedorSet) {
          const nomeVencedor = res.vencedorSet === "CASA" ? p.nomeTimeCasa : p.nomeTimeVisitante;
          setTimerOn(false);
          setAlerta({
            msg: `✅ ${nomeVencedor} venceu o set! Iniciar próximo set?`,
            onOk: async () => {
              await api.atualizarPartida(partidaId, {
                setsCasa: res.novoSetsCasa,
                setsVisitante: res.novoSetsVisitante,
                setAtualCasa: 0,
                setAtualVisitante: 0,
              });
              await load();
              setAlerta(null);
              setSetStarted(false);
              setTimerSecs(0);
              const proximoSet = res.novoSetsCasa + res.novoSetsVisitante;
              modalJaAbertoPorSet.current.add(proximoSet);
              abrirModalEscalacao();
            },
          });
        }
      }

      // Expulsão ou desqualificação → substituição obrigatória
      if (tipoCartao === "EXPULSAO" || tipoCartao === "DESQUALIFICACAO") {
        setAlerta({
          msg: "Jogador expulso! Realize a substituição obrigatória agora.",
          onOk: () => {
            setAlerta(null);
            abrirModalSubstituicao(
              ladoPenalizado === "CASA" ? partida.timeCasaId : partida.timeVisitanteId
            );
          },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
      setModalCartao(null);
    }
  };

  /* ── Derivações ───────────────────────────────────────────── */
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

  const podeGerenciar = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";
  const isAoVivo = partida.status === "AO_VIVO";
  const isFinalizada = partida.status === "FINALIZADA";
  const isAgendada = partida.status === "AGENDADA" || partida.status === "AQUECIMENTO";

  const todosCasa = jogadores.filter((j) => j.timeId === partida.timeCasaId);
  const todosVis = jogadores.filter((j) => j.timeId === partida.timeVisitanteId);

  const titularesCasaList = obterTitularesAtuais(partida.timeCasaId, setAtivo, jogadores);
  const titularesVisList = obterTitularesAtuais(partida.timeVisitanteId, setAtivo, jogadores);
  const bancoCasaList = obterBancoAtual(partida.timeCasaId, setAtivo, jogadores);
  const bancoVisList = obterBancoAtual(partida.timeVisitanteId, setAtivo, jogadores);

  // Jogadores inativos por cartão/expulsão
  const expulsosSetAtual = eventos
    .filter((e) => e.tipoErro === "EXPULSAO" && e.indiceSet === setAtivo)
    .map((e) => e.jogadorId);
  const desqualificados = eventos
    .filter((e) => e.tipoErro === "DESQUALIFICACAO")
    .map((e) => e.jogadorId);
  const jogadoresInativos = new Set([...expulsosSetAtual, ...desqualificados]);

  const casaTemAmarelo = eventos.some(
    (e) => e.lado === "CASA" && e.tipoErro === "CARTAO_AMARELO" && !e.anulado
  );
  const visTemAmarelo = eventos.some(
    (e) => e.lado === "VISITANTE" && e.tipoErro === "CARTAO_AMARELO" && !e.anulado
  );

  const reservasCasaAtivos = bancoCasaList.filter(j => !jogadoresInativos.has(j.jogadorId));
  const reservasVisAtivos = bancoVisList.filter(j => !jogadoresInativos.has(j.jogadorId));

  // Fallback para quadra caso escalação ainda não tenha sido feita
  const jCasaQuadra = titularesCasaList.length >= 6 ? titularesCasaList : todosCasa.slice(0, 6);
  const jVisQuadra = titularesVisList.length >= 6 ? titularesVisList : todosVis.slice(0, 6);

  // Jogadores para o modal de ação
  const jModal = modal
    ? (modal.acao.type === "ERRO_ADVERSARIO" || modal.acao.type === "CARTAO_ADVERSARIO")
      ? (modal.lado === "CASA" ? titularesVisList : titularesCasaList)
      : (modal.lado === "CASA" ? titularesCasaList : titularesVisList)
    : [];

  const evSetAtivo = eventos
    .filter((e) => !e.anulado && e.indiceSet === setAtivo)
    .reverse();
  const eventosCron = [...evSetAtivo].reverse();

  // ── Cálculo do sacador e rotação ──────────────────────────
  // Determina o lado que tem o saque AGORA com base nos eventos
  let ladoSaque: LadoPonto = "CASA";
  if (eventosCron.length > 0) {
    ladoSaque = eventosCron[eventosCron.length - 1].lado;
  }

  let rotCasa = 0, rotVisit = 0;
  let ladoAnterior: LadoPonto | null = null;
  for (const ev of eventosCron) {
    if (ladoAnterior !== null && ev.lado !== ladoAnterior) {
      if (ev.lado === "CASA") rotCasa++;
      else rotVisit++;
    }
    ladoAnterior = ev.lado;
  }

  const sacadorAtual: LadoPonto = ladoSaque;

  // ── Sacador individual (jogador na Posição 1) ─────────────
  // Usado para atribuição automática de erro de saque
  const sacadorCasaJogador = obterJogadorPosicao1(partida.timeCasaId, setAtivo, jogadores);
  const sacadorVisJogador = obterJogadorPosicao1(partida.timeVisitanteId, setAtivo, jogadores);

  const getSacadorAtualJogador = (lado: LadoPonto) => {
    // O sacador é quem está na Posição 1 do time que tem o saque
    if (lado === "CASA") return sacadorCasaJogador;
    return sacadorVisJogador;
  };

  // Interceptador de ações
  const handleAcaoClick = (ladoClicado: LadoPonto, acaoClicada: ActionDef) => {
    if (acaoClicada.type === "CARTAO_ADVERSARIO") {
      setModalCartao(ladoClicado);
      return;
    }
    setModal({ lado: ladoClicado, acao: acaoClicada });
  };

  return (
    <div className="h-screen bg-gray-100 text-gray-900 flex flex-col font-sans overflow-hidden">

      {/* ── MODAIS ── */}
      {showConfig && (
        <ModalConfiguracao
          configTimer={configTimer} setConfigTimer={setConfigTimer}
          configAutoSaque={configAutoSaque} setConfigAutoSaque={setConfigAutoSaque}
          onClose={() => setShowConfig(false)}
        />
      )}

      {modalCartao && (
        <ModalCartao
          lado={modalCartao}
          nomeTime={modalCartao === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante}
          jogadores={
            modalCartao === "CASA"
              ? todosCasa.filter(j => !jogadoresInativos.has(j.jogadorId))
              : todosVis.filter(j => !jogadoresInativos.has(j.jogadorId))
          }
          timeJaTemAmarelo={modalCartao === "CASA" ? casaTemAmarelo : visTemAmarelo}
          onRegistrar={(id, tipoCartao) => executarCartao(id, tipoCartao, modalCartao)}
          onClose={() => setModalCartao(null)}
        />
      )}

      {alerta && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <AlertTriangle className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="font-display font-black text-xl text-gray-900 leading-snug">{alerta.msg}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAlerta(null)}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={alerta.onOk}
                className="flex-1 py-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <ModalAcao
          acao={modal.acao}
          lado={modal.lado}
          jogadores={jModal}
          partida={partida}
          onRegistrar={(id, err) => executarRegistro(modal.acao, modal.lado, id, err)}
          onClose={() => setModal(null)}
          ladoSaque={sacadorAtual}
          // Passa o ID do sacador atual (jogador na posição 1 do time que está sacando)
          idSacador={
            configAutoSaque
              ? getSacadorAtualJogador(sacadorAtual)?.jogadorId
              : undefined
          }
        />
      )}

      {modalEscalacaoAberto && (
        <ModalEscalacao
          aberto={modalEscalacaoAberto}
          indiceSet={setAtivo}
          timeCasaId={partida.timeCasaId}
          timeVisitanteId={partida.timeVisitanteId}
          nomeTimeCasa={partida.nomeTimeCasa}
          nomeTimeVisitante={partida.nomeTimeVisitante}
          jogadores={jogadores}
          escalacaoAnterior={setAtivo > 0 ? obterEscalacao(setAtivo - 1) : undefined}
          aoConfirmar={handleConfirmarEscalacao}
          aoFechar={fecharModalEscalacao}
        />
      )}

      {modalSubAberto && timeSubId && (
        <ModalSubstituicao
          aberto={modalSubAberto}
          indiceSet={setAtivo}
          timeAtualId={timeSubId}
          lado={timeSubId === partida.timeCasaId ? "CASA" : "VISITANTE"}
          nomeTimeAtual={
            timeSubId === partida.timeCasaId ? partida.nomeTimeCasa : partida.nomeTimeVisitante
          }
          titulares={timeSubId === partida.timeCasaId ? titularesCasaList : titularesVisList}
          banco={timeSubId === partida.timeCasaId ? reservasCasaAtivos : reservasVisAtivos}
          placarCasa={partida.setAtualCasa}
          placarVisitante={partida.setAtualVisitante}
          substituicoesNesteSet={obterSubstituicoesDoSet(timeSubId, setAtivo)}
          aoConfirmar={confirmarSubstituicao}
          aoFechar={fecharModalSubstituicao}
        />
      )}

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
          onIniciarPartida={async () => {
            if (confirm("Iniciar a partida?")) {
              const p = await api.comecaPartida(partidaId!);
              setPartida(p);
              setSetStarted(false);
              // Marca o set 0 para abrir o modal
              modalJaAbertoPorSet.current.add(0);
              abrirModalEscalacao();
            }
          }}
          onIniciarSet={() => {
            // Permite abrir manualmente (botão "Iniciar Set" no header)
            abrirModalEscalacao();
          }}
          onAnularPonto={async () => {
            if (confirm("Anular último ponto/ação?")) {
              const { partida: p } = await api.anularUltimoEvento(partidaId!);
              setPartida(p);
              await load();
            }
          }}
          onEncerrarPartida={async () => {
            if (confirm("Encerrar partida permanentemente?")) {
              await api.finalizarPartida(partidaId!);
              setTimerOn(false);
              await load();
            }
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
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              Tie-break: <span className="text-gray-900 font-black ml-1">{partida.pontosParaVencerUltimoSet ?? 15}</span>
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

        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          <ColunaTime
            lado="CASA"
            partida={partida}
            titulares={titularesCasaList}
            reservas={reservasCasaAtivos}
            podeGerenciar={podeGerenciar}
            isAoVivo={isAoVivo}
            setStarted={setStarted}
            onSub={() => abrirModalSubstituicao(partida.timeCasaId)}
            onAcao={(acao) => handleAcaoClick("CASA", acao)}
          />

          <div className="w-full lg:w-[42%] flex flex-col border-r border-gray-100 bg-gray-50 overflow-hidden shrink-0">
            <div className="p-4 border-b border-gray-100 bg-white shadow-sm z-10">
              <Quadra
                jCasa={jCasaQuadra}
                jVisit={jVisQuadra}
                rotCasa={rotCasa}
                rotVisit={rotVisit}
                sacador={sacadorAtual}
              />

              <div className="flex items-center justify-center gap-1 mt-3">
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

            <HistoricoSet eventos={evSetAtivo} partida={partida} setStarted={setStarted} />
          </div>

          <ColunaTime
            lado="VISITANTE"
            partida={partida}
            titulares={titularesVisList}
            reservas={reservasVisAtivos}
            podeGerenciar={podeGerenciar}
            isAoVivo={isAoVivo}
            setStarted={setStarted}
            onSub={() => abrirModalSubstituicao(partida.timeVisitanteId)}
            onAcao={(acao) => handleAcaoClick("VISITANTE", acao)}
          />

        </main>
      </div>
    </div>
  );
}