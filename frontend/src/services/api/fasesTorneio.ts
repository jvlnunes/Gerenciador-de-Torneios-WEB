import { request } from "./cliente";
import { FaseTorneio, PoolJogadorRacha, FilaRachaEstado, Jogador, Time, ConfiguracaoRacha } from "./interfaces";
import { FormatoFase } from "./types";

export const fasesTorneioApi = {
    /**
     * Cria uma nova fase (Racha, Mata-Mata ou Pontos Corridos) para um torneio.
     */
    criarFase: async (
        torneioId: string,
        data: { tipo: FormatoFase; nome?: string; ordem?: number }
    ): Promise<FaseTorneio> => {
        return request<FaseTorneio>(`/torneios/${torneioId}/fases`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    /**
     * Busca os dados completos de uma fase.
     */
    buscar: async (faseId: string): Promise<FaseTorneio> => {
        return request<FaseTorneio>(`/fases/${faseId}`);
    },

    /**
     * Atualiza as configurações de uma fase de racha.
     */
    atualizarConfiguracaoRacha: async (faseId: string, data: Partial<ConfiguracaoRacha>): Promise<ConfiguracaoRacha> => {
        return request<ConfiguracaoRacha>(`/fases/${faseId}/configuracao-racha`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    /**
     * Lista todos os jogadores que fazem parte da pool de racha desta fase.
     */
    listarPool: async (faseId: string): Promise<PoolJogadorRacha[]> => {
        return request<PoolJogadorRacha[]>(`/fases/${faseId}/pool`);
    },

    /**
     * Adiciona jogadores à pool de racha (seja vinculando IDs existentes ou criando novos jogadores temporários).
     */
    adicionarPool: async (
        faseId: string,
        data: {
            jogadorIds?: string[];
            novosJogadores?: { nome: string; notaHabilidade?: number }[]
        },
    ): Promise<PoolJogadorRacha[]> => {
        return request<PoolJogadorRacha[]>(`/fases/${faseId}/pool`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    /**
     * Remove um jogador específico da pool de racha.
     */
    removerDaPool: async (faseId: string, jogadorId: string): Promise<PoolJogadorRacha[]> => {
        return request<PoolJogadorRacha[]>(`/fases/${faseId}/pool/${jogadorId}`, {
            method: "DELETE",
        });
    },

    /**
     * Executa o algoritmo de sorteio equilibrado para gerar as equipas (times) automaticamente.
     */
    sortearTimes: async (
        faseId: string,
        data: { jogadoresPorTime?: number; nomesTimes?: string[] }
    ): Promise<{ times: Time[]; jogadoresNaoAlocados: Jogador[] }> => {
        return request<{ times: Time[]; jogadoresNaoAlocados: Jogador[] }>(
            `/fases/${faseId}/pool/sortear`,
            {
                method: "POST",
                body: JSON.stringify(data)
            }
        );
    },

    /**
     * Procura o estado em tempo real da fila de racha (quem está a defender, quem está em jogo e na fila).
     */
    buscarFilaRacha: async (faseId: string): Promise<FilaRachaEstado | null> => {
        return request<FilaRachaEstado | null>(`/fases/${faseId}/fila-racha`);
    },

    /**
     * Inicializa a fila de espera do racha para dar início aos jogos.
     */
    iniciarFilaRacha: async (faseId: string): Promise<{ estado: FilaRachaEstado }> => {
        return request<{ estado: FilaRachaEstado }>(`/fases/${faseId}/fila-racha/iniciar`, {
            method: "POST",
        });
    },

    avancarFilaRacha: async (faseId: string, timeVencedorId: string) => {
        return request(`/fases/${faseId}/fila-racha/avancar`, {
            method: "POST",
            body: JSON.stringify({ timeVencedorId }),
        });
    },
};