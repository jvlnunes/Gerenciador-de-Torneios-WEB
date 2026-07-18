import { request } from "./cliente";
import { Time, Jogador } from "./interfaces";

export const timesApi = {
    /* ── Equipas (Times) ────────────────────────────────────── */

    /**
     * Lista todos os times pertencentes a um torneio específico.
     */
    listarPorTorneio: async (torneioId: string): Promise<Time[]> => {
        return request<Time[]>(`/times?torneioId=${torneioId}`);
    },

    /**
     * Procura os detalhes de um time específico pelo ID.
     */
    buscar: async (id: string): Promise<Time> => {
        return request<Time>(`/times/${id}`);
    },

    /**
     * Cria um novo time dentro de um torneio.
     */
    criar: async (data: Partial<Time> & { torneioId: string }): Promise<Time> => {
        return request<Time>(`/times`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    /**
     * Atualiza os dados de um time (nome, cores, escudo, etc).
     */
    atualizar: async (id: string, data: Partial<Time>): Promise<Time> => {
        return request<Time>(`/times/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    /**
     * Remove um time do sistema.
     */
    remover: async (id: string): Promise<void> => {
        return request<void>(`/times/${id}`, {
            method: "DELETE",
        });
    },

    /* ── Jogadores ───────────────────────────────────────────── */

    /**
     * Lista todos os jogadores registados num determinado time.
     */
    listarJogadores: async (timeId: string): Promise<Jogador[]> => {
        return request<Jogador[]>(`/times/${timeId}/jogadores`);
    },

    /**
     * Adiciona um novo jogador a um time.
     */
    adicionarJogador: async (timeId: string, data: Partial<Jogador>): Promise<Jogador> => {
        return request<Jogador>(`/times/${timeId}/jogadores`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    /**
    * Atualiza os dados de um jogador específico (rota aninhada em /times/:timeId/jogadores/:jogadorId).
    */
    atualizarJogador: async (timeId: string, jogadorId: string, data: Partial<Jogador>): Promise<Jogador> => {
        return request<Jogador>(`/times/${timeId}/jogadores/${jogadorId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    /**
     * Remove um jogador do time (rota aninhada em /times/:timeId/jogadores/:jogadorId).
     */
    removerJogador: async (timeId: string, jogadorId: string): Promise<void> => {
        return request<void>(`/times/${timeId}/jogadores/${jogadorId}`, {
            method: "DELETE",
        });
    },

    /* ── Convites ────────────────────────────────────────────── */

    /**
     * Permite a um utilizador entrar num time utilizando um token de convite.
     */
    entrarViaConvite: async (token: string): Promise<Time> => {
        return request<Time>(`/times/entrar`, {
            method: "POST",
            body: JSON.stringify({ token }),
        });
    },
};