import { cn } from "@/services/utils";
import type { EventoPartida, Partida } from "@/services/api/interfaces";
import { Trophy, Swords, Shield, Zap, XCircle } from "lucide-react";

interface Props {
  eventos: EventoPartida[]; 
  partida: Partida;
  setAtivo: number; 
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

export function EstatisticasComparativoTime({ eventos, partida, setAtivo }: Props) {
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
          Set {setAtivo + 1} em destaque
        </span>
        <span className="text-sm font-black text-orange-600 truncate max-w-[38%] text-right">
          {partida.nomeTimeVisitante}
        </span>
      </div>

      {categorias.map((cat) => {
        const destaque = cat.porSet[setAtivo] ?? { casa: 0, visitante: 0 };
        const maiorValor = Math.max(destaque.casa, destaque.visitante, 1);

        return (
          <div key={cat.key} className="rounded-xl border border-border overflow-hidden bg-card">
            {/* Linha de valores por set (histórico, como na tabela da VNL) */}
            <div className="flex items-stretch bg-muted/40 border-b border-border">
              <div className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground shrink-0 w-[92px] sm:w-28">
                {cat.icon}
                <span className="truncate">{cat.label}</span>
              </div>
              <div
                className="flex-1 grid"
                style={{ gridTemplateColumns: `repeat(${colunasSet.length}, minmax(0, 1fr))` }}
              >
                {colunasSet.map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-center py-1 border-l border-border",
                      i === setAtivo && "bg-primary/5"
                    )}
                  >
                    <p className="text-[9px] font-bold text-muted-foreground">S{i + 1}</p>
                    <p className="text-[11px] sm:text-xs font-black text-foreground tabular-nums">
                      {cat.porSet[i]?.casa ?? 0}
                      <span className="text-muted-foreground font-normal mx-0.5">-</span>
                      {cat.porSet[i]?.visitante ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Barra comparativa do set em destaque (estilo VNL) */}
            <div className="p-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-700 w-6 text-right tabular-nums shrink-0">
                  {destaque.casa}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${(destaque.casa / maiorValor) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-orange-600 w-6 text-right tabular-nums shrink-0">
                  {destaque.visitante}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${(destaque.visitante / maiorValor) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}