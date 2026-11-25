import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const existe = await this.prisma.usuario.findFirst({
      where: { perfil: 'ADMIN' },
    });
    if (existe) return;

    const email = process.env.ADMIN_EMAIL ?? 'admin@admin.com';
    const senha = process.env.ADMIN_PASSWORD ?? 'admin';

    await this.prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email,
        senha: await bcrypt.hash(senha, 10),
        perfil: 'ADMIN',
      },
    });
    this.logger.warn(
      `Admin padrão criado (${email}). Troque a senha após o primeiro login.`,
    );
  }
}