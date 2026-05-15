import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Torneio } from "@/services/api";
import { SiteHeader } from "@/components/site-header"; 
import { Trophy, Plus, Calendar, MapPin } from "lucide-react";

export default function TorneiosListPage() {
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.listarTorneios()
      .then(setTorneios)
      .catch(err => console.error("Erro ao buscar torneios:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader /> {/* Header genérico do sistema */}
      
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl font-black">Meus Torneios</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie suas competições e ligas.</p>
          </div>
          <button 
            onClick={() => navigate("/torneios/novo")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Novo Torneio
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground mt-12">Carregando torneios...</div>
        ) : torneios.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-xl bg-surface">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-bold">Nenhum torneio encontrado</h3>
            <p className="text-muted-foreground text-sm mb-4">Você ainda não possui nenhum torneio cadastrado.</p>
            <button onClick={() => navigate("/torneios/novo")} className="text-primary font-bold text-sm hover:underline">
              Criar meu primeiro torneio →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {torneios.map(t => (
              <Link key={t.id} to={`/torneios/${t.id}`} className="block group">
                <div className="border border-border rounded-xl p-5 bg-[var(--surface)] hover:border-primary transition duration-200 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--primary-bg)] border border-[var(--border2)] flex items-center justify-center text-primary font-bold">
                      {t.nome[0].toUpperCase()}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-[var(--surface2)] text-muted-foreground">
                      {t.status?.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold mb-1 group-hover:text-primary transition">{t.nome}</h3>
                  
                  <div className="mt-auto pt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" /> {t.local || "Local a definir"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" /> 
                      {t.dataInicio ? new Date(t.dataInicio).toLocaleDateString() : "Data a definir"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}