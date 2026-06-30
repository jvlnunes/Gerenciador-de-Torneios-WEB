import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TorneiosModule } from './torneios/torneios.module';
import { PartidasModule } from './partidas/partidas.module';
import { TimesModule } from './times/times.module';
import { JogadoresModule } from './jogadores/jogadores.module';
import { RegrasTorneioModule } from './regras-torneio/regras-torneio.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    TorneiosModule,
    PartidasModule,
    TimesModule,
    JogadoresModule,
    RegrasTorneioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}