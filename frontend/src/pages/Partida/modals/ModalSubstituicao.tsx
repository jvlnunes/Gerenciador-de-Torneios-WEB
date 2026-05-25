import { useState } from "react";
import { cn } from "@/services/utils";
import {
  type LadoPonto,
  type JogadorPartida,
} from "@/services/api";
import {
  CheckCircle2,
  ArrowLeftRight
} from "lucide-react";


interface SubModalProps {
  lado: LadoPonto;
  nomeCasa: string;
  nomeVis: string;
  titulares: JogadorPartida[];
  reservas: JogadorPartida[];
  onConfirm: (entrando: string, saindo: string) => void;
  onClose: () => void;
}

function SubModal({ lado, nomeCasa, nomeVis, titulares, reservas, onConfirm, onClose }: SubModalProps) {
  const [entrando, setEntrando] = useState<string>("");
  const [saindo, setSaindo] = useState<string>("");

  const nomeTime = lado === "CASA" ? nomeCasa : nomeVis;
  const cor = lado === "CASA" ? "emerald" : "orange";

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <ArrowLeftRight className={cn(
            "h-5 w-5",
            cor === "emerald" ? "text-emerald-600" : "text-orange-500"
          )} />
          <div className="flex-1">
            <h2 className="font-display font-black text-lg text-gray-900">Substituição</h2>
            <p className={cn(
              "text-xs font-bold uppercase tracking-wider",
              cor === "emerald" ? "text-emerald-600" : "text-orange-500"
            )}>
              {nomeTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Quem entra */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Entra (reserva)
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {reservas.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">Sem reservas disponíveis</p>
              )}
              {reservas.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setEntrando(j.jogadorId)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all",
                    entrando === j.jogadorId
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <span className="w-7 h-7 rounded-md bg-gray-100 text-gray-600 font-mono text-xs font-black flex items-center justify-center shrink-0">
                    {j.numeroCamisa ?? "–"}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 flex-1 truncate">{j.nomeJogador}</span>
                  {entrando === j.jogadorId && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Quem sai */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Sai (titular)
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {titulares.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSaindo(j.jogadorId)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all",
                    saindo === j.jogadorId
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <span className="w-7 h-7 rounded-md bg-gray-100 text-gray-600 font-mono text-xs font-black flex items-center justify-center shrink-0">
                    {j.numeroCamisa ?? "–"}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 flex-1 truncate">{j.nomeJogador}</span>
                  {saindo === j.jogadorId && <CheckCircle2 className="h-4 w-4 text-red-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => entrando && saindo && onConfirm(entrando, saindo)}
            disabled={!entrando || !saindo}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              entrando && saindo
                ? "bg-gray-900 text-white hover:bg-gray-800 shadow"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}