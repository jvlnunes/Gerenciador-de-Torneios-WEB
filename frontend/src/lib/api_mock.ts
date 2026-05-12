const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
const TOKEN_KEY = "vb_token";
const USER_KEY  = "vb_user";

export type UserRole             = "ADMIN" | "MANAGER" | "USER";
export type TournamentStatus     = "DRAFT" | "OPEN" | "ONGOING" | "FINISHED";
export type TournamentVisibility = "PUBLIC" | "PARTICIPANTS_ONLY" | "PRIVATE";
export type MatchStatus          = "SCHEDULED" | "WARMUP" | "LIVE" | "FINISHED";
export type PointType =
  | "SAQUE" | "ATAQUE" | "BLOQUEIO" | "ERRO_ADVERSARIO"
  | "ERRO_SAQUE" | "ERRO_ATAQUE" | "TOQUE_REDE" | "INVASAO" | "BOLA_FORA" | "DUPLO";
export type PointSide = "HOME" | "AWAY";

export interface AuthUser {
  id: string; name: string; email: string; role: UserRole;
}
export interface Tournament {
  id: string; name: string; description?: string; location?: string;
  startDate?: string; endDate?: string; status?: TournamentStatus;
  visibility?: TournamentVisibility; maxTeams?: number;
  bannerUrl?: string; logoUrl?: string; inviteToken?: string;
}
export interface Team {
  id: string; tournamentId: string; name: string;
  logoUrl?: string; inviteToken?: string; playerCount?: number;
}
export interface Player {
  id: string; teamId: string; userId?: string; name: string;
  jerseyNumber?: number; position?: string; photoUrl?: string;
  joinedViaLink?: boolean; createdAt?: string;
}

/** Jogador escalado para uma partida (pode sobrescrever posição/camisa) */
export interface MatchPlayer {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  playerName: string;
  jerseyNumber?: number;
  position?: string;
  isStarter: boolean;
}

/** Evento de ponto registrado na partida */
export interface MatchEvent {
  id: string;
  matchId: string;
  /** índice do set (0-based) */
  setIndex: number;
  side: PointSide;
  type: PointType;
  /** quem realizou ou cometeu (pode ser undefined se não informado) */
  playerId?: string;
  playerName?: string;
  /** placar no momento do evento */
  scoreHome: number;
  scoreAway: number;
  timestamp: string;
  /** ponto anulado? */
  voided?: boolean;
}

export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  status: MatchStatus;
  scheduledAt?: string;
  location?: string;
  /** Sets ganhos por cada lado */
  homeSets: number;
  awaySets: number;
  /** Placar do set atual */
  currentSetHome: number;
  currentSetAway: number;
  /** Histórico de sets encerrados [{home, away}] */
  sets: { home: number; away: number }[];
  /** Configurações herdadas do torneio */
  pointsToWinSet: number;
  pointsToWinLastSet: number;
  setsToWinMatch: number;
  startersPerTeam: number;
}

/* ── SSR-safe storage ─────────────────────────────────────── */
const isBrowser = typeof window !== "undefined";
const ls = {
  get: (k: string) => { try { return isBrowser ? localStorage.getItem(k) : null; } catch { return null; } },
  set: (k: string, v: string) => { try { if (isBrowser) localStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { if (isBrowser) localStorage.removeItem(k); } catch {} },
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

/* ── Mock: recalculate match score from events ─────────────── */
function recalcMatch(match: Match, events: MatchEvent[]): Match {
  const active = events.filter(e => e.matchId === match.id && !e.voided);
  // rebuild sets
  let homeSets = 0, awaySets = 0;
  const sets: { home: number; away: number }[] = [];

  // group by set
  const bySet: Map<number, MatchEvent[]> = new Map();
  for (const e of active) {
    if (!bySet.has(e.setIndex)) bySet.set(e.setIndex, []);
    bySet.get(e.setIndex)!.push(e);
  }

  const totalSetsPlayed = bySet.size;
  for (let i = 0; i < totalSetsPlayed - 1; i++) {
    const evs = bySet.get(i) ?? [];
    const last = evs[evs.length - 1];
    if (last) {
      sets.push({ home: last.scoreHome, away: last.scoreAway });
      if (last.scoreHome > last.scoreAway) homeSets++; else awaySets++;
    }
  }

  // current set
  const currentSetEvs = bySet.get(totalSetsPlayed - 1) ?? [];
  const lastCurrent = currentSetEvs[currentSetEvs.length - 1];

  return {
    ...match,
    homeSets,
    awaySets,
    sets,
    currentSetHome: lastCurrent?.scoreHome ?? 0,
    currentSetAway: lastCurrent?.scoreAway ?? 0,
  };
}

export const api = {
  /* ── Auth ─────────────────────────────────────────────── */
  login: async (email: string, password: string) => {
    if (useMock()) {
      const user: AuthUser = {
        id: "demo", name: email.split("@")[0] || "Demo", email,
        role: email.includes("admin") ? "ADMIN" : email.includes("manager") ? "MANAGER" : "USER",
      };
      auth.setSession("mock-token", user);
      return { token: "mock-token", user };
    }
    const data = await request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    });
    auth.setSession(data.token, data.user);
    return data;
  },
  register: async (name: string, email: string, password: string) => {
    if (useMock()) return api.login(email, password);
    return request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  },

  /* ── Tournaments ──────────────────────────────────────── */
  listTournaments: async (): Promise<Tournament[]> => {
    if (useMock()) return mockGet<Tournament>("vb_tournaments");
    return request<Tournament[]>("/tournaments");
  },
  getTournament: async (id: string): Promise<Tournament> => {
    if (useMock()) {
      const t = mockGetOne<Tournament>("vb_tournaments", id);
      if (!t) throw new Error("Torneio não encontrado");
      return t;
    }
    return request<Tournament>(`/tournaments/${id}`);
  },
  createTournament: async (data: Omit<Tournament, "id">): Promise<Tournament> => {
    if (useMock()) {
      const t: Tournament = {
        ...data, id: crypto.randomUUID(), inviteToken: crypto.randomUUID(),
        status: data.status ?? "DRAFT", visibility: data.visibility ?? "PRIVATE",
      };
      mockSet("vb_tournaments", [t, ...mockGet<Tournament>("vb_tournaments")]);
      return t;
    }
    return request<Tournament>("/tournaments", { method: "POST", body: JSON.stringify(data) });
  },
  updateTournament: async (id: string, data: Partial<Tournament>): Promise<Tournament> => {
    if (useMock()) {
      const list = mockGet<Tournament>("vb_tournaments");
      const i = list.findIndex(x => x.id === id);
      if (i < 0) throw new Error("Não encontrado");
      list[i] = { ...list[i], ...data }; mockSet("vb_tournaments", list); return list[i];
    }
    return request<Tournament>(`/tournaments/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deleteTournament: async (id: string): Promise<void> => {
    if (useMock()) { mockSet("vb_tournaments", mockGet<Tournament>("vb_tournaments").filter(x => x.id !== id)); return; }
    return request<void>(`/tournaments/${id}`, { method: "DELETE" });
  },

  /* ── Teams ────────────────────────────────────────────── */
  listTeams: async (tournamentId: string): Promise<Team[]> => {
    if (useMock()) return mockGet<Team>("vb_teams").filter(t => t.tournamentId === tournamentId);
    return request<Team[]>(`/teams?tournamentId=${tournamentId}`);
  },
  getTeam: async (id: string): Promise<Team & { players: Player[] }> => {
    if (useMock()) {
      const t = mockGetOne<Team>("vb_teams", id);
      if (!t) throw new Error("Time não encontrado");
      return { ...t, players: mockGet<Player>("vb_players").filter(p => p.teamId === id) };
    }
    return request(`/teams/${id}`);
  },
  getTeamByInvite: async (token: string): Promise<Team & { tournamentName: string }> => {
    if (useMock()) {
      const t = mockGet<Team>("vb_teams").find(x => x.inviteToken === token);
      if (!t) throw new Error("Link inválido");
      return { ...t, tournamentName: "Torneio Demo" };
    }
    return request(`/teams/join/${token}`);
  },
  createTeam: async (data: { tournamentId: string; name: string }): Promise<Team> => {
    if (useMock()) {
      const t: Team = { ...data, id: crypto.randomUUID(), inviteToken: crypto.randomUUID(), playerCount: 0 };
      mockSet("vb_teams", [...mockGet<Team>("vb_teams"), t]); return t;
    }
    return request<Team>("/teams", { method: "POST", body: JSON.stringify(data) });
  },
  updateTeam: async (id: string, data: Partial<Team>): Promise<Team> => {
    if (useMock()) {
      const list = mockGet<Team>("vb_teams"); const i = list.findIndex(x => x.id === id);
      list[i] = { ...list[i], ...data }; mockSet("vb_teams", list); return list[i];
    }
    return request<Team>(`/teams/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deleteTeam: async (id: string): Promise<void> => {
    if (useMock()) { mockSet("vb_teams", mockGet<Team>("vb_teams").filter(t => t.id !== id)); return; }
    return request<void>(`/teams/${id}`, { method: "DELETE" });
  },
  regenerateTeamInvite: async (teamId: string): Promise<Team> => {
    if (useMock()) {
      const list = mockGet<Team>("vb_teams"); const i = list.findIndex(x => x.id === teamId);
      list[i] = { ...list[i], inviteToken: crypto.randomUUID() }; mockSet("vb_teams", list); return list[i];
    }
    return request<Team>(`/teams/${teamId}/regenerate-invite`, { method: "POST" });
  },

  /* ── Players ──────────────────────────────────────────── */
  listPlayers: async (teamId: string): Promise<Player[]> => {
    if (useMock()) return mockGet<Player>("vb_players").filter(p => p.teamId === teamId);
    return request<Player[]>(`/teams/${teamId}/players`);
  },
  createPlayer: async (teamId: string, data: { name: string; jerseyNumber?: number; position?: string }): Promise<Player> => {
    if (useMock()) {
      const p: Player = { ...data, id: crypto.randomUUID(), teamId, createdAt: new Date().toISOString() };
      mockSet("vb_players", [...mockGet<Player>("vb_players"), p]); return p;
    }
    return request<Player>(`/teams/${teamId}/players`, { method: "POST", body: JSON.stringify(data) });
  },
  updatePlayer: async (teamId: string, playerId: string, data: Partial<Player>): Promise<Player> => {
    if (useMock()) {
      const list = mockGet<Player>("vb_players"); const i = list.findIndex(x => x.id === playerId);
      list[i] = { ...list[i], ...data }; mockSet("vb_players", list); return list[i];
    }
    return request<Player>(`/teams/${teamId}/players/${playerId}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deletePlayer: async (teamId: string, playerId: string): Promise<void> => {
    if (useMock()) { mockSet("vb_players", mockGet<Player>("vb_players").filter(p => p.id !== playerId)); return; }
    return request<void>(`/teams/${teamId}/players/${playerId}`, { method: "DELETE" });
  },
  joinTeamByInvite: async (token: string, data: { name: string; jerseyNumber?: number; position?: string }): Promise<Player> => {
    return request<Player>(`/teams/join/${token}/players`, { method: "POST", body: JSON.stringify(data) });
  },

  /* ── Matches ──────────────────────────────────────────── */
  listMatches: async (tournamentId: string): Promise<Match[]> => {
    if (useMock()) {
      const matches = mockGet<Match>("vb_matches").filter(m => m.tournamentId === tournamentId);
      const events  = mockGet<MatchEvent>("vb_events");
      return matches.map(m => recalcMatch(m, events));
    }
    return request<Match[]>(`/matches?tournamentId=${tournamentId}`);
  },
  getMatch: async (id: string): Promise<Match> => {
    if (useMock()) {
      const m = mockGetOne<Match>("vb_matches", id);
      if (!m) throw new Error("Partida não encontrada");
      return recalcMatch(m, mockGet<MatchEvent>("vb_events"));
    }
    return request<Match>(`/matches/${id}`);
  },
  createMatch: async (data: {
    tournamentId: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledAt?: string;
    location?: string;
    pointsToWinSet?: number;
    pointsToWinLastSet?: number;
    setsToWinMatch?: number;
    startersPerTeam?: number;
  }): Promise<Match> => {
    if (useMock()) {
      const homeTeam = mockGetOne<Team>("vb_teams", data.homeTeamId);
      const awayTeam = mockGetOne<Team>("vb_teams", data.awayTeamId);
      const m: Match = {
        id: crypto.randomUUID(),
        tournamentId: data.tournamentId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        homeTeamName: homeTeam?.name ?? "Casa",
        awayTeamName: awayTeam?.name ?? "Visitante",
        status: "SCHEDULED",
        scheduledAt: data.scheduledAt,
        location: data.location,
        homeSets: 0, awaySets: 0,
        currentSetHome: 0, currentSetAway: 0,
        sets: [],
        pointsToWinSet: data.pointsToWinSet ?? 25,
        pointsToWinLastSet: data.pointsToWinLastSet ?? 15,
        setsToWinMatch: data.setsToWinMatch ?? 3,
        startersPerTeam: data.startersPerTeam ?? 6,
      };
      mockSet("vb_matches", [...mockGet<Match>("vb_matches"), m]);
      return m;
    }
    return request<Match>("/matches", { method: "POST", body: JSON.stringify(data) });
  },
  updateMatch: async (id: string, data: Partial<Match>): Promise<Match> => {
    if (useMock()) {
      const list = mockGet<Match>("vb_matches"); const i = list.findIndex(x => x.id === id);
      if (i < 0) throw new Error("Partida não encontrada");
      list[i] = { ...list[i], ...data }; mockSet("vb_matches", list); return list[i];
    }
    return request<Match>(`/matches/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deleteMatch: async (id: string): Promise<void> => {
    if (useMock()) {
      mockSet("vb_matches", mockGet<Match>("vb_matches").filter(m => m.id !== id));
      mockSet("vb_events", mockGet<MatchEvent>("vb_events").filter(e => e.matchId !== id));
      return;
    }
    return request<void>(`/matches/${id}`, { method: "DELETE" });
  },
  startMatch: async (id: string): Promise<Match> => {
    if (useMock()) return api.updateMatch(id, { status: "LIVE" });
    return request<Match>(`/matches/${id}/start`, { method: "POST" });
  },
  finishMatch: async (id: string): Promise<Match> => {
    if (useMock()) return api.updateMatch(id, { status: "FINISHED" });
    return request<Match>(`/matches/${id}/finish`, { method: "POST" });
  },

  /* ── Match Players (escalação) ────────────────────────── */
  listMatchPlayers: async (matchId: string): Promise<MatchPlayer[]> => {
    if (useMock()) return mockGet<MatchPlayer>("vb_match_players").filter(p => p.matchId === matchId);
    return request<MatchPlayer[]>(`/matches/${matchId}/players`);
  },
  upsertMatchPlayer: async (matchId: string, data: Omit<MatchPlayer, "id" | "matchId">): Promise<MatchPlayer> => {
    if (useMock()) {
      const list = mockGet<MatchPlayer>("vb_match_players");
      const existing = list.findIndex(p => p.matchId === matchId && p.playerId === data.playerId);
      if (existing >= 0) {
        list[existing] = { ...list[existing], ...data, matchId };
        mockSet("vb_match_players", list);
        return list[existing];
      }
      const mp: MatchPlayer = { id: crypto.randomUUID(), matchId, ...data };
      mockSet("vb_match_players", [...list, mp]);
      return mp;
    }
    return request<MatchPlayer>(`/matches/${matchId}/players`, { method: "POST", body: JSON.stringify(data) });
  },
  removeMatchPlayer: async (matchId: string, playerId: string): Promise<void> => {
    if (useMock()) {
      mockSet("vb_match_players", mockGet<MatchPlayer>("vb_match_players")
        .filter(p => !(p.matchId === matchId && p.playerId === playerId)));
      return;
    }
    return request<void>(`/matches/${matchId}/players/${playerId}`, { method: "DELETE" });
  },

  /* ── Match Events (pontos) ────────────────────────────── */
  listMatchEvents: async (matchId: string): Promise<MatchEvent[]> => {
    if (useMock()) return mockGet<MatchEvent>("vb_events").filter(e => e.matchId === matchId);
    return request<MatchEvent[]>(`/matches/${matchId}/events`);
  },
  addMatchEvent: async (matchId: string, data: Omit<MatchEvent, "id" | "matchId" | "timestamp">): Promise<{ event: MatchEvent; match: Match }> => {
    if (useMock()) {
      const event: MatchEvent = { ...data, id: crypto.randomUUID(), matchId, timestamp: new Date().toISOString() };
      mockSet("vb_events", [...mockGet<MatchEvent>("vb_events"), event]);
      const match = recalcMatch(mockGetOne<Match>("vb_matches", matchId)!, mockGet<MatchEvent>("vb_events"));
      // check if set/match ended and advance
      const pts = data.setIndex === (match.sets.length + match.homeSets + match.awaySets)
        ? match.pointsToWinLastSet
        : match.pointsToWinSet;
      return { event, match };
    }
    return request(`/matches/${matchId}/events`, { method: "POST", body: JSON.stringify(data) });
  },
  voidLastEvent: async (matchId: string): Promise<{ match: Match }> => {
    if (useMock()) {
      const events = mockGet<MatchEvent>("vb_events").filter(e => e.matchId === matchId && !e.voided);
      if (!events.length) throw new Error("Sem eventos para anular");
      const lastId = events[events.length - 1].id;
      const all = mockGet<MatchEvent>("vb_events");
      const i = all.findIndex(e => e.id === lastId);
      all[i] = { ...all[i], voided: true };
      mockSet("vb_events", all);
      const match = recalcMatch(mockGetOne<Match>("vb_matches", matchId)!, all);
      return { match };
    }
    return request(`/matches/${matchId}/events/void-last`, { method: "POST" });
  },
};