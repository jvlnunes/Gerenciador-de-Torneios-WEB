import { useState } from "react";
import { Flag, Trophy, AlertTriangle } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";
import { cn } from "@/services/utils";
import type { LadoPonto } from "@/services/api/types";
import type { Partida } from "@/services/api/interfaces";

export interface ModalEncerrarPartidaProps {
  partida: Partida;
  onConfirmar: (vencedor: LadoPonto | null) => void | Promise<void>;
  onFechar: () => void;
}

export function ModalEncerrarPartida({ partida, onConfirmar, onFechar }: ModalEncerrarPartidaProps) {
  const [vencedor, setVencedor] = useState<LadoPonto | "SEM_VENCEDOR" | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const handleConfirmar = async () => {
    if (vencedor === null) return;
    setConfirmando(true);
    try {
      await onConfirmar(vencedor === "SEM_VENCEDOR" ? null : vencedor);
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <ModalShell
      onClose={onFechar}
      backdropClassName="bg-gray-900/50 p-4"
      contentClassName="max-w-sm bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
        <Flag className="h-5 w-5 text-red-500" />
        <div>
          <h2 className="font-display font-black text-lg text-gray-900">Encerrar partida</h2>
          <p className="text-xs text-gray-500 mt-0.5">Essa ação não pode ser desfeita.</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          Escolha se a partida termina com um vencedor definido ou é encerrada sem resultado (ex: WO, suspensão).
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setVencedor("CASA")}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
              vencedor === "CASA"
                ? "border-emerald-500 bg-emerald-50 shadow-sm"
                : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
            )}
          >
            <Trophy className={cn("h-4 w-4 shrink-0", vencedor === "CASA" ? "text-emerald-600" : "text-gray-300")} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{partida.nomeTimeCasa}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Vence a partida</p>
            </div>
          </button>

          <button
            onClick={() => setVencedor("VISITANTE")}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
              vencedor === "VISITANTE"
                ? "border-orange-500 bg-orange-50 shadow-sm"
                : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
            )}
          >
            <Trophy className={cn("h-4 w-4 shrink-0", vencedor === "VISITANTE" ? "text-orange-600" : "text-gray-300")} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{partida.nomeTimeVisitante}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Vence a partida</p>
            </div>
          </button>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ou</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={() => setVencedor("SEM_VENCEDOR")}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
              vencedor === "SEM_VENCEDOR"
                ? "border-gray-800 bg-gray-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <Flag className={cn("h-4 w-4 shrink-0", vencedor === "SEM_VENCEDOR" ? "text-gray-800" : "text-gray-300")} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Encerrar sem vencedor</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Mantém o placar atual</p>
            </div>
          </button>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
        <button
          onClick={onFechar}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          disabled={vencedor === null || confirmando}
          onClick={handleConfirmar}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all shadow",
            vencedor !== null && !confirmando
              ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          {confirmando ? "Encerrando..." : "Confirmar"}
        </button>
      </div>
    </ModalShell>
  );
}