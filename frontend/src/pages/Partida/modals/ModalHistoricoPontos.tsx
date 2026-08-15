import { ModalShell } from "@/components/ui/modal-shell";
import { HistoricoSet } from "../components/HistoricoSet";
import type { EventoPartida, Partida } from "@/services/api/interfaces";
import type { RegistroSubstituicao } from "../components/Escalacao";

export interface ModalHistoricoPontosProps {
  eventos: EventoPartida[];
  substituicoes: RegistroSubstituicao[];
  partida: Partida;
  setStarted: boolean;
  isFinalizada: boolean;
  setAtivoParaHistorico: number | null;
  onClose: () => void;
}

export function ModalHistoricoPontos({
  eventos,
  substituicoes,
  partida,
  setStarted,
  isFinalizada,
  setAtivoParaHistorico,
  onClose,
}: ModalHistoricoPontosProps) {
  return (
    <ModalShell
      onClose={onClose}
      align="end"
      backdropClassName="bg-black/60 sm:items-center"
      contentClassName="sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <span className="text-sm font-black text-gray-800">
          {isFinalizada
            ? `Histórico — ${setAtivoParaHistorico !== null ? `Set ${setAtivoParaHistorico + 1}` : "Partida"}`
            : "Histórico do set"}
        </span>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-lg"
        >
          ×
        </button>
      </div>
      <HistoricoSet
        eventos={eventos}
        substituicoes={substituicoes}
        partida={partida}
        setStarted={setStarted}
      />
    </ModalShell>
  );
}