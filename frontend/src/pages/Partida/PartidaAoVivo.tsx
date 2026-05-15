import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Partida, type EventoPartida, type TipoPonto, type TipoErro, type LadoPonto, type JogadorPartida } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/services/utils";
import { RotateCcw, Flag, Loader2, CheckCircle2, AlertTriangle, Activity, ArrowLeft, Trophy, Target, Zap, Users } from "lucide-react";

/* ─── Tipos ─────────────────────────────────────────────────── */
type ActionDef = { type: TipoPonto; label: string; emoji: string };

const ACOES_PONTO: ActionDef[] = [
  { type: "SAQUE", label: "Saque", emoji: "🏐" },
  { type: "ATAQUE", label: "Ataque", emoji: "⚡" },
  { type: "BLOQUEIO", label: "Bloqueio", emoji: "🛡️" },
];
const ACOES_EXTRAS: ActionDef[] = [
  { type: "ERRO_ADVERSARIO", label: "Erro Adv.", emoji: "✕" },
  { type: "CARTAO_ADVERSARIO", label: "Cartão Adv.", emoji: "🟨" },
];

/* ─── Utilitários ────────────────────────────────────────────── */
function tipoEmoji(t: TipoPonto) {
  const m: Record<string, string> = { SAQUE: "🏐", ATAQUE: "⚡", BLOQUEIO: "🛡️", ERRO_ADVERSARIO: "❌", CARTAO_ADVERSARIO: "🟨" };
  return m[t] ?? "•";
}

function tipoLabel(t: TipoPonto, err?: string) {
  if (t === "ERRO_ADVERSARIO") return err ? err.replace(/_/g, " ") : "Erro Adv.";
  const m: Record<string, string> = { SAQUE: "Saque", ATAQUE: "Ataque", BLOQUEIO: "Bloqueio", CARTAO_ADVERSARIO: "Cartão" };
  return m[t] ?? t;
}

function verificarFimSet(p: Partida, casa: number, vis: number) {
  const setIdx = p.setsCasa + p.setsVisitante;
  const totalSets = (p.setsParaVencerPartida ?? 3) * 2 - 1;
  const isUltimo = setIdx >= totalSets - 1;
  const pontoMin = isUltimo ? (p.pontosParaVencerUltimoSet ?? 15) : (p.pontosParaVencerSet ?? 25);

  if (Math.max(casa, vis) >= pontoMin && Math.abs(casa - vis) >= 2) {
    const vSet: LadoPonto = casa > vis ? "CASA" : "VISITANTE";
    const nC = p.setsCasa + (vSet === "CASA" ? 1 : 0);
    const nV = p.setsVisitante + (vSet === "VISITANTE" ? 1 : 0);
    const sv = p.setsParaVencerPartida ?? 3;
    if (nC >= sv || nV >= sv) return { fimSet: true, vSet, fimPartida: true, vPartida: (nC >= sv ? "CASA" : "VISITANTE") as LadoPonto };
    return { fimSet: true, vSet, fimPartida: false, vPartida: null };
  }
  return { fimSet: false, vSet: null, fimPartida: false, vPartida: null };
}

/* ─── Componente da Quadra Unificada ─────────────────────────── */
function Quadra({ jCasa, jVisit, rotCasa, rotVisit, sacador }: { jCasa: JogadorPartida[]; jVisit: JogadorPartida[]; rotCasa: number; rotVisit: number; sacador: LadoPonto; }) {
  const getJogador = (j: JogadorPartida[], vSlot: number, rot: number) => {
    const idxOriginal = (vSlot - 1 + rot) % 6;
    return j[idxOriginal] ?? null;
  }

  const Slot = ({ lado, vSlot, cor }: { lado: "CASA"|"VISIT", vSlot: number, cor: string }) => {
    const j = getJogador(lado === "CASA"? jCasa : jVisit, vSlot, lado === "CASA"? rotCasa : rotVisit);
    const bgCor = cor === "primary" ? "bg-emerald-600 text-white" : "bg-orange-500 text-white";
    
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[65px] z-10 transition-all duration-300 hover:scale-110 hover:-translate-y-1 cursor-pointer group">
         <span className="absolute top-1 left-1.5 text-[9px] font-black text-white/50">{vSlot}</span>
         {j && (
           <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md border-2 border-white z-10 transition-shadow group-hover:shadow-lg", bgCor)}>
             {j.numeroCamisa ?? "?"}
           </div>
         )}
         {j && (
           <span className="text-[10px] text-gray-800 font-bold mt-1.5 truncate max-w-[90%] px-1.5 text-center bg-white/80 backdrop-blur-sm rounded-md py-0.5 shadow-sm">
             {j.nomeJogador.split(" ")[0]}
           </span>
         )}
      </div>
    );
  }

  return (
    <div className="w-full bg-[#E89D78] rounded-xl border-4 border-white relative flex overflow-hidden aspect-[1.8/1] shadow-sm max-w-lg mx-auto">
       <div className="absolute top-0 bottom-0 left-1/2 w-1.5 bg-white -translate-x-1/2 z-20 flex flex-col justify-between items-center py-1">
          <div className="w-3.5 h-3.5 bg-red-500 rounded-full absolute -top-1.5 border border-white" />
          <div className="w-3.5 h-3.5 bg-red-500 rounded-full absolute -bottom-1.5 border border-white" />
       </div>
       <div className="flex-1 grid grid-cols-[2fr_1fr] grid-rows-3 relative">
          <div className="absolute top-0 bottom-0 right-[33.33%] w-[2px] bg-white/60 z-0" />
          <Slot lado="CASA" vSlot={5} cor="primary" /> <Slot lado="CASA" vSlot={4} cor="primary" />
          <Slot lado="CASA" vSlot={6} cor="primary" /> <Slot lado="CASA" vSlot={3} cor="primary" />
          <Slot lado="CASA" vSlot={1} cor="primary" /> <Slot lado="CASA" vSlot={2} cor="primary" />
       </div>
       <div className="flex-1 grid grid-cols-[1fr_2fr] grid-rows-3 relative">
          <div className="absolute top-0 bottom-0 left-[33.33%] w-[2px] bg-white/60 z-0" />
          <Slot lado="VISIT" vSlot={2} cor="amber" /> <Slot lado="VISIT" vSlot={1} cor="amber" />
          <Slot lado="VISIT" vSlot={3} cor="amber" /> <Slot lado="VISIT" vSlot={6} cor="amber" />
          <Slot lado="VISIT" vSlot={4} cor="amber" /> <Slot lado="VISIT" vSlot={5} cor="amber" />
       </div>
    </div>
  )
}

/* ─── Modal de Ação ──────────────────────────────────────────── */
function ModalAcao({
  acao, lado, jogadores, partida, onRegistrar, onClose, idSacador, ladoSaque = "CASA"
}: { acao: ActionDef; lado: LadoPonto; jogadores: JogadorPartida[]; partida: Partida; ladoSaque: LadoPonto; idSacador?: string; onRegistrar: (id?: string, err?: TipoErro) => void; onClose: () => void; }) {
  const [erro, setErro] = useState<TipoErro | null>(null);
  const isErro = acao.type === "ERRO_ADVERSARIO";
  const timeNome = lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante;
  const timeQueErrou = lado === "CASA" ? "VISITANTE" : "CASA"; 
  const isErroDoSacador = isErro && timeQueErrou === ladoSaque;

  return (    
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <span className="text-2xl">{acao.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-black tracking-wide text-gray-900">{acao.label}</p>
            <p className="text-xs text-gray-500 truncate uppercase tracking-widest">{timeNome}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 flex items-center justify-center transition-colors">✕</button>
        </div>
        
        <div className="p-5 space-y-4">
          {isErro && !erro && (
            <div className="grid grid-cols-2 gap-2">
              {(["ERRO_SAQUE","ERRO_ATAQUE","TOQUE_REDE","DOIS_TOQUES","QUATRO_TOQUES","BOLA_FORA","INVASAO"] as TipoErro[])
                .map(e => (
                  <button key={e} onClick={() => e === "ERRO_SAQUE" ? onRegistrar(idSacador, e) : setErro(e)}
                    className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all text-gray-700">
                    {e.replace("ERRO_","").replace(/_/g," ")}
                  </button>
              ))}
            </div>
          )}
          {(!isErro || erro) && (
            <>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {jogadores.map(j => (
                  <button key={j.id} onClick={() => onRegistrar(j.jogadorId, erro ?? undefined)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left group">
                    <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center font-display text-sm font-black text-gray-600 transition-colors">
                      {j.numeroCamisa ?? "–"}
                    </span>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">{j.nomeJogador}</span>
                  </button>
                ))}
                {jogadores.length === 0 && <p className="text-xs text-center text-gray-400 py-6">Nenhum jogador escalado</p>}
              </div>
              <button onClick={() => onRegistrar(undefined, erro ?? undefined)}
                className="w-full text-center text-[11px] font-bold uppercase tracking-widest py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all mt-2">
                Atribuir ponto à equipe
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Página Principal ───────────────────────────────────────── */
export default function PartidaLivePage() {
  const { id: partidaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [partida, setPartida] = useState<Partida | null>(null);
  const [eventos, setEventos] = useState<EventoPartida[]>([]);
  const [jogadores, setJogadores] = useState<JogadorPartida[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ lado: LadoPonto; acao: ActionDef } | null>(null);
  const [alerta, setAlerta] = useState<{ msg: string; onOk: () => void } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [setAtivo, setSetAtivo] = useState(0);

  const load = useCallback(async () => {
    if(!partidaId) return;
    try {
      const [p, evs, jgs] = await Promise.all([
        api.buscarPartida(partidaId),
        api.listarEventosPartida(partidaId),
        api.listarJogadoresPartida(partidaId),
      ]);
      setPartida(p); setEventos(evs); setJogadores(jgs);
      setSetAtivo(p.setsCasa + p.setsVisitante);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [partidaId]);

  useEffect(() => { load(); }, [load]);

  const registrar = async (jogadorId?: string, tipoErro?: TipoErro) => {
    if (!partida || !modal || !partidaId || salvando) return;
    setSalvando(true);
    const nC = partida.setAtualCasa + (modal.lado === "CASA" ? 1 : 0);
    const nV = partida.setAtualVisitante + (modal.lado === "VISITANTE" ? 1 : 0);
    try {
      const jogadorNome = jogadores.find(j => j.jogadorId === jogadorId)?.nomeJogador;
      const { partida: p } = await api.registrarEvento(partidaId, {
        indiceSet: partida.setsCasa + partida.setsVisitante,
        lado: modal.lado, tipo: modal.acao.type, tipoErro, jogadorId, jogadorNome,
        placarCasa: nC, placarVisitante: nV,
      });
      setPartida(p); await load();
      const res = verificarFimSet(p, nC, nV);
      if (res.fimPartida) {
        setAlerta({ msg: `🏆 ${res.vPartida === "CASA" ? p.nomeTimeCasa : p.nomeTimeVisitante} venceu a partida! Encerrar?`, onOk: async () => { await api.finalizarPartida(partidaId); await load(); setAlerta(null); } });
      } else if (res.fimSet) {
        setAlerta({ msg: `${res.vSet === "CASA" ? p.nomeTimeCasa : p.nomeTimeVisitante} venceu o set! Continuar?`, onOk: () => setAlerta(null) });
      }
    } catch (e) { console.error(e); }
    finally { setSalvando(false); setModal(null); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  if (!partida) return <div className="p-10 text-center text-gray-500 bg-gray-100 h-screen">Partida não encontrada</div>;

  const podeGerenciar = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";
  const isAoVivo = partida.status === "AO_VIVO";

  const jCasa = jogadores.filter(j => j.timeId === partida.timeCasaId);
  const jVis = jogadores.filter(j => j.timeId === partida.timeVisitanteId);
  const jModal = modal ? ((modal.acao.type === "ERRO_ADVERSARIO" || modal.acao.type === "CARTAO_ADVERSARIO") ? jogadores.filter(j => j.timeId === (modal.lado === "CASA" ? partida.timeVisitanteId : partida.timeCasaId)) : jogadores.filter(j => j.timeId === (modal.lado === "CASA" ? partida.timeCasaId : partida.timeVisitanteId))) : [];

  const evSetAtivo = eventos.filter(e => !e.anulado && e.indiceSet === setAtivo).reverse();
  const eventosCronologicos = [...evSetAtivo].reverse();
  
  let sacadorAtual: LadoPonto = eventosCronologicos.length > 0 ? eventosCronologicos[eventosCronologicos.length - 1].lado : "CASA";
  let rotCasa = 0, rotVisit = 0, ladoSaque = eventosCronologicos.length > 0 ? eventosCronologicos[0].lado : "CASA";
  for (const ev of eventosCronologicos) {
    if (ev.lado !== ladoSaque) {
      ladoSaque = ev.lado;
      if (ev.lado === 'CASA') rotCasa++; else rotVisit++;
    }
  }

  return (
    <div className="h-screen bg-gray-100 text-gray-900 flex flex-col font-sans overflow-hidden p-0 lg:p-6 lg:pb-8">
      
      {modal && <ModalAcao acao={modal.acao} lado={modal.lado} jogadores={jModal} partida={partida} onRegistrar={registrar} onClose={() => setModal(null)} ladoSaque={ladoSaque} />}
      
      {alerta && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <AlertTriangle className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="font-display font-black text-xl text-gray-900">{alerta.msg}</p>
            <div className="flex gap-3">
              <button onClick={() => setAlerta(null)} className="flex-1 py-3.5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors">Não agora</button>
              <button onClick={alerta.onOk} className="flex-1 py-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTAINER PRINCIPAL 85% DA TELA ── */}
      <div className="max-w-[1400px] lg:w-[85vw] mx-auto flex flex-col flex-1 overflow-hidden bg-white rounded-none lg:rounded-3xl shadow-xl border-x lg:border border-gray-200">
        
        {/* ── HEADER HORIZONTAL CENTRALIZADO ── */}
        <header className="relative flex items-center justify-center p-4 sm:p-5 border-b border-gray-100 bg-white shrink-0">
          
          <div className="absolute left-4 sm:left-6">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-gray-50 text-gray-600 hover:text-gray-900 transition rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              {isAoVivo && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200">
                {isAoVivo ? `Set ${partida.sets.length + 1}` : "Encerrada"}
              </span>
            </div>
            
            <div className="flex items-center gap-6 sm:gap-14 font-display mt-1">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1 h-5">
                  {sacadorAtual === "CASA" && <span className="animate-bounce text-sm">🏐</span>}
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">{partida.nomeTimeCasa}</span>
                </div>
                <div className="text-6xl sm:text-7xl font-black text-gray-900 tabular-nums leading-none">{partida.setAtualCasa}</div>
              </div>
              
              <div className="flex flex-col items-center justify-end h-full pb-2">
                <div className="text-xs font-bold text-gray-500 flex gap-2 uppercase tracking-widest">
                  <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md">Sets <span className="text-gray-900 ml-1">{partida.setsCasa}</span></span>
                  <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md">Sets <span className="text-gray-900 ml-1">{partida.setsVisitante}</span></span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1 h-5">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">{partida.nomeTimeVisitante}</span>
                  {sacadorAtual === "VISITANTE" && <span className="animate-bounce text-sm">🏐</span>}
                </div>
                <div className="text-6xl sm:text-7xl font-black text-gray-900 tabular-nums leading-none">{partida.setAtualVisitante}</div>
              </div>
            </div>
          </div>

          <div className="absolute right-4 sm:right-6 flex gap-2">
            {podeGerenciar && isAoVivo && (
              <>
                <button onClick={async () => { if(confirm("Anular ponto?") && partidaId){ const {partida:p} = await api.anularUltimoEvento(partidaId); setPartida(p); await load(); } }} 
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-[11px] uppercase tracking-wider font-bold bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition text-gray-700">
                  <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Anular</span>
                </button>
                <button onClick={async () => { if(confirm("Encerrar partida?") && partidaId){ await api.finalizarPartida(partidaId); await load(); } }} 
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-[11px] uppercase tracking-wider font-bold bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition">
                  <Flag className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Encerrar</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* ── BARRA DE REGRAS INFORMATIVAS ── */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-gray-500 shrink-0">
          <span className="flex items-center gap-1.5 sm:gap-2">
            <Trophy className="w-3.5 h-3.5 text-emerald-500" /> Sets para vencer: <span className="text-gray-900 font-black">{partida.setsParaVencerPartida ?? 3}</span>
          </span>
          <span className="flex items-center gap-1.5 sm:gap-2">
            <Target className="w-3.5 h-3.5 text-emerald-500" /> Pts por set: <span className="text-gray-900 font-black">{partida.pontosParaVencerSet ?? 25}</span>
          </span>
          <span className="flex items-center gap-1.5 sm:gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-500" /> Tie-break: <span className="text-gray-900 font-black">{partida.pontosParaVencerUltimoSet ?? 15} pts</span>
          </span>
          <span className="flex items-center gap-1.5 sm:gap-2">
            <Users className="w-3.5 h-3.5 text-emerald-500" /> Titulares: <span className="text-gray-900 font-black">{partida.titularesPorTime ?? 6}</span>
          </span>
        </div>

        {/* ── CORPO: 3 COLUNAS ── */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* COLUNA ESQUERDA: CASA */}
          <div className="flex-1 flex flex-col border-r border-gray-100 p-6 overflow-y-auto bg-white">
            <div className="text-center mb-8">
              <h2 className="font-display text-4xl sm:text-5xl font-black text-gray-900 truncate px-4">{partida.nomeTimeCasa}</h2>
              <p className="text-emerald-600 text-xs mt-2 uppercase tracking-[0.2em] font-bold">CASA</p>
            </div>
            
            {isAoVivo && podeGerenciar && (
              <div className="flex-1 flex flex-col gap-3 max-w-sm mx-auto w-full justify-center">
                <div className="grid grid-cols-3 gap-3">
                  {ACOES_PONTO.map(a => (
                    <button key={a.type} onClick={() => setModal({ lado: "CASA", acao: a })} 
                      className="group relative overflow-hidden rounded-2xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100 transition-all p-5 sm:p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md">
                      <span className="text-3xl sm:text-4xl relative z-10 group-hover:scale-110 transition-transform">{a.emoji}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-700 mt-3 relative z-10">{a.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {ACOES_EXTRAS.map(a => (
                    <button key={a.type} onClick={() => setModal({ lado: "CASA", acao: a })} 
                      className={cn("group relative overflow-hidden rounded-xl border hover:opacity-100 transition-all p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow", 
                        a.type === "ERRO_ADVERSARIO" ? "bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-400" : "bg-yellow-50 border-yellow-200 text-yellow-600 hover:border-yellow-400"
                      )}>
                      <span className="text-2xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUNA CENTRAL: QUADRA & HISTÓRICO */}
          <div className="w-full lg:w-[45%] flex flex-col border-r border-gray-100 bg-gray-50 overflow-hidden shrink-0">
            <div className="p-5 border-b border-gray-100 bg-white shadow-sm z-10">
              <Quadra jCasa={jCasa} jVisit={jVis} rotCasa={rotCasa} rotVisit={rotVisit} sacador={sacadorAtual} />
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-gray-50/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Histórico do Set</span>
                </div>
                <span className="text-xs font-bold text-gray-400">{evSetAtivo.length} pts</span>
              </div>
              
              <div className="flex flex-col gap-2">
                {evSetAtivo.map((ev, i) => (
                  <div key={ev.id} className={cn("flex items-center gap-4 p-3.5 rounded-xl border transition-all", i === 0 ? "border-gray-300 bg-white shadow-sm" : "border-gray-200 bg-white/60")}>
                    <div className={cn("w-1.5 h-full absolute left-0 top-0 bottom-0 rounded-l-xl", ev.lado === "CASA" ? "bg-emerald-500" : "bg-orange-400")} />
                    <span className="text-2xl leading-none w-8 text-center">{tipoEmoji(ev.tipo)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-gray-800 truncate">{ev.lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante}</span>
                        <span className="text-gray-500">· {tipoLabel(ev.tipo, ev.tipoErro)}</span>
                      </div>
                      {ev.jogadorNome && (
                        <div className="font-bold text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                          {ev.tipo === "ERRO_ADVERSARIO" || ev.tipo === "CARTAO_ADVERSARIO" ? "FALHA: " : " "} 
                          <span className="text-gray-800">{ev.jogadorNome}</span>
                        </div>
                      )}
                    </div>
                    <span className="font-display text-xl font-black text-gray-900 shrink-0 tabular-nums">
                      {ev.placarCasa}<span className="text-gray-400 font-sans font-normal mx-1.5">-</span>{ev.placarVisitante}
                    </span>
                  </div>
                ))}
                {evSetAtivo.length === 0 && <div className="text-center text-sm text-gray-400 mt-8 font-medium">O set acabou de começar.</div>}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: VISITANTE */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white">
            <div className="text-center mb-8">
              <h2 className="font-display text-4xl sm:text-5xl font-black text-gray-900 truncate px-4">{partida.nomeTimeVisitante}</h2>
              <p className="text-orange-500 text-xs mt-2 uppercase tracking-[0.2em] font-bold">VISITANTE</p>
            </div>
            
            {isAoVivo && podeGerenciar && (
              <div className="flex-1 flex flex-col gap-3 max-w-sm mx-auto w-full justify-center">
                <div className="grid grid-cols-3 gap-3">
                  {ACOES_PONTO.map(a => (
                    <button key={a.type} onClick={() => setModal({ lado: "VISITANTE", acao: a })} 
                      className="group relative overflow-hidden rounded-2xl bg-orange-50 border border-orange-100 hover:border-orange-300 hover:bg-orange-100 transition-all p-5 sm:p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md">
                      <span className="text-3xl sm:text-4xl relative z-10 group-hover:scale-110 transition-transform">{a.emoji}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-orange-600 mt-3 relative z-10">{a.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {ACOES_EXTRAS.map(a => (
                     <button key={a.type} onClick={() => setModal({ lado: "VISITANTE", acao: a })} 
                     className={cn("group relative overflow-hidden rounded-xl border hover:opacity-100 transition-all p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow", 
                       a.type === "ERRO_ADVERSARIO" ? "bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-400" : "bg-yellow-50 border-yellow-200 text-yellow-600 hover:border-yellow-400"
                     )}>
                     <span className="text-2xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                     <span className="text-[10px] font-bold uppercase tracking-wider">{a.label}</span>
                   </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
      `}</style>
    </div>
  );
}