
// ─── Mock Data ────────────────────────────────────────────────
export const MOCK_TORNEIO = {
  id: "t1",
  nome: "Copa Verão 2026",
  descricao: "O maior torneio de vôlei da temporada com times de toda a região.",
  local: "Ginásio Municipal de Fortaleza",
  dataInicio: "2026-06-01",
  dataFim: "2026-06-15",
  status: "EM_ANDAMENTO",
  formato: "HIBRIDO",
  bannerUrl: null,
  logoUrl: null,
  maxTimes: 8,
};

export const MOCK_TIMES = [
  { id: "time1", nome: "Tigres FC", pts: 18, v: 6, d: 0, sets: [18, 4] },
  { id: "time2", nome: "Leões SP",  pts: 15, v: 5, d: 1, sets: [16, 7] },
  { id: "time3", nome: "Falcões RJ",pts: 12, v: 4, d: 2, sets: [13, 8] },
  { id: "time4", nome: "Águias MG", pts: 9,  v: 3, d: 3, sets: [11, 11] },
  { id: "time5", nome: "Tubarões BA",pts: 6, v: 2, d: 4, sets: [8,  13] },
  { id: "time6", nome: "Panteras CE",pts: 3, v: 1, d: 5, sets: [5,  16] },
  { id: "time7", nome: "Lobos RS",  pts: 1,  v: 0, d: 6, sets: [3,  18] },
  { id: "time8", nome: "Cobras AM", pts: 0,  v: 0, d: 6, sets: [2,  18] },
];

export const MOCK_PARTIDAS = [
  { id: "p1", timeCasa: "Tigres FC", timeVis: "Leões SP",   status: "AO_VIVO",   placar: [2,1], setAtual: [18,14], local: "Quadra A" },
  { id: "p2", timeCasa: "Falcões RJ",timeVis: "Águias MG",  status: "AO_VIVO",   placar: [1,1], setAtual: [11,8],  local: "Quadra B" },
  { id: "p3", timeCasa: "Tigres FC", timeVis: "Falcões RJ", status: "FINALIZADA",placar: [3,0], setAtual: [0,0],   local: "Quadra A" },
  { id: "p4", timeCasa: "Leões SP",  timeVis: "Águias MG",  status: "FINALIZADA",placar: [2,1], setAtual: [0,0],   local: "Quadra B" },
  { id: "p5", timeCasa: "Tubarões BA",timeVis:"Panteras CE", status: "AGENDADA",  placar: [0,0], setAtual: [0,0],   local: "Quadra A", hora: "15:00" },
];

export const MOCK_ESTATISTICAS = {
  topPontuadores: [
    { nome: "Carlos Saque",  time: "Tigres FC",  pts: 42, aces: 8, bloq: 12 },
    { nome: "André Ataque",  time: "Leões SP",   pts: 38, aces: 5, bloq: 9  },
    { nome: "Marcos Bloq",   time: "Falcões RJ", pts: 35, aces: 6, bloq: 15 },
    { nome: "Diego Ponteiro",time: "Tigres FC",  pts: 31, aces: 4, bloq: 7  },
    { nome: "Felipe Central",time: "Águias MG",  pts: 28, aces: 3, bloq: 11 },
  ],
  votacoes: [
    { partida: "Tigres × Falcões", mvp: "Carlos Saque", votos: 87 },
    { partida: "Leões × Águias",   mvp: "André Ataque", votos: 74 },
    { partida: "Tigres × Leões",   mvp: "Marcos Bloq",  votos: 91 },
  ],
};

export const MOCK_MIDIAS = [
  { id: 1, tipo: "foto", titulo: "Final do 1º set — Tigres × Leões", emoji: "📸", cor: "#1a3a2a" },
  { id: 2, tipo: "foto", titulo: "Bloqueio decisivo de Marcos",       emoji: "⚡", cor: "#1a2a3a" },
  { id: 3, tipo: "video",titulo: "Melhores momentos — Rodada 3",      emoji: "▶️", cor: "#2a1a3a" },
  { id: 4, tipo: "foto", titulo: "Cerimônia de abertura",             emoji: "🏆", cor: "#3a2a1a" },
  { id: 5, tipo: "video",titulo: "Entrevista: Capitão Tigres FC",     emoji: "🎙️", cor: "#1a3a3a" },
  { id: 6, tipo: "foto", titulo: "Torcida — Quadra A",                emoji: "📸", cor: "#3a1a1a" },
];
