import { Module } from '@nestjs/common';
import { TimesService } from './times.service';
import { TimesController } from './times.controller';

@Module({
  providers: [TimesService],
  controllers: [TimesController]
})
export class TimesModule {}
