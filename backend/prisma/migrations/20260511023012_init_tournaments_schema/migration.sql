-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'GERENTE', 'USUARIO');

-- CreateEnum
CREATE TYPE "StatusTorneio" AS ENUM ('RASCUNHO', 'ABERTO', 'EM_ANDAMENTO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "VisibilidadeTorneio" AS ENUM ('PUBLICO', 'SOMENTE_PARTICIPANTES', 'PRIVADO');

-- CreateEnum
CREATE TYPE "FormatoTorneio" AS ENUM ('RACHA', 'MATA_MATA', 'PONTOS_CORRIDOS');

-- CreateEnum
CREATE TYPE "StatusPartida" AS ENUM ('AGENDADA', 'AQUECIMENTO', 'AO_VIVO', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "TipoPonto" AS ENUM ('SAQUE', 'ATAQUE', 'BLOQUEIO', 'ERRO_ADVERSARIO');

-- CreateEnum
CREATE TYPE "TipoErro" AS ENUM ('ERRO_SAQUE', 'ERRO_ATAQUE', 'TOQUE_REDE', 'INVASAO', 'BOLA_FORA', 'DOIS_TOQUES');

-- CreateEnum
CREATE TYPE "LadoPonto" AS ENUM ('CASA', 'VISITANTE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL DEFAULT 'USUARIO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Torneio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "local" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "status" "StatusTorneio" NOT NULL DEFAULT 'RASCUNHO',
    "visibilidade" "VisibilidadeTorneio" NOT NULL DEFAULT 'PRIVADO',
    "bannerUrl" TEXT,
    "logoUrl" TEXT,
    "tokenConvite" TEXT,
    "formato" "FormatoTorneio" NOT NULL DEFAULT 'MATA_MATA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Torneio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizadorTorneios" (
    "id" TEXT NOT NULL,
    "torneioId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "OrganizadorTorneios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Time" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "logoUrl" TEXT,
    "tokenConvite" TEXT,
    "quantidadeJogadores" INTEGER NOT NULL DEFAULT 0,
    "torneioId" TEXT NOT NULL,

    CONSTRAINT "Time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jogador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "numeroCamisa" INTEGER,
    "posicao" TEXT,
    "fotoUrl" TEXT,
    "entrouPorLink" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeId" TEXT NOT NULL,
    "usuarioId" TEXT,

    CONSTRAINT "Jogador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partida" (
    "id" TEXT NOT NULL,
    "status" "StatusPartida" NOT NULL DEFAULT 'AGENDADA',
    "agendadoPara" TIMESTAMP(3),
    "local" TEXT,
    "setsCasa" INTEGER NOT NULL DEFAULT 0,
    "setsVisitante" INTEGER NOT NULL DEFAULT 0,
    "setAtualCasa" INTEGER NOT NULL DEFAULT 0,
    "setAtualVisitante" INTEGER NOT NULL DEFAULT 0,
    "torneioId" TEXT NOT NULL,
    "timeCasaId" TEXT NOT NULL,
    "timeVisitanteId" TEXT NOT NULL,

    CONSTRAINT "Partida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JogadorPartida" (
    "id" TEXT NOT NULL,
    "titular" BOOLEAN NOT NULL DEFAULT false,
    "numeroCamisa" INTEGER,
    "posicao" TEXT,
    "partidaId" TEXT NOT NULL,
    "jogadorId" TEXT NOT NULL,
    "timeId" TEXT NOT NULL,

    CONSTRAINT "JogadorPartida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoPartida" (
    "id" TEXT NOT NULL,
    "indiceSet" INTEGER NOT NULL,
    "lado" "LadoPonto" NOT NULL,
    "tipo" "TipoPonto" NOT NULL,
    "tipoErro" "TipoErro",
    "placarCasa" INTEGER NOT NULL,
    "placarVisitante" INTEGER NOT NULL,
    "horario" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "partidaId" TEXT NOT NULL,
    "jogadorId" TEXT,

    CONSTRAINT "EventoPartida_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizadorTorneios_torneioId_usuarioId_key" ON "OrganizadorTorneios"("torneioId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Time_tokenConvite_key" ON "Time"("tokenConvite");

-- CreateIndex
CREATE UNIQUE INDEX "JogadorPartida_jogadorId_partidaId_key" ON "JogadorPartida"("jogadorId", "partidaId");

-- AddForeignKey
ALTER TABLE "OrganizadorTorneios" ADD CONSTRAINT "OrganizadorTorneios_torneioId_fkey" FOREIGN KEY ("torneioId") REFERENCES "Torneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizadorTorneios" ADD CONSTRAINT "OrganizadorTorneios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Time" ADD CONSTRAINT "Time_torneioId_fkey" FOREIGN KEY ("torneioId") REFERENCES "Torneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogador" ADD CONSTRAINT "Jogador_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogador" ADD CONSTRAINT "Jogador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_torneioId_fkey" FOREIGN KEY ("torneioId") REFERENCES "Torneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_timeCasaId_fkey" FOREIGN KEY ("timeCasaId") REFERENCES "Time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_timeVisitanteId_fkey" FOREIGN KEY ("timeVisitanteId") REFERENCES "Time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JogadorPartida" ADD CONSTRAINT "JogadorPartida_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "Partida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JogadorPartida" ADD CONSTRAINT "JogadorPartida_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "Jogador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JogadorPartida" ADD CONSTRAINT "JogadorPartida_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoPartida" ADD CONSTRAINT "EventoPartida_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "Partida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoPartida" ADD CONSTRAINT "EventoPartida_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "Jogador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
