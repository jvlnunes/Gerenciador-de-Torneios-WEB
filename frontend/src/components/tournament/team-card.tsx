import { Link } from "@tanstack/react-router";
import { Shield, Users, Trash2, ChevronRight, Instagram, Globe, Phone } from "lucide-react";
import { type Time } from "@/services/api";
import { cn } from "@/services/utils";

interface Props {
  team: Time;
  torneioId: string;
  onDelete?: (e: React.MouseEvent) => void;
  canManage?: boolean;
}

export function TeamCard({ team, torneioId, onDelete, canManage }: Props) {
  const cor = team.corPrimaria || "var(--color-primary)";
  const corSec = team.corSecundaria || "#ffffff";

  return (
    <Link
      to="/torneios/$id/times/$timeId"
      params={{ id: torneioId, timeId: team.id }}
      className="group block rounded-2xl border-2 border-border bg-card overflow-hidden shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ "--team-color": cor } as React.CSSProperties}
    >
      {/* Faixa superior com cor do time */}
      <div
        className="h-2 w-full transition-all group-hover:h-3"
        style={{ background: `linear-gradient(90deg, ${cor} 0%, ${cor}99 100%)` }}
      />

      <div className="p-4 flex items-center gap-4">
        {/* Brasão */}
        <div
          className="relative h-14 w-14 rounded-xl grid place-items-center shrink-0 overflow-hidden border-2 shadow-sm transition-transform group-hover:scale-105"
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
              className="text-2xl font-black"
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
            <h3
              className="font-display font-bold text-foreground truncate group-hover:text-primary transition-colors"
              style={{ "--tw-text-opacity": 1 } as React.CSSProperties}
            >
              {team.nome}
            </h3>
            {/* Dot de cor */}
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0 border border-background shadow-sm"
              style={{ background: cor }}
            />
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {team.quantidadeJogadores ?? 0} jogador{(team.quantidadeJogadores ?? 0) !== 1 ? "es" : ""}
            </span>

            {/* Redes sociais em miniatura */}
            {team.instagram && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Instagram className="h-3 w-3" />
              </span>
            )}
            {team.site && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Globe className="h-3 w-3" />
              </span>
            )}
            {team.telefone && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Phone className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 shrink-0">
          {canManage && onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(e); }}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Excluir time"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <span className="text-muted-foreground group-hover:text-primary transition-colors p-1">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}