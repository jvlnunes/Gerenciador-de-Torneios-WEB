-- CreateEnum
CREATE TYPE "ModoFormacaoTimes" AS ENUM ('MANUAL', 'POOL_SORTEIO');

-- CreateEnum
CREATE TYPE "CriterioSorteio" AS ENUM ('ALEATORIO', 'NOTA');

-- CreateEnum
CREATE TYPE "ModoGeracaoPartidas" AS ENUM ('AUTOMATICO', 'MANUAL');

-- DropForeignKey
ALTER TABLE "Jogador" DROP CONSTRAINT "Jogador_timeId_fkey";

-- AlterTable
ALTER TABLE "Jogador" ADD COLUMN     "notaHabilidade" DOUBLE PRECISION,
ALTER COLUMN "timeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Time" ADD COLUMN     "faseId" TEXT;

-- CreateTable
CREATE TABLE "FaseTorneio" (
    "id" TEXT NOT NULL,
    "torneioId" TEXT NOT NULL,
    "tipo" "FormatoTorneio" NOT NULL,
    "ordem" INTEGER NOT NULL,
    "nome" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaseTorneio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoRacha" (
    "id" TEXT NOT NULL,
    "faseId" TEXT NOT NULL,
    "modoFormacaoTimes" "ModoFormacaoTimes" NOT NULL DEFAULT 'MANUAL',
    "criterioSorteio" "CriterioSorteio" NOT NULL DEFAULT 'ALEATORIO',
    "modoGeracaoPartidas" "ModoGeracaoPartidas" NOT NULL DEFAULT 'MANUAL',
    "jogadoresPorTime" INTEGER NOT NULL DEFAULT 4,
    "vitoriasSeguidasParaSair" INTEGER NOT NULL DEFAULT 2,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoRacha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolJogadorRacha" (
    "id" TEXT NOT NULL,
    "faseId" TEXT NOT NULL,
    "jogadorId" TEXT NOT NULL,
    "alocado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolJogadorRacha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilaRachaEstado" (
    "id" TEXT NOT NULL,
    "faseId" TEXT NOT NULL,
    "timeDefensorId" TEXT,
    "vitoriasSeguidas" INTEGER NOT NULL DEFAULT 0,
    "timesAguardando" JSONB NOT NULL DEFAULT '[]',
    "partidaAtualId" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilaRachaEstado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FaseTorneio_torneioId_ordem_key" ON "FaseTorneio"("torneioId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoRacha_faseId_key" ON "ConfiguracaoRacha"("faseId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolJogadorRacha_faseId_jogadorId_key" ON "PoolJogadorRacha"("faseId", "jogadorId");

-- CreateIndex
CREATE UNIQUE INDEX "FilaRachaEstado_faseId_key" ON "FilaRachaEstado"("faseId");

-- AddForeignKey
ALTER TABLE "FaseTorneio" ADD CONSTRAINT "FaseTorneio_torneioId_fkey" FOREIGN KEY ("torneioId") REFERENCES "Torneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoRacha" ADD CONSTRAINT "ConfiguracaoRacha_faseId_fkey" FOREIGN KEY ("faseId") REFERENCES "FaseTorneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolJogadorRacha" ADD CONSTRAINT "PoolJogadorRacha_faseId_fkey" FOREIGN KEY ("faseId") REFERENCES "FaseTorneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolJogadorRacha" ADD CONSTRAINT "PoolJogadorRacha_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "Jogador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilaRachaEstado" ADD CONSTRAINT "FilaRachaEstado_faseId_fkey" FOREIGN KEY ("faseId") REFERENCES "FaseTorneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Time" ADD CONSTRAINT "Time_faseId_fkey" FOREIGN KEY ("faseId") REFERENCES "FaseTorneio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogador" ADD CONSTRAINT "Jogador_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Time"("id") ON DELETE SET NULL ON UPDATE CASCADE;
