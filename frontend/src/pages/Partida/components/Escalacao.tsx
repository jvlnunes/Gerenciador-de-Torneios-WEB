import type { JogadorPartida } from "@/services/api/interfaces";

export type IndicePosicao = 0 | 1 | 2 | 3 | 4 | 5;

export const LABEL_POSICAO: Record<number, string> = {
  0: "Pos 5",
  1: "Pos 1",
  2: "Pos 6",
  3: "Pos 4",
  4: "Pos 3",
  5: "Pos 2",
};

/** Um jogador posicionado em quadra para um time */
export interface TitularEmQuadra {
  jogadorId: string;
  indicePosicao: IndicePosicao;
}

/** Escalação completa de um lado (casa ou visitante) */
export interface EscalacaoTime {
  timeId: string;
  titulares: TitularEmQuadra[];
  banco: string[]; // IDs dos reservas
  indicePosicaoSaque: IndicePosicao;
}

/** Escalação das duas equipes para um set */
export interface EscalacaoSet {
  indiceSet: number;
  casa: EscalacaoTime;
  visitante: EscalacaoTime;
}

/** Registro de uma substituição feita durante o set */
export interface RegistroSubstituicao {
  id: string;
  indiceSet: number;
  timeId: string;
  // Jogador que saiu
  idJogadorSaindo: string;
  nomeJogadorSaindo: string;
  numeroJogadorSaindo?: number;
  // Jogador que entrou
  idJogadorEntrando: string;
  nomeJogadorEntrando: string;
  numeroJogadorEntrando?: number;
  // Posição onde ocorreu
  indicePosicao: IndicePosicao;
  placarCasa: number;
  placarVisitante: number;
  timestamp: string;
}

export interface ModalEscalacaoProps {
  aberto: boolean;
  indiceSet: number;
  timeCasaId: string;
  timeVisitanteId: string;
  nomeTimeCasa: string;
  nomeTimeVisitante: string;
  jogadores: JogadorPartida[];
  escalacaoAnterior?: EscalacaoSet;
  aoConfirmar: (escalacao: EscalacaoSet) => void;
  aoFechar: () => void;
}

export interface ModalSubstituicaoProps {
  aberto: boolean;
  indiceSet: number;
  timeAtualId: string;
  lado: "CASA" | "VISITANTE";
  nomeTimeAtual: string;
  titulares: JogadorPartida[];
  banco: JogadorPartida[];
  placarCasa: number;
  placarVisitante: number;
  substituicoesNesteSet: RegistroSubstituicao[];
  aoConfirmar: (sub: Omit<RegistroSubstituicao, "id" | "timestamp">) => void;
  aoFechar: () => void;
}