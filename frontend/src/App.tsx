import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login"; // Certifique-se de que Login está exportado como default em src/pages/Login/index.tsx
import Dashboard from "./pages/Dashboard"; // Idem para src/pages/Dashboard/index.tsx
import TorneioLayout from "./pages/Torneio/TorneioLayout";
import HomeTorneio from "./pages/Torneio/HomeTorneio";
import Classificacao from "./pages/Torneio/Classificacao";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/torneios/:torneioId" element={<TorneioLayout />}>
          <Route index element={<HomeTorneio />} />
          <Route path="classificacao" element={<Classificacao />} />
          {/* Adicione as outras rotas (Estatisticas, Midias) aqui conforme for criando as páginas */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}