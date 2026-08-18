import type { Time, Jogador, Torneio } from "@/services/api/interfaces"
import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import api from "@/services/api"
import { SiteHeader } from "@/components/site-header"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/services/utils"
import {
  ArrowLeft, Plus, Loader2, X, Users, Star, StarOff,
  Check, AlertCircle, Instagram, Phone, Globe, Facebook,
  MessageCircle, Mail, Palette, Save, ChevronRight,
  GripVertical, Shield, LayoutGrid, ChevronDown,
} from "lucide-react"

type Tab = "elenco" | "identidade"
type IndicePosicao = 0 | 1 | 2 | 3 | 4 | 5

interface TitularNaQuadra {
  jogadorId: string
  indicePosicao: IndicePosicao
}

/** Fonte única de verdade do drag-and-drop: nunca duplicar este estado. */
type DragOrigin = { from: IndicePosicao | "bench"; jogadorId: string } | null

const POSITIONS = ["Levantador", "Ponteiro", "Oposto", "Central", "Líbero", "Outro"]

function proximoCamisa(players: Jogador[]): number {
  const used = new Set(players.map((p) => p.numeroCamisa).filter(Boolean) as number[])
  let n = 1
  while (used.has(n)) n++
  return n
}

const ORDEM_SLOTS: IndicePosicao[] = [0, 3, 2, 4, 1, 5]
const LABEL_SLOT: Record<number, string> = { 0: "5", 1: "1 · Saque", 2: "6", 3: "4", 4: "3", 5: "2" }

/* ────────────────────────────────────────────────────────────
   Quadra (visual) — sem estado próprio de drag. Tudo controlado
   pelo pai via `dragging` (origem atual) e os callbacks abaixo.
──────────────────────────────────────────────────────────── */
function QuadraFormacao({
  titulares,
  jogadores,
  cor,
  dragging,
  onDragStartSlot,
  onDropOnSlot,
  onSendToBench,
}: {
  titulares: TitularNaQuadra[]
  jogadores: Jogador[]
  cor: string
  dragging: DragOrigin
  onDragStartSlot: (from: IndicePosicao, jogadorId: string) => void
  onDropOnSlot: (toSlot: IndicePosicao) => void
  onSendToBench: (indicePosicao: IndicePosicao) => void
}) {
  const [overSlot, setOverSlot] = useState<IndicePosicao | null>(null)

  const getJogador = (indice: IndicePosicao) => {
    const t = titulares.find((t) => t.indicePosicao === indice)
    if (!t) return undefined
    return jogadores.find((j) => j.id === t.jogadorId)
  }

  return (
    <div
      className="rounded-2xl border-4 border-white overflow-hidden shadow-inner relative"
      style={{ background: "#E89D78", aspectRatio: "1.4 / 1" }}
    >
      <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-white z-20 shadow-[0_0_6px_rgba(0,0,0,0.4)]">
        <div className="w-3 h-3 rounded-full bg-red-500 border border-white absolute -top-1 -left-[5px]" />
        <div className="w-3 h-3 rounded-full bg-red-500 border border-white absolute -bottom-1 -left-[5px]" />
      </div>
      <div className="absolute top-0 bottom-0 right-[33.33%] w-[2px] bg-white/50 z-0" />

      <div className="grid grid-cols-[2fr_1fr] grid-rows-3 h-full relative z-10 p-1.5 gap-1">
        {ORDEM_SLOTS.map((indice) => {
          const jogador = getJogador(indice)
          const isSacador = indice === 1
          const isOver = overSlot === indice
          const isBeingDragged = dragging?.from === indice

          return (
            <div
              key={indice}
              className={cn(
                "relative flex flex-col items-center justify-center min-h-[52px] rounded-lg transition-all",
                isOver && dragging && "bg-white/35 ring-2 ring-white scale-[1.03]",
                !jogador && "border border-dashed border-white/25 m-0.5",
                isBeingDragged && "opacity-40",
              )}
              onDragOver={(e) => { e.preventDefault(); setOverSlot(indice) }}
              onDragLeave={() => setOverSlot(null)}
              onDrop={(e) => {
                e.preventDefault()
                setOverSlot(null)
                onDropOnSlot(indice)
              }}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-1 text-[8px] font-black select-none tracking-wide",
                  isSacador ? "text-yellow-300" : "text-white/40",
                )}
              >
                {LABEL_SLOT[indice]}
              </span>

              {jogador ? (
                <div
                  draggable
                  onDragStart={() => onDragStartSlot(indice, jogador.id)}
                  className="flex flex-col items-center cursor-grab active:cursor-grabbing group"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shadow-md border-2 border-white text-white transition-transform group-hover:scale-105",
                      isSacador && "ring-2 ring-yellow-300 ring-offset-1 ring-offset-transparent",
                    )}
                    style={{ background: cor }}
                  >
                    {jogador.numeroCamisa ?? "?"}
                  </div>
                  <span className="text-[9px] text-white font-bold mt-0.5 truncate max-w-[58px] px-1 text-center bg-black/30 rounded py-0.5">
                    {jogador.nome.split(" ")[0]}
                  </span>
                </div>
              ) : (
                <span className="text-[9px] text-white/25 select-none">vazio</span>
              )}

              {titulares.some((t) => t.indicePosicao === indice) && (
                <button
                  onClick={() => onSendToBench(indice)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/40 text-white/70 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[10px] leading-none"
                  title="Remover para banco"
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Linha de jogador editável ──────────────────────────── */
function PlayerRow({
  jogador,
  isTitular,
  canManage,
  onUpdate,
  onDelete,
  onToggleTitular,
  draggable,
  onDragStart,
}: {
  jogador: Jogador
  isTitular: boolean
  canManage: boolean
  onUpdate: (data: Partial<Jogador>) => void
  onDelete: () => void
  onToggleTitular: () => void
  draggable?: boolean
  onDragStart?: () => void
}) {
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(jogador.nome)
  const [editingNum, setEditingNum] = useState(false)
  const [draftNum, setDraftNum] = useState(String(jogador.numeroCamisa ?? ""))
  const nameRef = useRef<HTMLInputElement>(null)
  const numRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editingName) nameRef.current?.focus() }, [editingName])
  useEffect(() => { if (editingNum) numRef.current?.focus() }, [editingNum])

  const commitName = () => {
    setEditingName(false)
    if (draftName.trim() && draftName !== jogador.nome) onUpdate({ nome: draftName.trim() })
    else setDraftName(jogador.nome)
  }

  const commitNum = () => {
    setEditingNum(false)
    const n = draftNum ? Number(draftNum) : undefined
    if (n !== jogador.numeroCamisa) onUpdate({ numeroCamisa: n })
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all group",
        isTitular ? "border-primary/25 bg-primary/[0.04]" : "border-border bg-card hover:bg-muted/20",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      {draggable && <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}

      <div className="shrink-0">
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
              if (e.key === "Enter") commitNum()
              if (e.key === "Escape") setEditingNum(false)
            }}
            className="w-10 h-8 rounded-lg border border-primary bg-background px-1 text-xs text-center focus:outline-none"
          />
        ) : (
          <button
            onClick={() => canManage && setEditingNum(true)}
            className={cn(
              "w-8 h-8 rounded-lg font-mono text-sm font-black grid place-items-center transition-colors",
              isTitular ? "text-white" : "bg-muted text-muted-foreground",
              canManage && "hover:opacity-80",
            )}
            style={isTitular ? { background: "var(--color-primary)" } : undefined}
          >
            {jogador.numeroCamisa ?? "–"}
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {editingName && canManage ? (
          <input
            ref={nameRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName()
              if (e.key === "Escape") setEditingName(false)
            }}
            className="h-7 w-full rounded border border-primary bg-background px-2 text-sm focus:outline-none"
          />
        ) : (
          <button
            onClick={() => canManage && setEditingName(true)}
            className={cn(
              "text-sm font-semibold text-foreground text-left w-full truncate block",
              canManage && "hover:text-primary transition-colors",
            )}
          >
            {jogador.nome}
          </button>
        )}
        <select
          value={jogador.posicao ?? ""}
          onChange={(e) => canManage && onUpdate({ posicao: e.target.value || undefined })}
          disabled={!canManage}
          className="text-xs text-muted-foreground bg-transparent border-none focus:outline-none disabled:cursor-default mt-0.5 -ml-0.5"
        >
          <option value="">sem posição</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {canManage && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggleTitular}
            title={isTitular ? "Mover para banco" : "Colocar em quadra"}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            {isTitular ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Adicionar jogador ──────────────────────────────────── */
function AddPlayerRow({
  players,
  teamId,
  onCreated,
}: {
  players: Jogador[]
  teamId: string
  onCreated: (p: Jogador) => void
}) {
  const [name, setName] = useState("")
  const [jersey, setJersey] = useState("")
  const [position, setPosition] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const submit = async () => {
    if (!name.trim()) { setError("Nome obrigatório"); nameRef.current?.focus(); return }
    setSaving(true); setError(null)
    const numeroCamisa = jersey ? Number(jersey) : proximoCamisa(players)
    try {
      const p = await api.times.adicionarJogador(teamId, {
        nome: name.trim(),
        numeroCamisa,
        posicao: position || undefined,
      })
      onCreated(p)
      setName(""); setJersey(""); setPosition("")
      nameRef.current?.focus()
    } catch (e) { setError((e as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 space-y-2">
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
      <p className="text-[10px] text-muted-foreground pl-1">
        Nº automático se deixado em branco · Enter para adicionar
      </p>
    </div>
  )
}

/* ─── Aba Elenco + Formação (drag unificado) ─────────────── */
function TabElencoFormacao({ time, canManage }: { time: Time; canManage: boolean }) {
  const [players, setPlayers] = useState<Jogador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [titularesQuadra, setTitularesQuadra] = useState<TitularNaQuadra[]>([])

  // ── ÚNICA fonte de verdade do drag, compartilhada entre quadra e banco ──
  const [dragging, setDragging] = useState<DragOrigin>(null)
  const [benchDropActive, setBenchDropActive] = useState(false)

  const cor = time.corPrimaria || "var(--color-primary)"

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const jogs = await api.times.listarJogadores(time.id)
      setPlayers(jogs)

      const titularesComPosicao = jogs.filter((j) => j.titular && j.indicePosicao != null)

      if (titularesComPosicao.length > 0) {
        setTitularesQuadra(
          titularesComPosicao.map((j) => ({
            jogadorId: j.id,
            indicePosicao: j.indicePosicao as IndicePosicao,
          })),
        )
      } else {
        const fallbackTitulares = jogs.filter((j) => j.titular).slice(0, 6)
        setTitularesQuadra(
          fallbackTitulares.map((j, i) => ({ jogadorId: j.id, indicePosicao: i as IndicePosicao })),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [time.id])
  useEffect(() => { load() }, [load])

  const handleUpdate = async (id: string, data: Partial<Jogador>) => {
    try {
      const updated = await api.times.atualizarJogador(time.id, id, data)
      setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)))
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remover jogador?")) return
    await api.times.removerJogador(time.id, id)
    setPlayers((prev) => prev.filter((p) => p.id !== id))
    setTitularesQuadra((prev) => prev.filter((t) => t.jogadorId !== id))
  }

  const titularIds = new Set(titularesQuadra.map((t) => t.jogadorId))
  const titulares = players.filter((p) => titularIds.has(p.id))
  const banco = players.filter((p) => !titularIds.has(p.id))

  /* ── Único handler de drop, usado tanto por drops vindos da quadra quanto do banco ── */
  const handleDropOnSlot = (toSlot: IndicePosicao) => {
    if (!dragging) return
    const { from, jogadorId } = dragging
    setDragging(null)

    if (from === toSlot) return

    setTitularesQuadra((prev) => {
      const next = prev.map((t) => ({ ...t }))
      const ocupanteNoSlot = next.find((t) => t.indicePosicao === toSlot)

      if (from === "bench") {
        if (ocupanteNoSlot) {
          // Troca: quem estava no slot vai para o banco, o reserva assume o slot.
          ocupanteNoSlot.jogadorId = jogadorId
        } else {
          if (next.length >= 6) return prev // quadra já cheia, ignora
          next.push({ jogadorId, indicePosicao: toSlot })
        }
        return next
      }

      // Quadra → quadra: troca de posição.
      const origem = next.find((t) => t.indicePosicao === from)
      if (!origem) return prev

      if (ocupanteNoSlot) {
        const tmp = origem.jogadorId
        origem.jogadorId = ocupanteNoSlot.jogadorId
        ocupanteNoSlot.jogadorId = tmp
      } else {
        origem.indicePosicao = toSlot
      }
      return next
    })
  }

  const sendToBench = (indicePosicao: IndicePosicao) => {
    setTitularesQuadra((prev) => prev.filter((t) => t.indicePosicao !== indicePosicao))
  }

  const handleDropOnBench = () => {
    setBenchDropActive(false)
    if (!dragging || dragging.from === "bench") { setDragging(null); return }
    sendToBench(dragging.from)
    setDragging(null)
  }

  const toggleTitular = (jogador: Jogador) => {
    if (titularIds.has(jogador.id)) {
      const slot = titularesQuadra.find((t) => t.jogadorId === jogador.id)?.indicePosicao
      if (slot !== undefined) sendToBench(slot)
    } else {
      if (titularesQuadra.length >= 6) {
        alert("Máximo de 6 titulares. Remova um da quadra antes.")
        return
      }
      const slots = [0, 1, 2, 3, 4, 5] as IndicePosicao[]
      const livre = slots.find((s) => !titularesQuadra.some((t) => t.indicePosicao === s))
      if (livre !== undefined) {
        setTitularesQuadra((prev) => [...prev, { jogadorId: jogador.id, indicePosicao: livre }])
      }
    }
  }

  const salvarFormacao = async () => {
    setSaving(true)
    try {
      const atualizados = await Promise.all(
        players.map((p) => {
          const t = titularesQuadra.find((t) => t.jogadorId === p.id)
          return api.times.atualizarJogador(time.id, p.id, {
            titular: !!t,
            indicePosicao: t ? t.indicePosicao : null,
          })
        }),
      )
      setPlayers(atualizados)
    } catch (e) {
      alert("Erro ao salvar formação: " + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
        {/* Coluna esquerda: Quadra + banco */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              Formação ({titularesQuadra.length}/6)
            </h3>
            {canManage && (
              <button
                onClick={salvarFormacao}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar formação
              </button>
            )}
          </div>

          <QuadraFormacao
            titulares={titularesQuadra}
            jogadores={players}
            cor={cor}
            dragging={dragging}
            onDragStartSlot={(from, jogadorId) => setDragging({ from, jogadorId })}
            onDropOnSlot={handleDropOnSlot}
            onSendToBench={sendToBench}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setBenchDropActive(true) }}
            onDragLeave={() => setBenchDropActive(false)}
            onDrop={(e) => { e.preventDefault(); handleDropOnBench() }}
            className={cn(
              "rounded-xl border-2 border-dashed p-3 transition-all",
              benchDropActive ? "border-primary/60 bg-primary/5" : "border-border bg-muted/20",
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Banco ({banco.length}) — arraste um titular aqui para reservar
            </p>
            {banco.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">Todos os jogadores estão na quadra</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {banco.map((j) => (
                  <div
                    key={j.id}
                    draggable={canManage}
                    onDragStart={() => setDragging({ from: "bench", jogadorId: j.id })}
                    className={cn(
                      "flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all select-none",
                      canManage && "cursor-grab active:cursor-grabbing",
                    )}
                  >
                    {canManage && <GripVertical className="h-3 w-3 text-muted-foreground/50" />}
                    <span
                      className="w-5 h-5 rounded-md font-mono text-[10px] font-black grid place-items-center text-white shrink-0"
                      style={{ background: cor }}
                    >
                      {j.numeroCamisa ?? "?"}
                    </span>
                    {j.nome.split(" ")[0]}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita: lista completa */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            Elenco completo ({players.length})
          </h3>

          {players.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm font-semibold text-foreground">Nenhum jogador ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione abaixo</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {titulares.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Em quadra</p>
                  {titulares.map((p) => (
                    <PlayerRow
                      key={p.id}
                      jogador={p}
                      isTitular
                      canManage={canManage}
                      onUpdate={(data) => handleUpdate(p.id, data)}
                      onDelete={() => handleDelete(p.id)}
                      onToggleTitular={() => toggleTitular(p)}
                    />
                  ))}
                </>
              )}
              {banco.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 pt-1">Banco</p>
                  {banco.map((p) => (
                    <PlayerRow
                      key={p.id}
                      jogador={p}
                      isTitular={false}
                      canManage={canManage}
                      onUpdate={(data) => handleUpdate(p.id, data)}
                      onDelete={() => handleDelete(p.id)}
                      onToggleTitular={() => toggleTitular(p)}
                      draggable={canManage}
                      onDragStart={() => setDragging({ from: "bench", jogadorId: p.id })}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {canManage && (
            <AddPlayerRow players={players} teamId={time.id} onCreated={(p) => setPlayers((prev) => [...prev, p])} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Aba: Identidade ────────────────────────────────────── */
function TabIdentidade({
  time,
  canManage,
  onSaved,
}: {
  time: Time
  canManage: boolean
  onSaved: (t: Time) => void
}) {
  const [nome, setNome] = useState(time.nome)
  const [logoUrl, setLogoUrl] = useState(time.logoUrl ?? "")
  const [corPrimaria, setCorPrimaria] = useState(time.corPrimaria ?? "#00843D")
  const [corSecundaria, setCorSecundaria] = useState(time.corSecundaria ?? "#ffffff")
  const [email, setEmail] = useState(time.email ?? "")
  const [telefone, setTelefone] = useState(time.telefone ?? "")
  const [instagram, setInstagram] = useState(time.instagram ?? "")
  const [whatsapp, setWhatsapp] = useState(time.whatsapp ?? "")
  const [facebook, setFacebook] = useState(time.facebook ?? "")
  const [site, setSite] = useState(time.site ?? "")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contatosAbertos, setContatosAbertos] = useState(false)

  const handleSave = async () => {
    if (!nome.trim()) { setError("Nome é obrigatório"); return }
    setSaving(true); setError(null)
    try {
      const updated = await api.times.atualizar(time.id, {
        nome: nome.trim(), logoUrl: logoUrl || undefined,
        corPrimaria: corPrimaria || undefined, corSecundaria: corSecundaria || undefined,
        email: email || undefined, telefone: telefone || undefined,
        instagram: instagram || undefined, whatsapp: whatsapp || undefined,
        facebook: facebook || undefined, site: site || undefined,
      })
      onSaved(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (e) {
      setError((e as Error).message)
    } finally { setSaving(false) }
  }

  const cor = corPrimaria || "#00843D"

  const CONTACT_FIELDS = [
    { icon: Mail, label: "E-mail", value: email, onChange: setEmail, placeholder: "time@email.com", type: "email" },
    { icon: Phone, label: "Telefone", value: telefone, onChange: setTelefone, placeholder: "(00) 00000-0000", type: "tel" },
    { icon: Instagram, label: "Instagram", value: instagram, onChange: setInstagram, placeholder: "https://instagram.com/time", type: "url" },
    { icon: MessageCircle, label: "WhatsApp", value: whatsapp, onChange: setWhatsapp, placeholder: "https://wa.me/55...", type: "url" },
    { icon: Facebook, label: "Facebook", value: facebook, onChange: setFacebook, placeholder: "https://facebook.com/time", type: "url" },
    { icon: Globe, label: "Site", value: site, onChange: setSite, placeholder: "https://meutime.com.br", type: "url" },
  ]

  const contatosPreenchidos = CONTACT_FIELDS.filter((f) => f.value.trim().length > 0).length

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">

        {/* ── Coluna principal ── */}
        <div className="space-y-6 min-w-0">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Dados básicos + cores */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nome do time *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={!canManage} className="h-11" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">URL do brasão</Label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." disabled={!canManage} className="h-11" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Cores do time</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Cor primária", value: corPrimaria, onChange: setCorPrimaria },
                  { label: "Cor secundária", value: corSecundaria, onChange: setCorSecundaria },
                ].map(({ label, value, onChange }) => (
                  <div key={label} className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
                    <div className="flex items-center gap-3 h-11 rounded-xl border border-input px-3 bg-background">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={!canManage}
                        className="h-7 w-7 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="text-sm font-mono text-foreground">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contato & redes — encolhível */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => setContatosAbertos((v) => !v)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground">Contato & redes sociais</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {contatosPreenchidos > 0
                    ? `${contatosPreenchidos} preenchido${contatosPreenchidos !== 1 ? "s" : ""}`
                    : "Nenhum contato preenchido"}
                </p>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", contatosAbertos && "rotate-180")} />
            </button>

            {contatosAbertos && (
              <div className="border-t border-border px-5 py-4 space-y-3">
                {CONTACT_FIELDS.map(({ icon: Icon, label, value, onChange, placeholder, type }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center shrink-0">
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
            )}
          </div>
        </div>

        {/* ── Coluna lateral: ação de salvar sempre visível ── */}
        {canManage && (
          <div className="lg:sticky lg:top-20 space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2 h-11 font-semibold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar alterações
              </Button>
              {success && (
                <p className="text-xs text-green-600 flex items-center gap-1.5 font-medium">
                  <Check className="h-3.5 w-3.5" /> Salvo com sucesso!
                </p>
              )}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                As alterações de identidade e contato são salvas juntas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Página principal ───────────────────────────────────── */
export default function TorneioTimeDetalhe() {
  const { torneioId, timeId } = useParams<{ torneioId: string; timeId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [time, setTime] = useState<Time | null>(null)
  const [torneio, setTorneio] = useState<Torneio | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("elenco")

  const canManage = torneio ? api.torneios.podeGerenciarTorneio(torneio, user) : false

  useEffect(() => {
    if (!timeId) return
    api.times.buscar(timeId)
      .then(async (t) => {
        setTime(t)
        const torneioData = await api.torneios.buscarTorneio(t.torneioId)
        setTorneio(torneioData)
      })
      .catch(() => navigate(`/torneios/${torneioId}`))
      .finally(() => setLoading(false))
  }, [timeId, torneioId, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!time) return null

  const cor = time.corPrimaria || "#00843D"
  const corSec = time.corSecundaria || "#ffffff"

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "elenco", label: "Elenco & Formação", icon: LayoutGrid },
    { id: "identidade", label: "Identidade", icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="h-32 md:h-36 w-full"
          style={{ background: `linear-gradient(135deg, ${cor} 0%, ${cor}cc 55%, ${cor}22 100%)` }}
        />
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-end gap-5 -mt-9 pb-3">
            <div
              className="h-22 w-22 rounded-2xl border-4 shadow-xl grid place-items-center text-4xl font-black shrink-0 overflow-hidden"
              style={{ height: 88, width: 88, background: cor, borderColor: "var(--background)", color: corSec }}
            >
              {time.logoUrl
                ? <img src={time.logoUrl} alt={`Brasão ${time.nome}`} className="h-full w-full object-cover" />
                : time.nome?.[0]?.toUpperCase() ?? "?"}
            </div>
            <nav className="flex-1 min-w-0 flex items-center gap-1 text-xs text-muted-foreground pb-1.5">
              <Link to={`/torneios/${torneioId}`} className="hover:text-primary transition-colors">Torneio</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/torneios/${torneioId}/times`} className="hover:text-primary transition-colors">Times</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium truncate">{time.nome}</span>
            </nav>
            <button
              onClick={() => navigate(`/torneios/${torneioId}/times`)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pb-1.5 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          </div>

          {/* Nome fora da faixa do banner — nunca mais cortado */}
          <h1 className="font-display text-2xl md:text-3xl font-black text-foreground leading-tight truncate pb-5">
            {time.nome}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ background: cor }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto w-full px-4 py-8 flex-1">
        {activeTab === "elenco" && <TabElencoFormacao time={time} canManage={canManage} />}
        {activeTab === "identidade" && <TabIdentidade time={time} canManage={canManage} onSaved={setTime} />}
      </div>
    </div>
  )
}