import {
    type Partida,
    type TipoPonto,
    type LadoPonto
} from "@/services/api";


function tipoEmoji(t: TipoPonto) {
    const m: Record<string, string> = {
        SAQUE: "🏐", ATAQUE: "⚡", BLOQUEIO: "🛡️",
        ERRO_ADVERSARIO: "❌", CARTAO_ADVERSARIO: "🟨",
    };
    return m[t] ?? "•";
}

function tipoLabel(t: TipoPonto, err?: string) {
    if (t === "ERRO_ADVERSARIO") return err ? err.replace(/_/g, " ") : "Erro Adv.";
    const m: Record<string, string> = {
        SAQUE: "Saque", ATAQUE: "Ataque", BLOQUEIO: "Bloqueio", CARTAO_ADVERSARIO: "Cartão",
    };
    return m[t] ?? t;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function verificarFimSet(p: Partida, pCasa: number, pVis: number): {
    fimSet: boolean;
    vencedorSet: LadoPonto | null;
    fimPartida: boolean;
    vencedorPartida: LadoPonto | null;
    novoSetsCasa: number;
    novoSetsVisitante: number;
} {
    const totalSetsDisputa = (p.setsParaVencerPartida ?? 3) * 2 - 1;
    const setAtual = p.setsCasa + p.setsVisitante;
    const isUltimoSet = setAtual >= totalSetsDisputa - 1;
    const pontoMin = isUltimoSet
        ? (p.pontosParaVencerUltimoSet ?? 15)
        : (p.pontosParaVencerSet ?? 25);

    const maxPontos = Math.max(pCasa, pVis);
    const diff = Math.abs(pCasa - pVis);


    if (maxPontos >= pontoMin && diff >= 2) {
        const vencedorSet: LadoPonto = pCasa > pVis ? "CASA" : "VISITANTE";
        const novoSetsCasa = p.setsCasa + (vencedorSet === "CASA" ? 1 : 0);
        const novoSetsVisitante = p.setsVisitante + (vencedorSet === "VISITANTE" ? 1 : 0);
        const sv = p.setsParaVencerPartida ?? 3;
        const fimPartida = novoSetsCasa >= sv || novoSetsVisitante >= sv;

        return {
            fimSet: true,
            vencedorSet,
            fimPartida,
            vencedorPartida: fimPartida
                ? (novoSetsCasa >= sv ? "CASA" : "VISITANTE")
                : null,
            novoSetsCasa,
            novoSetsVisitante,
        };
    }

    return {
        fimSet: false,
        vencedorSet: null,
        fimPartida: false,
        vencedorPartida: null,
        novoSetsCasa: p.setsCasa,
        novoSetsVisitante: p.setsVisitante,
    };
}

