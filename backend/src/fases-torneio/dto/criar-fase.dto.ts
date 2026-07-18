import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { FormatoTorneio } from '@prisma/client';

export class CriarFaseDto {
  @ApiProperty({ enum: FormatoTorneio, example: 'RACHA' })
  @IsEnum(FormatoTorneio)
  tipo!: FormatoTorneio;

  @ApiPropertyOptional({ example: 'Fase única - Racha' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordem da fase no torneio (1-based). Se omitido, vai para o final.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  ordem?: number;
}