import { PartialType } from '@nestjs/swagger';
import { CriarTorneioDto } from './criar-torneio.dto';

export class AtualizarTorneioDto extends PartialType(CriarTorneioDto) {}