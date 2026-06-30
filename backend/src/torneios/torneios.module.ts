import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TorneiosController } from './torneios.controller';
import { TorneiosService } from './torneios.service';

@Module({
  imports: [AuthModule],
  controllers: [TorneiosController],
  providers: [TorneiosService],
})
export class TorneiosModule {}
