import { cn } from "@/services/utils";
import { Settings, Timer, Zap } from "lucide-react";

interface ModalConfiguracaoProps {
  configTimer: boolean;
  setConfigTimer: (v: boolean) => void;
  configAutoSaque: boolean;
  setConfigAutoSaque: (v: boolean) => void;
  onClose: () => void;
}

export function ModalConfiguracao({
  configTimer, setConfigTimer, configAutoSaque, setConfigAutoSaque, onClose
}: ModalConfiguracaoProps) {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <Settings className="h-5 w-5 text-gray-500" />
          <h2 className="font-display font-black text-lg text-gray-900 flex-1">Configurações</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-lg transition-colors">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Toggle Timer */}
          <button 
            onClick={() => setConfigTimer(!configTimer)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", configTimer ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400")}>
                <Timer className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">Timer do Set</p>
                <p className="text-[10px] text-gray-500">Exibir cronômetro na barra superior</p>
              </div>
            </div>
            <div className={cn("w-10 h-6 rounded-full transition-colors relative", configTimer ? "bg-emerald-500" : "bg-gray-300")}>
              <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", configTimer ? "left-5" : "left-1")} />
            </div>
          </button>

          {/* Toggle Auto Saque */}
          <button 
            onClick={() => setConfigAutoSaque(!configAutoSaque)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", configAutoSaque ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400")}>
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">Saque Inteligente</p>
                <p className="text-[10px] text-gray-500">Atribuir Ace/Erro auto. para a Posição 1</p>
              </div>
            </div>
            <div className={cn("w-10 h-6 rounded-full transition-colors relative", configAutoSaque ? "bg-blue-500" : "bg-gray-300")}>
              <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", configAutoSaque ? "left-5" : "left-1")} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}