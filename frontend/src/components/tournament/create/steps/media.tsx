import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Upload, X, Plus, Trash2, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SocialLink {
  id: string
  platform: string
  url: string
}

export interface MediaData {
  bannerUrl: string | null
  logoUrl: string | null
  bannerFile: File | null
  logoFile: File | null
  socialLinks: SocialLink[]
}

interface Props {
  data: MediaData
  setData: (data: Partial<MediaData>) => void
  onNext: () => void
  onBack: () => void
}

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: "📸", placeholder: "https://instagram.com/torneio" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬", placeholder: "https://wa.me/5500000000000" },
  { value: "facebook", label: "Facebook", icon: "📘", placeholder: "https://facebook.com/torneio" },
  { value: "youtube", label: "YouTube", icon: "▶️", placeholder: "https://youtube.com/@torneio" },
  { value: "twitter", label: "X / Twitter", icon: "🐦", placeholder: "https://x.com/torneio" },
  { value: "tiktok", label: "TikTok", icon: "🎵", placeholder: "https://tiktok.com/@torneio" },
  { value: "site", label: "Site", icon: "🌐", placeholder: "https://meusitetorneio.com.br" },
]

function ImageUpload({
  label,
  hint,
  previewUrl,
  aspectClass,
  onFile,
  onRemove,
}: {
  label: string
  hint: string
  previewUrl: string | null
  aspectClass: string
  onFile: (file: File, url: string) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onFile(file, url)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5",
          aspectClass
        )}
        onClick={() => !previewUrl && inputRef.current?.click()}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">Clique para fazer upload</span>
            <span className="text-xs">PNG, JPG ou WebP</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {previewUrl && (
        <button
          onClick={() => inputRef.current?.click()}
          className="text-xs text-primary hover:underline font-medium"
        >
          Trocar imagem
        </button>
      )}
    </div>
  )
}

export function MediaStep({ data, setData, onNext, onBack }: Props) {
  const addSocial = () => {
    setData({
      socialLinks: [
        ...data.socialLinks,
        { id: crypto.randomUUID(), platform: "instagram", url: "" },
      ],
    })
  }

  const removeSocial = (id: string) => {
    setData({ socialLinks: data.socialLinks.filter((s) => s.id !== id) })
  }

  const updateSocial = (id: string, update: Partial<SocialLink>) => {
    setData({
      socialLinks: data.socialLinks.map((s) => (s.id === id ? { ...s, ...update } : s)),
    })
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <ImageUpload
        label="Banner do torneio"
        hint="Imagem principal exibida no topo da página. Recomendado: 1200×400px"
        previewUrl={data.bannerUrl}
        aspectClass="h-40"
        onFile={(file, url) => setData({ bannerFile: file, bannerUrl: url })}
        onRemove={() => setData({ bannerFile: null, bannerUrl: null })}
      />

      {/* Logo */}
      <ImageUpload
        label="Logo do torneio"
        hint="Logo exibida nos cards e cabeçalho. Recomendado: 256×256px quadrado"
        previewUrl={data.logoUrl}
        aspectClass="h-48 max-w-48"
        onFile={(file, url) => setData({ logoFile: file, logoUrl: url })}
        onRemove={() => setData({ logoFile: null, logoUrl: null })}
      />

      {/* Social links */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold text-foreground">Redes sociais</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione links das redes sociais ou site do torneio.
          </p>
        </div>

        <div className="space-y-3">
          {data.socialLinks.map((social) => {
            const platform = PLATFORMS.find((p) => p.value === social.platform) ?? PLATFORMS[0]
            return (
              <div key={social.id} className="flex items-center gap-2">
                {/* Platform picker */}
                <select
                  value={social.platform}
                  onChange={(e) => updateSocial(social.id, { platform: e.target.value })}
                  className="h-10 rounded-md border border-border bg-card px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
                {/* URL */}
                <div className="flex-1 relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={social.url}
                    onChange={(e) => updateSocial(social.id, { url: e.target.value })}
                    placeholder={platform.placeholder}
                    className="pl-8 h-10 bg-card border-border"
                  />
                </div>
                <button
                  onClick={() => removeSocial(social.id)}
                  className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>

        <button
          onClick={addSocial}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-3.5 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4" /> Adicionar rede social
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2 h-11">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button onClick={onNext} className="gap-2 h-11 px-8 font-semibold">
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}