import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { api, type Partida, type EventoPartida, type TipoPonto, type TipoErro, type LadoPonto, type JogadorPartida } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import { RotateCcw, Flag, Loader2, Trophy, CheckCircle2, AlertTriangle, Activity, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/partidas/$id")({
  component: LiveMatchPage,
});

/* ─── Tipos ─────────────────────────────────────────────────── */
type ActionDef = { type: TipoPonto; label: string; emoji: string };

const ACOES_PONTO: ActionDef[] = [
  { type: "SAQUE", label: "Saque", emoji: "🏐" },
  { type: "ATAQUE", label: "Ataque", emoji: "⚡" },
  { type: "BLOQUEIO", label: "Bloqueio", emoji: "🛡️" },
];
const ACOES_EXTRAS: ActionDef[] = [
  { type: "ERRO_ADVERSARIO", label: "Erro adversário", emoji: "✕" },
  { type: "CARTAO_ADVERSARIO", label: "Cartão adversário", emoji: "□" },
];


/* ─── Utilitários ────────────────────────────────────────────── */
function tipoEmoji(t: TipoPonto) {
  const m: Record<string, string> = {
    SAQUE: "🏐", ATAQUE: "⚡", BLOQUEIO: "🛡️", ERRO_ADVERSARIO: "❌", CARTAO_ADVERSARIO: "🟨",
  };
  return m[t] ?? "•";
}

function tipoLabel(t: TipoPonto, err?: string) {
  if (t === "ERRO_ADVERSARIO") return err ? err.replace(/_/g, " ") : "Erro Adv.";
  const m: Record<string, string> = {
    SAQUE: "Saque", ATAQUE: "Ataque", BLOQUEIO: "Bloqueio", CARTAO_ADVERSARIO: "Cartão",
  };
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

    if (nC >= sv || nV >= sv) {
      return { fimSet: true, vSet, fimPartida: true, vPartida: (nC >= sv ? "CASA" : "VISITANTE") as LadoPonto };

    }
    return { fimSet: true, vSet, fimPartida: false, vPartida: null };

  }
  return { fimSet: false, vSet: null, fimPartida: false, vPartida: null };
}

/* ─── Quadra de Vôlei unificada e com Rodízio ────────────────────────────────────────── */
function Quadra({ jCasa, jVisit, rotCasa, rotVisit, sacador, corCasa = "primary", corVisit = "amber" }: {
  jCasa: JogadorPartida[];
  jVisit: JogadorPartida[];
  rotCasa: number;
  rotVisit: number;
  sacador: LadoPonto;
  corCasa?: string;
  corVisit?: string;
}) {
  const getJogador = (j: JogadorPartida[], vSlot: number, rot: number) => {
    const idxOriginal = (vSlot - 1 + rot) % 6;
    return j[idxOriginal] ?? null;
  }

  const Slot = ({ lado, vSlot, isServer, cor}: { lado: "CASA"|"VISIT", vSlot: number, isServer: boolean, cor: string }) => {
    const j = getJogador(lado === "CASA"? jCasa : jVisit, vSlot, lado === "CASA"? rotCasa : rotVisit);
    const bgCor = cor === "primary" ? "bg-primary" : "bg-amber-600";

    return (
      <div className="relative flex flex-col items-center justify-center min-h-[65px] z-10 transition-all duration-300">
         <span className="absolute top-1 left-1.5 text-[10px] font-black text-white/40">{vSlot}</span>
         {j && (
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md border-2 border-white text-white z-10", bgCor)}>
              {j.numeroCamisa ?? "?"}
            </div>
         )}
         {j && (
            <span className="text-[9px] text-white font-bold mt-1 truncate max-w-[90%] px-1 text-center bg-black/40 rounded py-0.5">
              {j.nomeJogador.split(" ")[0]}
            </span>
         )}
      </div>
    );
  }
  return (
    <div className="w-full bg-[#E56E3B] rounded-xl border-4 border-white relative flex overflow-hidden aspect-[1.8/1] shadow-inner max-w-2xl mx-auto">
       {/* Antena / Rede Central */}
       <div className="absolute top-0 bottom-0 left-1/2 w-1.5 bg-white -translate-x-1/2 z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex flex-col justify-between items-center py-1">
          <div className="w-3 h-3 bg-white rounded-full absolute -top-1" />
          <div className="w-3 h-3 bg-white rounded-full absolute -bottom-1" />
       </div>

       {/* LADO CASA (Esquerda) */}
       <div className="flex-1 grid grid-cols-[2fr_1fr] grid-rows-3 relative">
          <div className="absolute top-0 bottom-0 right-[33.33%] w-[2px] bg-white/40 z-0" />
          <Slot lado="CASA" vSlot={5} cor="primary" /> <Slot lado="CASA" vSlot={4} cor="primary" />
          <Slot lado="CASA" vSlot={6} cor="primary" /> <Slot lado="CASA" vSlot={3} cor="primary" />
          <Slot lado="CASA" vSlot={1} cor="primary" /> <Slot lado="CASA" vSlot={2} cor="primary" />
       </div>

       {/* LADO VISITANTE (Direita) - Posição 1 no topo direito */}
       <div className="flex-1 grid grid-cols-[1fr_2fr] grid-rows-3 relative">
          <div className="absolute top-0 bottom-0 left-[33.33%] w-[2px] bg-white/40 z-0" />
          <Slot lado="VISIT" vSlot={2} cor="amber" /> <Slot lado="VISIT" vSlot={1} cor="amber" />
          <Slot lado="VISIT" vSlot={3} cor="amber" /> <Slot lado="VISIT" vSlot={6} cor="amber" />
          <Slot lado="VISIT" vSlot={4} cor="amber" /> <Slot lado="VISIT" vSlot={5} cor="amber" />
       </div>
    </div>
  )
}

/* ─── Modal de ação ──────────────────────────────────────────── */
function ModalAcao({
  acao, lado, jogadores, partida, onRegistrar, onClose,  idSacador, ladoSaque = "CASA"
}: {
  acao: ActionDef; 
  lado: LadoPonto; 
  jogadores: JogadorPartida[];
  partida: Partida; 
  ladoSaque: LadoPonto;
  idSacador?: string;
  onRegistrar: (id?: string, err?: TipoErro) => void; onClose: () => void;
}) {
  const [erro, setErro] = useState<TipoErro | null>(null);
  const isErro = acao.type === "ERRO_ADVERSARIO";
  const timeNome = lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante;
  const timeQueErrou = lado === "CASA" ? "VISITANTE" : "CASA"; 
  const isErroDoSacador = isErro && timeQueErrou === ladoSaque;

  console.log("ModalAcao", { acao, lado, jogadores, partida, ladoSaque, idSacador, isErro, isErroDoSacador });

  return (    
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50">
      <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-lg">{acao.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">{acao.label}</p>
            <p className="text-xs text-muted-foreground truncate">{timeNome}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted text-xs transition-colors">✕</button>
        </div>
        <div className="p-4 space-y-3">
          {isErro && !erro && (
            <div className="grid grid-cols-2 gap-1.5">
              {(["ERRO_SAQUE","ERRO_ATAQUE","TOQUE_REDE","DOIS_TOQUES","QUATRO_TOQUES","BOLA_FORA","INVASAO"] as TipoErro[])
                // .filter(e => e === "ERRO_SAQUE" ? isErroDoSacador : true) // Só mostra Erro de Saque se for o time que saca
                .map(e => (
                  <button key={e} onClick={() => {
                    if (e === "ERRO_SAQUE") {
                      onRegistrar(idSacador, e); 
                    } else {
                      setErro(e);
                    }
                  }}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/60 font-medium transition-colors">
                    {e.replace("ERRO_","").replace(/_/g," ")}
                  </button>
              ))}
            </div>
          )}
          {(!isErro || erro) && (
            <>
              <div className="max-h-44 overflow-y-auto space-y-1">
                {jogadores.map(j => (
                  <button key={j.id} onClick={() => onRegistrar(j.jogadorId, erro ?? undefined)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all text-left">
                    <span className="w-7 h-7 rounded-md bg-primary/10 grid place-items-center font-mono text-xs font-bold text-primary shrink-0">
                      {j.numeroCamisa ?? "–"}
                    </span>
                    <span className="text-sm font-medium text-foreground">{j.nomeJogador}</span>
                  </button>
                ))}
                {jogadores.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-3">Nenhum jogador escalado</p>
                )}
              </div>
              <button onClick={() => onRegistrar(undefined, erro ?? undefined)}
                className="w-full text-center text-xs py-2.5 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 font-semibold transition-all">
                Atribuir à equipe
              </button>
            </>
          )}
          <button onClick={onClose} className="w-full text-xs text-muted-foreground py-1.5 hover:text-foreground transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Página Principal ───────────────────────────────────────── */
function LiveMatchPage() {
  const { id: partidaId } = Route.useParams();
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [partidaId]);

  useEffect(() => { load(); }, [load]);

  const registrar = async (jogadorId?: string, tipoErro?: TipoErro) => {
    if (!partida || !modal || salvando) return;
    setSalvando(true);
    const nC = partida.setAtualCasa + (modal.lado === "CASA" ? 1 : 0);
    const nV = partida.setAtualVisitante + (modal.lado === "VISITANTE" ? 1 : 0);
    try {
      const { partida: p } = await api.registrarEvento(partidaId, {
        indiceSet: partida.setsCasa + partida.setsVisitante,
        lado: modal.lado, tipo: modal.acao.type, tipoErro, jogadorId, jogadorNome,
        placarCasa: nC, placarVisitante: nV,
      });
      setPartida(p);
      await load();
      const res = verificarFimSet(p, nC, nV);
      if (res.fimPartida) {
        const nome = res.vPartida === "CASA" ? p.nomeTimeCasa : p.nomeTimeVisitante;
        setAlerta({
          msg: `🏆 ${nome} venceu a partida! Encerrar?`, onOk: async () => {
            await api.finalizarPartida(partidaId); await load(); setAlerta(null);
          }
        });
      } else if (res.fimSet) {
        const nome = res.vSet === "CASA" ? p.nomeTimeCasa : p.nomeTimeVisitante;
        setAlerta({ msg: `${nome} venceu o set! Continuar para o próximo?`, onOk: () => setAlerta(null) });
      }
    } catch (e) { console.error(e); }
    finally { setSalvando(false); setModal(null); }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!partida) return <div className="p-10 text-center text-muted-foreground">Partida não encontrada</div>;

  const podeGerenciar = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";
  const isAoVivo = partida.status === "AO_VIVO";
  const isAgendada = partida.status === "AGENDADA" || partida.status === "AQUECIMENTO";
  const isFinalizada = partida.status === "FINALIZADA";

  const jCasa = jogadores.filter(j => j.timeId === partida.timeCasaId);
  const jVis = jogadores.filter(j => j.timeId === partida.timeVisitanteId);

  const jModal = modal
    ? (modal.acao.type === "ERRO_ADVERSARIO" || modal.acao.type === "CARTAO_ADVERSARIO")
      ? jogadores.filter(j => j.timeId === (modal.lado === "CASA" ? partida.timeVisitanteId : partida.timeCasaId))
      : jogadores.filter(j => j.timeId === (modal.lado === "CASA" ? partida.timeCasaId : partida.timeVisitanteId))
    : [];

  const setsAnt = partida.sets ?? [];
  const totalSetsDisputa = (partida.setsParaVencerPartida ?? 3) * 2 - 1;
  const setLabels = Array.from({ length: totalSetsDisputa }, (_, i) => `S${i + 1}`);

  const evSetAtivo = eventos.filter(e => !e.anulado && e.indiceSet === setAtivo).reverse();

  // Calcular Rodízio
  const eventosCronologicos = [...evSetAtivo].reverse();
  let sacadorAtual: LadoPonto = "CASA"
  if (eventosCronologicos.length > 0 ){
    sacadorAtual = eventosCronologicos[0].lado;
  }

  let rotCasa = 0;
  let rotVisit = 0;
  let ladoSaque = sacadorAtual;

  for (const ev of eventosCronologicos) {
    if (ev.lado !== ladoSaque) {
      ladoSaque = ev.lado;
      if (ev.lado === 'CASA') rotCasa++;
      else rotVisit++;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {modal && (
        <ModalAcao acao={modal.acao} lado={modal.lado} jogadores={jModal} partida={partida}
          onRegistrar={registrar} onClose={() => setModal(null)} />
      )}

      {alerta && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <AlertTriangle className="h-9 w-9 text-primary mx-auto" />
            <p className="font-bold text-foreground text-sm">{alerta.msg}</p>
            <div className="flex gap-2">
              <button onClick={() => setAlerta(null)}
                className="flex-1 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                Não agora
              </button>
              <button onClick={alerta.onOk}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-3 py-4 space-y-2.5">

        {/* Voltar */}
        <Link to="/torneios" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Partidas
        </Link>

        {/* ══ BLOCO 1: PLACAR ══════════════════════════════════════ */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">

          {/* Barra superior: status + botões de ação */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
            <div className="flex items-center gap-1.5">
              {isAoVivo && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                isAoVivo ? "text-green-600" : isFinalizada ? "text-muted-foreground" : "text-amber-600"
              )}>
                {isAoVivo ? "Ao vivo" : isFinalizada ? "Finalizada" : "Agendada"}
              </span>
            </div>

            {podeGerenciar && !isFinalizada && (
              <div className="flex items-center gap-1.5">
                {isAgendada && (
                  <button
                    onClick={async () => { if (confirm("Iniciar a partida?")) { const p = await api.comecaPartida(partidaId); setPartida(p); } }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold transition-colors"
                  >
                    <Flag className="h-3 w-3" /> Iniciar
                  </button>
                )}
                {isAoVivo && (
                  <>
                    <button
                      onClick={async () => { if (confirm("Anular último ponto?")) { const { partida: p } = await api.anularUltimoEvento(partidaId); setPartida(p); await load(); } }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-[10px] font-semibold text-foreground transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" /> Anular último ponto
                    </button>
                    <button
                      onClick={async () => { if (confirm("Encerrar a partida permanentemente?")) { const p = await api.finalizarPartida(partidaId); setPartida(p); await load(); } }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-[10px] font-bold transition-colors"
                    >
                      <Flag className="h-3 w-3" /> Encerrar partida
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Placar */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-4 py-4">
            <div className="text-center">
              <p className="font-display font-black text-base leading-tight text-foreground">{partida.nomeTimeCasa}</p>
              <p className="text-[10px] text-muted-foreground">Casa</p>
            </div>
            <div className="text-center px-3">
              <div className="flex items-baseline gap-2.5">
                <span className="font-display font-black text-6xl leading-none tabular-nums text-foreground">
                  {partida.setAtualCasa}
                </span>
                <span className="text-muted-foreground font-bold text-2xl leading-none">–</span>
                <span className="font-display font-black text-6xl leading-none tabular-nums text-foreground">
                  {partida.setAtualVisitante}
                </span>
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                {partida.setsCasa} <span className="font-normal"></span> × {partida.setsVisitante}
              </p>
            </div>
            <div className="text-center">
              <p className="font-display font-black text-base leading-tight text-foreground">{partida.nomeTimeVisitante}</p>
              <p className="text-[10px] text-muted-foreground">Visitante</p>
            </div>
          </div>

          {/* Pills de set */}
          <div className="flex items-center justify-center gap-1 px-4 pb-4">
            {setLabels.map((label, i) => {
              const set = setsAnt[i];
              const isCurrent = i === partida.setsCasa + partida.setsVisitante;
              const isDone = i < setsAnt.length;
              return (
                <button key={i} onClick={() => setSetAtivo(i)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border",
                    setAtivo === i && "ring-2 ring-primary ring-offset-1 ring-offset-card",
                    isCurrent ? "bg-primary text-primary-foreground border-primary"
                      : isDone ? "bg-muted text-foreground border-border"
                        : "bg-transparent text-muted-foreground/50 border-border/30"
                  )}>
                  {label}
                  {isDone && set && <span className="ml-1 opacity-60 font-normal">{set.casa}–{set.visitante}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ BLOCO 2: REGRAS ═══════════════════════════════════════ */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 rounded-xl border border-border bg-card text-[10px]">
          {[
            { icon: "🏆", k: "Sets para vencer", v: partida.setsParaVencerPartida ?? 3 },
            { icon: "📊", k: "Pts/set", v: partida.pontosParaVencerSet ?? 25 },
            { icon: "⚡", k: "Set decisivo", v: `${partida.pontosParaVencerUltimoSet ?? 15} pts` },
            { icon: "👥", k: "Titulares", v: partida.titularesPorTime ?? 6 },
            // { icon: "🔁", k: "Vencer por 2", v: "Sim" },
          ].map(r => (
            <span key={r.k} className="flex items-center gap-1 shrink-0 text-muted-foreground">
              {r.icon}
              <span className="font-semibold text-foreground">{r.k}:</span>
              <span className="font-bold text-primary">{r.v}</span>
            </span>
          ))}
        </div>

        {/* ══ BLOCO 3: QUADRA UNIFICADA + AÇÕES ════════════════ */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-muted/20">
            <span className="text-[11px] font-black uppercase tracking-widest text-primary">{partida.nomeTimeCasa}</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-500">{partida.nomeTimeVisitante}</span>
          </div>
          
          <div className="p-3 sm:p-5 bg-[#071c0b]">
            <Quadra 
              jCasa={jCasa} 
              jVisit={jVis} 
              rotCasa={rotCasa} 
              rotVisit={rotVisit} 
              sacador={ladoSaque} 
            />
          </div>

          {isAoVivo && podeGerenciar && (
            <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-muted/10">
              {/* Ações Casa */}
              <div className="p-2 space-y-1.5">
                <div className="grid grid-cols-3 gap-1">
                  {ACOES_PONTO.map(a => (
                    <button key={a.type} onClick={() => setModal({ lado: "CASA", acao: a })}
                      className="flex flex-col items-center gap-0.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/15 active:scale-95 py-2 px-0.5 transition-all">
                      <span className="text-base">{a.emoji}</span>
                      <span className="text-[9px] font-bold text-primary leading-tight text-center">{a.label}</span>
                    </button>
                  ))}
                </div>
                {ACOES_EXTRAS.map(a => (
                  <button key={a.type} onClick={() => setModal({ lado: "CASA", acao: a })}
                    className={cn(
                      "w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border bg-background hover:bg-muted/50 active:scale-95 text-[10px] font-semibold transition-all",
                      a.type === "ERRO_ADVERSARIO" ? "border-orange-500/30 text-orange-700" : "border-yellow-400/30 text-yellow-700"
                    )}>
                    {a.emoji} {a.label}
                  </button>
                ))}
              </div>

              {/* Ações Visitante */}
              <div className="p-2 space-y-1.5">
                <div className="grid grid-cols-3 gap-1">
                  {ACOES_PONTO.map(a => (
                    <button key={a.type} onClick={() => setModal({ lado: "VISITANTE", acao: a })}
                      className="flex flex-col items-center gap-0.5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 active:scale-95 py-2 px-0.5 transition-all">
                      <span className="text-base">{a.emoji}</span>
                      <span className="text-[9px] font-bold text-amber-600 leading-tight text-center">{a.label}</span>
                    </button>
                  ))}
                </div>
                {ACOES_EXTRAS.map(a => (
                  <button key={a.type} onClick={() => setModal({ lado: "VISITANTE", acao: a })}
                    className={cn(
                      "w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border bg-background hover:bg-muted/50 active:scale-95 text-[10px] font-semibold transition-all",
                      a.type === "ERRO_ADVERSARIO" ? "border-orange-500/30 text-orange-700" : "border-yellow-400/30 text-yellow-700"
                    )}>
                    {a.emoji} {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ BLOCO 4: HISTÓRICO COM NOME DESTACADO ════════════════ */}
        {evSetAtivo.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
              <Activity className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                Histórico — {setAtivo === partida.setsCasa + partida.setsVisitante ? "Set atual" : `Set ${setAtivo + 1}`}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">{evSetAtivo.length} pts</span>
            </div>
            <div className="divide-y divide-border/40 max-h-44 overflow-y-auto">
              {evSetAtivo.map((ev, i) => (
                <div key={ev.id} className={cn("flex items-center gap-2 px-3 py-2 text-xs", i === 0 && "bg-primary/5")}>
                  <span className={cn("h-2 w-2 rounded-full shrink-0", ev.lado === "CASA" ? "bg-primary" : "bg-amber-500")} />
                  <span className="text-sm leading-none">{tipoEmoji(ev.tipo)}</span>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="font-semibold text-foreground">
                        {ev.lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante}
                      </span>
                      <span className="text-muted-foreground">· {tipoLabel(ev.tipo, ev.tipoErro)}</span>
                    </div>
                    {/* AQUI ESTÁ O DESTAQUE DO JOGADOR NO HISTÓRICO */}
                    {ev.jogadorNome && (
                      <span className="font-bold text-[10px] text-foreground/80 mt-0.5">
                        {ev.tipo === "ERRO_ADVERSARIO" || ev.tipo === "CARTAO_ADVERSARIO" ? "FALHA DE: " : "AUTOR: "} 
                        <span className="text-foreground">{ev.jogadorNome}</span>
                      </span>
                    )}
                  </div>
                  
                  <span className="font-mono text-sm font-black text-foreground shrink-0 tabular-nums">
                    {ev.placarCasa}<span className="text-muted-foreground font-normal mx-0.5">-</span>{ev.placarVisitante}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ENCERRADA ═══════════════════════════════════════════ */}
        {isFinalizada && (
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 text-center space-y-2">
            <Trophy className="h-10 w-10 text-primary mx-auto" />
            <h2 className="font-display text-xl font-black text-foreground">Partida encerrada</h2>
            <p className="text-sm text-muted-foreground">
              Resultado final:{" "}
              <span className="font-bold text-foreground">{partida.setsCasa}</span>
              {" × "}
              <span className="font-bold text-foreground">{partida.setsVisitante}</span> sets
            </p>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}