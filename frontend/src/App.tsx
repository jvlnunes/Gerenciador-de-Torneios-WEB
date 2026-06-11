import { BrowserRouter, Routes, Route } from "react-router-dom";

// Páginas públicas / globais
import LoginPage         from "./pages/Login";
import TorneiosListPage  from "./pages/Torneios/ListarTorneios";
import CriarTorneioPage  from "./pages/Torneios/CriarTorneio";
import PartidaLivePage   from "./pages/Partida/index";
// import PartidaLivePage   from "./pages/Partida/PartidaAoVivo";

// Layout interno do torneio (com sidebar)
import TorneioLayout     from "./pages/Torneio/TorneioLayout";

// Páginas internas do torneio (renderizadas dentro do layout)
import TorneioOverview      from "./pages/Torneio/TorneioOverview";
import TorneioPartidas      from "./pages/Torneio/TorneioPartidas";
import TorneioTimes         from "./pages/Torneio/TorneioTimes";
import TorneioClassificacao from "./pages/Torneio/TorneioClassificacao";
import TorneioConfiguracoes from "./pages/Torneio/TorneioConfiguracoes";

// 🆕 Nossas novas páginas modularizadas!
import TorneioEstatisticas  from "./pages/Torneio/TorneioEstatisticas";
import TorneioFases         from "./pages/Torneio/TorneioFases";

// Landing page
import IndexPage from "./pages/Index";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz: landing page */}
        <Route path="/" element={<IndexPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Páginas de gerenciamento geral */}
        <Route path="/torneios"      element={<TorneiosListPage />} />
        <Route path="/torneios/novo" element={<CriarTorneioPage />} />

        {/* Partida ao vivo (Sem o layout do torneio, ocupa a tela toda) */}
        <Route path="/partidas/:id"  element={<PartidaLivePage />} />

        {/* Layout interno do torneio (A Sidebar fica no TorneioLayout) */}
        <Route path="/torneios/:torneioId" element={<TorneioLayout />}>
          {/* O "index" faz com que o Overview seja a tela padrão ao acessar /torneios/123 */}
          <Route index                element={<TorneioOverview />} />
          
          {/* Rotas filhas - a URL vai ficar, por exemplo: /torneios/123/partidas */}
          <Route path="fases"         element={<TorneioFases />} />
          <Route path="partidas"      element={<TorneioPartidas />} />
          <Route path="times"         element={<TorneioTimes />} />
          <Route path="classificacao" element={<TorneioClassificacao />} />
          <Route path="estatisticas"  element={<TorneioEstatisticas />} />
          <Route path="configuracoes" element={<TorneioConfiguracoes />} />
        </Route>

        <Route 
          path="*" 
          element={
            <div className="flex flex-col h-screen items-center justify-center text-center p-6">
              <h1 className="font-display text-4xl font-black text-foreground mb-2">404</h1>
              <p className="text-muted-foreground">Página não encontrada.</p>
              <a href="/" className="mt-4 text-primary font-bold hover:underline">Voltar ao Início</a>
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}