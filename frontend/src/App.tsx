import { BrowserRouter, Routes, Route } from "react-router-dom";

// Páginas públicas / globais
import LoginPage         from "./pages/Login";
import TorneiosListPage  from "./pages/Torneios/ListarTorneios";
import CriarTorneioPage  from "./pages/Torneios/CriarTorneio";
import PartidaLivePage   from "./pages/Partida/PartidaAoVivo";

// Layout interno do torneio (com sidebar)
import TorneioLayout     from "./pages/Torneio/TorneioLayout";

// Páginas internas do torneio (renderizadas dentro do layout)
import TorneioOverview      from "./pages/Torneio/TorneioOverview";
import TorneioPartidas      from "./pages/Torneio/TorneioPartidas";
import TorneioTimes         from "./pages/Torneio/TorneioTimes";
import TorneioClassificacao from "./pages/Torneio/TorneioClassificacao";
import TorneioConfiguracoes from "./pages/Torneio/TorneioConfiguracoes";

// Landing page — importada das pages do tanstack (ou recriada inline abaixo)
import IndexPage from "./pages/Index";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz: landing page */}
        <Route path="/" element={<IndexPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Páginas públicas */}
        <Route path="/torneios"      element={<TorneiosListPage />} />
        <Route path="/torneios/novo" element={<CriarTorneioPage />} />

        {/* Partida ao vivo */}
        <Route path="/partidas/:id"  element={<PartidaLivePage />} />

        {/* Layout interno do torneio (com sidebar) */}
        <Route path="/torneios/:torneioId" element={<TorneioLayout />}>
          <Route index                element={<TorneioOverview />} />
          <Route path="partidas"      element={<TorneioPartidas />} />
          <Route path="times"         element={<TorneioTimes />} />
          <Route path="classificacao" element={<TorneioClassificacao />} />
          <Route path="configuracoes" element={<TorneioConfiguracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}