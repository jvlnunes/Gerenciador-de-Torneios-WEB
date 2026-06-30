import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Carrega explicitamente o .env a partir da raiz do projeto backend,
// independente de onde o comando `prisma` for executado.
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});