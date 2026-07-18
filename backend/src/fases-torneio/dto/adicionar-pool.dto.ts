import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NovoJogadorPoolDto {
  @IsString()
  nome!: string;

  @IsOptional()
  notaHabilidade?: number;
}

export class AdicionarPoolDto {
  @ApiPropertyOptional({ type: [String], description: 'IDs de jogadores já existentes (de outros times/torneios) a incluir na pool' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jogadorIds?: string[];

  @ApiPropertyOptional({
    description: 'Jogadores novos, criados direto na pool (sem time ainda)',
    type: [NovoJogadorPoolDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NovoJogadorPoolDto)
  novosJogadores?: NovoJogadorPoolDto[];
}