import { Module } from '@nestjs/common';
import { PartidasService } from './partidas.service';
import { AuthModule } from '../auth/auth.module';
import { PartidasController } from './partidas.controller';

@Module({
  imports: [AuthModule],
  providers: [PartidasService],
  controllers: [PartidasController],
})
export class PartidasModule {}
