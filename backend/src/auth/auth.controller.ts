import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Autentica um usuário e retorna o token JWT' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido, retorna token e dados do usuário.' })
  @ApiResponse({ status: 401, description: 'E-mail ou senha inválidos.' })
  login(@Body() dados: LoginDto) {
    return this.authService.login(dados);
  }

  @Post('register')
  @ApiOperation({ summary: 'Cria uma nova conta de usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Já existe um usuário com este e-mail.' })
  register(@Body() dados: RegisterDto) {
    return this.authService.register(dados);
  }
}