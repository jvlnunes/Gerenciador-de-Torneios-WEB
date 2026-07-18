import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import {
  ModoFormacaoTimes,
  CriterioSorteio,
  ModoGeracaoPartidas,
} from '@prisma/client';

export class AtualizarConfiguracaoRachaDto {
  @ApiPropertyOptional({ enum: ModoFormacaoTimes })
  @IsOptional()
  @IsEnum(ModoFormacaoTimes)
  modoFormacaoTimes?: ModoFormacaoTimes;

  @ApiPropertyOptional({ enum: CriterioSorteio })
  @IsOptional()
  @IsEnum(CriterioSorteio)
  criterioSorteio?: CriterioSorteio;

  @ApiPropertyOptional({ enum: ModoGeracaoPartidas })
  @IsOptional()
  @IsEnum(ModoGeracaoPartidas)
  modoGeracaoPartidas?: ModoGeracaoPartidas;

  @ApiPropertyOptional({ example: 4, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  jogadoresPorTime?: number;

  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  vitoriasSeguidasParaSair?: number;
}