import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  FasesTorneioController,
  FaseController,
} from './fases-torneio.controller';
import { FasesTorneioService } from './fases-torneio.service';

@Module({
  imports: [AuthModule],
  controllers: [FasesTorneioController, FaseController],
  providers: [FasesTorneioService],
  exports: [FasesTorneioService],
})
export class FasesTorneioModule {}