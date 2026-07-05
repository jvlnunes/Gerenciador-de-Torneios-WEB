import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // '*' libera todas as portas.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          
      forbidNonWhitelisted: true, 
      transform: true,          
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('VolleyHub API')
    .setDescription(
      'API de gerenciamento de torneios de vôlei — torneios, times, jogadores, partidas ao vivo e estatísticas.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Informe o token JWT obtido em /auth/login',
        in: 'header',
      },
      'access-token', // nome de referência usado no @ApiBearerAuth() dos controllers
    )
    .addTag('auth', 'Autenticação e registro de usuários')
    .addTag('torneios', 'Gestão de torneios')
    .addTag('times', 'Gestão de times')
    .addTag('jogadores', 'Gestão de jogadores')
    .addTag('partidas', 'Partidas, eventos ao vivo, escalação e substituições')
    .addTag('regras-torneio', 'Regras de pontuação por torneio')
    .addTag('usuarios', 'Administração de usuários (ADMIN)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
bootstrap();