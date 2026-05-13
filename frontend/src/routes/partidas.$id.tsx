import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  api,
  type Partida,
  type EventoPartida,
  type TipoPonto,
  type TipoErro,
  type LadoPonto,
  type JogadorPartida,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import {
  RotateCcw, Flag, Loader2, Trophy, CheckCircle2,
  AlertTriangle, Activity, ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/partidas/$id")({
  component: LiveMatchPage,
});

/* ─── Tipos ─────────────────────────────────────────────────── */
type ActionDef = { type: TipoPonto; label: string; emoji: string };

const ACOES_PONTO: ActionDef[] = [
  { type: "SAQUE",    label: "Saque",    emoji: "🏐" },
  { type: "ATAQUE",   label: "Ataque",   emoji: "⚡" },
  { type: "BLOQUEIO", label: "Bloqueio", emoji: "🛡️" },
];
const ACOES_EXTRAS: ActionDef[] = [
  { type: "ERRO_ADVERSARIO",   label: "Erro adversário",   emoji: "✕" },
  { type: "CARTAO_ADVERSARIO", label: "Cartão adversário", emoji: "□" },
];

/* ─── Layout posições quadra (rotação oficial) ───────────────── */
// Frente(rede): 4 | 3 | 2
// Fundo(saque): 5 | 6 | 1
const SLOTS = [
  { slot: 4, row: 0, col: 0 },
  { slot: 3, row: 0, col: 1 },
  { slot: 2, row: 0, col: 2 },
  { slot: 5, row: 1, col: 0 },
  { slot: 6, row: 1, col: 1 },
  { slot: 1, row: 1, col: 2 },
];

/* ─── Utilitários ────────────────────────────────────────────── */
function tipoEmoji(t: TipoPonto) {
  const m: Record<string, string> = {
    SAQUE:"🏐", ATAQUE:"⚡", BLOQUEIO:"🛡️", ERRO_ADVERSARIO:"❌", CARTAO_ADVERSARIO:"🟨",
  };
  return m[t] ?? "•";
}
function tipoLabel(t: TipoPonto, err?: string) {
  if (t === "ERRO_ADVERSARIO") return err ? err.replace(/_/g," ") : "Erro Adv.";
  const m: Record<string, string> = {
    SAQUE:"Saque", ATAQUE:"Ataque", BLOQUEIO:"Bloqueio", CARTAO_ADVERSARIO:"Cartão",
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
      return { fimSet:true, vSet, fimPartida:true, vPartida:(nC >= sv ? "CASA" : "VISITANTE") as LadoPonto };
    }
    return { fimSet:true, vSet, fimPartida:false, vPartida:null };
  }
  return { fimSet:false, vSet:null, fimPartida:false, vPartida:null };
}

/* ─── Quadra de Vôlei ────────────────────────────────────────── */
function Quadra({ jogadores, cor }: { jogadores: JogadorPartida[]; cor: "primary" | "amber" }) {
  const get = (slot: number) => jogadores[slot - 1] ?? null;
  const accentCls = cor === "primary" ? "text-primary" : "text-amber-500";
  return (
    <div
      className="rounded-lg overflow-hidden border border-white/10 grid grid-rows-2 gap-px"
      style={{ background: "#071c0b" }}
    >
      {/* Label rede no topo */}
      <div className="col-span-3 flex items-center justify-center bg-primary/20 py-0.5">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/70">rede</span>
      </div>
      {[0, 1].map(row => (
        <div key={row} className="grid grid-cols-3 gap-px">
          {SLOTS.filter(s => s.row === row).map(({ slot }) => {
            const j = get(slot);
            const isSaque = slot === 1;
            return (
              <div key={slot} className={cn(
                "relative flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-all",
                j ? "bg-white/[0.08]" : "bg-white/[0.02]",
              )}>
                {isSaque && (
                  <span className="absolute top-0.5 right-0.5 text-[7px] text-primary/70 font-black">↑</span>
                )}
                {j ? (
                  <>
                    <span className={cn("font-black text-sm leading-none", accentCls)}>
                      {j.numeroCamisa ?? "?"}
                    </span>
                    <span className="text-white/50 text-[9px] mt-0.5 truncate max-w-full px-1 leading-tight">
                      {j.nomeJogador.split(" ")[0]}
                    </span>
                  </>
                ) : (
                  <span className="text-white/10 text-[9px] font-bold">{slot}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── Modal de ação ──────────────────────────────────────────── */
function ModalAcao({
  acao, lado, jogadores, partida, onRegistrar, onClose,
}: {
  acao: ActionDef; lado: LadoPonto; jogadores: JogadorPartida[];
  partida: Partida; onRegistrar: (id?: string, err?: TipoErro) => void; onClose: () => void;
}) {
  const [erro, setErro] = useState<TipoErro | null>(null);
  const isErro = acao.type === "ERRO_ADVERSARIO";
  const timeNome = lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante;

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
              {(["ERRO_SAQUE","ERRO_ATAQUE","TOQUE_REDE","DOIS_TOQUES","QUATRO_TOQUES","BOLA_FORA","INVASAO"] as TipoErro[]).map(e => (
                <button key={e} onClick={() => setErro(e)}
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

  const [partida, setPartida]     = useState<Partida | null>(null);
  const [eventos, setEventos]     = useState<EventoPartida[]>([]);
  const [jogadores, setJogadores] = useState<JogadorPartida[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<{ lado: LadoPonto; acao: ActionDef } | null>(null);
  const [alerta, setAlerta]       = useState<{ msg: string; onOk: () => void } | null>(null);
  const [salvando, setSalvando]   = useState(false);
  const [setAtivo, setSetAtivo]   = useState(0);

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
        lado: modal.lado, tipo: modal.acao.type, tipoErro, jogadorId,
        placarCasa: nC, placarVisitante: nV,
      });
      setPartida(p);
      await load();
      const res = verificarFimSet(p, nC, nV);
      if (res.fimPartida) {
        const nome = res.vPartida === "CASA" ? p.nomeTimeCasa : p.nomeTimeVisitante;
        setAlerta({ msg: `🏆 ${nome} venceu a partida! Encerrar?`, onOk: async () => {
          await api.finalizarPartida(partidaId); await load(); setAlerta(null);
        }});
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
  const isAoVivo    = partida.status === "AO_VIVO";
  const isAgendada  = partida.status === "AGENDADA" || partida.status === "AQUECIMENTO";
  const isFinalizada = partida.status === "FINALIZADA";

  const jCasa = jogadores.filter(j => j.timeId === partida.timeCasaId);
  const jVis  = jogadores.filter(j => j.timeId === partida.timeVisitanteId);

  const jModal = modal
    ? (modal.acao.type === "ERRO_ADVERSARIO" || modal.acao.type === "CARTAO_ADVERSARIO")
      ? jogadores.filter(j => j.timeId === (modal.lado === "CASA" ? partida.timeVisitanteId : partida.timeCasaId))
      : jogadores.filter(j => j.timeId === (modal.lado === "CASA" ? partida.timeCasaId : partida.timeVisitanteId))
    : [];

  const setsAnt = partida.sets ?? [];
  const totalSetsDisputa = (partida.setsParaVencerPartida ?? 3) * 2 - 1;
  const setLabels = Array.from({ length: totalSetsDisputa }, (_, i) => `S${i + 1}`);

  const evSetAtivo = eventos.filter(e => !e.anulado && e.indiceSet === setAtivo).reverse();

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
                    onClick={async () => { if (confirm("Iniciar a partida?")) { const p = await api.comecaPartida(partidaId); setPartida(p); }}}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold transition-colors"
                  >
                    <Flag className="h-3 w-3" /> Iniciar
                  </button>
                )}
                {isAoVivo && (
                  <>
                    <button
                      onClick={async () => { if (confirm("Anular último ponto?")) { const { partida: p } = await api.anularUltimoEvento(partidaId); setPartida(p); await load(); }}}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-[10px] font-semibold text-foreground transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" /> Anular último ponto
                    </button>
                    <button
                      onClick={async () => { if (confirm("Encerrar a partida permanentemente?")) { const p = await api.finalizarPartida(partidaId); setPartida(p); await load(); }}}
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
            { icon: "📊", k: "Pts/set",          v: partida.pontosParaVencerSet ?? 25 },
            { icon: "⚡", k: "Set decisivo",     v: `${partida.pontosParaVencerUltimoSet ?? 15} pts` },
            { icon: "👥", k: "Titulares",        v: partida.titularesPorTime ?? 6 },
            { icon: "🔁", k: "Vencer por 2",     v: "Sim" },
          ].map(r => (
            <span key={r.k} className="flex items-center gap-1 shrink-0 text-muted-foreground">
              {r.icon}
              <span className="font-semibold text-foreground">{r.k}:</span>
              <span className="font-bold text-primary">{r.v}</span>
            </span>
          ))}
        </div>

        {/* ══ BLOCO 3: QUADRAS + AÇÕES (2 colunas) ════════════════ */}
        <div className="grid grid-cols-2 gap-2.5">

          {/* Casa */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="text-primary">{partida.nomeTimeCasa}</span>
              </p>
            </div>
            <div className="p-2">
              <Quadra jogadores={jCasa} cor="primary" />
            </div>

            {isAoVivo && podeGerenciar && (
              <div className="px-2 pb-2 space-y-1.5 border-t border-border pt-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Ações — <span className="text-primary">Casa</span>
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {ACOES_PONTO.map(a => (
                    <button key={a.type} onClick={() => setModal({ lado: "CASA", acao: a })}
                      className="flex flex-col items-center gap-0.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/15 active:scale-95 py-2 px-0.5 transition-all">
                      <span className="text-base">{a.emoji}</span>
                      <span className="text-[9px] font-bold text-primary leading-tight text-center">{a.label}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  {ACOES_EXTRAS.map(a => (
                    <button key={a.type} onClick={() => setModal({ lado: "CASA", acao: a })}
                      className={cn(
                        "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg border bg-background hover:bg-muted/50 active:scale-95 text-[10px] font-semibold transition-all",
                        a.type === "ERRO_ADVERSARIO"
                          ? "border-orange-500/30 text-orange-700"
                          : "border-yellow-400/30 text-yellow-700"
                      )}>
                      <span className={cn(
                        "w-4 h-4 rounded text-[9px] font-black grid place-items-center shrink-0",
                        a.type === "ERRO_ADVERSARIO" ? "bg-orange-500/20" : "bg-yellow-400/20"
                      )}>{a.emoji}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Visitante */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="text-amber-500">{partida.nomeTimeVisitante}</span>{" "}
                <span className="font-normal normal-case text-muted-foreground/60">(visit.)</span>
              </p>
            </div>
            <div className="p-2">
              <Quadra jogadores={jVis} cor="amber" />
            </div>

            {isAoVivo && podeGerenciar && (
              <div className="px-2 pb-2 space-y-1.5 border-t border-border pt-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Ações — <span className="text-amber-500">Visitante</span>
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {ACOES_PONTO.map(a => (
                    <button key={a.type} onClick={() => setModal({ lado: "VISITANTE", acao: a })}
                      className="flex flex-col items-center gap-0.5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 active:scale-95 py-2 px-0.5 transition-all">
                      <span className="text-base">{a.emoji}</span>
                      <span className="text-[9px] font-bold text-amber-600 leading-tight text-center">{a.label}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  {ACOES_EXTRAS.map(a => (
                    <button key={a.type} onClick={() => setModal({ lado: "VISITANTE", acao: a })}
                      className={cn(
                        "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg border bg-background hover:bg-muted/50 active:scale-95 text-[10px] font-semibold transition-all",
                        a.type === "ERRO_ADVERSARIO"
                          ? "border-orange-500/30 text-orange-700"
                          : "border-yellow-400/30 text-yellow-700"
                      )}>
                      <span className={cn(
                        "w-4 h-4 rounded text-[9px] font-black grid place-items-center shrink-0",
                        a.type === "ERRO_ADVERSARIO" ? "bg-orange-500/20" : "bg-yellow-400/20"
                      )}>{a.emoji}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ BLOCO 4: HISTÓRICO ═══════════════════════════════════ */}
        {evSetAtivo.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
              <Activity className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                Histórico de pontos — {setAtivo === partida.setsCasa + partida.setsVisitante ? "Set atual" : `Set ${setAtivo + 1}`}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">{evSetAtivo.length} pts</span>
            </div>
            <div className="divide-y divide-border/40 max-h-44 overflow-y-auto">
              {evSetAtivo.map((ev, i) => (
                <div key={ev.id} className={cn(
                  "flex items-center gap-2 px-3 py-2 text-xs",
                  i === 0 && "bg-primary/5"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ev.lado === "CASA" ? "bg-primary" : "bg-amber-500")} />
                  <span className="text-sm leading-none">{tipoEmoji(ev.tipo)}</span>
                  <span className="flex-1 min-w-0 text-[11px]">
                    <span className="font-semibold text-foreground">
                      {ev.lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante}
                    </span>
                    <span className="text-muted-foreground"> · {tipoLabel(ev.tipo, ev.tipoErro)}</span>
                    {ev.nomeJogador && <span className="text-muted-foreground"> — {ev.nomeJogador.split(" ")[0]}</span>}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-muted-foreground shrink-0">{ev.placarCasa}–{ev.placarVisitante}</span>
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