import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, type Torneio, type Time } from "@/services/api";

interface TorneioCtx { torneio: Torneio; torneioId: string; liveCount: number; }

export default function TorneioClassificacao() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  
  const [times, setTimes] = useState<Time[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarTimes() {
      try {
        // Futuramente trocar por: await api.buscarClassificacao(torneioId)
        const timesRes = await api.listarTimes(torneioId);
        setTimes(timesRes);
      } catch (error) {
        console.error("Erro ao carregar classificação", error);
      } finally {
        setLoading(false);
      }
    }
    carregarTimes();
  }, [torneioId]);

  const formVitDer = (v: number, d: number) => {
    const total = v + d;
    if (total === 0) return [];
    return Array.from({ length: Math.min(total, 5) }, (_, i) => i < v ? "V" : "D").reverse();
  };

  if (loading) return <div className="p-6">Carregando classificação...</div>;

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">Classificação</div>
        <div className="section-sub">{torneio.nome} • Visão geral dos times</div>
      </div>

      <div className="card">
        {/* Header da Tabela */}
        <div className="tabela-header">
          <div>#</div>
          <div />
          <div>Time</div>
          <div style={{ textAlign: "center" }}>PTS</div>
          <div style={{ textAlign: "center" }}>V</div>
          <div style={{ textAlign: "center" }}>D</div>
          <div style={{ textAlign: "center" }}>Sets</div>
          <div style={{ textAlign: "center" }}>Form.</div>
          <div style={{ textAlign: "right" }}>%V</div>
        </div>

        {times.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Nenhum time registrado neste torneio ainda.
          </div>
        )}

        {times.map((t, i) => {
          // Valores zerados temporários (aguardando backend de classificação)
          const isLeader = i === 0;
          const v = 0, d = 0, pts = 0, setsPro = 0, setsContra = 0;
          const pct = 0;
          const form = formVitDer(v, d);

          return (
            <div className={`tabela-row ${isLeader && times.length > 1 ? "leader" : ""}`} key={t.id}>
              <div className="t-rank">{i + 1}</div>
              <div>
                <div className="t-ico">{t.nome[0].toUpperCase()}</div>
              </div>
              <div className="t-n">{t.nome}</div>
              <div className="t-pts-cell">{pts}</div>
              <div className="t-v">{v}</div>
              <div className="t-d">{d}</div>
              <div className="t-sets">{setsPro}/{setsContra}</div>
              <div>
                <div className="form-badges">
                  {form.length > 0 ? form.map((r, fi) => (
                    <div key={fi} className={`fb ${r}`}>{r}</div>
                  )) : <span className="text-xs text-muted-foreground">-</span>}
                </div>
              </div>
              <div className="t-pct">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}