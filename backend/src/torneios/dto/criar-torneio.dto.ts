import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  IsISO8601,
  MinLength,
} from 'class-validator';
import { StatusTorneio, VisibilidadeTorneio, FormatoTorneio } from '@prisma/client';

export class CriarTorneioDto {
  @ApiProperty({ example: 'Copa Verão 2026' })
  @IsString()
  @MinLength(3)
  nome!: string;

  @ApiPropertyOptional({ example: 'Torneio aberto de vôlei de praia.' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ example: 'Ginásio Municipal' })
  @IsOptional()
  @IsString()
  local?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsISO8601()
  dataInicio?: string;

  @ApiPropertyOptional({ example: '2026-03-15' })
  @IsOptional()
  @IsISO8601()
  dataFim?: string;

  @ApiPropertyOptional({ enum: StatusTorneio, default: StatusTorneio.RASCUNHO })
  @IsOptional()
  @IsEnum(StatusTorneio)
  status?: StatusTorneio;

  @ApiPropertyOptional({ enum: VisibilidadeTorneio, default: VisibilidadeTorneio.PRIVADO })
  @IsOptional()
  @IsEnum(VisibilidadeTorneio)
  visibilidade?: VisibilidadeTorneio;

  @ApiPropertyOptional({ enum: FormatoTorneio, default: FormatoTorneio.MATA_MATA })
  @IsOptional()
  @IsEnum(FormatoTorneio)
  formato?: FormatoTorneio;

  @ApiPropertyOptional({ example: 'https://cdn.exemplo.com/banner.png' })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.exemplo.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}