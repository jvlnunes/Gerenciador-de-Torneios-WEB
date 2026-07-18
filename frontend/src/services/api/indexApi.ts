import { auth, request } from "./cliente";
import { authApi } from "./auth";
import { torneiosApi } from "./torneios";
import { timesApi } from "./times";
import { partidasApi } from "./partidas";
import { fasesTorneioApi } from "./fasesTorneio";

export const api = {
    auth: { ...authApi, ...auth },
    torneios: torneiosApi,
    times: timesApi,
    partidas: partidasApi,
    fases: fasesTorneioApi,
    request 
};

export * from "./interfaces";
export * from "./types";