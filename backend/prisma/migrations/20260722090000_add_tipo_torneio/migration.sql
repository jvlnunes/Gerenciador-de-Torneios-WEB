-- CreateEnum
CREATE TYPE "TipoTorneio" AS ENUM ('NORMAL', 'RACHA');

-- AlterTable
ALTER TABLE "Torneio" ADD COLUMN "tipo" "TipoTorneio" NOT NULL DEFAULT 'NORMAL';

-- Backfill: torneios que já têm uma fase RACHA única viram tipo RACHA
UPDATE "Torneio" t
SET "tipo" = 'RACHA'
WHERE EXISTS (
  SELECT 1 FROM "FaseTorneio" f
  WHERE f."torneioId" = t.id AND f."tipo" = 'RACHA'
);