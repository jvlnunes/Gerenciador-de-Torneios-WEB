import type { Torneio, Time } from "@/services/api/interfaces";
import { useEffect, useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Plus, Loader2, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalCriarTime } from "@/pages/Torneio/modals/ModalCriarTime"

interface TorneioCtx {
  torneio: Torneio;
  torneioId: string;
  liveCount: number;
  canManage: boolean;
}

/* ─── Card do time ───────────────────────────────────────── */
function TimeCard({
  team,
  canManage,
  onClick,
  onDelete,
}: {
  team: Time;
  canManage: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const cor = team.corPrimaria || "var(--color-primary)";
  const corSec = team.corSecundaria || "#ffffff";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group w-full text-left rounded-2xl border-2 border-border bg-card overflow-hidden shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Faixa colorida superior */}
      <div
        className="h-2 w-full transition-all duration-300 group-hover:h-3"
        style={{ background: `linear-gradient(90deg, ${cor} 0%, ${cor}99 100%)` }}
      />

      <div className="p-4 flex items-center gap-4">
        {/* Brasão */}
        <div
          className="relative h-14 w-14 rounded-xl grid place-items-center shrink-0 overflow-hidden border-2 shadow-sm transition-transform duration-200 group-hover:scale-105"
          style={{ background: cor, borderColor: `${cor}44` }}
        >
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt={`Brasão ${team.nome}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="text-2xl font-black leading-none"
              style={{ color: corSec }}
            >
              {team.nome?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
          {/* Brilho no hover */}
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {team.nome}
            </h3>
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0 border border-background shadow-sm"
              style={{ background: cor }}
            />
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {team.quantidadeJogadores ?? 0} jogador{(team.quantidadeJogadores ?? 0) !== 1 ? "es" : ""}
            </span>
            {team.instagram && <span title="Instagram">📸</span>}
            {team.whatsapp && <span title="WhatsApp">💬</span>}
            {team.site && <span title="Site">🌐</span>}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 shrink-0">
          {canManage && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Excluir time"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
          <span className="text-muted-foreground group-hover:text-primary transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────── */
export default function TorneioTimes() {
  const { torneio, torneioId, canManage } = useOutletContext<TorneioCtx>();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Time[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTeams(await api.times.listarPorTorneio(torneioId)); }
    finally { setLoading(false); }
  }, [torneioId]);

  useEffect(() => { load(); }, [load]);

  const deleteTeam = async (id: string) => {
    if (!confirm("Excluir este time? Todos os jogadores serão removidos.")) return;
    await api.times.remover(id);
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {showCreate && (
        <ModalCriarTime
          torneioId={torneioId}
          onCreated={(t) => {
            setTeams((prev) => [...prev, t]);
            setShowCreate(false);
            navigate(`/torneios/${torneioId}/times/${t.id}`);
          }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-black text-foreground">Times</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {torneio.nome} · {teams.length} time{teams.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo time
          </Button>
        )}
      </div>

      {/* Stats rápidas */}
      {teams.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Times", value: teams.length },
            { label: "Jogadores", value: teams.reduce((a, t) => a + (t.quantidadeJogadores ?? 0), 0) },
            {
              label: "Média/time",
              value: Math.round(
                teams.reduce((a, t) => a + (t.quantidadeJogadores ?? 0), 0) / Math.max(teams.length, 1)
              ),
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center shadow-sm">
              <p className="font-display text-2xl font-black text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h2 className="mt-4 font-display text-2xl font-bold text-foreground">Nenhum time ainda</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
            Adicione os times participantes para criar partidas.
          </p>
          {canManage && (
            <Button className="mt-6 gap-2" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Criar primeiro time
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <TimeCard
              key={t.id}
              team={t}
              canManage={canManage}
              onClick={() => navigate(`/torneios/${torneioId}/times/${t.id}`)}
              onDelete={() => deleteTeam(t.id)}
            />
          ))}

          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-2xl border-2 border-dashed border-border py-10 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2"
            >
              <Plus className="h-6 w-6" />
              Adicionar time
            </button>
          )}
        </div>
      )}
    </div>
  );
}