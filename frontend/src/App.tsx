import { BrowserRouter, Routes, Route } from "react-router-dom";

// Páginas públicas / globais
import LoginPage         from "./pages/Login";
import TorneiosListPage  from "./pages/Torneios/ListarTorneios";
import CriarTorneioPage  from "./pages/Torneios/CriarTorneio";
import PartidaLivePage   from "./pages/Partida/index";

// Layout interno do torneio (com sidebar)
import TorneioLayout     from "./pages/Torneio/TorneioLayout";

// Páginas internas do torneio (renderizadas dentro do layout)
import TorneioOverview      from "./pages/Torneio/TorneioOverview";
import TorneioPartidas      from "./pages/Torneio/TorneioPartidas";
import TorneioTimes         from "./pages/Torneio/TorneioTimes";
import TorneioTimeDetalhe   from "./pages/Time/TorneioTimeDetalhe";
import TorneioClassificacao from "./pages/Torneio/TorneioClassificacao";
import TorneioConfiguracoes from "./pages/Torneio/TorneioConfiguracoes";
import TorneioEstatisticas  from "./pages/Torneio/TorneioEstatisticas";
import TorneioFases         from "./pages/Torneio/TorneioFases";
import AdminUsuarios        from "./pages/Admin/AdminUsuarios";

import JoinTeamPage from "./pages/Join/JoinTime";

import IndexPage from "./pages/Index";

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

        {/* Convite de time */}
        <Route path="/join/:token" element={<JoinTeamPage />} />

        {/* Páginas de gerenciamento geral */}
        <Route path="/torneios"      element={<TorneiosListPage />} />
        <Route path="/torneios/novo" element={<CriarTorneioPage />} />

        {/* Partida ao vivo (sem layout do torneio) */}
        <Route path="/partidas/:id"  element={<PartidaLivePage />} />

        {/* Layout interno do torneio (sidebar fica no TorneioLayout) */}
        <Route path="/torneios/:torneioId" element={<TorneioLayout />}>
          <Route index                       element={<TorneioOverview />} />
          <Route path="fases"                element={<TorneioFases />} />
          <Route path="partidas"             element={<TorneioPartidas />} />
          <Route path="times"                element={<TorneioTimes />} />
          <Route path="classificacao"        element={<TorneioClassificacao />} />
          <Route path="estatisticas"         element={<TorneioEstatisticas />} />
          <Route path="configuracoes"        element={<TorneioConfiguracoes />} />
        </Route>

        {/* Página do time — FORA do layout do torneio (tem seu próprio header + tabs) */}
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