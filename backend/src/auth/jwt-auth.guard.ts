import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PerfilUsuario } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

function extrairToken(request: Request): string | undefined {
  const authHeader = request.headers['authorization'];
  if (!authHeader || Array.isArray(authHeader)) return undefined;
  const [tipo, token] = authHeader.split(' ');
  return tipo === 'Bearer' ? token : undefined;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extrairToken(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthenticatedUser>(token);
      // Anexa o usuário autenticado na request para uso nos controllers/services
      (request as Request & { user: AuthenticatedUser }).user = {
        id: payload.id,
        nome: payload.nome,
        email: payload.email,
        perfil: payload.perfil,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}