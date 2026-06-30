import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dados: { email: string; password: string }) {
    return this.authService.login(dados);
  }

  @Post('register')
  register(@Body() dados: { nome: string; email: string; password: string }) {
    return this.authService.register(dados);
  }
}