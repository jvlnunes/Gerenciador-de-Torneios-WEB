import { createFileRoute, useOutletContext } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { api, type Torneio } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/services/utils";
import {
  ChevronDown, Check, Loader2, AlertCircle,
  Info, Settings, Layers, Users, Image, Target, Shield,
} from "lucide-react";

export const Route = createFileRoute("/torneios/$id/settings")({
  component: TournamentSettingsPage,
});

interface OutletCtx {
  torneio: Torneio;
  setTorneio: (t: Torneio) => void;
  torneioId: string;
  canManage: boolean;
}

/* ── Config block colapsável ── */
function ConfigBlock({
  icon: Icon,
  title,
  description,
  defaultOpen = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform flex-shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Campo de leitura ── */
function ReadRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || <span className="italic text-muted-foreground/60">Não informado</span>}</span>
    </div>
  );
}

/* ── Bloco: Informações básicas (editável) ── */
function BasicInfoBlock({ torneio, onSaved }: { torneio: Torneio; onSaved: (t: Torneio) => void }) {
  const [editing, setEditing] = useState(false);
  const [nome, setNome]           = useState(torneio.nome);
  const [descricao, setDescricao] = useState(torneio.descricao ?? "");
  const [local, setLocal]         = useState(torneio.local ?? "");
  const [dataInicio, setDataInicio] = useState(torneio.dataInicio?.slice(0, 10) ?? "");
  const [dataFim, setDataFim]     = useState(torneio.dataFim?.slice(0, 10) ?? "");
  const [status, setStatus]       = useState(torneio.status ?? "RASCUNHO");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { setError("O nome é obrigatório"); return; }
    setSaving(true); setError(null);
    try {
      const updated = await api.atualizarTorneio(torneio.id, {
        nome: nome.trim(), descricao, local, dataInicio, dataFim, status: status as Torneio["status"],
      });
      onSaved(updated);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfigBlock icon={Info} title="Informações básicas" description="Nome, local, datas e status" defaultOpen>
      {!editing ? (
        <div>
          <ReadRow label="Nome" value={torneio.nome} />
          <ReadRow label="Descrição" value={torneio.descricao} />
          <ReadRow label="Local" value={torneio.local} />
          <ReadRow label="Início" value={torneio.dataInicio ? new Date(torneio.dataInicio).toLocaleDateString("pt-BR") : undefined} />
          <ReadRow label="Término" value={torneio.dataFim ? new Date(torneio.dataFim).toLocaleDateString("pt-BR") : undefined} />
          <ReadRow label="Status" value={torneio.status} />
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Editar
            </Button>
            {success && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Salvo com sucesso
              </span>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="nome" className="text-sm font-semibold">Nome *</Label>
            <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} required className="h-9" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc" className="text-sm font-semibold">Descrição</Label>
            <Textarea id="desc" value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} className="resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="local" className="text-sm font-semibold">Local</Label>
              <Input id="local" value={local} onChange={e => setLocal(e.target.value)} placeholder="Ginásio Municipal" className="h-9" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-sm font-semibold">Status</Label>
              <select
                id="status"
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="RASCUNHO">Rascunho</option>
                <option value="ABERTO">Inscrições abertas</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inicio" className="text-sm font-semibold">Data de início</Label>
              <Input id="inicio" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-9" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fim" className="text-sm font-semibold">Data de término</Label>
              <Input id="fim" type="date" value={dataFim} min={dataInicio} onChange={e => setDataFim(e.target.value)} className="h-9" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Salvar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </ConfigBlock>
  );
}

/* ── Bloco: Regras (read-only por enquanto) ── */
function RulesBlock() {
  return (
    <ConfigBlock icon={Target} title="Regras da partida" description="Sets, pontuação e formato de jogo">
      <ReadRow label="Titulares por equipe" value="6 jogadores" />
      <ReadRow label="Sets para vencer" value="3 (melhor de 5)" />
      <ReadRow label="Pontos por set regular" value="25 pts" />
      <ReadRow label="Set decisivo (5º)" value="15 pts" />
      <ReadRow label="Vencer por 2 pontos" value="Sim" />
      <div className="mt-4">
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
          As regras podem ser alteradas enquanto o torneio estiver em rascunho.
        </div>
      </div>
    </ConfigBlock>
  );
}

/* ── Bloco: Fases ── */
function PhasesBlock() {
  return (
    <ConfigBlock icon={Layers} title="Formato e fases" description="Estrutura de disputa do campeonato">
      <div className="space-y-2 mb-4">
        {[
          { num: 1, name: "Fase de grupos", format: "Pontos corridos", teams: "8 times" },
          { num: 2, name: "Eliminatórias",  format: "Mata-mata",        teams: "Top 4" },
        ].map(phase => (
          <div key={phase.num} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
            <div className="h-7 w-7 rounded-full bg-primary/10 grid place-items-center text-xs font-bold text-primary flex-shrink-0">
              {phase.num}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{phase.name}</p>
              <p className="text-xs text-muted-foreground">{phase.format} · {phase.teams}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
        Edição de fases disponível em breve.
      </div>
    </ConfigBlock>
  );
}

/* ── Bloco: Organizadores ── */
function OrganizersBlock() {
  const organizers = [
    { nome: "João Silva",   email: "joao@exemplo.com",  role: "Principal" },
    { nome: "Ana Oliveira", email: "ana@exemplo.com",   role: "Assistente" },
  ];

  return (
    <ConfigBlock icon={Users} title="Organizadores" description="Responsáveis pelo torneio">
      <div className="space-y-2 mb-4">
        {organizers.map((org, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center text-xs font-bold text-primary flex-shrink-0">
              {org.nome[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{org.nome}</p>
              <p className="text-xs text-muted-foreground">{org.email}</p>
            </div>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              i === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {org.role}
            </span>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" className="gap-1.5">
        <Users className="h-3.5 w-3.5" /> Gerenciar organizadores
      </Button>
    </ConfigBlock>
  );
}

/* ── Bloco: Mídia ── */
function MediaBlock({ torneio }: { torneio: Torneio }) {
  return (
    <ConfigBlock icon={Image} title="Mídia e aparência" description="Banner, logo e redes sociais">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Banner</p>
          {torneio.bannerUrl ? (
            <img src={torneio.bannerUrl} alt="Banner" className="w-full h-16 object-cover rounded-md" />
          ) : (
            <div className="w-full h-16 rounded-md bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Não configurado</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Logo</p>
          {torneio.logoUrl ? (
            <img src={torneio.logoUrl} alt="Logo" className="h-16 w-16 object-cover rounded-lg" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground">Sem logo</span>
            </div>
          )}
        </div>
      </div>
      <Button size="sm" variant="outline" className="gap-1.5">
        <Image className="h-3.5 w-3.5" /> Editar mídias
      </Button>
    </ConfigBlock>
  );
}

/* ── Bloco: Zona de perigo ── */
function DangerBlock({ torneioId }: { torneioId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.removerTorneio(torneioId);
      window.location.href = "/torneios";
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <ConfigBlock icon={Shield} title="Zona de perigo" description="Ações irreversíveis">
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
          <div>
            <p className="text-sm font-semibold text-foreground">Excluir torneio</p>
            <p className="text-xs text-muted-foreground mt-0.5">Remove permanentemente o torneio e todos os dados.</p>
          </div>
          {!confirming ? (
            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirming(true)}>
              Excluir
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive font-semibold">Tem certeza?</span>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Não</Button>
              <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sim, excluir"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </ConfigBlock>
  );
}

/* ── Página principal ── */
export function TournamentSettingsPage() {
  const { torneio, setTorneio, torneioId, canManage } = useOutletContext<OutletCtx>();

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <Settings className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="font-display text-lg font-bold text-foreground">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground mt-1">Apenas administradores podem acessar as configurações.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie todas as configurações do torneio em blocos independentes.
        </p>
      </div>

      <div className="space-y-3">
        <BasicInfoBlock torneio={torneio} onSaved={setTorneio} />
        <RulesBlock />
        <PhasesBlock />
        <OrganizersBlock />
        <MediaBlock torneio={torneio} />
        <DangerBlock torneioId={torneioId} />
      </div>
    </div>
  );
}