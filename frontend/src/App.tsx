import { BrowserRouter, Routes, Route } from "react-router-dom";

// Páginas públicas / globais
import LoginPage         from "./pages/Login";
import PartidaLivePage   from "./pages/Partida/indexPartida";
import TorneiosListPage  from "./pages/MenuPrincipal/ListarTorneios";
import CriarTorneioPage  from "./pages/MenuPrincipal/CriarTorneio";

// Layout interno do torneio (com sidebar)
import TorneioLayout     from "./pages/Torneio/TorneioLayout";

// Páginas internas do torneio (renderizadas dentro do layout)
import TorneioTimes         from "./pages/Torneio/TorneioTimes";
import TorneioFases         from "./pages/Torneio/TorneioFases";
import AdminUsuarios        from "./pages/Admin/AdminUsuarios";
import TorneioOverview      from "./pages/Torneio/TorneioOverview";
import TorneioPartidas      from "./pages/Torneio/TorneioPartidas";
import TorneioTimeDetalhe   from "./pages/Time/TimeDetalhe";
import TorneioEstatisticas  from "./pages/Torneio/TorneioEstatisticas";
import TorneioConfiguracoes from "./pages/Torneio/TorneioConfiguracoes";
import TorneioClassificacao from "./pages/Torneio/TorneioClassificacao";
import TorneioRacha         from "./pages/Torneio/TorneioRacha";

import IndexPage from "./pages/IndexTorneio";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Admin para gerencia de usuários */}
        <Route path="/admin/usuarios" element={<AdminUsuarios />} />

        {/* Rota raiz: landing page */}
        <Route path="/" element={<IndexPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Páginas de gerenciamento geral */}
        <Route path="/torneios"      element={<TorneiosListPage />} />
        <Route path="/torneios/novo" element={<CriarTorneioPage />} />

        {/* Partida ao vivo */}
        <Route path="/partidas/:id"  element={<PartidaLivePage />} />

        {/* Layout interno do torneio */}
        <Route path="/torneios/:torneioId" element={<TorneioLayout />}>
          <Route index                       element={<TorneioOverview />} />
          <Route path="fases"                element={<TorneioFases />} />          
          <Route path="racha"                element={<TorneioRacha />} />
          <Route path="partidas"             element={<TorneioPartidas />} />
          <Route path="times"                element={<TorneioTimes />} />
          <Route path="classificacao"        element={<TorneioClassificacao />} />
          <Route path="estatisticas"         element={<TorneioEstatisticas />} />
          <Route path="configuracoes"        element={<TorneioConfiguracoes />} />
        </Route>

        {/* Página do time */}
        <Route path="/torneios/:torneioId/times/:timeId" element={<TorneioTimeDetalhe />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="flex flex-col h-screen items-center justify-center text-center p-6">
              <h1 className="font-display text-4xl font-black text-foreground mb-2">404</h1>
              <p className="text-muted-foreground">Página não encontrada.</p>
              <a href="/" className="mt-4 text-primary font-bold hover:underline">
                Voltar ao Início
              </a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}