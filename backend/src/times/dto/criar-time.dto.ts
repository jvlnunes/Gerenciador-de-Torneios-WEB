import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsEmail, MinLength } from 'class-validator';

export class CriarTimeDto {
  @ApiProperty({ example: 'uuid-do-torneio' })
  @IsString()
  torneioId!: string;

  @ApiProperty({ example: 'Tigres FC' })
  @IsString()
  @MinLength(2)
  nome!: string;

  @ApiPropertyOptional({ example: 'https://cdn.exemplo.com/brasao.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#00843D' })
  @IsOptional()
  @IsString()
  corPrimaria?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsOptional()
  @IsString()
  corSecundaria?: string;

  @ApiPropertyOptional({ example: 'contato@time.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '(85) 90000-0000' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/time' })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional({ example: 'https://wa.me/5585900000000' })
  @IsOptional()
  @IsUrl()
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/time' })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional({ example: 'https://time.com.br' })
  @IsOptional()
  @IsUrl()
  site?: string;
}