import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 10;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { criadoEm: 'desc' },
    });
    return usuarios.map(({ senha, ...resto }) => resto);
  }

  async criar(dados: { nome: string; email: string; senha: string; perfil?: string }) {
    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha: senhaHash,
        ...(dados.perfil ? { perfil: dados.perfil as any } : {}),
      },
    });
    const { senha, ...resto } = usuario;
    return resto;
  }

  async atualizar(
    id: string,
    dados: { nome?: string; email?: string; senha?: string; perfil?: string },
  ) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const dataAtualizada: Record<string, unknown> = {
      ...(dados.nome ? { nome: dados.nome } : {}),
      ...(dados.email ? { email: dados.email } : {}),
      ...(dados.perfil ? { perfil: dados.perfil } : {}),
    };

    if (dados.senha) {
      dataAtualizada.senha = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    }

    const atualizado = await this.prisma.usuario.update({
      where: { id },
      data: dataAtualizada,
    });
    const { senha, ...resto } = atualizado;
    return resto;
  }

  async remover(id: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    await this.prisma.usuario.delete({ where: { id } });
    return { sucesso: true };
  }
}