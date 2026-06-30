import { useState, useEffect } from "react";
import { JogadorPartida, LadoPonto } from "@/services/api";
import { cn } from "@/services/utils";
import { CheckCircle2, Play, Users } from "lucide-react";

export interface SetStartModalProps {
  aberto: boolean;
  setNum: number;
  jCasa: JogadorPartida[];
  jVis: JogadorPartida[];
  nomeCasa: string;
  nomeVis: string;
  maxTitulares: number;
  onConfirm: (titularesCasa: string[], titularesVis: string[], saqueInicial: LadoPonto) => void;
  onClose: () => void;
}

export function ModalInicioSet({
  aberto, setNum, jCasa, jVis, nomeCasa, nomeVis, maxTitulares, onConfirm, onClose,
}: SetStartModalProps) {
  
  const [selCasa, setSelCasa] = useState<Set<string>>(new Set());
  const [selVis, setSelVis] = useState<Set<string>>(new Set());
  const [saqueInicial, setSaqueInicial] = useState<LadoPonto | null>(null);

  useEffect(() => {
    if (aberto) {
      // Puxa os titulares padrão da Casa
      const titularesConfigCasa = jCasa.filter(j => j.titular).map(j => j.jogadorId);
      const fallbackCasa = titularesConfigCasa.length === maxTitulares 
        ? titularesConfigCasa 
        : jCasa.map(j => j.jogadorId).slice(0, maxTitulares);
      
      // Puxa os titulares padrão do Visitante
      const titularesConfigVis = jVis.filter(j => j.titular).map(j => j.jogadorId);
      const fallbackVis = titularesConfigVis.length === maxTitulares 
        ? titularesConfigVis 
        : jVis.map(j => j.jogadorId).slice(0, maxTitulares);

      setSelCasa(new Set(fallbackCasa));
      setSelVis(new Set(fallbackVis));
      setSaqueInicial(null); // Reseta o sacador
    }
  }, [aberto, jCasa, jVis, maxTitulares]);

  if (!aberto) return null;

  const togglePlayer = (id: string, sel: Set<string>, setSel: (s: Set<string>) => void) => {
    const next = new Set(sel);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= maxTitulares) return; 
      next.add(id);
    }
    setSel(next);
  };

  const canConfirm = selCasa.size === maxTitulares && selVis.size === maxTitulares && saqueInicial !== null;

  const PlayerList = ({ jogadores, sel, setSel, cor }: any) => {
    const colorClass = cor === "emerald" 
      ? "bg-emerald-50 border-emerald-500 text-emerald-900" 
      : "bg-orange-50 border-orange-500 text-orange-900";

    return (
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {jogadores.map((j: JogadorPartida) => {
          const isSelected = sel.has(j.jogadorId);
          return (
            <button
              key={j.jogadorId}
              onClick={() => togglePlayer(j.jogadorId, sel, setSel)}
              className={cn(
                "w-full flex items-center justify-between p-2 rounded-lg border text-sm transition-all",
                isSelected ? colorClass : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-6 h-6 rounded flex items-center justify-center font-bold text-xs",
                  isSelected ? (cor === "emerald" ? "bg-emerald-500 text-white" : "bg-orange-500 text-white") : "bg-gray-100"
                )}>
                  {j.numeroCamisa ?? "-"}
                </span>
                <span className={isSelected ? "font-bold" : "font-medium"}>{j.nomeJogador}</span>
              </div>
              {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Preparação do Set {setNum}</h2>
            <p className="text-sm text-slate-500">Selecione os titulares e quem começa sacando.</p>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Seletor de Saque */}
          <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
            <span className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Quem começa sacando?</span>
            <div className="flex gap-4 w-full max-w-md">
              <button
                onClick={() => setSaqueInicial("CASA")}
                className={cn(
                  "flex-1 py-3 rounded-lg font-bold border-2 transition-all",
                  saqueInicial === "CASA" ? "bg-emerald-500 border-emerald-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-500 hover:border-emerald-300"
                )}
              >
                {nomeCasa}
              </button>
              <button
                onClick={() => setSaqueInicial("VISITANTE")}
                className={cn(
                  "flex-1 py-3 rounded-lg font-bold border-2 transition-all",
                  saqueInicial === "VISITANTE" ? "bg-orange-500 border-orange-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-500 hover:border-orange-300"
                )}
              >
                {nomeVis}
              </button>
            </div>
          </div>

          {/* Seleção de Elenco */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-emerald-700 uppercase tracking-wider">{nomeCasa}</h3>
                <span className={cn("text-xs font-black px-2 py-0.5 rounded-full", selCasa.size === maxTitulares ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                  {selCasa.size}/{maxTitulares}
                </span>
              </div>
              <PlayerList jogadores={jCasa} sel={selCasa} setSel={setSelCasa} cor="emerald" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-orange-700 uppercase tracking-wider">{nomeVis}</h3>
                <span className={cn("text-xs font-black px-2 py-0.5 rounded-full", selVis.size === maxTitulares ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500")}>
                  {selVis.size}/{maxTitulares}
                </span>
              </div>
              <PlayerList jogadores={jVis} sel={selVis} setSel={setSelVis} cor="orange" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">Cancelar</button>
          <button
            onClick={() => onConfirm([...selCasa], [...selVis], saqueInicial!)}
            disabled={!canConfirm}
            className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm", canConfirm ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md" : "bg-gray-200 text-gray-400 cursor-not-allowed")}
          >
            Confirmar e Iniciar Set <Play className="h-4 w-4" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}