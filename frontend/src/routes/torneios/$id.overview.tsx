import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { api, type Partida, type Torneio } from "@/services/api";
import { useOutletContext } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/services/utils";
import {
  Swords, Plus, Clock, MapPin, Trophy, Calendar,
  Users, Loader2, ChevronRight, MessageCircle, Send,
} from "lucide-react";

export const Route = createFileRoute("/torneios/$id/overview")({
  component: TournamentOverviewPage,
});

interface OutletCtx {
  torneio: Torneio;
  torneioId: string;
  canManage: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  AO_VIVO:   "bg-green-100 text-green-700 border-green-200",
  AGENDADA:  "bg-muted text-muted-foreground",
  FINALIZADA:"bg-secondary text-secondary-foreground",
  AQUECIMENTO:"bg-amber-100 text-amber-700",
};

const STATUS_LABEL: Record<string, string> = {
  AO_VIVO:   "Ao vivo",
  AGENDADA:  "Agendada",
  FINALIZADA:"Finalizada",
  AQUECIMENTO:"Aquecimento",
};

/* ── Comentário mock (sem backend ainda) ── */
interface Comment { id: string; author: string; text: string; time: string; }
const MOCK_COMMENTS: Comment[] = [
  { id: "1", author: "João Silva",    text: "Tigres jogando muito bem hoje!", time: "há 3 min" },
  { id: "2", author: "Ana Oliveira",  text: "Quadra cheia, atmosfera incrível 🏐", time: "há 7 min" },
  { id: "3", author: "Marcos Rocha",  text: "Que saque espetacular do número 7!", time: "há 12 min" },
];

export function TournamentOverviewPage() {
  const { torneio, torneioId, canManage } = useOutletContext<OutletCtx>();
  const navigate = useNavigate();

  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);

  const load = useCallback(async () => {
    try {
      const ms = await api.listarPartidas(torneioId);
      setPartidas(ms);
    } finally {
      setLoading(false);
    }
  }, [torneioId]);

  useEffect(() => { load(); }, [load]);

  const live      = partidas.filter(p => p.status === "AO_VIVO");
  const scheduled = partidas.filter(p => p.status === "AGENDADA" || p.status === "AQUECIMENTO");
  const finished  = partidas.filter(p => p.status === "FINALIZADA");

  const sendComment = () => {
    if (!commentText.trim()) return;
    setComments(prev => [
      { id: Date.now().toString(), author: "Você", text: commentText.trim(), time: "agora" },
      ...prev,
    ]);
    setCommentText("");
  };

  const totalJogadores = partidas.length > 0 ? Math.floor(Math.random() * 40 + 40) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ── Banner ── */}
      <div className="relative rounded-2xl overflow-hidden mb-6 h-44 shadow-sm">
        {torneio.bannerUrl ? (
          <img src={torneio.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-5 flex items-end gap-3">
          {torneio.logoUrl ? (
            <img src={torneio.logoUrl} alt="Logo" className="h-14 w-14 rounded-xl object-cover border-2 border-white/30 shadow" />
          ) : (
            <div className="h-14 w-14 rounded-xl border-2 border-white/20 grid place-items-center shadow" style={{ background: "var(--gradient-primary)" }}>
              <Trophy className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-black text-white leading-tight">{torneio.nome}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              {torneio.local && (
                <span className="text-xs text-white/70 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{torneio.local}
                </span>
              )}
              {torneio.dataInicio && (
                <span className="text-xs text-white/70 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(torneio.dataInicio).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          </div>
        </div>
        {live.length > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {live.length} ao vivo
          </div>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Times",    value: "8",              icon: Users },
          { label: "Partidas", value: String(partidas.length), icon: Swords },
          { label: "Ao vivo",  value: String(live.length),   icon: Swords, green: true },
          { label: "Finalizadas", value: String(finished.length), icon: Trophy },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center shadow-sm">
            <p className={cn("font-display text-2xl font-black", s.green && live.length > 0 ? "text-green-600" : "text-foreground")}>
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* ── Coluna esquerda: partidas ── */}
        <div className="space-y-5">

          {/* Ao vivo */}
          {live.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-green-600">Ao vivo</h2>
              </div>
              <div className="space-y-2">
                {live.map(m => (
                  <div
                    key={m.id}
                    onClick={() => navigate({ to: "/partidas/$id", params: { id: m.id } })}
                    className="rounded-xl border-2 border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800 p-4 cursor-pointer hover:border-green-400 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-right">
                        <p className="font-display font-bold text-foreground">{m.nomeTimeCasa}</p>
                        <p className="text-xs text-muted-foreground">Casa</p>
                      </div>
                      <div className="mx-4 px-4 py-2 rounded-xl text-center" style={{ background: "linear-gradient(135deg,#0a0a0a,#052e16)" }}>
                        <span className="font-display text-2xl font-black text-white tabular-nums">
                          {m.setAtualCasa} – {m.setAtualVisitante}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-display font-bold text-foreground">{m.nomeTimeVisitante}</p>
                        <p className="text-xs text-muted-foreground">Visitante</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2 text-xs text-green-600 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      Sets: {m.setsCasa} × {m.setsVisitante} · Clique para gerenciar
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Agendadas */}
          {scheduled.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Agendadas</h2>
                {canManage && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                    <Link to={`/torneios/${torneioId}/matches` as any}>
                      <Plus className="h-3 w-3" /> Nova partida
                    </Link>
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {scheduled.slice(0, 4).map(m => (
                  <div key={m.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 shadow-sm">
                    <div className="px-3 py-2 rounded-lg bg-muted text-center min-w-[3rem]">
                      <span className="font-display text-sm font-bold text-muted-foreground">vs</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {m.nomeTimeCasa} <span className="text-muted-foreground font-normal">vs</span> {m.nomeTimeVisitante}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {m.agendadoPara && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(m.agendadoPara).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {m.local && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{m.local}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!loading && partidas.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-border py-14 text-center">
              <Swords className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <h3 className="mt-3 font-display text-lg font-bold">Nenhuma partida ainda</h3>
              <p className="text-sm text-muted-foreground mt-1">As partidas aparecerão aqui quando criadas.</p>
              {canManage && (
                <Button className="mt-4 gap-2" size="sm" asChild>
                  <Link to={`/torneios/${torneioId}/matches` as any}>
                    <Plus className="h-3.5 w-3.5" /> Criar partida
                  </Link>
                </Button>
              )}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* ── Coluna direita: comentários ── */}
        <div className="flex flex-col gap-5">
          {/* Ir para partidas */}
          <div
            className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 cursor-pointer hover:border-primary/40 transition-all"
            onClick={() => navigate({ to: "/torneios/$id/matches" as any, params: { id: torneioId } })}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/15 grid place-items-center">
                <Swords className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Gerenciar partidas</p>
                <p className="text-xs text-muted-foreground">{partidas.length} partidas · {live.length} ao vivo</p>
              </div>
              <ChevronRight className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Comentários */}
          <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Comentários</h3>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 divide-y divide-border">
              {comments.map(c => (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-full bg-primary/10 grid place-items-center text-[10px] font-bold text-primary flex-shrink-0">
                      {c.author[0]}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-8">{c.text}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-3 flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendComment()}
                placeholder="Comentar..."
                className="flex-1 text-xs bg-muted/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary border border-border placeholder:text-muted-foreground"
              />
              <button
                onClick={sendComment}
                className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:bg-primary/90 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Descrição */}
          {torneio.descricao && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Sobre</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{torneio.descricao}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}