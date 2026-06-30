import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { api, type AuthUser, type PerfilUsuario } from "@/services/api";
import { cn } from "@/services/utils";
import {
  Users, Shield, UserCog, Plus, Search, Trash2,
  Loader2, X, AlertCircle, Check, Crown, User,
  ChevronDown, MoreVertical, Eye, EyeOff, RefreshCw,
} from "lucide-react";

/* ─── Tipos locais ─────────────────────────────────────────── */
interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  criadoEm?: string;
}

/* ─── Helpers de perfil ────────────────────────────────────── */
const PERFIL_CONFIG: Record<
  PerfilUsuario,
  { label: string; icon: React.ElementType; color: string; badgeClass: string }
> = {
  ADMIN: {
    label: "Admin",
    icon: Crown,
    color: "text-amber-600",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 border",
  },
  GERENTE: {
    label: "Gerente",
    icon: UserCog,
    color: "text-primary",
    badgeClass: "bg-primary/10 text-primary border-primary/20 border",
  },
  USUARIO: {
    label: "Usuário",
    icon: User,
    color: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground border-border border",
  },
};

/* ─── Modal: criar / editar usuário ────────────────────────── */
function ModalUsuario({
  usuario,
  onClose,
  onSaved,
}: {
  usuario: UsuarioAdmin | null; // null = criação
  onClose: () => void;
  onSaved: (u: UsuarioAdmin) => void;
}) {
  const isEdit = !!usuario;

  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>(usuario?.perfil ?? "USUARIO");
  const [showSenha, setShowSenha] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!nome.trim() || !email.trim()) {
      setError("Nome e e-mail são obrigatórios");
      return;
    }
    if (!isEdit && !senha.trim()) {
      setError("Senha é obrigatória para novos usuários");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let saved: UsuarioAdmin;

      if (isEdit) {
        // PUT /usuarios/:id
        const res = await fetch(
          `${(import.meta as any).env?.VITE_API_URL ?? "http://localhost:3000"}/usuarios/${usuario.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(api as any).authHeader?.() ?? {},
            },
            body: JSON.stringify({
              nome: nome.trim(),
              email: email.trim(),
              perfil,
              ...(senha ? { senha } : {}),
            }),
          }
        );
        if (!res.ok) throw new Error(await res.text());
        saved = await res.json();
      } else {
        // POST /auth/register (reutiliza endpoint) ou /usuarios
        const res = await fetch(
          `${(import.meta as any).env?.VITE_API_URL ?? "http://localhost:3000"}/usuarios`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nome: nome.trim(),
              email: email.trim(),
              senha,
              perfil,
            }),
          }
        );
        if (!res.ok) throw new Error(await res.text());
        saved = await res.json();
      }

      onSaved(saved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const perfis: PerfilUsuario[] = ["USUARIO", "GERENTE", "ADMIN"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {isEdit ? "Editar usuário" : "Novo usuário"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit ? `Editando ${usuario.email}` : "Preencha os dados para criar a conta"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              className="h-11"
              autoFocus
            />
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">E-mail *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="h-11"
            />
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              {isEdit ? "Nova senha (deixe em branco para manter)" : "Senha *"}
            </Label>
            <div className="relative">
              <Input
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"}
                className="h-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Perfil */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Nível de acesso</Label>
            <div className="grid grid-cols-3 gap-2">
              {perfis.map((p) => {
                const cfg = PERFIL_CONFIG[p];
                const Icon = cfg.icon;
                const active = perfil === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPerfil(p)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all",
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        active ? cfg.color : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-bold",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {cfg.label}
                    </span>
                    {active && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {perfil === "ADMIN" && "Acesso total ao sistema, incluindo gestão de usuários."}
              {perfil === "GERENTE" && "Pode criar e gerenciar torneios, times e partidas."}
              {perfil === "USUARIO" && "Acesso somente leitura. Pode visualizar torneios e estatísticas."}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving} className="flex-1 h-11 gap-2 font-semibold">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isEdit ? "Salvar alterações" : "Criar usuário"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: confirmar exclusão ────────────────────────────── */
function ModalConfirmDelete({
  usuario,
  onClose,
  onConfirm,
}: {
  usuario: UsuarioAdmin;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-5 text-center">
        <div className="h-14 w-14 rounded-full bg-destructive/10 grid place-items-center mx-auto">
          <Trash2 className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Excluir usuário?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{usuario.nome}</span> será removido
            permanentemente. Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dropdown de ações por linha ──────────────────────────── */
function AcoesDropdown({
  usuario,
  currentUserId,
  onEdit,
  onDelete,
  onChangePerfil,
}: {
  usuario: UsuarioAdmin;
  currentUserId: string;
  onEdit: () => void;
  onDelete: () => void;
  onChangePerfil: (p: PerfilUsuario) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isMe = usuario.id === currentUserId;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const perfisAlternativos = (["USUARIO", "GERENTE", "ADMIN"] as PerfilUsuario[]).filter(
    (p) => p !== usuario.perfil
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
          >
            <UserCog className="h-4 w-4 text-muted-foreground" />
            Editar dados
          </button>

          {perfisAlternativos.length > 0 && (
            <>
              <div className="h-px bg-border mx-3" />
              <div className="px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Alterar perfil
                </p>
                {perfisAlternativos.map((p) => {
                  const cfg = PERFIL_CONFIG[p];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={p}
                      onClick={() => { onChangePerfil(p); setOpen(false); }}
                      className="w-full flex items-center gap-2.5 py-2 text-sm text-foreground hover:text-primary transition-colors text-left"
                    >
                      <Icon className={cn("h-4 w-4", cfg.color)} />
                      Tornar {cfg.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {!isMe && (
            <>
              <div className="h-px bg-border mx-3" />
              <button
                onClick={() => { onDelete(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                <Trash2 className="h-4 w-4" />
                Excluir usuário
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Stats cards ──────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 shadow-sm">
      <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-3xl font-black text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ─── Linha de usuário na tabela ───────────────────────────── */
function UserRow({
  usuario,
  currentUserId,
  onEdit,
  onDelete,
  onChangePerfil,
}: {
  usuario: UsuarioAdmin;
  currentUserId: string;
  onEdit: () => void;
  onDelete: () => void;
  onChangePerfil: (p: PerfilUsuario) => void;
}) {
  const cfg = PERFIL_CONFIG[usuario.perfil];
  const Icon = cfg.icon;
  const isMe = usuario.id === currentUserId;

  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors group">
      {/* Avatar + Nome */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-xl grid place-items-center text-sm font-black text-white shrink-0",
              usuario.perfil === "ADMIN"
                ? "bg-amber-500"
                : usuario.perfil === "GERENTE"
                ? "bg-primary"
                : "bg-muted-foreground/60"
            )}
          >
            {usuario.nome?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
              {usuario.nome}
              {isMe && (
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  você
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
          </div>
        </div>
      </td>

      {/* Perfil */}
      <td className="px-4 py-4">
        <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", cfg.badgeClass)}>
          <Icon className="h-3 w-3" />
          {cfg.label}
        </div>
      </td>

      {/* Data de cadastro */}
      <td className="px-4 py-4 text-sm text-muted-foreground">
        {usuario.criadoEm
          ? new Date(usuario.criadoEm).toLocaleDateString("pt-BR")
          : "—"}
      </td>

      {/* Ações */}
      <td className="px-4 py-4 text-right">
        <AcoesDropdown
          usuario={usuario}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          onChangePerfil={onChangePerfil}
        />
      </td>
    </tr>
  );
}

/* ─── Página principal ─────────────────────────────────────── */
export default function AdminUsuarios() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPerfil, setFilterPerfil] = useState<PerfilUsuario | "TODOS">("TODOS");

  const [modalUsuario, setModalUsuario] = useState<UsuarioAdmin | null | "new">(undefined as any);
  const [modalDelete, setModalDelete] = useState<UsuarioAdmin | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Guard: só ADMIN pode acessar
  useEffect(() => {
    if (user && user.perfil !== "ADMIN") {
      navigate("/torneios");
    }
  }, [user, navigate]);

  const apiUrl = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3000";

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("vb_token");
      const res = await fetch(`${apiUrl}/usuarios`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsuarios(data);
    } catch {
      // fallback vazio
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaved = (saved: UsuarioAdmin) => {
    setUsuarios((prev) => {
      const idx = prev.findIndex((u) => u.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setModalUsuario(undefined as any);
    showSuccess(
      modalUsuario === "new"
        ? `Usuário ${saved.nome} criado com sucesso!`
        : `Dados de ${saved.nome} atualizados.`
    );
  };

  const handleDelete = async () => {
    if (!modalDelete) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("vb_token");
      await fetch(`${apiUrl}/usuarios/${modalDelete.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUsuarios((prev) => prev.filter((u) => u.id !== modalDelete.id));
      showSuccess(`${modalDelete.nome} foi removido.`);
    } catch {
      // silencioso
    } finally {
      setActionLoading(false);
      setModalDelete(null);
    }
  };

  const handleChangePerfil = async (usuario: UsuarioAdmin, novoPerfil: PerfilUsuario) => {
    try {
      const token = localStorage.getItem("vb_token");
      const res = await fetch(`${apiUrl}/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ perfil: novoPerfil }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? updated : u)));
      showSuccess(`${usuario.nome} agora é ${PERFIL_CONFIG[novoPerfil].label}.`);
    } catch {
      // silencioso
    }
  };

  /* Filtros */
  const filtered = usuarios.filter((u) => {
    const matchSearch =
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchPerfil = filterPerfil === "TODOS" || u.perfil === filterPerfil;
    return matchSearch && matchPerfil;
  });

  const stats = {
    total: usuarios.length,
    admins: usuarios.filter((u) => u.perfil === "ADMIN").length,
    gerentes: usuarios.filter((u) => u.perfil === "GERENTE").length,
    usuarios: usuarios.filter((u) => u.perfil === "USUARIO").length,
  };

  if (user?.perfil !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Modais */}
      {modalUsuario != null && (
        <ModalUsuario
          usuario={modalUsuario === "new" ? null : modalUsuario as UsuarioAdmin}
          onClose={() => setModalUsuario(undefined as any)}
          onSaved={handleSaved}
        />
      )}

      {modalDelete && (
        <ModalConfirmDelete
          usuario={modalDelete}
          onClose={() => setModalDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      <div className="container mx-auto max-w-5xl px-4 py-10">

        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Painel Admin
              </span>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Cadastre, edite e controle os níveis de acesso da plataforma.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Recarregar"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <Button onClick={() => setModalUsuario("new")} className="gap-2">
              <Plus className="h-4 w-4" /> Novo usuário
            </Button>
          </div>
        </div>

        {/* Toast de sucesso */}
        {successMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400 shadow-sm">
            <Check className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Total"
            value={stats.total}
            color="bg-muted text-foreground"
          />
          <StatCard
            icon={Crown}
            label="Admins"
            value={stats.admins}
            color="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
          />
          <StatCard
            icon={UserCog}
            label="Gerentes"
            value={stats.gerentes}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            icon={User}
            label="Usuários"
            value={stats.usuarios}
            color="bg-muted text-muted-foreground"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="pl-9 h-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filtro de perfil */}
          <div className="flex gap-1.5 flex-wrap">
            {(["TODOS", "ADMIN", "GERENTE", "USUARIO"] as const).map((p) => {
              const isActive = filterPerfil === p;
              const cfg = p !== "TODOS" ? PERFIL_CONFIG[p] : null;
              return (
                <button
                  key={p}
                  onClick={() => setFilterPerfil(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {p === "TODOS" ? "Todos" : cfg?.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                {search || filterPerfil !== "TODOS"
                  ? "Nenhum usuário encontrado"
                  : "Nenhum usuário cadastrado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search
                  ? "Tente outros termos de busca"
                  : "Crie o primeiro usuário clicando em \"Novo usuário\""}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Usuário
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Perfil
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Cadastrado em
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <UserRow
                      key={u.id}
                      usuario={u}
                      currentUserId={user?.id ?? ""}
                      onEdit={() => setModalUsuario(u)}
                      onDelete={() => setModalDelete(u)}
                      onChangePerfil={(p) => handleChangePerfil(u, p)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé da tabela */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {filtered.length} usuário{filtered.length !== 1 ? "s" : ""}
                {(search || filterPerfil !== "TODOS") && ` de ${usuarios.length} total`}
              </span>
              {(search || filterPerfil !== "TODOS") && (
                <button
                  onClick={() => { setSearch(""); setFilterPerfil("TODOS"); }}
                  className="text-primary hover:underline font-medium"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Legenda de perfis */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["ADMIN", "GERENTE", "USUARIO"] as PerfilUsuario[]).map((p) => {
            const cfg = PERFIL_CONFIG[p];
            const Icon = cfg.icon;
            return (
              <div key={p} className="flex items-start gap-3">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg grid place-items-center shrink-0",
                    p === "ADMIN"
                      ? "bg-amber-50 dark:bg-amber-900/20"
                      : p === "GERENTE"
                      ? "bg-primary/10"
                      : "bg-muted"
                  )}
                >
                  <Icon className={cn("h-4 w-4", cfg.color)} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{cfg.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {p === "ADMIN" && "Acesso total ao sistema e gestão de usuários."}
                    {p === "GERENTE" && "Cria e gerencia torneios, times e partidas."}
                    {p === "USUARIO" && "Somente visualização de torneios e estatísticas."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}