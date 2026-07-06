import { PartialType, OmitType } from '@nestjs/swagger';
import { CriarJogadorDto } from './criar-jogador.dto';

export class AtualizarJogadorDto extends PartialType(
  OmitType(CriarJogadorDto, ['timeId'] as const),
) {}