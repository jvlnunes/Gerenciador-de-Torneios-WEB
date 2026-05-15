import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Páginas públicas / globais
import LoginPage         from "./pages/Login";
import TorneiosListPage  from "./pages/Torneios/TorneiosListPage";
import CriarTorneioPage  from "./pages/Torneios/CriarTorneioPage";
import PartidaLivePage   from "./pages/Partida/PartidaLivePage";
// import JoinTeamPage      from "./pages/JoinTeamPage";

// Layout interno do torneio (com sidebar)
import TorneioLayout     from "./pages/Torneio/TorneioLayout";

// Páginas internas do torneio (renderizadas dentro do layout)
import TorneioOverview   from "./pages/Torneio/TorneioOverview";
import TorneioPartidas   from "./pages/Torneio/TorneioPartidas";
import TorneioTimes      from "./pages/Torneio/TorneioTimes";
import TorneioClassificacao from "./pages/Torneio/TorneioClassificacao";
import TorneioConfiguracoes from "./pages/Torneio/TorneioConfiguracoes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz: redireciona para torneios */}
        <Route path="/" element={<Navigate to="/torneios" replace />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Páginas públicas (header normal, sem sidebar) */}
        <Route path="/torneios"      element={<TorneiosListPage />} />
        <Route path="/torneios/novo" element={<CriarTorneioPage />} />

        {/* Partida ao vivo (tela cheia, sem sidebar) */}
        <Route path="/partidas/:id"  element={<PartidaLivePage />} />

        {/* Convite de time */}
        {/* <Route path="/join/:token"   element={<JoinTeamPage />} /> */}

        {/* ── Layout interno do torneio (sidebar) ── */}
        <Route path="/torneios/:torneioId" element={<TorneioLayout />}>
          {/* index → /torneios/:id → overview */}
          <Route index                  element={<TorneioOverview />} />
          <Route path="partidas"        element={<TorneioPartidas />} />
          <Route path="times"           element={<TorneioTimes />} />
          <Route path="classificacao"   element={<TorneioClassificacao />} />
          <Route path="configuracoes"   element={<TorneioConfiguracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}