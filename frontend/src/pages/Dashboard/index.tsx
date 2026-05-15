import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", color: "#e8f0e8" }}>
      <h1>Painel de Gerenciamento</h1>
      <p style={{ color: "#6b7f6b", marginBottom: "30px" }}>
        Aqui você verá a lista de torneios cadastrados no sistema.
      </p>

      <div style={{ 
        background: "#111611", 
        border: "1px solid rgba(255,255,255,0.07)", 
        borderRadius: "10px", 
        padding: "20px",
        maxWidth: "400px"
      }}>
        <h3 style={{ margin: "0 0 10px 0" }}>Copa Verão 2026</h3>
        <p style={{ fontSize: "14px", color: "#6b7f6b", marginBottom: "20px" }}>
          Status: Em andamento • 8 times
        </p>
        
        {/* Este é o Link que vai acionar o nosso TorneioLayout */}
        <Link 
          to="/torneios/t1" 
          style={{ 
            display: "inline-block",
            background: "rgba(0,196,79,0.12)", 
            color: "#00c44f",
            padding: "8px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
            border: "1px solid rgba(0,196,79,0.25)"
          }}
        >
          Acessar Torneio →
        </Link>
      </div>
    </div>
  );
}