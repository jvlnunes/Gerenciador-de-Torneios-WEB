import { request } from "./cliente";
import { 
    Torneio, 
    RegrasTorneio, 
    OrganizadorTorneio, 
    AuthUser, 
    FaseTorneio
} from "./interfaces";


/* ── Gestão de Acessos e Permissões (Regras de Negócio) ────────── */

/**
 * Verifica se um utilizador específico faz parte do grupo de organizadores do torneio.
 */
export function souOrganizador(torneio: Torneio, userId?: string): boolean {
    if (!userId) return false;
    return (torneio.organizadores ?? []).some((o) => o.usuarioId === userId);
}

/**
 * Valida se o utilizador atual tem permissão administrativa total ou de gestão direta sobre o torneio.
 */
export function podeGerenciarTorneio(torneio: Torneio, user: AuthUser | null): boolean {
    if (!user) return false;
    if (user.perfil === "ADMIN") return true;
    return user.perfil === "GERENTE" && souOrganizador(torneio, user.id);
}

export const torneiosApi = {
    /* ── Torneios (CRUD) ────────────────────────────────────── */

    /**
     * Lista todos os torneios registados na plataforma.
     */
    listarTorneios: async (): Promise<Torneio[]> => {
        return request<Torneio[]>("/torneios");
    },

    /**
     * Procura os detalhes completos de um torneio pelo seu ID.
     */
    buscarTorneio: async (id: string): Promise<Torneio> => {
        return request<Torneio>(`/torneios/${id}`);
    },

    /**
     * Cria um novo torneio.
     */
    criarTorneio: async (data: Omit<Torneio, "id">): Promise<Torneio> => {
        return request<Torneio>("/torneios", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    /**
     * Atualiza os dados parciais de um torneio existente.
     */
    atualizarTorneio: async (id: string, data: Partial<Torneio>): Promise<Torneio> => {
        return request<Torneio>(`/torneios/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    /**
     * Remove permanentemente um torneio do sistema.
     */
    removerTorneio: async (id: string): Promise<void> => {
        return request<void>(`/torneios/${id}`, {
            method: "DELETE",
        });
    },

    /* ── Regras de Partida do Torneio ─────────────────────────── */

    /**
     * Procura as regras de pontuação e limites configuradas para o torneio.
     */
    buscarRegras: async (torneioId: string): Promise<RegrasTorneio> => {
        return request<RegrasTorneio>(`/torneios/${torneioId}/regras`);
    },

    /**
     * Atualiza as regras de sets, pontos e limite de atletas de um torneio.
     */
    atualizarRegras: async (
        torneioId: string,
        data: Partial<Omit<RegrasTorneio, "id" | "torneioId">>,
    ): Promise<RegrasTorneio> => {
        return request<RegrasTorneio>(`/torneios/${torneioId}/regras`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    /* ── Organizadores do Torneio ────────────────────────────── */

    /**
     * Lista todos os utilizadores associados como organizadores do torneio.
     */
    listarOrganizadores: async (torneioId: string): Promise<OrganizadorTorneio[]> => {
        return request<OrganizadorTorneio[]>(`/torneios/${torneioId}/organizadores`);
    },

    /**
     * Adiciona um novo co-organizador ao torneio através do e-mail.
     */
    adicionarOrganizador: async (torneioId: string, email: string): Promise<OrganizadorTorneio[]> => {
        return request<OrganizadorTorneio[]>(`/torneios/${torneioId}/organizadores`, {
            method: "POST",
            body: JSON.stringify({ email }),
        });
    },

    /**
     * Remove o vínculo de gestão de um organizador específico do torneio.
     */
    removerOrganizador: async (torneioId: string, usuarioId: string): Promise<OrganizadorTorneio[]> => {
        return request<OrganizadorTorneio[]>(`/torneios/${torneioId}/organizadores/${usuarioId}`, {
            method: "DELETE",
        });
    },

    /**
     * Lista todas as fases de um torneio.
     */
    listarFases: async (torneioId: string): Promise<FaseTorneio[]> => {
        return request<FaseTorneio[]>(`/torneios/${torneioId}/fases`);
    },

    souOrganizador,
    podeGerenciarTorneio,
};

