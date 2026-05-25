import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  api,
  type Partida,
  type EventoPartida,
  type TipoPonto,
  type TipoErro,
  type LadoPonto,
  type JogadorPartida,
} from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/services/utils";
import {
  RotateCcw, Flag, Loader2, CheckCircle2, AlertTriangle,
  Activity, ArrowLeft, Trophy, Target, Zap, Users,
  Play, Pause, Timer, RefreshCw, ArrowLeftRight,
  ChevronDown,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TIPOS
═══════════════════════════════════════════════════════════════ */
type ActionDef = { type: TipoPonto; label: string; emoji: string };

const ACOES_PONTO: ActionDef[] = [
  { type: "SAQUE",    label: "Saque",    emoji: "🏐" },
  { type: "ATAQUE",   label: "Ataque",   emoji: "⚡" },
  { type: "BLOQUEIO", label: "Bloqueio", emoji: "🛡️" },
];
const ACOES_EXTRAS: ActionDef[] = [
  { type: "ERRO_ADVERSARIO",   label: "Erro Adv.",   emoji: "✕" },
  { type: "CARTAO_ADVERSARIO", label: "Cartão Adv.", emoji: "🟨" },
];





/* ═══════════════════════════════════════════════════════════════
   BANCO DE RESERVAS — exibe titulares e reservas lado a lado
═══════════════════════════════════════════════════════════════ */
function BankPanel({
  titulares, reservas, cor, nomeTime,
  canManage, onSub,
}: {
  titulares: JogadorPartida[];
  reservas: JogadorPartida[];
  cor: "emerald" | "orange";
  nomeTime: string;
  canManage: boolean;
  onSub: () => void;
}) {
  const [open, setOpen] = useState(false);
  const accent = cor === "emerald" ? "text-emerald-700" : "text-orange-600";
  const bg     = cor === "emerald" ? "bg-emerald-50 border-emerald-200" : "bg-orange-50 border-orange-200";
  const dot    = cor === "emerald" ? "bg-emerald-500" : "bg-orange-400";

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b border-gray-200"
      >
        <span className={`h-2 w-2 rounded-full ${dot} shrink-0`} />
        <span className={`text-[11px] font-black uppercase tracking-widest ${accent} flex-1 truncate`}>
          {nomeTime}
        </span>
        <span className="text-[10px] text-gray-400 font-medium">
          {titulares.length} titular · {reservas.length} reserva
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="p-3 space-y-3">
          {/* Titulares */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Titulares em quadra
            </p>
            <div className="space-y-1">
              {titulares.length === 0 && (
                <p className="text-[11px] text-gray-400 italic">—</p>
              )}
              {titulares.map((j) => (
                <div
                  key={j.id}
                  className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg border", bg)}
                >
                  <span className="w-6 h-6 rounded-md bg-white font-mono text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
                    {j.numeroCamisa ?? "–"}
                  </span>
                  <span className="text-xs font-semibold text-gray-800 flex-1 truncate">{j.nomeJogador}</span>
                  {j.posicao && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
                      {j.posicao.slice(0, 3)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reservas */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Banco de reservas
            </p>
            <div className="space-y-1">
              {reservas.length === 0 && (
                <p className="text-[11px] text-gray-400 italic">Sem reservas</p>
              )}
              {reservas.map((j) => (
                <div
                  key={j.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <span className="w-6 h-6 rounded-md bg-white font-mono text-xs font-black flex items-center justify-center shrink-0 shadow-sm text-gray-500">
                    {j.numeroCamisa ?? "–"}
                  </span>
                  <span className="text-xs font-medium text-gray-500 flex-1 truncate">{j.nomeJogador}</span>
                  {j.posicao && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
                      {j.posicao.slice(0, 3)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botão substituição */}
          {canManage && (
            <button
              onClick={onSub}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Substituição
            </button>
          )}
        </div>
      )}
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════
   MODAL DE AÇÃO (REGISTRAR PONTO)
═══════════════════════════════════════════════════════════════ */
function ModalAcao({
  acao, lado, jogadores, partida, onRegistrar, onClose, idSacador, ladoSaque,
}: {
  acao: ActionDef;
  lado: LadoPonto;
  jogadores: JogadorPartida[];
  partida: Partida;
  ladoSaque: LadoPonto;
  idSacador?: string;
  onRegistrar: (id?: string, err?: TipoErro) => void;
  onClose: () => void;
}) {
  const [erro, setErro] = useState<TipoErro | null>(null);
  const isErro = acao.type === "ERRO_ADVERSARIO";
  const timeNome = lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <span className="text-2xl">{acao.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-black tracking-wide text-gray-900">{acao.label}</p>
            <p className="text-xs text-gray-500 truncate uppercase tracking-widest">{timeNome}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isErro && !erro && (
            <div className="grid grid-cols-2 gap-2">
              {(["ERRO_SAQUE", "ERRO_ATAQUE", "TOQUE_REDE", "DOIS_TOQUES", "QUATRO_TOQUES", "BOLA_FORA", "INVASAO"] as TipoErro[]).map((e) => (
                <button
                  key={e}
                  onClick={() => e === "ERRO_SAQUE" ? onRegistrar(idSacador, e) : setErro(e)}
                  className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all text-gray-700"
                >
                  {e.replace("ERRO_", "").replace(/_/g, " ")}
                </button>
              ))}
            </div>
          )}
          {(!isErro || erro) && (
            <>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {jogadores.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => onRegistrar(j.jogadorId, erro ?? undefined)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center font-display text-sm font-black text-gray-600 transition-colors">
                      {j.numeroCamisa ?? "–"}
                    </span>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">{j.nomeJogador}</span>
                  </button>
                ))}
                {jogadores.length === 0 && (
                  <p className="text-xs text-center text-gray-400 py-6">Nenhum jogador escalado</p>
                )}
              </div>
              <button
                onClick={() => onRegistrar(undefined, erro ?? undefined)}
                className="w-full text-center text-[11px] font-bold uppercase tracking-widest py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
              >
                Atribuir ponto à equipe
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════════════ */
export default function PartidaLivePage() {
  const { id: partidaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Estado principal ─────────────────────────────────────── */
  const [partida,   setPartida]   = useState<Partida | null>(null);
  const [eventos,   setEventos]   = useState<EventoPartida[]>([]);
  const [jogadores, setJogadores] = useState<JogadorPartida[]>([]);
  const [loading,   setLoading]   = useState(true);

  /* ── Titulares por time neste set ─────────────────────────── */
  // IDs dos jogadores atualmente como titular em quadra
  const [titularesCasa, setTitularesCasa] = useState<Set<string>>(new Set());
  const [titularesVis,  setTitularesVis]  = useState<Set<string>>(new Set());

  /* ── Timer do set ─────────────────────────────────────────── */
  const [setStarted,  setSetStarted]  = useState(false);
  const [timerOn,     setTimerOn]     = useState(false);
  const [timerSecs,   setTimerSecs]   = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Modais ───────────────────────────────────────────────── */
  const [modal,        setModal]        = useState<{ lado: LadoPonto; acao: ActionDef } | null>(null);
  const [alerta,       setAlerta]       = useState<{ msg: string; onOk: () => void } | null>(null);
  const [showSetStart, setShowSetStart] = useState(false);
  const [subModal,     setSubModal]     = useState<LadoPonto | null>(null);
  const [setAtivo,     setSetAtivo]     = useState(0);

  const [salvando, setSalvando] = useState(false);

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
      setSetAtivo(p.setsCasa + p.setsVisitante);

      // Preencher titulares iniciais a partir de JogadorPartida.titular
      if (titularesCasa.size === 0 && titularesVis.size === 0) {
        const tCasa = new Set(jgs.filter((j) => j.titular && j.timeId === p.timeCasaId).map((j) => j.jogadorId));
        const tVis  = new Set(jgs.filter((j) => j.titular && j.timeId === p.timeVisitanteId).map((j) => j.jogadorId));
        if (tCasa.size > 0) setTitularesCasa(tCasa);
        if (tVis.size > 0) setTitularesVis(tVis);
        if (tCasa.size > 0 || tVis.size > 0) setSetStarted(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [partidaId]);

  useEffect(() => { load(); }, [load]);

  /* ── Iniciar set (modal) ──────────────────────────────────── */
  const handleSetStartConfirm = async (titCasa: string[], titVis: string[]) => {
    setShowSetStart(false);
    setTitularesCasa(new Set(titCasa));
    setTitularesVis(new Set(titVis));
    setSetStarted(true);
    setTimerSecs(0);
    setTimerOn(true);
  };

  /* ── Substituição ─────────────────────────────────────────── */
  const handleSub = (lado: LadoPonto, entrando: string, saindo: string) => {
    setSubModal(null);
    if (lado === "CASA") {
      setTitularesCasa((prev) => {
        const next = new Set(prev);
        next.delete(saindo);
        next.add(entrando);
        return next;
      });
    } else {
      setTitularesVis((prev) => {
        const next = new Set(prev);
        next.delete(saindo);
        next.add(entrando);
        return next;
      });
    }
  };

  /* ── Registrar evento ─────────────────────────────────────── */
  const registrar = async (jogadorId?: string, tipoErro?: TipoErro) => {
    if (!partida || !modal || !partidaId || salvando) return;
    setSalvando(true);

    const nC = partida.setAtualCasa + (modal.lado === "CASA" ? 1 : 0);
    const nV = partida.setAtualVisitante + (modal.lado === "VISITANTE" ? 1 : 0);

    try {
      const jogadorNome = jogadores.find((j) => j.jogadorId === jogadorId)?.nomeJogador;
      const { partida: p } = await api.registrarEvento(partidaId, {
        indiceSet: partida.setsCasa + partida.setsVisitante,
        lado: modal.lado,
        tipo: modal.acao.type,
        tipoErro,
        jogadorId,
        jogadorNome,
        placarCasa: nC,
        placarVisitante: nV,
      });

      setPartida(p);
      await load();

      /* Verificar fim de set com a lógica corrigida */
      const res = verificarFimSet(p, nC, nV);

      if (res.fimPartida && res.vencedorPartida) {
        const nomeVencedor = res.vencedorPartida === "CASA" ? p.nomeTimeCasa : p.nomeTimeVisitante;
        setTimerOn(false);
        setAlerta({
          msg: `🏆 ${nomeVencedor} venceu a partida! Encerrar agora?`,
          onOk: async () => {
            // Fechar o set atual antes de finalizar
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
            // Atualizar o placar de sets e zerar pontos do set atual
            await api.atualizarPartida(partidaId, {
              setsCasa: res.novoSetsCasa,
              setsVisitante: res.novoSetsVisitante,
              setAtualCasa: 0,
              setAtualVisitante: 0,
            });
            await load();
            setAlerta(null);
            // Resetar estado para o próximo set
            setSetStarted(false);
            setTimerSecs(0);
            setTitularesCasa(new Set());
            setTitularesVis(new Set());
            setShowSetStart(true);
          },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
      setModal(null);
    }
  };

  /* ── Guards ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }
  if (!partida) {
    return (
      <div className="p-10 text-center text-gray-500 bg-gray-100 h-screen">
        Partida não encontrada
      </div>
    );
  }

  /* ── Derivações ───────────────────────────────────────────── */
  const podeGerenciar = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";
  const isAoVivo      = partida.status === "AO_VIVO";
  const isFinalizada  = partida.status === "FINALIZADA";
  const isAgendada    = partida.status === "AGENDADA" || partida.status === "AQUECIMENTO";

  // Todos os jogadores separados por time
  const todosCasa = jogadores.filter((j) => j.timeId === partida.timeCasaId);
  const todosVis  = jogadores.filter((j) => j.timeId === partida.timeVisitanteId);

  // Titulares vs reservas baseado no estado local (definido no início do set)
  const titularesCasaList = todosCasa.filter((j) => titularesCasa.has(j.jogadorId));
  const reservasCasaList  = todosCasa.filter((j) => !titularesCasa.has(j.jogadorId));
  const titularesVisList  = todosVis.filter((j) => titularesVis.has(j.jogadorId));
  const reservasVisList   = todosVis.filter((j) => !titularesVis.has(j.jogadorId));

  // Para rodízio na quadra, usar apenas titulares
  const jCasaQuadra = titularesCasaList.length >= 6 ? titularesCasaList : todosCasa;
  const jVisQuadra  = titularesVisList.length  >= 6 ? titularesVisList  : todosVis;

  // Para modal de ação, usar jogadores do lado correto (titulares em quadra)
  const jModal = modal
    ? (modal.acao.type === "ERRO_ADVERSARIO" || modal.acao.type === "CARTAO_ADVERSARIO")
      ? (modal.lado === "CASA" ? titularesVisList  : titularesCasaList)
      : (modal.lado === "CASA" ? titularesCasaList : titularesVisList)
    : [];

  // Rodízio
  const evSetAtivo = eventos.filter((e) => !e.anulado && e.indiceSet === setAtivo).reverse();
  const eventosCron = [...evSetAtivo].reverse();

  let ladoSaque: LadoPonto = eventosCron.length > 0 ? eventosCron[0].lado : "CASA";
  let rotCasa = 0, rotVisit = 0;
  for (const ev of eventosCron) {
    if (ev.lado !== ladoSaque) {
      ladoSaque = ev.lado;
      if (ev.lado === "CASA") rotCasa++; else rotVisit++;
    }
  }

  // Sacador (quem serve agora = dono do último ponto)
  const sacadorAtual: LadoPonto = eventosCron.length > 0
    ? eventosCron[eventosCron.length - 1].lado
    : "CASA";

  // Sacador individual (para ERRO_SAQUE)
  const idSacador = sacadorAtual === "CASA"
    ? titularesCasaList[rotCasa % Math.max(titularesCasaList.length, 1)]?.jogadorId
    : titularesVisList[rotVisit % Math.max(titularesVisList.length, 1)]?.jogadorId;

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="h-screen bg-gray-100 text-gray-900 flex flex-col font-sans overflow-hidden">

      {/* ── Modais ── */}
      {modal && (
        <ModalAcao
          acao={modal.acao}
          lado={modal.lado}
          jogadores={jModal}
          partida={partida}
          onRegistrar={registrar}
          onClose={() => setModal(null)}
          ladoSaque={ladoSaque}
          idSacador={idSacador}
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
                Não agora
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

      {showSetStart && (
        <SetStartModal
          setNum={(partida.setsCasa + partida.setsVisitante) + 1}
          jCasa={todosCasa}
          jVis={todosVis}
          nomeCasa={partida.nomeTimeCasa}
          nomeVis={partida.nomeTimeVisitante}
          maxTitulares={partida.titularesPorTime ?? 6}
          onConfirm={handleSetStartConfirm}
          onClose={() => setShowSetStart(false)}
        />
      )}

      {subModal && (
        <SubModal
          lado={subModal}
          nomeCasa={partida.nomeTimeCasa}
          nomeVis={partida.nomeTimeVisitante}
          titulares={subModal === "CASA" ? titularesCasaList : titularesVisList}
          reservas={subModal  === "CASA" ? reservasCasaList  : reservasVisList}
          onConfirm={(entrando, saindo) => handleSub(subModal, entrando, saindo)}
          onClose={() => setSubModal(null)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          CONTAINER PRINCIPAL
      ═══════════════════════════════════════════════════════ */}
      <div className="max-w-[1400px] lg:w-[90vw] mx-auto flex flex-col flex-1 overflow-hidden bg-white rounded-none lg:rounded-3xl shadow-xl border-x lg:border border-gray-200 lg:my-4">

        {/* ── HEADER ── */}
        <header className="relative flex items-center justify-center p-4 sm:p-5 border-b border-gray-100 bg-white shrink-0">
          <div className="absolute left-4 sm:left-5">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-gray-50 text-gray-600 hover:text-gray-900 transition rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Placar central */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              {isAoVivo && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200">
                {isFinalizada ? "Encerrada"
                  : isAgendada ? "Agendada"
                  : `Set ${partida.setsCasa + partida.setsVisitante + 1}`}
              </span>
            </div>

            <div className="flex items-center gap-6 sm:gap-14 font-display mt-1">
              {/* Time casa */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1 h-5">
                  {sacadorAtual === "CASA" && <span className="animate-bounce text-sm">🏐</span>}
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">{partida.nomeTimeCasa}</span>
                </div>
                <div className="text-6xl sm:text-7xl font-black text-gray-900 tabular-nums leading-none">
                  {partida.setAtualCasa}
                </div>
              </div>

              {/* Sets */}
              <div className="flex flex-col items-center justify-end h-full pb-2">
                <div className="text-xs font-bold text-gray-500 flex gap-2 uppercase tracking-widest">
                  <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md">
                    Sets <span className="text-gray-900 ml-1">{partida.setsCasa}</span>
                  </span>
                  <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md">
                    Sets <span className="text-gray-900 ml-1">{partida.setsVisitante}</span>
                  </span>
                </div>
              </div>

              {/* Time visitante */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1 h-5">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">{partida.nomeTimeVisitante}</span>
                  {sacadorAtual === "VISITANTE" && <span className="animate-bounce text-sm">🏐</span>}
                </div>
                <div className="text-6xl sm:text-7xl font-black text-gray-900 tabular-nums leading-none">
                  {partida.setAtualVisitante}
                </div>
              </div>
            </div>
          </div>

          {/* Ações header direita */}
          {podeGerenciar && (
            <div className="absolute right-4 sm:right-5 flex gap-2">
              {isAgendada && (
                <button
                  onClick={async () => {
                    if (confirm("Iniciar a partida?")) {
                      const p = await api.comecaPartida(partidaId!);
                      setPartida(p);
                      setShowSetStart(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow"
                >
                  <Flag className="w-3.5 h-3.5" /> Iniciar
                </button>
              )}
              {isAoVivo && !setStarted && (
                <button
                  onClick={() => setShowSetStart(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow"
                >
                  <Play className="w-3.5 h-3.5" /> Iniciar Set
                </button>
              )}
              {isAoVivo && setStarted && (
                <>
                  <button
                    onClick={async () => {
                      if (confirm("Anular último ponto?")) {
                        const { partida: p } = await api.anularUltimoEvento(partidaId!);
                        setPartida(p);
                        await load();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition text-gray-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Anular</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("Encerrar partida permanentemente?")) {
                        await api.finalizarPartida(partidaId!);
                        setTimerOn(false);
                        await load();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Encerrar</span>
                  </button>
                </>
              )}
            </div>
          )}
        </header>

        {/* ── BARRA: REGRAS + TIMER ── */}
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

          {/* Timer */}
          {isAoVivo && setStarted && (
            <SetTimer
              running={timerOn}
              seconds={timerSecs}
              onToggle={() => setTimerOn((v) => !v)}
            />
          )}
        </div>

        {/* ── CORPO: 3 COLUNAS ── */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* COLUNA ESQUERDA — CASA */}
          <div className="flex-1 flex flex-col border-r border-gray-100 overflow-y-auto bg-white">
            <div className="text-center py-4 px-4 border-b border-gray-100">
              <h2 className="font-display text-3xl sm:text-4xl font-black text-gray-900 truncate">{partida.nomeTimeCasa}</h2>
              <p className="text-emerald-600 text-[10px] mt-1 uppercase tracking-[0.2em] font-bold">CASA</p>
            </div>

            {/* Banco de reservas Casa */}
            <div className="px-3 py-3 border-b border-gray-100">
              <BankPanel
                titulares={titularesCasaList}
                reservas={reservasCasaList}
                cor="emerald"
                nomeTime={partida.nomeTimeCasa}
                canManage={podeGerenciar && isAoVivo && setStarted}
                onSub={() => setSubModal("CASA")}
              />
            </div>

            {/* Botões de ação Casa */}
            {isAoVivo && podeGerenciar && setStarted && (
              <div className="flex-1 flex flex-col gap-3 p-4 justify-center">
                <div className="grid grid-cols-3 gap-2.5">
                  {ACOES_PONTO.map((a) => (
                    <button
                      key={a.type}
                      onClick={() => setModal({ lado: "CASA", acao: a })}
                      className="group rounded-2xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100 transition-all p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <span className="text-3xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-700 mt-2">{a.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ACOES_EXTRAS.map((a) => (
                    <button
                      key={a.type}
                      onClick={() => setModal({ lado: "CASA", acao: a })}
                      className={cn(
                        "group rounded-xl border transition-all p-3 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow",
                        a.type === "ERRO_ADVERSARIO"
                          ? "bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-400"
                          : "bg-yellow-50 border-yellow-200 text-yellow-600 hover:border-yellow-400"
                      )}
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder quando set não iniciado */}
            {isAoVivo && podeGerenciar && !setStarted && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <Play className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Inicie o set para registrar pontos</p>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA CENTRAL — QUADRA + HISTÓRICO */}
          <div className="w-full lg:w-[42%] flex flex-col border-r border-gray-100 bg-gray-50 overflow-hidden shrink-0">
            {/* Quadra */}
            <div className="p-4 border-b border-gray-100 bg-white shadow-sm z-10">
              <Quadra
                jCasa={jCasaQuadra}
                jVisit={jVisQuadra}
                rotCasa={rotCasa}
                rotVisit={rotVisit}
                sacador={sacadorAtual}
              />

              {/* Pills de set */}
              <div className="flex items-center justify-center gap-1 mt-3">
                {Array.from({ length: (partida.setsParaVencerPartida ?? 3) * 2 - 1 }, (_, i) => {
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
                        <span className="ml-1 opacity-60 font-normal">{set.casa}–{set.visitante}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Histórico */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Histórico</span>
                </div>
                <span className="text-xs font-bold text-gray-400">{evSetAtivo.length} pts</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {evSetAtivo.map((ev, i) => (
                  <div
                    key={ev.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      i === 0 ? "border-gray-300 bg-white shadow-sm" : "border-gray-200 bg-white/60"
                    )}
                  >
                    <div className={cn(
                      "w-1.5 h-8 rounded-full shrink-0",
                      ev.lado === "CASA" ? "bg-emerald-500" : "bg-orange-400"
                    )} />
                    <span className="text-xl leading-none w-7 text-center">{tipoEmoji(ev.tipo)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-bold text-gray-800 truncate">
                          {ev.lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante}
                        </span>
                        <span className="text-gray-500">· {tipoLabel(ev.tipo, ev.tipoErro)}</span>
                      </div>
                      {ev.jogadorNome && (
                        <div className="text-[10px] text-gray-400 mt-0.5 font-medium">
                          {ev.tipo === "ERRO_ADVERSARIO" || ev.tipo === "CARTAO_ADVERSARIO"
                            ? "FALHA: "
                            : "AUTOR: "}
                          <span className="text-gray-600 font-bold">{ev.jogadorNome}</span>
                        </div>
                      )}
                    </div>
                    <span className="font-display text-lg font-black text-gray-900 shrink-0 tabular-nums">
                      {ev.placarCasa}<span className="text-gray-300 font-sans font-normal mx-1">-</span>{ev.placarVisitante}
                    </span>
                  </div>
                ))}
                {evSetAtivo.length === 0 && (
                  <div className="text-center text-sm text-gray-400 mt-8 font-medium">
                    {setStarted ? "Nenhum ponto registrado ainda." : "Inicie o set para começar."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA — VISITANTE */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-white">
            <div className="text-center py-4 px-4 border-b border-gray-100">
              <h2 className="font-display text-3xl sm:text-4xl font-black text-gray-900 truncate">{partida.nomeTimeVisitante}</h2>
              <p className="text-orange-500 text-[10px] mt-1 uppercase tracking-[0.2em] font-bold">VISITANTE</p>
            </div>

            {/* Banco de reservas Visitante */}
            <div className="px-3 py-3 border-b border-gray-100">
              <BankPanel
                titulares={titularesVisList}
                reservas={reservasVisList}
                cor="orange"
                nomeTime={partida.nomeTimeVisitante}
                canManage={podeGerenciar && isAoVivo && setStarted}
                onSub={() => setSubModal("VISITANTE")}
              />
            </div>

            {/* Botões de ação Visitante */}
            {isAoVivo && podeGerenciar && setStarted && (
              <div className="flex-1 flex flex-col gap-3 p-4 justify-center">
                <div className="grid grid-cols-3 gap-2.5">
                  {ACOES_PONTO.map((a) => (
                    <button
                      key={a.type}
                      onClick={() => setModal({ lado: "VISITANTE", acao: a })}
                      className="group rounded-2xl bg-orange-50 border border-orange-100 hover:border-orange-300 hover:bg-orange-100 transition-all p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <span className="text-3xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-orange-600 mt-2">{a.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ACOES_EXTRAS.map((a) => (
                    <button
                      key={a.type}
                      onClick={() => setModal({ lado: "VISITANTE", acao: a })}
                      className={cn(
                        "group rounded-xl border transition-all p-3 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow",
                        a.type === "ERRO_ADVERSARIO"
                          ? "bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-400"
                          : "bg-yellow-50 border-yellow-200 text-yellow-600 hover:border-yellow-400"
                      )}
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder quando set não iniciado */}
            {isAoVivo && podeGerenciar && !setStarted && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <Play className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Inicie o set para registrar pontos</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}