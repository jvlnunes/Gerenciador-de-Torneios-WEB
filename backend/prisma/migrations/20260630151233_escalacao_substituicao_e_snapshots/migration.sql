-- AlterTable
ALTER TABLE "EventoPartida" ADD COLUMN     "quadraCasaAntes" JSONB,
ADD COLUMN     "quadraCasaDepois" JSONB,
ADD COLUMN     "quadraVisitanteAntes" JSONB,
ADD COLUMN     "quadraVisitanteDepois" JSONB,
ADD COLUMN     "sacadorAntes" "LadoPonto",
ADD COLUMN     "sacadorDepois" "LadoPonto";

-- CreateTable
CREATE TABLE "EscalacaoSet" (
    "id" TEXT NOT NULL,
    "partidaId" TEXT NOT NULL,
    "indiceSet" INTEGER NOT NULL,
    "timeId" TEXT NOT NULL,
    "titulares" JSONB NOT NULL,
    "banco" JSONB NOT NULL,
    "indicePosicaoSaque" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalacaoSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstituicaoPartida" (
    "id" TEXT NOT NULL,
    "partidaId" TEXT NOT NULL,
    "indiceSet" INTEGER NOT NULL,
    "timeId" TEXT NOT NULL,
    "idJogadorSaindo" TEXT NOT NULL,
    "nomeJogadorSaindo" TEXT NOT NULL,
    "numeroJogadorSaindo" INTEGER,
    "idJogadorEntrando" TEXT NOT NULL,
    "nomeJogadorEntrando" TEXT NOT NULL,
    "numeroJogadorEntrando" INTEGER,
    "indicePosicao" INTEGER NOT NULL,
    "placarCasa" INTEGER NOT NULL,
    "placarVisitante" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubstituicaoPartida_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EscalacaoSet_partidaId_indiceSet_timeId_key" ON "EscalacaoSet"("partidaId", "indiceSet", "timeId");

-- AddForeignKey
ALTER TABLE "EscalacaoSet" ADD CONSTRAINT "EscalacaoSet_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "Partida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituicaoPartida" ADD CONSTRAINT "SubstituicaoPartida_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "Partida"("id") ON DELETE CASCADE ON UPDATE CASCADE;
