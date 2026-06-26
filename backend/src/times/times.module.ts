import { Module } from '@nestjs/common';
import { TimesService } from './times.service';
import { AuthModule } from '../auth/auth.module';
import { TimesController } from './times.controller';

@Module({
  imports: [AuthModule],
  providers: [TimesService],
  controllers: [TimesController],
})
export class TimesModule {}
