const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
const TOKEN_KEY = "vb_token";
const USER_KEY = "vb_user";

export type PerfilUsuario = "ADMIN" | "GERENTE" | "USUARIO";

export type StatusTorneio = "RASCUNHO" | "ABERTO" | "EM_ANDAMENTO" | "FINALIZADO";
export type StatusPartida = "AGENDADA" | "AQUECIMENTO" | "AO_VIVO" | "FINALIZADA";
export type VisibilidadeTorneio = "PUBLICO" | "SOMENTE_PARTICIPANTES" | "PRIVADO";

export type LadoPonto = "CASA" | "VISITANTE";
export type TipoPonto = "SAQUE" | "ATAQUE" | "BLOQUEIO" | "ERRO_ADVERSARIO" | "CARTAO_ADVERSARIO";
export type TipoCartao = "AMARELO" | "VERMELHO";
export type TipoErro =
    | "ERRO_SAQUE" | "ERRO_ATAQUE" | "TOQUE_REDE" | "DOIS_TOQUES" | "QUATRO_TOQUES"
    | "INVASAO" | "BOLA_FORA" | "CONDUCAO" | "ERRO_ROTACAO";

export interface AuthUser {
    id: string;
    nome: string;
    email: string;
    perfil: PerfilUsuario;
}

export interface Torneio {
    id: string;
    nome: string;
    descricao?: string;
    local?: string;
    dataInicio?: string;
    dataFim?: string;
    status?: StatusTorneio;
    visibilidade?: VisibilidadeTorneio;
    maxTimes?: number;
    bannerUrl?: string;
    logoUrl?: string;
    tokenConvite?: string;
}
export interface Time {
    id: string;
    torneioId: string;
    nome: string;
    logoUrl?: string;
    tokenConvite?: string;
    quantidadeJogadores?: number;
}

export interface Jogador {
    id: string;
    timeId: string;
    usuarioId?: string;
    nome: string;
    numeroCamisa?: number;
    posicao?: string;
    fotoUrl?: string;
    entrouPorLink?: boolean;
    criadoEm?: string;
}

export interface JogadorPartida {
    id: string;
    partidaId: string;
    jogadorId: string;
    timeId: string;
    nomeJogador: string;
    numeroCamisa?: number;
    posicao?: string;
    titular: boolean;
}

export interface EventoPartida {
    id: string;
    partidaId: string;
    indiceSet: number;
    lado: LadoPonto;
    tipo: TipoPonto;
    tipoErro?: TipoErro;
    tipoCartao?: TipoCartao;
    jogadorId?: string;
    nomeJogador?: string;
    placarCasa: number;
    placarVisitante: number;
    horario: string;
    anulado?: boolean;
}

export interface Partida {
    id: string;
    torneioId: string;
    timeCasaId: string;
    timeVisitanteId: string;
    nomeTimeCasa: string;
    nomeTimeVisitante: string;
    status: StatusPartida;
    agendadoPara?: string;
    local?: string;
    setsCasa: number;
    setsVisitante: number;
    setAtualCasa: number;
    setAtualVisitante: number;
    sets: { casa: number; visitante: number }[];
    pontosParaVencerSet: number;
    pontosParaVencerUltimoSet: number;
    setsParaVencerPartida: number;
    titularesPorTime: number;
}


// Funções para calculos 

/* ── SSR-safe storage ─────────────────────────────────────── */
const isBrowser = typeof window !== "undefined";
const ls = {
    get: (k: string) => { try { return isBrowser ? localStorage.getItem(k) : null; } catch { return null; } },
    set: (k: string, v: string) => { try { if (isBrowser) localStorage.setItem(k, v); } catch { } },
    del: (k: string) => { try { if (isBrowser) localStorage.removeItem(k); } catch { } },
};

export const auth = {
    getToken: () => ls.get(TOKEN_KEY),
    getUser: (): AuthUser | null => { try { return JSON.parse(ls.get(USER_KEY) ?? "null"); } catch { return null; } },
    setSession: (token: string, user: AuthUser) => {
        ls.set(TOKEN_KEY, token); ls.set(USER_KEY, JSON.stringify(user));
        if (isBrowser) window.dispatchEvent(new Event("auth-change"));
    },
    clear: () => {
        ls.del(TOKEN_KEY); ls.del(USER_KEY);
        if (isBrowser) window.dispatchEvent(new Event("auth-change"));
    },
};

/* ── HTTP helper ──────────────────────────────────────────── */
async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const token = auth.getToken();
    const res = await fetch(`${API_URL}${path}`, {
        ...opts,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(opts.headers ?? {}),
        },
    });
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
    if (res.status === 204) return undefined as T;
    return res.json();
}

/* ── Mock helpers ─────────────────────────────────────────── */
const useMock = () => !import.meta.env.VITE_API_URL;
const mockGet = <T>(k: string): T[] => { try { return JSON.parse(ls.get(k) ?? "[]"); } catch { return []; } };
const mockSet = <T>(k: string, v: T[]) => ls.set(k, JSON.stringify(v));
const mockGetOne = <T extends { id: string }>(k: string, id: string): T | undefined =>
    mockGet<T>(k).find(x => x.id === id);

/* ── Mock: recalcular placar a partir de eventos ─────────────── */
function recalcularPartida(partida: Partida, eventos: EventoPartida[]): Partida {
    const ativos = eventos.filter(e => e.partidaId === partida.id && !e.anulado);
    let setsCasa = 0, setsVisitante = 0;
    const sets: { casa: number; visitante: number }[] = [];

    const porSet: Map<number, EventoPartida[]> = new Map();
    for (const e of ativos) {
        if (!porSet.has(e.indiceSet)) porSet.set(e.indiceSet, []);
        porSet.get(e.indiceSet)!.push(e);
    }

    const totalSetsJogados = porSet.size;
    for (let i = 0; i < totalSetsJogados - 1; i++) {
        const evs = porSet.get(i) ?? [];
        const ultimo = evs[evs.length - 1];
        if (ultimo) {
            sets.push({ casa: ultimo.placarCasa, visitante: ultimo.placarVisitante });
            if (ultimo.placarCasa > ultimo.placarVisitante) setsCasa++; else setsVisitante++;
        }
    }

    const evsSetAtual = porSet.get(totalSetsJogados - 1) ?? [];
    const ultimoAtual = evsSetAtual[evsSetAtual.length - 1];

    return {
        ...partida,
        setsCasa,
        setsVisitante,
        sets,
        setAtualCasa: ultimoAtual?.placarCasa ?? 0,
        setAtualVisitante: ultimoAtual?.placarVisitante ?? 0,
    };
}

// ─── API EXPORTADA ─────────────────────────────────────────────────
export const api = {
    /* ── Autenticação ─────────────────────────────────────────────── */
    login: async (email: string, senha: string) => {
        if (useMock()) {
            const user: AuthUser = {
                id: "demo", nome: email.split("@")[0] || "Demo", email,
                perfil: email.includes("admin") ? "ADMIN" : email.includes("gerente") ? "GERENTE" : "USUARIO",
            };
            auth.setSession("mock-token", user);
            return { token: "mock-token", user };
        }
        const data = await request<{ token: string; user: AuthUser }>("/auth/login", {
            method: "POST", body: JSON.stringify({ email, password: senha }),
        });
        auth.setSession(data.token, data.user);
        return data;
    },
    register: async (nome: string, email: string, senha: string) => {
        if (useMock()) return api.login(email, senha);
        return request("/auth/register", { method: "POST", body: JSON.stringify({ nome, email, password: senha }) });
    },

    /* ── Torneios ─────────────────────────────────────────────────── */
    listarTorneios: async (): Promise<Torneio[]> => {
        if (useMock()) {
            return mockGet<Torneio>("vb_torneios");
        }
        return request<Torneio[]>("/tournaments");
    },
    buscarTorneio: async (id: string): Promise<Torneio> => {
        if (useMock()) {
            const t = mockGetOne<Torneio>("vb_torneios", id);
            if (!t) throw new Error("Torneio não encontrado");
            return t;
        }
        return request<Torneio>(`/tournaments/${id}`);
    },
    criarTorneio: async (data: Omit<Torneio, "id">): Promise<Torneio> => {
        if (useMock()) {
            const t: Torneio = {
                ...data, id: crypto.randomUUID(), tokenConvite: crypto.randomUUID(),
                status: data.status ?? "RASCUNHO", visibilidade: data.visibilidade ?? "PRIVADO",
            };
            mockSet("vb_torneios", [t, ...mockGet<Torneio>("vb_torneios")]);
            return t;
        }
        return request<Torneio>("/tournaments", { method: "POST", body: JSON.stringify(data) });
    },
    atualizarTorneio: async (id: string, data: Partial<Torneio>): Promise<Torneio> => {
        if (useMock()) {
            const lista = mockGet<Torneio>("vb_torneios");
            const i = lista.findIndex(x => x.id === id);
            if (i < 0) throw new Error("Não encontrado");
            lista[i] = { ...lista[i], ...data }; mockSet("vb_torneios", lista); return lista[i];
        }
        return request<Torneio>(`/tournaments/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    removerTorneio: async (id: string): Promise<void> => {
        if (useMock()) { mockSet("vb_torneios", mockGet<Torneio>("vb_torneios").filter(x => x.id !== id)); return; }
        return request<void>(`/tournaments/${id}`, { method: "DELETE" });
    },

    /* ── Times ────────────────────────────────────────────────────── */
    listarTimes: async (torneioId: string): Promise<Time[]> => {
        if (useMock()) return mockGet<Time>("vb_times").filter(t => t.torneioId === torneioId);
        return request<Time[]>(`/teams?tournamentId=${torneioId}`);
    },
    buscarTime: async (id: string): Promise<Time> => {
        if (useMock()) return mockGetOne<Time>("vb_times", id)!;
        return request<Time>(`/teams/${id}`);
    },
    criarTime: async (data: Omit<Time, "id">): Promise<Time> => {
        if (useMock()) {
            const t: Time = { ...data, id: crypto.randomUUID(), tokenConvite: crypto.randomUUID() };
            mockSet("vb_times", [...mockGet<Time>("vb_times"), t]);
            return t;
        }
        return request<Time>("/teams", { method: "POST", body: JSON.stringify(data) });
    },
    atualizarTime: async (id: string, data: Partial<Time>): Promise<Time> => {
        if (useMock()) {
            const lista = mockGet<Time>("vb_times");
            const i = lista.findIndex(x => x.id === id);
            lista[i] = { ...lista[i], ...data }; mockSet("vb_times", lista); return lista[i];
        }
        return request<Time>(`/teams/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    removerTime: async (id: string): Promise<void> => {
        if (useMock()) {
            mockSet("vb_times", mockGet<Time>("vb_times").filter(x => x.id !== id));
            return;
        }
        return request<void>(`/teams/${id}`, { method: "DELETE" });
    },

    /* ── Jogadores ────────────────────────────────────────────────── */
    listarJogadores: async (timeId: string): Promise<Jogador[]> => {
        if (useMock()) {
            return mockGet<Jogador>("vb_jogadores").filter(j => j.timeId === timeId)
        };
        return request<Jogador[]>(`/players?teamId=${timeId}`);
    },
    criarJogador: async (data: Omit<Jogador, "id">): Promise<Jogador> => {
        if (useMock()) {
            const j: Jogador = {
                ...data,
                id: crypto.randomUUID(),
                criadoEm: new Date().toISOString()
            };
            mockSet("vb_jogadores", [...mockGet<Jogador>("vb_jogadores"), j]);
            return j;
        }
        return request<Jogador>("/players", { method: "POST", body: JSON.stringify(data) });
    },
    atualizarJogador: async () => { },
    deletarJogador: async () => { },


    /* ── Partidas ─────────────────────────────────────────────────── */
    listarPartidas: async (torneioId: string): Promise<Partida[]> => {
        if (useMock()) return mockGet<Partida>("vb_partidas").filter(p => p.torneioId === torneioId);
        return request<Partida[]>(`/matches?tournamentId=${torneioId}`);
    },
    buscarPartida: async (id: string): Promise<Partida> => {
        if (useMock()) return mockGetOne<Partida>("vb_partidas", id)!;
        return request<Partida>(`/matches/${id}`);
    },
    criarPartida: async (data: Omit<Partida, "id">): Promise<Partida> => {
        if (useMock()) {
            const p: Partida = {
                ...data,
                id: crypto.randomUUID(),
                status: data.status ?? "AGENDADA",
                setsCasa: 0, 
                setsVisitante: 0, 
                setAtualCasa: 0, 
                setAtualVisitante: 0, 
                sets: [],
                pontosParaVencerSet: 25, 
                pontosParaVencerUltimoSet: 15, 
                setsParaVencerPartida: 3, 
                titularesPorTime: 6
            };
            mockSet("vb_partidas", [...mockGet<Partida>("vb_partidas"), p]);
            return p;
        }
        return request<Partida>("/matches", { method: "POST", body: JSON.stringify(data) });
    },
    atualizarPartida: async (id: string, data: Partial<Partida>): Promise<Partida> => {
        if (useMock()) {
            const lista = mockGet<Partida>("vb_partidas");
            const i = lista.findIndex(x => x.id === id);
            lista[i] = { ...lista[i], ...data }; mockSet("vb_partidas", lista); return lista[i];
        }
        return request<Partida>(`/matches/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    removerPartida: async (id: string) => { },
    começaPartida: async () => { },
    finalizarPartida: async () => { },

    /* ── Elenco da Partida───────────────────── */
    listarJogadoresPartida: async (partidaId: string): Promise<JogadorPartida[]> => {
        if (useMock()) {
            let jogadores = mockGet<JogadorPartida>("vb_jogadores_partida").filter(j => j.partidaId === partidaId);
            if (jogadores.length === 0) {
                return [
                    { id: "1", partidaId, jogadorId: "j1", timeId: "tCasa", nomeJogador: "Atleta 1", numeroCamisa: 10, titular: true },
                    { id: "2", partidaId, jogadorId: "j2", timeId: "tCasa", nomeJogador: "Atleta 2", numeroCamisa: 7, titular: true },
                    { id: "3", partidaId, jogadorId: "j3", timeId: "tVisitante", nomeJogador: "Atleta 3", numeroCamisa: 11, titular: true },
                    { id: "4", partidaId, jogadorId: "j4", timeId: "tVisitante", nomeJogador: "Atleta 4", numeroCamisa: 9, titular: true },
                ];
            }
            return jogadores;
        }
        return request<JogadorPartida[]>(`/matches/${partidaId}/players`);
    },

    /* ── Eventos / Placar Ao Vivo ─────────────────────────────────── */
    listarEventosPartida: async (partidaId: string): Promise<EventoPartida[]> => {
        if (useMock()) return mockGet<EventoPartida>("vb_eventos").filter(e => e.partidaId === partidaId && !e.anulado);
        return request<EventoPartida[]>(`/matches/${partidaId}/events`);
    },
    registrarEvento: async (partidaId: string, data: Omit<EventoPartida, "id" | "partidaId" | "horario">): Promise<{ evento: EventoPartida; partida: Partida }> => {
        if (useMock()) {
            // Cria o evento
            const evento: EventoPartida = { ...data, id: crypto.randomUUID(), partidaId, horario: new Date().toISOString() };
            const todosEventos = [...mockGet<EventoPartida>("vb_eventos"), evento];
            mockSet("vb_eventos", todosEventos);

            // Recalcula o placar da partida com o novo evento e salva
            let partida = mockGetOne<Partida>("vb_partidas", partidaId);
            if (partida) {
                partida = recalcularPartida(partida, todosEventos);
                await api.atualizarPartida(partidaId, partida);
            }
            return { evento, partida: partida! };
        }
        return request(`/matches/${partidaId}/events`, { method: "POST", body: JSON.stringify(data) });
    },
    anularUltimoEvento: async (partidaId: string): Promise<{ partida: Partida }> => {
        if (useMock()) {
            const todos = mockGet<EventoPartida>("vb_eventos");
            const ativos = todos.filter(e => e.partidaId === partidaId && !e.anulado);
            if (!ativos.length) throw new Error("Sem eventos para anular");

            // Pega o ID do último evento e marca como anulado
            const lastId = ativos[ativos.length - 1].id;
            const idx = todos.findIndex(e => e.id === lastId);
            todos[idx].anulado = true;
            mockSet("vb_eventos", todos);

            // Recalcula o placar removendo o efeito daquele ponto/erro
            let partida = mockGetOne<Partida>("vb_partidas", partidaId);
            if (partida) {
                partida = recalcularPartida(partida, todos);
                await api.atualizarPartida(partidaId, partida);
            }
            return { partida: partida! };
        }
        return request(`/matches/${partidaId}/events/void-last`, { method: "POST" });
    }
};