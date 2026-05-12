import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Extraímos o Pool (gerenciador de conexões) do driver nativo do PostgreSQL
const { Pool } = pg;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 1. Lemos a URL do seu ficheiro .env
    const connectionString = process.env.DATABASE_URL;

    // 2. Criamos o pool de conexões nativo do PostgreSQL
    const pool = new Pool({ connectionString });

    // 3. Criamos o adaptador que traduz as queries do Prisma para o driver 'pg'
    const adapter = new PrismaPg(pool);

    // 4. Passamos o adaptador para o construtor do Prisma (O que o erro estava pedindo!)
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}