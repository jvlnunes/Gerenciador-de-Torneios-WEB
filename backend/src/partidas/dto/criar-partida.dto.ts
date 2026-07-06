import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsISO8601 } from 'class-validator';

export class CriarPartidaDto {
  @ApiProperty({ example: 'uuid-do-torneio' })
  @IsString()
  torneioId: string;

  @ApiProperty({ example: 'uuid-do-time-casa' })
  @IsString()
  timeCasaId: string;

  @ApiProperty({ example: 'uuid-do-time-visitante' })
  @IsString()
  timeVisitanteId: string;

  @ApiPropertyOptional({ example: '2026-03-10T19:00:00Z' })
  @IsOptional()
  @IsISO8601()
  agendadoPara?: string;

  @ApiPropertyOptional({ example: 'Quadra 1' })
  @IsOptional()
  @IsString()
  local?: string;
}