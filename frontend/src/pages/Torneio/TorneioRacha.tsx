import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import type { FaseTorneio, Torneio, ConfiguracaoRacha, PoolJogadorRacha, FilaRachaEstado } from "@/services/api/interfaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/services/utils";
import {
  Loader2, Shuffle, Users, Settings2, Trophy, Plus, X,
  AlertCircle, CheckCircle2, Crown, Play, ArrowRight,
} from "lucide-react";
import api from "@/services/api";
import type { ModoFormacaoTimes, CriterioSorteio, ModoGeracaoPartidas } from "@/services/api/types";

interface TorneioCtx {
  torneio: Torneio;
  torneioId: string;
  canManage: boolean;
}

/* ── Bloco de opção tipo toggle-card ─────────────────────── */
function OpcaoCard<T extends string>({
  value,
  current,
  onSelect,
  icon,
  label,
  desc,
  disabled,
}: {
  value: T;
  current: T;
  onSelect: (v: T) => void;
  icon: string;
  label: string;
  desc: string;
  disabled?: boolean;
}) {
  const ativo = value === current;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        ativo ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40",
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground leading-tight">{desc}</span>
    </button>
  );
}

/* ── Seção: configuração geral ────────────────────────────── */
function SecaoConfiguracao({
  faseId,
  config,
  canManage,
  onSaved,
}: {
  faseId: string;
  config: ConfiguracaoRacha;
  canManage: boolean;
  onSaved: (c: ConfiguracaoRacha) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = async (data: Partial<ConfiguracaoRacha>) => {
    setSaving(true);
    setError(null);
    try {
      const atualizado = await api.fases.atualizarConfiguracaoRacha(faseId, data);
      onSaved(atualizado);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Formação dos times</Label>
        <div className="grid grid-cols-2 gap-2">
          <OpcaoCard<ModoFormacaoTimes>
            value="MANUAL"
            current={config.modoFormacaoTimes}
            onSelect={(v) => patch({ modoFormacaoTimes: v })}
            icon="🧑‍🤝‍🧑"
            label="Manual"
            desc="Gerente cria e monta os times normalmente."
            disabled={!canManage || saving}
          />
          <OpcaoCard<ModoFormacaoTimes>
            value="POOL_SORTEIO"
            current={config.modoFormacaoTimes}
            onSelect={(v) => patch({ modoFormacaoTimes: v })}
            icon="🎲"
            label="Pool + sorteio"
            desc="Jogadores entram numa pool e os times são sorteados."
            disabled={!canManage || saving}
          />
        </div>
      </div>

      {config.modoFormacaoTimes === "POOL_SORTEIO" && (
        <div className="space-y-2 pl-1 border-l-2 border-primary/20 ml-1">
          <Label className="text-sm font-semibold text-foreground pl-3">Critério do sorteio</Label>
          <div className="grid grid-cols-2 gap-2 pl-3">
            <OpcaoCard<CriterioSorteio>
              value="ALEATORIO"
              current={config.criterioSorteio}
              onSelect={(v) => patch({ criterioSorteio: v })}
              icon="🔀"
              label="Aleatório"
              desc="Distribuição totalmente aleatória entre os times."
              disabled={!canManage || saving}
            />
            <OpcaoCard<CriterioSorteio>
              value="NOTA"
              current={config.criterioSorteio}
              onSelect={(v) => patch({ criterioSorteio: v })}
              icon="⭐"
              label="Por nota"
              desc="Distribui equilibrando a nota de habilidade de cada jogador."
              disabled={!canManage || saving}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Geração de partidas</Label>
        <div className="grid grid-cols-2 gap-2">
          <OpcaoCard<ModoGeracaoPartidas>
            value="MANUAL"
            current={config.modoGeracaoPartidas}
            onSelect={(v) => patch({ modoGeracaoPartidas: v })}
            icon="🗒️"
            label="Manual"
            desc="Gerente cria cada confronto na aba Partidas."
            disabled={!canManage || saving}
          />
          <OpcaoCard<ModoGeracaoPartidas>
            value="AUTOMATICO"
            current={config.modoGeracaoPartidas}
            onSelect={(v) => patch({ modoGeracaoPartidas: v })}
            icon="👑"
            label='Automático ("rei da quadra")'
            desc="O vencedor fica na quadra até perder ou bater o limite de vitórias seguidas."
            disabled={!canManage || saving}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-foreground">Jogadores por time</Label>
          <Input
            type="number"
            min={1}
            value={config.jogadoresPorTime}
            disabled={!canManage || saving}
            onChange={(e) => patch({ jogadoresPorTime: Number(e.target.value) })}
            className="h-10"
          />
        </div>

        {config.modoGeracaoPartidas === "AUTOMATICO" && (
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">Vitórias seguidas p/ sair</Label>
            <Input
              type="number"
              min={1}
              value={config.vitoriasSeguidasParaSair}
              disabled={!canManage || saving}
              onChange={(e) => patch({ vitoriasSeguidasParaSair: Number(e.target.value) })}
              className="h-10"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Seção: pool de jogadores + sorteio ───────────────────── */
function SecaoPool({
  faseId,
  jogadoresPorTime,
  canManage,
}: {
  faseId: string;
  jogadoresPorTime: number;
  canManage: boolean;
}) {
  const [pool, setPool] = useState<PoolJogadorRacha[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [nota, setNota] = useState("");
  const [adding, setAdding] = useState(false);
  const [sorteando, setSorteando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ times: { id: string; nome: string }[]; jogadoresNaoAlocados: { nome: string }[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPool(await api.fases.listarPool(faseId));
    } finally {
      setLoading(false);
    }
  }, [faseId]);

  useEffect(() => { load(); }, [load]);

  const adicionar = async () => {
    if (!nome.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const atualizado = await api.fases.adicionarPool(faseId, {
        novosJogadores: [{ nome: nome.trim(), notaHabilidade: nota ? Number(nota) : undefined }],
      });
      setPool(atualizado);
      setNome("");
      setNota("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const remover = async (jogadorId: string) => {
    try {
      setPool(await api.fases.removerDaPool(faseId, jogadorId));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const sortear = async () => {
    setSorteando(true);
    setError(null);
    setResultado(null);
    try {
      const r = await api.fases.sortearTimes(faseId, {});
      setResultado(r);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSorteando(false);
    }
  };

  const disponiveis = pool.filter((p) => !p.alocado);
  const alocados = pool.filter((p) => p.alocado);
  const timesFormaveis = Math.floor(disponiveis.length / Math.max(jogadoresPorTime, 1));

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {resultado && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Sorteio concluído! {resultado.times.length} times criados:</p>
            <p className="mt-1">{resultado.times.map((t) => t.nome).join(", ")}</p>
            {resultado.jogadoresNaoAlocados.length > 0 && (
              <p className="mt-1 text-green-800/80">
                Banco geral (sobra): {resultado.jogadoresNaoAlocados.map((j) => j.nome).join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {canManage && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-primary" /> Adicionar jogador à pool
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adicionar()}
              placeholder="Nome do jogador"
              className="h-10 flex-1"
            />
            <Input
              type="number"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota"
              className="h-10 w-24"
            />
            <Button onClick={adicionar} disabled={adding} className="h-10 gap-1.5 shrink-0">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Disponíveis / banco geral ({disponiveis.length})
            </p>
            {disponiveis.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhum jogador na pool ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {disponiveis.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium text-foreground">{p.jogador.nome}</span>
                    {p.jogador.notaHabilidade != null && (
                      <span className="text-xs text-muted-foreground">★{p.jogador.notaHabilidade}</span>
                    )}
                    {canManage && (
                      <button
                        onClick={() => remover(p.jogadorId)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {alocados.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Já sorteados ({alocados.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {alocados.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm text-foreground"
                  >
                    {p.jogador.nome}
                  </span>
                ))}
              </div>
            </div>
          )}

          {canManage && (
            <div className="rounded-xl border-2 border-dashed border-primary/30 p-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {timesFormaveis >= 2
                  ? `Dá pra formar ${timesFormaveis} times de ${jogadoresPorTime} jogadores.`
                  : `Faltam jogadores: com ${disponiveis.length} disponíveis só dá pra formar ${timesFormaveis} time(s) de ${jogadoresPorTime}. Mínimo: 2 times.`}
              </p>
              <Button
                onClick={sortear}
                disabled={sorteando || timesFormaveis < 2}
                className="gap-2 h-10 px-6 font-semibold"
              >
                {sorteando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
                Sortear times
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Seção: fila "rei da quadra" ──────────────────────────── */
function SecaoFila({ faseId, canManage }: { faseId: string; canManage: boolean }) {
  const [estado, setEstado] = useState<FilaRachaEstado | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEstado(await api.fases.buscarFilaRacha(faseId));
    } finally {
      setLoading(false);
    }
  }, [faseId]);

  useEffect(() => { load(); }, [load]);

  const iniciar = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.fases.iniciarFilaRacha(faseId);
      setEstado(r.estado);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {!estado ? (
        <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
          <Crown className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">Fila ainda não foi iniciada.</p>
          {canManage && (
            <Button onClick={iniciar} disabled={busy} className="mt-4 gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Iniciar fila do racha
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Defendendo a quadra
              </p>
              <p className="text-sm font-black text-foreground">
                {estado.vitoriasSeguidas} vitória{estado.vitoriasSeguidas !== 1 ? "s" : ""} seguida{estado.vitoriasSeguidas !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Fila de espera ({estado.timesAguardando.length})
            </p>
            {estado.timesAguardando.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sem desafiantes na fila.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {estado.timesAguardando.map((id, i) => (
                  <span key={id} className="flex items-center gap-1">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                      {i + 1}º
                    </span>
                    {i < estado.timesAguardando.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            O próximo confronto é criado automaticamente assim que a partida atual for finalizada
            (o resultado é enviado pro endpoint de avançar a fila a partir da tela da partida ao vivo).
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Página principal ─────────────────────────────────────── */
type Aba = "config" | "pool" | "fila";

export default function TorneioRacha() {
  const { torneioId, canManage } = useOutletContext<TorneioCtx>();

  const [fase, setFase] = useState<FaseTorneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>("config");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // A lógica de listar fases geralmente depende do ID do torneio
        // Verifique se no seu serviço de torneios ou fases você criou esse endpoint
        const todasAsFases = await api.torneios.listarFases(torneioId); // Ajuste se necessário
        const racha = todasAsFases.find((f) => f.tipo === "RACHA");

        if (!racha) {
          setError("Este torneio não tem uma fase RACHA configurada.");
          return;
        }

        // Se a sua API de fases já retorna os dados completos (configuracaoRacha), 
        // você pode usar o objeto racha diretamente e pular a chamada extra de "buscar"
        setFase(racha);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [torneioId]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !fase) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const config = fase.configuracaoRacha ?? {
    id: "",
    faseId: fase.id,
    modoFormacaoTimes: "MANUAL" as const,
    criterioSorteio: "ALEATORIO" as const,
    modoGeracaoPartidas: "MANUAL" as const,
    jogadoresPorTime: 4,
    vitoriasSeguidasParaSair: 2,
  };

  const tabs: { id: Aba; label: string; icon: React.ReactNode }[] = [
    { id: "config", label: "Configuração", icon: <Settings2 className="h-4 w-4" /> },
    { id: "pool", label: "Pool & Sorteio", icon: <Users className="h-4 w-4" /> },
    { id: "fila", label: "Fila (rei da quadra)", icon: <Trophy className="h-4 w-4" /> },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-foreground flex items-center gap-2">
          🤝 Configurar Racha
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Defina como os times serão formados e como as partidas serão geradas.
        </p>
      </div>

      <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all",
              aba === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {aba === "config" && (
          <SecaoConfiguracao
            faseId={fase.id}
            config={config}
            canManage={canManage}
            onSaved={(c) => setFase((f) => (f ? { ...f, configuracaoRacha: c } : f))}
          />
        )}
        {aba === "pool" && config.modoFormacaoTimes === "POOL_SORTEIO" && (
          <SecaoPool faseId={fase.id} jogadoresPorTime={config.jogadoresPorTime} canManage={canManage} />
        )}
        {aba === "pool" && config.modoFormacaoTimes === "MANUAL" && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            O modo de formação de times está como <strong className="text-foreground">Manual</strong>.
            Mude para <strong className="text-foreground">Pool + sorteio</strong> na aba Configuração para usar o sorteio.
          </div>
        )}
        {aba === "fila" && config.modoGeracaoPartidas === "AUTOMATICO" && (
          <SecaoFila faseId={fase.id} canManage={canManage} />
        )}
        {aba === "fila" && config.modoGeracaoPartidas === "MANUAL" && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            A geração de partidas está como <strong className="text-foreground">Manual</strong>.
            As partidas do racha são criadas na aba <strong className="text-foreground">Partidas</strong>.
          </div>
        )}
      </div>
    </div>
  );
}