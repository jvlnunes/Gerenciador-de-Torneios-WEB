import type { StatusPartida } from "./types";
import { request } from "./cliente";
import {
    Partida,
    JogadorPartida,
    EscalacaoTimeApi,
    EventoPartida,
    SubstituicaoApi
} from "./interfaces";


export const partidasApi = {
    /* ── Partidas (Core) ────────────────────────────────────── */

    /**
     * Lista todas as partidas de um determinado torneio.
     */
    listarPorTorneio: async (torneioId: string): Promise<Partida[]> => {
        return request<Partida[]>(`/partidas?torneioId=${torneioId}`);
    },

    /**
     * Busca os dados completos de uma partida específica (placar, sets, times).
     */
    buscar: async (partidaId: string): Promise<Partida> => {
        return request<Partida>(`/partidas/${partidaId}`);
    },

    /**
     * Cria uma nova partida no torneio.
     */
    criar: async (torneioId: string, data: Partial<Partida>): Promise<Partida> => {
        return request<Partida>(`/partidas`, {
            method: "POST",
            body: JSON.stringify({ ...data, torneioId }),
        });
    },

    /**
     * Remove uma partida do sistema.
     */
    removerPartida: async (partidaId: string): Promise<void> => {
        return request<void>(`/partidas/${partidaId}`, {
            method: "DELETE",
        });
    },

    /**
     * Atualiza dados gerais da partida (usado para placares, status, etc.)
     */
    atualizarPartida: async (partidaId: string, data: Partial<Partida>): Promise<Partida> => {
        return request<Partida>(`/partidas/${partidaId}`, {
            method: "PUT",          // era PATCH
            body: JSON.stringify(data),
        });
    },

    /**
     * Finaliza a partida de forma definitiva.
     */
    finalizarPartida: async (partidaId: string): Promise<Partida> => {
        return request<Partida>(`/partidas/${partidaId}`, {
            method: "PUT",
            body: JSON.stringify({ status: "FINALIZADA" }),
        });
    },

    /**
     * Atualiza o status da partida (ex: de AGENDADA para AQUECIMENTO ou AO_VIVO).
     */
    atualizarStatus: async (partidaId: string, status: StatusPartida): Promise<Partida> => {
        return request<Partida>(`/partidas/${partidaId}`, {
            method: "PUT",          // era PATCH /status
            body: JSON.stringify({ status }),
        });
    },

    /* ── Relacionados e Escalação (Drag and Drop) ───────────── */

    /**
     * Lista os jogadores que foram convocados/relacionados para esta partida.
     */
    listarJogadoresRelacionados: async (partidaId: string): Promise<JogadorPartida[]> => {
        return request<JogadorPartida[]>(`/partidas/${partidaId}/jogadores`);
    },

    /**
     * Atualiza a lista geral de jogadores disponíveis para a partida.
     */
    atualizarJogadoresRelacionados: async (
        partidaId: string,
        data: { timeCasaIds: string[]; timeVisitanteIds: string[] }
    ): Promise<JogadorPartida[]> => {
        return request<JogadorPartida[]>(`/partidas/${partidaId}/jogadores`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    /**
     * Busca a escalação de um set específico (titulares, posições e quem saca).
     */
    buscarEscalacao: async (partidaId: string, indiceSet?: number): Promise<EscalacaoTimeApi[]> => {
        const qs = indiceSet !== undefined ? `?indiceSet=${indiceSet}` : "";
        return request<EscalacaoTimeApi[]>(`/partidas/${partidaId}/escalacao${qs}`);
    },

    /**
     * Salva a escalação inicial de um set definindo os 6 titulares e suas posições.
     */
    salvarEscalacao: async (
        partidaId: string,
        data: { indiceSet: number; escalacaoCasa: EscalacaoTimeApi; escalacaoVisitante: EscalacaoTimeApi }
    ): Promise<void> => {
        return request<void>(`/partidas/${partidaId}/escalacao`, {
            method: "POST",
            body: JSON.stringify({
                indiceSet: data.indiceSet,
                casa: data.escalacaoCasa,          // renomeado
                visitante: data.escalacaoVisitante, // renomeado
            }),
        });
    },

    /* ── Eventos (Súmula Ao Vivo) ───────────────────────────── */

    /**
     * Lista o histórico completo de pontos, erros e cartões da partida.
     */
    listarEventos: async (partidaId: string): Promise<EventoPartida[]> => {
        return request<EventoPartida[]>(`/partidas/${partidaId}/eventos`);
    },

    /**
     * Registra uma nova ação na partida (ponto, erro ou cartão) e recalcula o placar.
     */
    registrarEvento: async (
        partidaId: string,
        data: Partial<EventoPartida>,
    ): Promise<{ evento: EventoPartida; partida: Partida }> => {
        return request<{ evento: EventoPartida; partida: Partida }>(
            `/partidas/${partidaId}/eventos`,
            {
                method: "POST",
                body: JSON.stringify(data),
            },
        );
    },

    /**
     * Remove o último evento registrado na partida (botão Desfazer/Anular).
     */
    anularUltimoEvento: async (partidaId: string): Promise<void> => {
        return request<void>(`/partidas/${partidaId}/eventos/anular-ultimo`, {
            method: "POST",
        });
    },

    /* ── Substituições ──────────────────────────────────────── */

    /**
     * Lista o histórico de substituições feitas em um set.
     */
    listarSubstituicoes: async (partidaId: string, indiceSet?: number): Promise<SubstituicaoApi[]> => {
        const qs = indiceSet !== undefined ? `?indiceSet=${indiceSet}` : "";
        return request<SubstituicaoApi[]>(`/partidas/${partidaId}/substituicoes${qs}`);
    },

    /**
     * Registra uma troca de jogador ao vivo.
     */
    registrarSubstituicao: async (partidaId: string, data: Partial<SubstituicaoApi>): Promise<SubstituicaoApi> => {
        return request<SubstituicaoApi>(`/partidas/${partidaId}/substituicoes`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    /**
     * Inicia a partida alterando o status no backend.
     */
    comecaPartida: async (partidaId: string): Promise<Partida> => {
        return request<Partida>(`/partidas/${partidaId}`, {
            method: "PUT",          // era PATCH
            body: JSON.stringify({ status: "AQUECIMENTO" }),
        });
    },
};