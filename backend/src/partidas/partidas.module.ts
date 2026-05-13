import { Module } from '@nestjs/common';
import { PartidasService } from './partidas.service';
import { PartidasController } from './partidas.controller';

@Module({
  providers: [PartidasService],
  controllers: [PartidasController]
})
export class PartidasModule {}
