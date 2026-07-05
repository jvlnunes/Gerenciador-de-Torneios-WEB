import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsUrl,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CriarJogadorDto {
  @ApiProperty({ example: 'uuid-do-time' })
  @IsString()
  timeId: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 99 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  numeroCamisa?: number;

  @ApiPropertyOptional({ example: 'Levantador' })
  @IsOptional()
  @IsString()
  posicao?: string;

  @ApiPropertyOptional({ example: 'https://cdn.exemplo.com/foto.png' })
  @IsOptional()
  @IsUrl()
  fotoUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  titular?: boolean;
}