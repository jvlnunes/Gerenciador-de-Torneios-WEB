import type { EventoPartida, Partida } from "@/services/api/interfaces";
import { Trophy, Swords, Shield, Zap, XCircle } from "lucide-react";

interface Props {
  eventos: EventoPartida[];
  partida: Partida;
  setAtivo: number;
  agregarTodosSets?: boolean;
}

interface LinhaSet {
  casa: number;
  visitante: number;
}

interface CategoriaStats {
  key: string;
  label: string;
  icon: React.ReactNode;
  porSet: LinhaSet[];
}

function contarPorTipo(
  eventos: EventoPartida[],
  totalSets: number,
  predicate: (ev: EventoPartida, lado: "CASA" | "VISITANTE") => boolean,
): LinhaSet[] {
  return Array.from({ length: totalSets }, (_, indiceSet) => {
    const evsDoSet = eventos.filter((e) => !e.anulado && e.indiceSet === indiceSet);
    return {
      casa: evsDoSet.filter((e) => predicate(e, "CASA")).length,
      visitante: evsDoSet.filter((e) => predicate(e, "VISITANTE")).length,
    };
  });
}

function pontosFinaisPorSet(eventos: EventoPartida[], totalSets: number): LinhaSet[] {
  return Array.from({ length: totalSets }, (_, indiceSet) => {
    const evsDoSet = eventos.filter((e) => !e.anulado && e.indiceSet === indiceSet);
    if (evsDoSet.length === 0) return { casa: 0, visitante: 0 };
    const ultimo = evsDoSet.reduce((acc, e) =>
      new Date(e.horario).getTime() > new Date(acc.horario).getTime() ? e : acc
    );
    return { casa: ultimo.placarCasa, visitante: ultimo.placarVisitante };
  });
}

function somarSets(porSet: LinhaSet[]): LinhaSet {
  return porSet.reduce(
    (acc, s) => ({ casa: acc.casa + s.casa, visitante: acc.visitante + s.visitante }),
    { casa: 0, visitante: 0 },
  );
}

export function EstatisticasComparativoTime({ eventos, partida, setAtivo, agregarTodosSets = false }: Props) {
  const setsJaComEvento = new Set(eventos.filter((e) => !e.anulado).map((e) => e.indiceSet));
  const totalSets = Math.max(
    partida.setsCasa + partida.setsVisitante + (partida.status === "AO_VIVO" ? 1 : 0),
    setsJaComEvento.size,
    1,
  );

  const categorias: CategoriaStats[] = [
    {
      key: "pontos",
      label: "PONTOS",
      icon: <Trophy className="h-3.5 w-3.5" />,
      porSet: pontosFinaisPorSet(eventos, totalSets),
    },
    {
      key: "ataques",
      label: "ATAQUES",
      icon: <Swords className="h-3.5 w-3.5" />,
      porSet: contarPorTipo(eventos, totalSets, (e, lado) => e.tipo === "ATAQUE" && e.lado === lado),
    },
    {
      key: "bloqueios",
      label: "BLOQUEIOS",
      icon: <Shield className="h-3.5 w-3.5" />,
      porSet: contarPorTipo(eventos, totalSets, (e, lado) => e.tipo === "BLOQUEIO" && e.lado === lado),
    },
    {
      key: "saques",
      label: "SAQUES (ACE)",
      icon: <Zap className="h-3.5 w-3.5" />,
      porSet: contarPorTipo(eventos, totalSets, (e, lado) => e.tipo === "SAQUE" && e.lado === lado),
    },
    {
      key: "erros",
      label: "ERROS ADV.",
      icon: <XCircle className="h-3.5 w-3.5" />,
      porSet: contarPorTipo(eventos, totalSets, (e, lado) => e.tipo === "ERRO_ADVERSARIO" && e.lado === lado),
    },
  ];

  const colunasSet = Array.from({ length: totalSets }, (_, i) => i);

  return (
    <div className="p-4 space-y-3">
      {/* Cabeçalho dos times */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-black text-emerald-700 truncate max-w-[38%]">
          {partida.nomeTimeCasa}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">
          {agregarTodosSets ? "Total da partida" : `Set ${setAtivo + 1} em destaque`}
        </span>
        <span className="text-sm font-black text-orange-600 truncate max-w-[38%] text-right">
          {partida.nomeTimeVisitante}
        </span>
      </div>

      {/* Card único reunindo todas as categorias */}
      <div className="rounded-xl border border-border overflow-hidden bg-card divide-y divide-border">
        {categorias.map((cat) => {
          const destaque = agregarTodosSets
            ? somarSets(cat.porSet)
            : cat.porSet[setAtivo] ?? { casa: 0, visitante: 0 };
          const total = destaque.casa + destaque.visitante;
          const pctCasa = total > 0 ? (destaque.casa / total) * 100 : 50;
          const pctVisitante = total > 0 ? 100 - pctCasa : 50;

          return (
            <div key={cat.key} className="px-3 py-2.5 space-y-1.5">
              {/* Rótulo da categoria, centralizado acima da barra */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {cat.icon}
                <span>{cat.label}</span>
              </div>

              {/* Barra comparativa única — set em destaque ou soma de todos os sets */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-700 w-6 text-right tabular-nums shrink-0">
                  {destaque.casa}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                    style={{ width: `${pctCasa}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-l from-orange-400 to-orange-500 transition-all duration-300"
                    style={{ width: `${pctVisitante}%` }}
                  />
                </div>
                <span className="text-xs font-black text-orange-600 w-6 text-left tabular-nums shrink-0">
                  {destaque.visitante}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}