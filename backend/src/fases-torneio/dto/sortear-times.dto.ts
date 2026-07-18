import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SortearTimesDto {
  @ApiPropertyOptional({
    example: 4,
    description: 'Sobrescreve o jogadoresPorTime da configuração da fase para este sorteio',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  jogadoresPorTime?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'Nomes dos times a serem criados, na ordem. Se faltar nome, usa "Time N".',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nomesTimes?: string[];
}