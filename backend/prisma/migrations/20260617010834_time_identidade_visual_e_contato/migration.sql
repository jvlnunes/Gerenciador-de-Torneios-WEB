-- AlterTable
ALTER TABLE "Jogador" ADD COLUMN     "titular" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Time" ADD COLUMN     "corPrimaria" TEXT,
ADD COLUMN     "corSecundaria" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "site" TEXT,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "whatsapp" TEXT;
