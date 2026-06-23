import { useState } from "react";
import { JogadorPartida, Partida, LadoPonto, TipoErro } from "@/services/api";
import { ActionDef } from "../utils/LogicaPartida";

export interface ModalAcaoProps {
  acao: ActionDef;
  lado: LadoPonto;
  jogadores: JogadorPartida[];
  partida: Partida;
  ladoSaque: LadoPonto;
  idSacador?: string;
  onRegistrar: (id?: string, err?: TipoErro) => void;
  onClose: () => void;
}

export function ModalAcao({
  acao, lado, jogadores, partida, onRegistrar, onClose, idSacador, ladoSaque,
}: ModalAcaoProps) {
  const [erro, setErro] = useState<TipoErro | null>(null);
  const isErro = acao.type === "ERRO_ADVERSARIO";
  const timeNome = lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante;

  // Lógica de interceptação e proteção
  const handleErroClick = (e: TipoErro) => {
    if (e === "ERRO_SAQUE") {
      // Descobre quem é o adversário baseado no lado que está recebendo o ponto
      const ladoAdversario = lado === "CASA" ? "VISITANTE" : "CASA";
      
      // Validação: O adversário estava sacando?
      if (ladoSaque !== ladoAdversario) {
        alert("Ação inválida! O time adversário não está com o saque no momento.");
        return; // Bloqueia a execução aqui!
      }
      
      // Se estava tudo certo, atribui ao sacador automaticamente
      onRegistrar(idSacador, e);
    } else {
      // Se for outro erro, vai para a tela de escolher qual jogador cometeu a falha
      setErro(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <span className="text-2xl">{acao.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-black tracking-wide text-gray-900">{acao.label}</p>
            <p className="text-xs text-gray-500 truncate uppercase tracking-widest">{timeNome}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Tela 1: Escolhendo o tipo do erro */}
          {isErro && !erro && (
            <div className="grid grid-cols-2 gap-2">
              {(["ERRO_SAQUE", "ERRO_ATAQUE", "TOQUE_REDE", "DOIS_TOQUES", "QUATRO_TOQUES", "INVASAO", "BOLA_FORA", "CONDUCAO", "ERRO_ROTACAO"] as TipoErro[]).map((e) => (
                <button
                  key={e}
                  onClick={() => handleErroClick(e)}
                  className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all text-gray-700"
                >
                  {e.replace("ERRO_", "").replace(/_/g, " ")}
                </button>
              ))}
            </div>
          )}

          {/* Tela 2: Escolhendo o jogador que cometeu a ação */}
          {(!isErro || erro) && (
            <>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {jogadores.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => onRegistrar(j.jogadorId, erro ?? undefined)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center font-display text-sm font-black text-gray-600 transition-colors">
                      {j.numeroCamisa ?? "–"}
                    </span>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">{j.nomeJogador}</span>
                  </button>
                ))}
                {jogadores.length === 0 && (
                  <p className="text-xs text-center text-gray-400 py-6">Nenhum jogador escalado</p>
                )}
              </div>
              <button
                onClick={() => onRegistrar(undefined, erro ?? undefined)}
                className="w-full text-center text-[11px] font-bold uppercase tracking-widest py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
              >
                Atribuir ponto à equipe
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}