import { PartialType, OmitType } from '@nestjs/swagger';
import { CriarTimeDto } from './criar-time.dto';

export class AtualizarTimeDto extends PartialType(
  OmitType(CriarTimeDto, ['torneioId'] as const),
) {}