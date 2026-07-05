# 🏐 VolleyHub — Gerenciador de Torneios de Vôlei

Aplicação web completa para organização e Gerenciamento de torneios de vôlei em tempo real: cadastro de times e jogadores, criação de torneios com fases e regras customizáveis, súmula eletrônica ao vivo (placar, saque, escalação, substituições, cartões) e estatísticas/classificação geradas automaticamente a partir dos eventos da partida.

---

## Sumário

- [Visão geral](#visão-geral)
- [Perfis de usuário e permissões](#perfis-de-usuário-e-permissões)
- [Principais funcionalidades](#principais-funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Modelo de dados](#modelo-de-dados)
- [Como executar o projeto](#como-executar-o-projeto)
- [Documentação da API (Swagger)](#documentação-da-api-swagger)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Equipe](#equipe)

---

## Visão geral

O VolleyHub resolve um problema real de organizadores amadores/semi-profissionais de vôlei: substituir planilhas e súmulas de papel por uma ferramenta única que cobre todo o ciclo do torneio — da criação à estatística final — com controle de acesso adequado para cada tipo de usuário envolvido.

## Perfis de usuário e permissões

| Perfil       | Permissões                                                                                     |
|--------------|--------------------------------------------------------------------------------------------------|
| **ADMIN**    | Acesso total: gerencia todos os torneios, times, partidas e usuários do sistema.                 |
| **GERENTE**  | Cria e gerencia **apenas os torneios em que é organizador** (times, partidas, regras, configurações). Pode visualizar torneios de terceiros, mas sem permissão de edição. |
| **USUARIO**  | Acesso de leitura: visualiza torneios, times, partidas e estatísticas públicas.                  |

O controle de acesso é aplicado tanto no frontend (ocultação/bloqueio de ações) quanto no **backend**, via guards (`JwtAuthGuard` + `RolesGuard`) — a permissão real está na API, não apenas na interface.

## Principais funcionalidades

- **Autenticação** com registro/login e sessão via JWT.
- **Gestão de torneios**: criação por etapas (informações básicas, fases, regras, organizadores, mídia), edição, exclusão e configuração de regras de pontuação (sets, pontos por set, tie-break, vantagem de 2 pontos).
- **Gestão de times e elenco**: cadastro de jogadores, definição de titulares/formação em quadra (drag-and-drop), identidade visual do time (cores, logo, redes sociais), entrada de jogadores via link de convite.
- **Partida ao vivo**: placar em tempo real, escalação por set, rotação e sacador automático, registro de pontos por tipo de ação (saque, ataque, bloqueio, erro do adversário), cartões (amarelo/vermelho) com efeito em quadra (expulsão do set / desqualificação da partida), substituições com histórico, anulação do último evento, timer de set.
- **Classificação e estatísticas**: tabela de classificação calculada a partir dos resultados, ranking de maiores pontuadores/saques/bloqueios por torneio.
- **Painel administrativo**: gestão de usuários e perfis (apenas ADMIN).
- **Documentação interativa da API** via Swagger.

## Arquitetura

O projeto segue uma arquitetura cliente-servidor com separação clara de responsabilidades:

```
┌─────────────────────┐        REST (JSON) + JWT        ┌──────────────────────┐
│   Frontend (React)   │  ───────────────────────────►  │   Backend (NestJS)   │
│  Vite + Tailwind CSS │  ◄───────────────────────────  │  Controllers/Services │
└─────────────────────┘                                  └──────────┬───────────┘
                                                                       │ Prisma ORM
                                                                       ▼
                                                            ┌──────────────────────┐
                                                            │   PostgreSQL (DB)     │
                                                            └──────────────────────┘
```

**Backend** organizado em módulos por domínio, cada um com sua própria camada de rota, controlador e serviço:

- `auth/` — login, registro, geração/validação de JWT, guards de autenticação e de perfil (roles).
- `torneios/`, `times/`, `jogadores/`, `partidas/`, `regras-torneio/`, `usuarios/` — CRUD e regras de negócio de cada domínio.
- `prisma/` — camada de persistência (client único injetável em toda a aplicação).

**Frontend** organizado por página/domínio, com camada de serviço isolada (`services/api`) que centraliza toda comunicação HTTP e nunca é chamada diretamente pelos componentes de UI sem passar por essa camada.

## Tecnologias utilizadas

### Backend
- [NestJS](https://nestjs.com/) (Node.js + TypeScript)
- [Prisma ORM](https://www.prisma.io/) + PostgreSQL
- [JWT](https://github.com/nestjs/jwt) (`@nestjs/jwt`) para autenticação
- [bcrypt](https://www.npmjs.com/package/bcrypt) para hash de senhas
- [class-validator](https://github.com/typestack/class-validator) / `class-transformer` para validação de payloads
- [Swagger](https://swagger.io/) (`@nestjs/swagger`) para documentação da API

### Frontend
- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- [React Router](https://reactrouter.com/)
- [Lucide Icons](https://lucide.dev/)

### Infraestrutura
- Docker Compose (PostgreSQL local)
- ESLint + Prettier em backend e frontend

## Modelo de dados

Principais entidades e relacionamentos (schema completo em `backend/prisma/schema.prisma`):

- **Usuario** — conta de acesso, com perfil (`ADMIN` | `GERENTE` | `USUARIO`).
- **Torneio** — pertence a organizadores (`OrganizadorTorneios`), possui `RegrasTorneio` próprias, times e partidas.
- **Time** — pertence a um torneio; possui jogadores e identidade visual.
- **Jogador** — pertence a um time; pode estar vinculado a um `Usuario` (entrada via convite).
- **Partida** — relaciona dois times (casa/visitante) dentro de um torneio; possui eventos, escalações por set e substituições.
- **EventoPartida** — cada ponto/erro/cartão registrado ao vivo, com snapshot da quadra antes/depois.
- **EscalacaoSet** / **SubstituicaoPartida** — controle de titulares, banco e trocas por set.

O modelo atende ao requisito mínimo de 3+ entidades relacionadas com folga, incluindo CRUD completo para Torneio, Time, Jogador e Partida.

## Como executar o projeto

### Pré-requisitos
- Node.js 20+
- Docker (para o PostgreSQL local) ou uma instância PostgreSQL própria

### 1. Banco de dados

```bash
cd backend
docker compose up -d
```

Isso sobe um PostgreSQL local na porta `5433` (ver `backend/docker-compose.yml`).

### 2. Backend

```bash
cd backend
npm install

# copie/ajuste o .env com sua DATABASE_URL e JWT_SECRET (ver backend/.env de exemplo)

npx prisma generate
npx prisma migrate dev

npm run start:dev
```

O backend sobe por padrão em `http://localhost:3000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend sobe por padrão em `http://localhost:5173` (ou porta informada pelo Vite) e espera o backend em `VITE_API_URL` (padrão: `http://localhost:3000`, configurável em `.env`).


## Documentação da API (Swagger)

Com o backend em execução, a documentação interativa de todas as rotas está disponível em:

```
http://localhost:3000/api-docs
```

## Estrutura de pastas

```
.
├── backend/
│   ├── prisma/            # schema e migrations
│   └── src/
│       ├── auth/           # login, registro, guards, JWT
│       ├── torneios/
│       ├── times/
│       ├── jogadores/
│       ├── partidas/
│       ├── regras-torneio/
│       ├── usuarios/
│       └── prisma/         # PrismaService (client compartilhado)
└── frontend/
    └── src/
        ├── pages/          # telas por domínio (Torneio, Partida, Time, Admin...)
        ├── components/     # componentes reutilizáveis e de UI (shadcn)
        ├── hooks/          # hooks customizados (useAuth, useEscalacao...)
        └── services/       # camada de comunicação com a API
```
