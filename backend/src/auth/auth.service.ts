import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from './jwt-auth.guard';

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  nome: string;
  email: string;
  password: string;
}

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private paraUsuarioPublico(usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: AuthenticatedUser['perfil'];
  }): AuthenticatedUser {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
  }

  async login(dados: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dados.email },
    });

    if (!usuario) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(dados.password, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const usuarioPublico = this.paraUsuarioPublico(usuario);
    const token = await this.jwtService.signAsync(usuarioPublico);

    return { token, user: usuarioPublico };
  }

  async register(dados: RegisterDto) {
    const existente = await this.prisma.usuario.findUnique({
      where: { email: dados.email },
    });

    if (existente) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const senhaHash = await bcrypt.hash(dados.password, SALT_ROUNDS);

    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha: senhaHash,
      },
    });

    return this.paraUsuarioPublico(usuario);
  }
}