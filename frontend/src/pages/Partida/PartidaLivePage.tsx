import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Partida } from "@/services/api";
import { ArrowLeft, Undo2, Flag } from "lucide-react";

export default function PartidaLivePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partida, setPartida] = useState<Partida | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.buscarPartida(id)
        .then(setPartida)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleEncerrar = async () => {
    if (!partida) return;
    if (confirm("Deseja realmente encerrar esta partida?")) {
      await api.finalizarPartida(partida.id);
      navigate(-1);
    }
  };

  const handleAnular = async () => {
    if (!partida) return;
    // Integração futura: await api.anularUltimoEvento(partida.id);
    alert("Função de anular ponto será acionada aqui.");
  };

  const registrarAcao = async (lado: "CASA" | "VISITANTE", tipo: string) => {
    if (!partida) return;
    // Integração futura: abrir modal de selecionar jogador, e depois api.registrarEvento(...)
    console.log(`Ponto registrado para: ${lado} | Tipo: ${tipo}`);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-primary">Carregando Placar...</div>;
  if (!partida) return <div className="min-h-screen bg-background text-center pt-20">Partida não encontrada.</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      {/* ── HEADER HORIZONTAL ── */}
      <header className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0a0a0a]">
        <button onClick={() => navigate(-1)} className="p-2 text-white/50 hover:text-white transition rounded-md hover:bg-white/5">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] px-2 py-1 rounded bg-primary/10 border border-primary/20 mb-2">
            Set {partida.sets.length + 1}
          </span>
          <div className="flex items-center gap-8 font-display">
            <div className="text-4xl font-black">{partida.setAtualCasa}</div>
            <div className="text-sm text-white/40 flex gap-2">
              <span className="px-3 py-1 bg-white/5 rounded">Sets: {partida.setsCasa}</span>
              <span className="px-3 py-1 bg-white/5 rounded">Sets: {partida.setsVisitante}</span>
            </div>
            <div className="text-4xl font-black">{partida.setAtualVisitante}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleAnular} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white/5 border border-white/10 rounded hover:bg-white/10 transition">
            <Undo2 className="w-4 h-4" /> Anular
          </button>
          <button onClick={handleEncerrar} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500/20 transition">
            <Flag className="w-4 h-4" /> Encerrar
          </button>
        </div>
      </header>

      {/* ── TIMES & CONTROLES (Lado a Lado) ── */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* TIME DA CASA */}
        <div className="flex-1 flex flex-col border-r border-white/10 p-6">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-black text-white/90">{partida.nomeTimeCasa}</h2>
            <p className="text-white/40 text-sm mt-1">Lado A</p>
          </div>

          <div className="flex-1 flex flex-col gap-4 max-w-sm mx-auto w-full justify-center">
            <button onClick={() => registrarAcao("CASA", "ATAQUE")} className="py-6 rounded-xl bg-primary/10 border border-primary/30 text-primary font-black text-xl hover:bg-primary/20 transition flex items-center justify-center gap-3">
              + PONTO <span className="text-sm font-normal uppercase tracking-widest">(Ataque/Saque)</span>
            </button>
            <button onClick={() => registrarAcao("CASA", "ERRO")} className="py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold hover:bg-red-500/20 transition">
              - ERRO DE SAQUE
            </button>
          </div>
        </div>

        {/* TIME VISITANTE */}
        <div className="flex-1 flex flex-col p-6">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-black text-white/90">{partida.nomeTimeVisitante}</h2>
            <p className="text-white/40 text-sm mt-1">Lado B</p>
          </div>

          <div className="flex-1 flex flex-col gap-4 max-w-sm mx-auto w-full justify-center">
            <button onClick={() => registrarAcao("VISITANTE", "ATAQUE")} className="py-6 rounded-xl bg-primary/10 border border-primary/30 text-primary font-black text-xl hover:bg-primary/20 transition flex items-center justify-center gap-3">
              + PONTO <span className="text-sm font-normal uppercase tracking-widest">(Ataque/Saque)</span>
            </button>
            <button onClick={() => registrarAcao("VISITANTE", "ERRO")} className="py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold hover:bg-red-500/20 transition">
              - ERRO DE SAQUE
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}