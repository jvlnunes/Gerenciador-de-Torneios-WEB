import { Link } from "@tanstack/react-router"
import { Shield, Users, Trash2 } from "lucide-react"
import { type Time } from "@/services/api"

interface Props {
  team: Time
  torneioId: string
  onDelete?: (e: React.MouseEvent) => void
  canManage?: boolean
}

export function TeamCard({ team, torneioId, onDelete, canManage }: Props) {
  const cor = team.corPrimaria || "var(--primary)"

  return (
    <Link
      to="/torneios/$id/times/$timeId"
      params={{ id: torneioId, timeId: team.id }}
      className="group block rounded-2xl border-2 border-border bg-card overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Faixa com a cor do time */}
      <div className="h-2 w-full" style={{ background: cor }} />

      <div className="p-4 flex items-center gap-3">
        {/* Brasão */}
        <div
          className="h-14 w-14 rounded-xl grid place-items-center shrink-0 border-2 overflow-hidden"
          style={{ borderColor: cor, background: `color-mix(in oklch, ${cor} 12%, transparent)` }}
        >
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={`Brasão ${team.nome}`} className="h-full w-full object-cover" />
          ) : (
            <Shield className="h-6 w-6" style={{ color: cor }} />
          )}
        </div>

        {/* Nome e meta */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {team.nome}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {team.quantidadeJogadores ?? 0} jogador{(team.quantidadeJogadores ?? 0) !== 1 ? "es" : ""}
          </p>
        </div>

        {canManage && onDelete && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(e) }}
            className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Excluir time"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </Link>
  )
}