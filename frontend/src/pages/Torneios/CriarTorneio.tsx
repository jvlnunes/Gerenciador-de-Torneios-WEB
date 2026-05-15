import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { SiteHeader } from "@/components/site-header";
import { ArrowLeft } from "lucide-react";

export default function CriarTorneioPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    local: "",
    dataInicio: "",
    descricao: "",
    visibilidade: "PUBLICO" as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Chama a sua API real
      const novoTorneio = await api.criarTorneio({
        nome: formData.nome,
        local: formData.local,
        dataInicio: formData.dataInicio ? new Date(formData.dataInicio).toISOString() : undefined,
        descricao: formData.descricao,
        visibilidade: formData.visibilidade,
        status: "RASCUNHO"
      });
      
      // Redireciona para a tela do torneio gerado
      navigate(`/torneios/${novoTorneio.id}`);
    } catch (err: any) {
      setError(err.message || "Erro ao criar torneio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <h1 className="font-display text-3xl font-black mb-6">Novo Torneio</h1>

        <form onSubmit={handleSubmit} className="space-y-5 bg-[var(--surface)] border border-border p-6 rounded-xl">
          {error && <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>}

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Nome da Competição *</label>
            <input 
              required
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="w-full bg-[var(--surface2)] border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none" 
              placeholder="Ex: Copa Verão 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Local</label>
              <input 
                value={formData.local}
                onChange={e => setFormData({...formData, local: e.target.value})}
                className="w-full bg-[var(--surface2)] border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Data de Início</label>
              <input 
                type="date"
                value={formData.dataInicio}
                onChange={e => setFormData({...formData, dataInicio: e.target.value})}
                className="w-full bg-[var(--surface2)] border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none [color-scheme:dark]" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Descrição</label>
            <textarea 
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
              className="w-full bg-[var(--surface2)] border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none min-h-[100px]" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition mt-4"
          >
            {loading ? "Salvando..." : "Criar Torneio"}
          </button>
        </form>
      </main>
    </div>
  );
}