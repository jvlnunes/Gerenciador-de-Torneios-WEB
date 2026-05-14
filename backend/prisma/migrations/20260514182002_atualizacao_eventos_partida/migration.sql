-- CreateTable
CREATE TABLE "RegrasTorneio" (
    "id" TEXT NOT NULL,
    "setsParaVencer" INTEGER NOT NULL DEFAULT 2,
    "pontosPorSet" INTEGER NOT NULL DEFAULT 25,
    "pontosTieBreak" INTEGER NOT NULL DEFAULT 15,
    "vantagemDoisPontos" BOOLEAN NOT NULL DEFAULT true,
    "limiteJogadoresPorTime" INTEGER,
    "torneioId" TEXT NOT NULL,

    CONSTRAINT "RegrasTorneio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegrasTorneio_torneioId_key" ON "RegrasTorneio"("torneioId");

-- AddForeignKey
ALTER TABLE "RegrasTorneio" ADD CONSTRAINT "RegrasTorneio_torneioId_fkey" FOREIGN KEY ("torneioId") REFERENCES "Torneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
