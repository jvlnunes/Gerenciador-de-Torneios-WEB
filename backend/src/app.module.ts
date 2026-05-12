import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { MatchesModule } from './matches/matches.module';
import { PrismaModule } from './prisma/prisma.module';
import { TorneiosModule } from './torneios/torneios.module';

@Module({
  imports: [AuthModule, TournamentsModule, MatchesModule, PrismaModule, TorneiosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
