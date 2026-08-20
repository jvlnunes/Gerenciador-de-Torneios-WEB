import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/services/api";
import type { Time, Partida, EventoPartida, JogadorPartida } from "@/services/api/interfaces";
import { EstatisticasComparativoTime } from "@/pages/Partida/components/EstatisticasComparativoTime";
import { EstatisticasTime } from "@/pages/Partida/components/EstatisticasTime";
import { cn } from "@/services/utils";
import {
  Loader2, Swords, ArrowRight, RotateCcw, Calendar, MapPin, BarChart3,
} from "lucide-react";

interface EstatisticasPorPartidaProps {
  torneioId: string;
}

const statusLabel: Record<string, string> = {
  AGENDADA: "Agendada",
  AQUECIMENTO: "Aquecimento",
  AO_VIVO: "Ao vivo",
  FINALIZADA: "Finalizada",
};

const statusColor: Record<string, string> = {
  AGENDADA: "bg-muted text-muted-foreground",
  AQUECIMENTO: "bg-amber-100 text-amber-700",
  AO_VIVO: "bg-green-100 text-green-700",
  FINALIZADA: "bg-secondary text-secondary-foreground",
};

/* ── Escolha de time (grid de botões com brasão) ─────────── */
function TimeGrid({
  times,
  excluirId,
  selecionadoId,
  onSelecionar,
}: {
  times: Time[];
  excluirId?: string | null;
  selecionadoId: string | null;
  onSelecionar: (id: string) => void;
}) {
  const disponiveis = times.filter((t) => t.id !== excluirId);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {disponiveis.map((t) => {
        const ativo = t.id === selecionadoId;
        return (
          <button
            key={t.id}
            onClick={() => onSelecionar(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-all",
              ativo ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30",
            )}
          >
            <span className="h-7 w-7 rounded-md bg-muted overflow-hidden shrink-0 grid place-items-center border border-border">
              {t.logoUrl ? (
                <img src={t.logoUrl} alt={t.nome} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] font-black text-muted-foreground">{t.nome[0]?.toUpperCase()}</span>
              )}
            </span>
            <span className="text-sm font-semibold text-foreground truncate">{t.nome}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Card de partida entre os dois times escolhidos ───────── */
function MatchOption({
  match,
  selected,
  onClick,
}: {
  match: Partida;
  selected: boolean;
  onClick: () => void;
}) {
  const timestamp = formatarTimestamp(match.agendadoPara, match.criadoEm);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30",
      )}
    >
      <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0", statusColor[match.status])}>
        {statusLabel[match.status] ?? match.status}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">
          {match.nomeTimeCasa} <span className="text-muted-foreground font-normal">vs</span> {match.nomeTimeVisitante}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          {timestamp && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {timestamp}
            </span>
          )}
          {match.local && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {match.local}
            </span>
          )}
        </div>
      </div>

      {(match.status === "FINALIZADA" || match.status === "AO_VIVO") && (
        <span className="font-display text-sm font-black text-foreground shrink-0 tabular-nums">
          {match.status === "FINALIZADA"
            ? `${match.setsCasa} × ${match.setsVisitante}`
            : `${match.setAtualCasa} – ${match.setAtualVisitante}`}
        </span>
      )}
    </button>
  );
}

function formatarTimestamp(agendadoPara?: string, criadoEm?: string): string | null {
  const fonte = agendadoPara ?? criadoEm;
  if (!fonte) return null;

  const data = new Date(fonte);
  if (Number.isNaN(data.getTime())) return null;

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EstatisticasPorPartida({ torneioId }: EstatisticasPorPartidaProps) {
  const [times, setTimes] = useState<Time[]>([]);
  const [matches, setMatches] = useState<Partida[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);

  const [timeAId, setTimeAId] = useState<string | null>(null);
  const [timeBId, setTimeBId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const [eventos, setEventos] = useState<EventoPartida[]>([]);
  const [jogadores, setJogadores] = useState<JogadorPartida[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    setLoadingBase(true);
    Promise.all([
      api.times.listarPorTorneio(torneioId),
      api.partidas.listarPorTorneio(torneioId),
    ])
      .then(([ts, ms]) => {
        setTimes(ts);
        setMatches(ms.filter((m) => m.status === "FINALIZADA" || m.status === "AO_VIVO"));
      })
      .finally(() => setLoadingBase(false));
  }, [torneioId]);

  // Partidas entre os dois times escolhidos, em qualquer ordem de casa/visitante
  const confrontos = useMemo(() => {
    if (!timeAId || !timeBId) return [];
    return matches.filter(
      (m) =>
        (m.timeCasaId === timeAId && m.timeVisitanteId === timeBId) ||
        (m.timeCasaId === timeBId && m.timeVisitanteId === timeAId),
    );
  }, [matches, timeAId, timeBId]);

  const selectedMatch = confrontos.find((m) => m.id === selectedMatchId) ?? null;

  const carregarStatsDaPartida = useCallback(async (matchId: string) => {
    setLoadingStats(true);
    try {
      const [evs, jgs] = await Promise.all([
        api.partidas.listarEventos(matchId),
        api.partidas.listarJogadoresRelacionados(matchId),
      ]);
      setEventos(evs);
      setJogadores(jgs);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Sempre que os confrontos mudam (novo par de times), escolhe automaticamente
  // a única partida se houver só uma, ou limpa a seleção se houver várias/nenhuma.
  useEffect(() => {
    if (confrontos.length === 1) {
      setSelectedMatchId(confrontos[0].id);
      carregarStatsDaPartida(confrontos[0].id);
    } else {
      setSelectedMatchId(null);
      setEventos([]);
      setJogadores([]);
    }
  }, [confrontos, carregarStatsDaPartida]);

  const handleSelecionarTimeA = (id: string) => {
    setTimeAId(id);
    if (id === timeBId) setTimeBId(null);
  };

  const handleSelecionarTimeB = (id: string) => {
    setTimeBId(id);
  };

  const handleSelecionarPartida = (matchId: string) => {
    setSelectedMatchId(matchId);
    carregarStatsDaPartida(matchId);
  };

  const resetar = () => {
    setTimeAId(null);
    setTimeBId(null);
    setSelectedMatchId(null);
    setEventos([]);
    setJogadores([]);
  };

  if (loadingBase) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (times.length < 2) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
        <Swords className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">
          É preciso pelo menos 2 times cadastrados para comparar estatísticas.
        </p>
      </div>
    );
  }

  const jogadoresCasa = jogadores.filter((j) => j.timeId === selectedMatch?.timeCasaId);
  const jogadoresVis = jogadores.filter((j) => j.timeId === selectedMatch?.timeVisitanteId);

  return (
    <div className="space-y-5">
      {/* Seleção de times */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Selecione os dois times
          </p>
          {(timeAId || timeBId) && (
            <button
              onClick={resetar}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground">1º time</p>
            <TimeGrid
              times={times}
              excluirId={timeBId}
              selecionadoId={timeAId}
              onSelecionar={handleSelecionarTimeA}
            />
          </div>

          <div className="hidden md:flex items-center justify-center h-full pt-6">
            <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground">2º time</p>
            {timeAId ? (
              <TimeGrid
                times={times}
                excluirId={timeAId}
                selecionadoId={timeBId}
                onSelecionar={handleSelecionarTimeB}
              />
            ) : (
              <div className="rounded-xl border-2 border-dashed border-border py-6 text-center">
                <p className="text-xs text-muted-foreground">Escolha o 1º time primeiro</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confrontos encontrados */}
      {timeAId && timeBId && (
        confrontos.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
            <Swords className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              Esses times ainda não se enfrentaram (ou a partida não começou).
            </p>
          </div>
        ) : confrontos.length > 1 ? (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
              {confrontos.length} confrontos encontrados — escolha um
            </p>
            {confrontos.map((m) => (
              <MatchOption
                key={m.id}
                match={m}
                selected={m.id === selectedMatchId}
                onClick={() => handleSelecionarPartida(m.id)}
              />
            ))}
          </div>
        ) : null
      )}

      {/* Estatísticas da partida selecionada */}
      {timeAId && timeBId && selectedMatch && (
        loadingStats ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 truncate">
                  {selectedMatch.nomeTimeCasa}
                </h3>
              </div>
              <EstatisticasTime
                eventos={eventos}
                jogadores={jogadoresCasa}
                nomeTime={selectedMatch.nomeTimeCasa}
                cor="emerald"
              />
            </div>

            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Comparativo geral
                </h3>
              </div>
              <EstatisticasComparativoTime
                eventos={eventos}
                partida={selectedMatch}
                setAtivo={0}
                agregarTodosSets
              />
            </div>

            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-600 truncate">
                  {selectedMatch.nomeTimeVisitante}
                </h3>
              </div>
              <EstatisticasTime
                eventos={eventos}
                jogadores={jogadoresVis}
                nomeTime={selectedMatch.nomeTimeVisitante}
                cor="orange"
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}