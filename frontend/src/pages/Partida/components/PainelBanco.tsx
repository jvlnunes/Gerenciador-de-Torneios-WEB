import { useState } from "react";
import { JogadorPartida } from "@/services/api";
import { cn } from "@/services/utils";
import { ChevronDown, ArrowLeftRight } from "lucide-react";

interface BankPanelProps {
  titulares: JogadorPartida[];
  reservas: JogadorPartida[];
  cor: "emerald" | "orange";
  nomeTime: string;
  canManage: boolean;
  onSub: () => void;
}

export function BankPanel({ titulares, reservas, cor, nomeTime, canManage, onSub }: BankPanelProps) {
  const [open, setOpen] = useState(false);
  const accent = cor === "emerald" ? "text-emerald-700" : "text-orange-600";
  const bg     = cor === "emerald" ? "bg-emerald-50 border-emerald-200" : "bg-orange-50 border-orange-200";
  const dot    = cor === "emerald" ? "bg-emerald-500" : "bg-orange-400";

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b border-gray-200"
      >
        <span className={`h-2 w-2 rounded-full ${dot} shrink-0`} />
        <span className={`text-[11px] font-black uppercase tracking-widest ${accent} flex-1 truncate`}>
          {nomeTime}
        </span>
        <span className="text-[10px] text-gray-400 font-medium">
          {titulares.length} titular · {reservas.length} reserva
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="p-3 space-y-3">
          {/* Titulares */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Titulares em quadra
            </p>
            <div className="space-y-1">
              {titulares.length === 0 && <p className="text-[11px] text-gray-400 italic">—</p>}
              {titulares.map((j) => (
                <div key={j.id} className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg border", bg)}>
                  <span className="w-6 h-6 rounded-md bg-white font-mono text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
                    {j.numeroCamisa ?? "–"}
                  </span>
                  <span className="text-xs font-semibold text-gray-800 flex-1 truncate">{j.nomeJogador}</span>
                  {j.posicao && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
                      {j.posicao.slice(0, 3)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reservas */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Banco de reservas
            </p>
            <div className="space-y-1">
              {reservas.length === 0 && <p className="text-[11px] text-gray-400 italic">Sem reservas</p>}
              {reservas.map((j) => (
                <div key={j.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
                  <span className="w-6 h-6 rounded-md bg-white font-mono text-xs font-black flex items-center justify-center shrink-0 shadow-sm text-gray-500">
                    {j.numeroCamisa ?? "–"}
                  </span>
                  <span className="text-xs font-medium text-gray-500 flex-1 truncate">{j.nomeJogador}</span>
                  {j.posicao && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
                      {j.posicao.slice(0, 3)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botão substituição */}
          {canManage && (
            <button
              onClick={onSub}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Substituição
            </button>
          )}
        </div>
      )}
    </div>
  );
}