import { cn } from "@/services/utils";

interface SetSelectorProps {
  totalSets: number;
  setsJogados: { casa: number; visitante: number }[];
  setAtual: number;
  setSelecionado: number;
  onSelecionar: (indice: number) => void;
}

export function SetSelector({ totalSets, setsJogados, setAtual, setSelecionado, onSelecionar }: SetSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-1 mt-3 flex-wrap">
      {Array.from({ length: totalSets }, (_, i) => {
        const set = setsJogados[i];
        const isCurrent = i === setAtual;
        const isDone = i < setsJogados.length;
        return (
          <button
            key={i}
            onClick={() => onSelecionar(i)}
            className={cn(
              "px-2 py-1 rounded-full text-[10px] font-bold transition-all border",
              setSelecionado === i && "ring-2 ring-emerald-400 ring-offset-1 ring-offset-white",
              isCurrent
                ? "bg-emerald-600 text-white border-emerald-600"
                : isDone
                  ? "bg-gray-200 text-gray-700 border-gray-200"
                  : "bg-transparent text-gray-300 border-gray-200",
            )}
          >
            S{i + 1}
            {isDone && set && (
              <span className="ml-1 opacity-60 font-normal">
                {set.casa}–{set.visitante}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}