-- CreateEnum
CREATE TYPE "TipoCartao" AS ENUM ('AMARELO', 'VERMELHO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoErro" ADD VALUE 'QUATRO_TOQUES';
ALTER TYPE "TipoErro" ADD VALUE 'CONDUCAO';
ALTER TYPE "TipoErro" ADD VALUE 'ERRO_ROTACAO';

-- AlterEnum
ALTER TYPE "TipoPonto" ADD VALUE 'CARTAO_ADVERSARIO';

-- AlterTable
ALTER TABLE "EventoPartida" ADD COLUMN     "tipoCartao" "TipoCartao";
