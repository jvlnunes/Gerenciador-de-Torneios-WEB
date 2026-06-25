import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, type Time, type Jogador } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/services/utils";
import {
  ArrowLeft, Plus, Loader2, X, Users, Star,
  StarOff, Check, AlertCircle, Instagram,
  Phone, Globe, Facebook, MessageCircle, Mail,
  Palette, Save, ChevronRight, Shield,
} from "lucide-react";

type Tab = "elenco" | "formacao" | "identidade";

const POSITIONS = ["Levantador", "Ponteiro", "Oposto", "Central", "Líbero", "Outro"];

/* ─── Utilitário ─────────────────────────────────────────── */
function proximoCamisa(players: Jogador[]): number {
  const used = new Set(players.map((p) => p.numeroCamisa).filter(Boolean) as number[]);
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

/* ─── PlayerRow ──────────────────────────────────────────── */
function PlayerRow({
  jogador,
  canManage,
  onUpdate,
  onDelete,
  onToggleTitular,
}: {
  jogador: Jogador;
  canManage: boolean;
  onUpdate: (data: Partial<Jogador>) => void;
  onDelete: () => void;
  onToggleTitular: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(jogador.nome);
  const [editingNum, setEditingNum] = useState(false);
  const [draftNum, setDraftNum] = useState(String(jogador.numeroCamisa ?? ""));
  const nameRef = useRef<HTMLInputElement>(null);
  const numRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingName) nameRef.current?.focus(); }, [editingName]);
  useEffect(() => { if (editingNum) numRef.current?.focus(); }, [editingNum]);

  const commitName = () => {
    setEditingName(false);
    if (draftName.trim() && draftName !== jogador.nome) onUpdate({ nome: draftName.trim() });
    else setDraftName(jogador.nome);
  };

  const commitNum = () => {
    setEditingNum(false);
    const n = draftNum ? Number(draftNum) : undefined;
    if (n !== jogador.numeroCamisa) onUpdate({ numeroCamisa: n });
  };

  return (
    <div
      className={cn(
        "grid items-center gap-2 px-4 py-3 rounded-xl border transition-all group",
        jogador.titular
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:bg-muted/30"
      )}
      style={{ gridTemplateColumns: "2.5rem 1fr auto auto" }}
    >
      {/* Nº camisa */}
      <div className="text-center">
        {editingNum && canManage ? (
          <input
            ref={numRef}
            type="number"
            min={1}
            max={99}
            value={draftNum}
            onChange={(e) => setDraftNum(e.target.value)}
            onBlur={commitNum}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitNum();
              if (e.key === "Escape") setEditingNum(false);
            }}
            className="w-10 h-7 rounded border border-primary bg-background px-1 text-xs text-center focus:outline-none"
          />
        ) : (
          <button
            onClick={() => canManage && setEditingNum(true)}
            title={canManage ? "Clique para editar número" : undefined}
            className={cn(
              "w-8 h-8 rounded-lg font-mono text-sm font-black grid place-items-center mx-auto transition-colors",
              jogador.titular
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
              canManage && "hover:opacity-80"
            )}
          >
            {jogador.numeroCamisa ?? "–"}
          </button>
        )}
      </div>

      {/* Nome + posição */}
      <div className="min-w-0">
        {editingName && canManage ? (
          <input
            ref={nameRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") setEditingName(false);
            }}
            className="h-7 w-full rounded border border-primary bg-background px-2 text-sm focus:outline-none"
          />
        ) : (
          <button
            onClick={() => canManage && setEditingName(true)}
            title={canManage ? "Clique para editar nome" : undefined}
            className={cn(
              "text-sm font-semibold text-foreground text-left w-full truncate block",
              canManage && "hover:text-primary transition-colors"
            )}
          >
            {jogador.nome}
          </button>
        )}
        <select
          value={jogador.posicao ?? ""}
          onChange={(e) => canManage && onUpdate({ posicao: e.target.value || undefined })}
          disabled={!canManage}
          className="text-xs text-muted-foreground bg-transparent border-none focus:outline-none disabled:cursor-default mt-0.5"
        >
          <option value="">— sem posição —</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Badge titular */}
      <div>
        {jogador.titular && (
          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 border shrink-0">
            Titular
          </Badge>
        )}
      </div>

      {/* Ações */}
      {canManage && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggleTitular}
            title={jogador.titular ? "Remover titular" : "Marcar como titular"}
            className="p-1.5 rounded text-muted-foreground hover:text-primary transition-colors"
          >
            {jogador.titular
              ? <StarOff className="h-3.5 w-3.5" />
              : <Star className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onDelete}
            title="Excluir jogador"
            className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── AddPlayerRow ───────────────────────────────────────── */
function AddPlayerRow({
  players,
  teamId,
  onCreated,
}: {
  players: Jogador[];
  teamId: string;
  onCreated: (p: Jogador) => void;
}) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!name.trim()) { setError("Nome obrigatório"); nameRef.current?.focus(); return; }
    setSaving(true); setError(null);
    const numeroCamisa = jersey ? Number(jersey) : proximoCamisa(players);
    try {
      const p = await api.criarJogador({
        timeId: teamId,
        nome: name.trim(),
        numeroCamisa,
        posicao: position || undefined,
      });
      onCreated(p);
      setName(""); setJersey(""); setPosition("");
      nameRef.current?.focus();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-2 pt-4 border-t border-border">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={99}
          value={jersey}
          onChange={(e) => setJersey(e.target.value)}
          placeholder="Nº"
          className="h-9 w-14 rounded-lg border border-input bg-background px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
        />
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nome do jogador"
          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Posição</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button
          onClick={submit}
          disabled={saving}
          className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:bg-primary/90 transition-colors shrink-0"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Nº atribuído automaticamente se vazio · Enter para adicionar
      </p>
    </div>
  );
}

/* ─── Aba: Elenco ────────────────────────────────────────── */
function TabElenco({ time, canManage }: { time: Time; canManage: boolean }) {
  const [players, setPlayers] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPlayers(await api.listarJogadores(time.id)); }
    finally { setLoading(false); }
  }, [time.id]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (id: string, data: Partial<Jogador>) => {
    try {
      const updated = await api.atualizarJogador(time.id, id, data);
      setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, ...updated } : p));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover jogador?")) return;
    await api.deletarJogador(time.id, id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  const titulares = players.filter((p) => p.titular);
  const reservas = players.filter((p) => !p.titular);

  return (
    <div className="space-y-6">
      {/* Contadores */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: players.length, color: "text-foreground" },
          { label: "Titulares", value: titulares.length, color: "text-primary" },
          { label: "Reservas", value: reservas.length, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center shadow-sm">
            <p className={cn("font-display text-2xl font-black", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {players.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-14 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-semibold text-foreground">Nenhum jogador ainda</p>
          <p className="text-xs text-muted-foreground mt-1">
            {canManage ? "Adicione jogadores usando o formulário abaixo" : "Nenhum jogador cadastrado"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((p) => (
            <PlayerRow
              key={p.id}
              jogador={p}
              canManage={canManage}
              onUpdate={(data) => handleUpdate(p.id, data)}
              onDelete={() => handleDelete(p.id)}
              onToggleTitular={() => handleUpdate(p.id, { titular: !p.titular })}
            />
          ))}
        </div>
      )}

      {canManage && (
        <AddPlayerRow
          players={players}
          teamId={time.id}
          onCreated={(p) => setPlayers((prev) => [...prev, p])}
        />
      )}
    </div>
  );
}

/* ─── Aba: Formação ──────────────────────────────────────── */
function TabFormacao({ time, canManage }: { time: Time; canManage: boolean }) {
  const [players, setPlayers] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPlayers(await api.listarJogadores(time.id)); }
    finally { setLoading(false); }
  }, [time.id]);

  useEffect(() => { load(); }, [load]);

  const toggleTitular = async (jogador: Jogador) => {
    const titulares = players.filter((p) => p.titular);
    if (!jogador.titular && titulares.length >= 6) {
      alert("Máximo de 6 titulares. Remova um antes de adicionar outro.");
      return;
    }
    setSaving(jogador.id);
    try {
      const updated = await api.atualizarJogador(time.id, jogador.id, { titular: !jogador.titular });
      setPlayers((prev) => prev.map((p) => p.id === jogador.id ? { ...p, ...updated } : p));
    } finally { setSaving(null); }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  const titulares = players.filter((p) => p.titular);
  const reservas = players.filter((p) => !p.titular);
  const cor = time.corPrimaria || "var(--color-primary)";

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Formação titular</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecione os 6 jogadores que iniciam em quadra.
          </p>
        </div>
        <span className={cn(
          "font-display text-2xl font-black shrink-0",
          titulares.length === 6 ? "text-primary" : "text-muted-foreground"
        )}>
          {titulares.length}/6
        </span>
      </div>

      {/* Em quadra */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Em quadra</h3>
          <div className="flex-1 h-px opacity-30" style={{ background: cor }} />
          <span className="text-xs font-bold text-primary">{titulares.length}/6</span>
        </div>

        {titulares.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum titular selecionado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {titulares.map((j) => (
              <div
                key={j.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5"
              >
                <div
                  className="h-9 w-9 rounded-lg grid place-items-center text-sm font-black text-white shrink-0"
                  style={{ background: cor }}
                >
                  {j.numeroCamisa ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{j.nome}</p>
                  <p className="text-xs text-muted-foreground">{j.posicao || "Sem posição"}</p>
                </div>
                {canManage && (
                  <button
                    onClick={() => toggleTitular(j)}
                    disabled={saving === j.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remover da formação"
                  >
                    {saving === j.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <X className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banco */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Banco de reservas
          </h3>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{reservas.length}</span>
        </div>

        {reservas.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {players.length === 0 ? "Nenhum jogador cadastrado" : "Todos os jogadores são titulares"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {reservas.map((j) => (
              <div key={j.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center text-sm font-bold text-muted-foreground shrink-0">
                  {j.numeroCamisa ?? "–"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{j.nome}</p>
                  <p className="text-xs text-muted-foreground">{j.posicao || "Sem posição"}</p>
                </div>
                {canManage && (
                  <button
                    onClick={() => toggleTitular(j)}
                    disabled={saving === j.id || titulares.length >= 6}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0",
                      titulares.length >= 6
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : "text-primary hover:bg-primary/10"
                    )}
                    title={titulares.length >= 6 ? "Limite atingido" : "Adicionar à formação"}
                  >
                    {saving === j.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <><Star className="h-3.5 w-3.5" /> Titular</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Aba: Identidade ────────────────────────────────────── */
function TabIdentidade({
  time,
  canManage,
  onSaved,
}: {
  time: Time;
  canManage: boolean;
  onSaved: (t: Time) => void;
}) {
  const [nome, setNome] = useState(time.nome);
  const [logoUrl, setLogoUrl] = useState(time.logoUrl ?? "");
  const [corPrimaria, setCorPrimaria] = useState(time.corPrimaria ?? "#00843D");
  const [corSecundaria, setCorSecundaria] = useState(time.corSecundaria ?? "#ffffff");
  const [email, setEmail] = useState(time.email ?? "");
  const [telefone, setTelefone] = useState(time.telefone ?? "");
  const [instagram, setInstagram] = useState(time.instagram ?? "");
  const [whatsapp, setWhatsapp] = useState(time.whatsapp ?? "");
  const [facebook, setFacebook] = useState(time.facebook ?? "");
  const [site, setSite] = useState(time.site ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!nome.trim()) { setError("Nome é obrigatório"); return; }
    setSaving(true); setError(null);
    try {
      const updated = await api.atualizarTime(time.id, {
        nome: nome.trim(),
        logoUrl: logoUrl || undefined,
        corPrimaria: corPrimaria || undefined,
        corSecundaria: corSecundaria || undefined,
        email: email || undefined,
        telefone: telefone || undefined,
        instagram: instagram || undefined,
        whatsapp: whatsapp || undefined,
        facebook: facebook || undefined,
        site: site || undefined,
      });
      onSaved(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally { setSaving(false); }
  };

  const cor = corPrimaria || "#00843D";

  return (
    <div className="space-y-8">
      {/* Prévia */}
      <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
        <div
          className="h-20 w-full"
          style={{ background: `linear-gradient(135deg, ${cor} 0%, ${cor}99 100%)` }}
        />
        <div className="px-5 pb-5 flex items-end gap-4 -mt-8">
          <div
            className="h-16 w-16 rounded-xl border-4 grid place-items-center text-2xl font-black text-white shadow-md shrink-0 overflow-hidden"
            style={{ background: cor, borderColor: "var(--background)" }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              nome?.[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <div className="pb-1">
            <p className="font-display text-xl font-black text-foreground leading-tight">
              {nome || "Nome do time"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Prévia do brasão e cores</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Nome */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Nome do time *</Label>
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Tigres FC"
          disabled={!canManage}
          className="h-11"
        />
      </div>

      {/* URL do brasão */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">URL do brasão</Label>
        <Input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://exemplo.com/brasao.png"
          disabled={!canManage}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">Cole o link de uma imagem PNG ou JPG</p>
      </div>

      {/* Cores */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Cores do time</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Cor primária", value: corPrimaria, onChange: setCorPrimaria },
            { label: "Cor secundária", value: corSecundaria, onChange: setCorSecundaria },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {label}
              </Label>
              <div className="flex items-center gap-3 h-11 rounded-xl border border-input px-3 bg-background">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={!canManage}
                  className="h-7 w-7 rounded cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-mono text-foreground">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contato & redes */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-4">Contato & redes sociais</h3>
        <div className="space-y-3">
          {[
            { icon: Mail, label: "E-mail", value: email, onChange: setEmail, placeholder: "time@email.com", type: "email" },
            { icon: Phone, label: "Telefone", value: telefone, onChange: setTelefone, placeholder: "(00) 00000-0000", type: "tel" },
            { icon: Instagram, label: "Instagram", value: instagram, onChange: setInstagram, placeholder: "https://instagram.com/time", type: "url" },
            { icon: MessageCircle, label: "WhatsApp", value: whatsapp, onChange: setWhatsapp, placeholder: "https://wa.me/5500000000000", type: "url" },
            { icon: Facebook, label: "Facebook", value: facebook, onChange: setFacebook, placeholder: "https://facebook.com/time", type: "url" },
            { icon: Globe, label: "Site", value: site, onChange: setSite, placeholder: "https://meutime.com.br", type: "url" },
          ].map(({ icon: Icon, label, value, onChange, placeholder, type }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted grid place-items-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={!canManage}
                className="h-10 flex-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Salvar */}
      {canManage && (
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 h-11 px-8 font-semibold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </Button>
          {success && (
            <span className="text-sm text-green-600 flex items-center gap-1.5 font-medium">
              <Check className="h-4 w-4" /> Salvo com sucesso!
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────── */
export default function TorneioTimeDetalhe() {
  const { torneioId, timeId } = useParams<{ torneioId: string; timeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";

  const [time, setTime] = useState<Time | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("elenco");

  useEffect(() => {
    if (!timeId) return;
    api.buscarTime(timeId)
      .then(setTime)
      .catch(() => navigate(`/torneios/${torneioId}`))
      .finally(() => setLoading(false));
  }, [timeId, torneioId, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );

  if (!time) return null;

  const cor = time.corPrimaria || "#00843D";
  const corSec = time.corSecundaria || "#ffffff";

  const tabs: { id: Tab; label: string }[] = [
    { id: "elenco", label: "Elenco" },
    { id: "formacao", label: "Formação" },
    { id: "identidade", label: "Identidade" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Faixa de cor */}
        <div
          className="h-32 w-full"
          style={{
            background: `linear-gradient(135deg, ${cor} 0%, ${cor}cc 60%, ${cor}44 100%)`,
          }}
        />

        {/* Conteúdo */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-end gap-5 -mt-12 pb-5">
            {/* Brasão */}
            <div
              className="h-24 w-24 rounded-2xl border-4 shadow-xl grid place-items-center text-4xl font-black shrink-0 overflow-hidden"
              style={{ background: cor, borderColor: "var(--background)", color: corSec }}
            >
              {time.logoUrl ? (
                <img
                  src={time.logoUrl}
                  alt={`Brasão ${time.nome}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                time.nome?.[0]?.toUpperCase() ?? "?"
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="font-display text-3xl font-black text-foreground leading-tight">
                {time.nome}
              </h1>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                <Link
                  to={`/torneios/${torneioId}`}
                  className="hover:text-primary transition-colors"
                >
                  Torneio
                </Link>
                <ChevronRight className="h-3 w-3" />
                <Link
                  to={`/torneios/${torneioId}/times`}
                  className="hover:text-primary transition-colors"
                >
                  Times
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium truncate">{time.nome}</span>
              </nav>
            </div>

            {/* Botão voltar */}
            <button
              onClick={() => navigate(`/torneios/${torneioId}/times`)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pb-1 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="border-b border-border bg-background sticky top-16 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-6 py-3.5 text-sm font-semibold transition-colors",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ background: cor }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Conteúdo ──────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        {activeTab === "elenco" && (
          <TabElenco time={time} canManage={canManage} />
        )}
        {activeTab === "formacao" && (
          <TabFormacao time={time} canManage={canManage} />
        )}
        {activeTab === "identidade" && (
          <TabIdentidade time={time} canManage={canManage} onSaved={setTime} />
        )}
      </div>
    </div>
  );
}