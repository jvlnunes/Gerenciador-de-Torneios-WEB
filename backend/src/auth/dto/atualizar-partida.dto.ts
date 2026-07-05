import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusPartida } from '@prisma/client';
import { CriarPartidaDto } from './criar-partida.dto';

export class AtualizarPartidaDto extends PartialType(CriarPartidaDto) {
  @ApiPropertyOptional({ enum: StatusPartida })
  @IsOptional()
  @IsEnum(StatusPartida)
  status?: StatusPartida;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  setsCasa?: number;

  @ApiPropertyOptional({ example: 2, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  setsVisitante?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  setAtualCasa?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  setAtualVisitante?: number;
}